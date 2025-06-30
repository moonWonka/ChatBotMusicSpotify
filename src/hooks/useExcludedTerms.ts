import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import excludedTermsService, { ExcludedTerm, ExcludedTermsConfig } from '../services/excludedTermsService';

interface UseExcludedTermsReturn {
  // State
  terms: ExcludedTerm[];
  isEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  addTerm: (term: string, category: ExcludedTerm['category'], reason?: string) => Promise<boolean>;
  removeTerm: (termId: string) => Promise<boolean>;
  updateTerm: (termId: string, updates: Partial<Pick<ExcludedTerm, 'term' | 'category' | 'reason' | 'isActive'>>) => Promise<boolean>;
  toggleTerm: (termId: string) => Promise<boolean>;
  toggleFeature: (enabled: boolean) => Promise<void>;
  
  // Filtering
  filterText: (text: string) => Promise<{ filteredText: string; removedTerms: string[] }>;
  containsExcludedTerms: (text: string) => Promise<{ hasExcludedTerms: boolean; foundTerms: string[] }>;
  
  // Bulk operations
  importTerms: (terms: string[], category?: ExcludedTerm['category']) => Promise<number>;
  exportTerms: () => Promise<string[]>;
  clearAllTerms: () => Promise<void>;
  
  // Utils
  validateTerm: (term: string) => { isValid: boolean; error?: string };
  getStats: () => Promise<{
    totalTerms: number;
    activeTerms: number;
    byCategory: Record<ExcludedTerm['category'], number>;
    isEnabled: boolean;
  }>;
  
  // Refresh
  refreshTerms: () => Promise<void>;
}

export const useExcludedTerms = (): UseExcludedTermsReturn => {
  const { user } = useAuth();
  const [terms, setTerms] = useState<ExcludedTerm[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's excluded terms configuration
  const loadConfig = useCallback(async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      await excludedTermsService.initDB();
      const config = await excludedTermsService.getUserConfig(user.id);
      setTerms(config.terms);
      setIsEnabled(config.isEnabled);
    } catch (err) {
      console.error('Error loading excluded terms:', err);
      setError('Error al cargar los términos excluidos');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initialize on user change
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Refresh terms
  const refreshTerms = useCallback(async () => {
    await loadConfig();
  }, [loadConfig]);

  // Add a new excluded term
  const addTerm = useCallback(async (
    term: string, 
    category: ExcludedTerm['category'], 
    reason?: string
  ): Promise<boolean> => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return false;
    }

    // Validate term
    const validation = excludedTermsService.validateTerm(term);
    if (!validation.isValid) {
      setError(validation.error || 'Término no válido');
      return false;
    }

    try {
      setError(null);
      const newTerm = await excludedTermsService.addExcludedTerm(user.id, term, category, reason);
      setTerms(prev => [...prev, newTerm]);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al agregar término';
      setError(errorMessage);
      return false;
    }
  }, [user?.id]);

  // Remove an excluded term
  const removeTerm = useCallback(async (termId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return false;
    }

    try {
      setError(null);
      const success = await excludedTermsService.removeExcludedTerm(user.id, termId);
      if (success) {
        setTerms(prev => prev.filter(term => term.id !== termId));
      }
      return success;
    } catch (err) {
      setError('Error al eliminar término');
      return false;
    }
  }, [user?.id]);

  // Update an excluded term
  const updateTerm = useCallback(async (
    termId: string, 
    updates: Partial<Pick<ExcludedTerm, 'term' | 'category' | 'reason' | 'isActive'>>
  ): Promise<boolean> => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return false;
    }

    // Validate term if being updated
    if (updates.term) {
      const validation = excludedTermsService.validateTerm(updates.term);
      if (!validation.isValid) {
        setError(validation.error || 'Término no válido');
        return false;
      }
    }

    try {
      setError(null);
      const success = await excludedTermsService.updateExcludedTerm(user.id, termId, updates);
      if (success) {
        setTerms(prev => prev.map(term => 
          term.id === termId 
            ? { ...term, ...updates, updatedAt: Date.now() }
            : term
        ));
      }
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al actualizar término';
      setError(errorMessage);
      return false;
    }
  }, [user?.id]);

  // Toggle term active state
  const toggleTerm = useCallback(async (termId: string): Promise<boolean> => {
    const term = terms.find(t => t.id === termId);
    if (!term) return false;

    return await updateTerm(termId, { isActive: !term.isActive });
  }, [terms, updateTerm]);

  // Toggle the entire feature on/off
  const toggleFeature = useCallback(async (enabled: boolean): Promise<void> => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return;
    }

    try {
      setError(null);
      await excludedTermsService.toggleExcludedTerms(user.id, enabled);
      setIsEnabled(enabled);
    } catch (err) {
      setError('Error al cambiar el estado del filtro');
    }
  }, [user?.id]);

  // Filter text by removing excluded terms
  const filterText = useCallback(async (text: string): Promise<{
    filteredText: string;
    removedTerms: string[];
  }> => {
    if (!user?.id || !isEnabled) {
      return { filteredText: text, removedTerms: [] };
    }

    try {
      return await excludedTermsService.filterText(user.id, text);
    } catch (err) {
      console.error('Error filtering text:', err);
      return { filteredText: text, removedTerms: [] };
    }
  }, [user?.id, isEnabled]);

  // Check if text contains excluded terms
  const containsExcludedTerms = useCallback(async (text: string): Promise<{
    hasExcludedTerms: boolean;
    foundTerms: string[];
  }> => {
    if (!user?.id || !isEnabled) {
      return { hasExcludedTerms: false, foundTerms: [] };
    }

    try {
      return await excludedTermsService.containsExcludedTerms(user.id, text);
    } catch (err) {
      console.error('Error checking excluded terms:', err);
      return { hasExcludedTerms: false, foundTerms: [] };
    }
  }, [user?.id, isEnabled]);

  // Import terms from a list
  const importTerms = useCallback(async (
    termList: string[], 
    category: ExcludedTerm['category'] = 'custom'
  ): Promise<number> => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return 0;
    }

    try {
      setError(null);
      const importedCount = await excludedTermsService.importTerms(user.id, termList, category);
      await refreshTerms(); // Reload to get updated list
      return importedCount;
    } catch (err) {
      setError('Error al importar términos');
      return 0;
    }
  }, [user?.id, refreshTerms]);

  // Export terms to a list
  const exportTerms = useCallback(async (): Promise<string[]> => {
    if (!user?.id) {
      return [];
    }

    try {
      return await excludedTermsService.exportTerms(user.id);
    } catch (err) {
      setError('Error al exportar términos');
      return [];
    }
  }, [user?.id]);

  // Clear all terms
  const clearAllTerms = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return;
    }

    try {
      setError(null);
      await excludedTermsService.clearAllTerms(user.id);
      setTerms([]);
    } catch (err) {
      setError('Error al eliminar todos los términos');
    }
  }, [user?.id]);

  // Validate term
  const validateTerm = useCallback((term: string) => {
    return excludedTermsService.validateTerm(term);
  }, []);

  // Get statistics
  const getStats = useCallback(async () => {
    if (!user?.id) {
      return {
        totalTerms: 0,
        activeTerms: 0,
        byCategory: {} as Record<ExcludedTerm['category'], number>,
        isEnabled: false
      };
    }

    try {
      return await excludedTermsService.getStats(user.id);
    } catch (err) {
      setError('Error al obtener estadísticas');
      return {
        totalTerms: 0,
        activeTerms: 0,
        byCategory: {} as Record<ExcludedTerm['category'], number>,
        isEnabled: false
      };
    }
  }, [user?.id]);

  return {
    // State
    terms,
    isEnabled,
    isLoading,
    error,
    
    // Actions
    addTerm,
    removeTerm,
    updateTerm,
    toggleTerm,
    toggleFeature,
    
    // Filtering
    filterText,
    containsExcludedTerms,
    
    // Bulk operations
    importTerms,
    exportTerms,
    clearAllTerms,
    
    // Utils
    validateTerm,
    getStats,
    
    // Refresh
    refreshTerms
  };
};