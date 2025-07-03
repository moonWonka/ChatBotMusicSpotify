import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import excludedTermsService, { ExcludedTerm } from '../services/excludedTermsService';

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

/**
 * Backend-only Excluded Terms Hook
 * Manages excluded terms state using only backend API calls
 * No local storage or IndexedDB dependencies
 */
export const useExcludedTerms = (): UseExcludedTermsReturn => {
  const { user } = useAuth();
  const [terms, setTerms] = useState<ExcludedTerm[]>([]);
  const [isEnabled, setIsEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's excluded terms from backend
  const loadTerms = useCallback(async () => {
    if (!user?.id) {
      console.log('👤 No user authenticated, clearing terms');
      setTerms([]);
      setIsEnabled(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📥 Loading excluded terms for user:', user.id);
      
      const userTerms = await excludedTermsService.getUserTerms(user.id);
      
      console.log('✅ Terms loaded successfully:', {
        count: userTerms.length,
        terms: userTerms.map(t => ({ id: t.id, term: t.term, category: t.category, isActive: t.isActive }))
      });
      
      setTerms(userTerms);
      // Feature is always enabled for now (could come from user preferences in the future)
      setIsEnabled(true);
      
    } catch (err) {
      console.error('🚨 Error loading excluded terms:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar términos excluidos');
      // On error, keep existing terms but show error
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Initialize on user change
  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  // Refresh terms from backend
  const refreshTerms = useCallback(async () => {
    console.log('🔄 Refreshing terms from backend');
    await loadTerms();
  }, [loadTerms]);

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
      setError(validation.error || 'Término inválido');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('➕ Adding term via backend:', { term, category });
      
      // Add term to backend
      const newTerm = await excludedTermsService.addTerm(user.id, term, category);
      
      // Update local state immediately with the new term
      setTerms(prevTerms => [...prevTerms, newTerm]);
      
      console.log('✅ Term added successfully:', newTerm);
      return true;
      
    } catch (err) {
      console.error('🚨 Error adding term:', err);
      setError(err instanceof Error ? err.message : 'Error al agregar término');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Remove an excluded term
  const removeTerm = useCallback(async (termId: string): Promise<boolean> => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🗑️ Removing term via backend:', { termId });
      
      // Remove from backend
      await excludedTermsService.removeTerm(user.id, termId);
      
      // Update local state immediately
      setTerms(prevTerms => prevTerms.filter(term => term.id !== termId));
      
      console.log('✅ Term removed successfully');
      return true;
      
    } catch (err) {
      console.error('🚨 Error removing term:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar término');
      return false;
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    setError(null);

    try {
      console.log('✏️ Updating term via backend:', { termId, updates });
      
      // Update in backend
      const updatedTerm = await excludedTermsService.updateTerm(user.id, termId, updates);
      
      // Update local state immediately
      setTerms(prevTerms => 
        prevTerms.map(term => 
          term.id === termId ? updatedTerm : term
        )
      );
      
      console.log('✅ Term updated successfully:', updatedTerm);
      return true;
      
    } catch (err) {
      console.error('🚨 Error updating term:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar término');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Toggle term active status
  const toggleTerm = useCallback(async (termId: string): Promise<boolean> => {
    console.log('🔄 Toggling term:', termId);
    
    const currentTerm = terms.find(t => t.id === termId);
    if (!currentTerm) {
      setError('Término no encontrado');
      return false;
    }
    
    return updateTerm(termId, { isActive: !currentTerm.isActive });
  }, [terms, updateTerm]);

  // Toggle the entire feature (for now just updates state, could call backend in future)
  const toggleFeature = useCallback(async (enabled: boolean): Promise<void> => {
    console.log('🔄 Toggling feature:', enabled);
    setIsEnabled(enabled);
    // In the future, this could save the preference to backend
  }, []);

  // Filter text by removing excluded terms
  const filterText = useCallback(async (text: string): Promise<{ filteredText: string; removedTerms: string[] }> => {
    if (!user?.id) {
      return { filteredText: text, removedTerms: [] };
    }

    try {
      return await excludedTermsService.filterText(user.id, text);
    } catch (err) {
      console.error('🚨 Error filtering text:', err);
      return { filteredText: text, removedTerms: [] };
    }
  }, [user?.id]);

  // Check if text contains excluded terms
  const containsExcludedTerms = useCallback(async (text: string): Promise<{ hasExcludedTerms: boolean; foundTerms: string[] }> => {
    if (!user?.id) {
      return { hasExcludedTerms: false, foundTerms: [] };
    }

    try {
      return await excludedTermsService.containsExcludedTerms(user.id, text);
    } catch (err) {
      console.error('🚨 Error checking excluded terms:', err);
      return { hasExcludedTerms: false, foundTerms: [] };
    }
  }, [user?.id]);

  // Import multiple terms
  const importTerms = useCallback(async (
    terms: string[], 
    category: ExcludedTerm['category'] = 'custom'
  ): Promise<number> => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return 0;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('📥 Importing terms via backend:', { count: terms.length, category });
      
      const importedTerms = await excludedTermsService.importTerms(user.id, terms, category);
      
      // Update local state with new terms
      setTerms(prevTerms => [...prevTerms, ...importedTerms]);
      
      console.log('✅ Terms imported successfully:', importedTerms.length);
      return importedTerms.length;
      
    } catch (err) {
      console.error('🚨 Error importing terms:', err);
      setError(err instanceof Error ? err.message : 'Error al importar términos');
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Export terms
  const exportTerms = useCallback(async (): Promise<string[]> => {
    if (!user?.id) {
      return [];
    }

    try {
      return await excludedTermsService.exportTerms(user.id);
    } catch (err) {
      console.error('🚨 Error exporting terms:', err);
      setError(err instanceof Error ? err.message : 'Error al exportar términos');
      return [];
    }
  }, [user?.id]);

  // Clear all terms
  const clearAllTerms = useCallback(async (): Promise<void> => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🧹 Clearing all terms via backend');
      
      await excludedTermsService.clearAllTerms(user.id);
      
      // Clear local state
      setTerms([]);
      
      console.log('✅ All terms cleared successfully');
      
    } catch (err) {
      console.error('🚨 Error clearing terms:', err);
      setError(err instanceof Error ? err.message : 'Error al limpiar términos');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Get statistics
  const getStats = useCallback(async () => {
    if (!user?.id) {
      return {
        totalTerms: 0,
        activeTerms: 0,
        byCategory: {
          artist: 0,
          genre: 0,
          song: 0,
          album: 0,
          keyword: 0,
          custom: 0,
        },
        isEnabled: true
      };
    }

    try {
      return await excludedTermsService.getStats(user.id);
    } catch (err) {
      console.error('🚨 Error getting stats:', err);
      // Fallback to local calculation
      const stats = {
        totalTerms: terms.length,
        activeTerms: terms.filter(t => t.isActive).length,
        byCategory: {
          artist: terms.filter(t => t.category === 'artist').length,
          genre: terms.filter(t => t.category === 'genre').length,
          song: terms.filter(t => t.category === 'song').length,
          album: terms.filter(t => t.category === 'album').length,
          keyword: terms.filter(t => t.category === 'keyword').length,
          custom: terms.filter(t => t.category === 'custom').length,
        },
        isEnabled
      };
      return stats;
    }
  }, [user?.id, terms, isEnabled]);

  // Validate term
  const validateTerm = useCallback((term: string) => {
    return excludedTermsService.validateTerm(term);
  }, []);

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