import { ApiResponse } from '../types';
import { BASE_API_URL, DEFAULT_API_VERSION } from '../config/config';

export interface ExcludedTerm {
  id: string;
  term: string;
  category: 'artist' | 'genre' | 'song' | 'album' | 'keyword' | 'custom';
  reason?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

// Interfaces para la API del backend
export interface BackendExcludedTerm {
  id: number;
  firebaseUserId: string;
  term: string;
  category: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExcludedTermRequest {
  firebaseUserId: string;
  term: string;
  category: string;
}

export interface UpdateExcludedTermRequest {
  id: number;
  firebaseUserId: string;
  term: string;
  category: string;
  isActive: boolean;
}

export interface ExcludedTermsConfig {
  userId: string;
  terms: ExcludedTerm[];
  globallyExcluded: string[]; // Terms excluded by admin
  isEnabled: boolean;
  lastUpdated: number;
}

/**
 * Backend-only Excluded Terms Service
 * Manages excluded terms exclusively through backend API calls
 * No local storage or IndexedDB caching
 */
class ExcludedTermsService {
  private categoryMapping: Record<string, ExcludedTerm['category']> = {
    'Artist': 'artist',
    'Genre': 'genre', 
    'Song': 'song',
    'Album': 'album',
    'Keyword': 'keyword',
    'Custom': 'custom',
    'artist': 'artist',
    'genre': 'genre',
    'song': 'song',
    'album': 'album',
    'keyword': 'keyword',
    'custom': 'custom'
  };

  /**
   * Convert backend term to frontend format
   */
  private convertBackendTerm(backendTerm: BackendExcludedTerm): ExcludedTerm {
    const createdAt = backendTerm.createdAt ? new Date(backendTerm.createdAt).getTime() : Date.now();
    const updatedAt = backendTerm.updatedAt ? new Date(backendTerm.updatedAt).getTime() : createdAt;
    
    return {
      id: backendTerm.id.toString(),
      term: backendTerm.term,
      category: this.categoryMapping[backendTerm.category] || 'custom',
      isActive: backendTerm.isActive,
      createdAt,
      updatedAt,
      reason: undefined // Backend doesn't have reason field yet
    };
  }

  /**
   * Parse backend response to extract terms array
   */
  private parseBackendResponse(response: any): BackendExcludedTerm[] {
    console.log('🔍 Parsing backend response:', response);
    
    // Direct array
    if (Array.isArray(response)) {
      console.log('📋 Response is direct array, length:', response.length);
      return response;
    }
    
    // Wrapper object with data property
    if (response && typeof response === 'object') {
      if (Array.isArray(response.data)) {
        console.log('📋 Response has data array, length:', response.data.length);
        return response.data;
      }
      if (Array.isArray(response.excludedTerms)) {
        console.log('📋 Response has excludedTerms array, length:', response.excludedTerms.length);
        return response.excludedTerms;
      }
      if (Array.isArray(response.terms)) {
        console.log('📋 Response has terms array, length:', response.terms.length);
        return response.terms;
      }
    }
    
    console.log('⚠️ Could not parse response, returning empty array');
    return [];
  }

  /**
   * Get user's excluded terms from backend
   */
  async getUserTerms(userId: string): Promise<ExcludedTerm[]> {
    try {
      console.log('🔍 Fetching excluded terms from backend for user:', userId);
      
      const response = await fetch(`${BASE_API_URL}api/ExcludedTerms/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'api-version': DEFAULT_API_VERSION,
        },
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Backend response received:', data);
      
      const backendTerms = this.parseBackendResponse(data);
      const convertedTerms = backendTerms.map(term => this.convertBackendTerm(term));
      
      console.log('✅ Terms converted successfully:', {
        backendCount: backendTerms.length,
        convertedCount: convertedTerms.length,
        terms: convertedTerms.map(t => ({ id: t.id, term: t.term, category: t.category, isActive: t.isActive }))
      });
      
      return convertedTerms;
    } catch (error) {
      console.error('🚨 Error fetching excluded terms:', error);
      throw error;
    }
  }

  /**
   * Get user configuration (terms + settings)
   */
  async getUserConfig(userId: string): Promise<ExcludedTermsConfig> {
    console.log('📦 Getting user config for:', userId);
    
    const terms = await this.getUserTerms(userId);
    
    // For now, feature is always enabled
    // In the future, this could come from user preferences API
    const config: ExcludedTermsConfig = {
      userId,
      terms,
      globallyExcluded: [], // Could be fetched from admin API
      isEnabled: true,
      lastUpdated: Date.now()
    };
    
    console.log('📦 User config assembled:', {
      userId: config.userId,
      termsCount: config.terms.length,
      isEnabled: config.isEnabled
    });
    
    return config;
  }

  /**
   * Add a new excluded term
   */
  async addTerm(userId: string, term: string, category: ExcludedTerm['category']): Promise<ExcludedTerm> {
    try {
      console.log('➕ Adding term to backend:', { userId, term, category });
      
      const requestData: CreateExcludedTermRequest = {
        firebaseUserId: userId,
        term: term.trim(),
        category
      };

      const response = await fetch(`${BASE_API_URL}api/ExcludedTerms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-version': DEFAULT_API_VERSION,
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Failed to add term: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Add term response:', data);
      
      // Parse response to get the created term
      let createdTerm: BackendExcludedTerm;
      if (data && typeof data === 'object') {
        if (data.data) {
          createdTerm = data.data;
        } else if (data.id) {
          createdTerm = data;
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        throw new Error('Invalid response format from server');
      }
      
      const convertedTerm = this.convertBackendTerm(createdTerm);
      console.log('✅ Term added successfully:', convertedTerm);
      
      return convertedTerm;
    } catch (error) {
      console.error('🚨 Error adding term:', error);
      throw error;
    }
  }

  /**
   * Remove an excluded term
   */
  async removeTerm(userId: string, termId: string): Promise<void> {
    try {
      console.log('🗑️ Removing term from backend:', { userId, termId });
      
      const response = await fetch(`${BASE_API_URL}api/ExcludedTerms/${termId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'api-version': DEFAULT_API_VERSION,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to remove term: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Term removed successfully');
    } catch (error) {
      console.error('🚨 Error removing term:', error);
      throw error;
    }
  }

  /**
   * Update an excluded term
   */
  async updateTerm(userId: string, termId: string, updates: Partial<Pick<ExcludedTerm, 'term' | 'category' | 'isActive'>>): Promise<ExcludedTerm> {
    try {
      console.log('✏️ Updating term in backend:', { userId, termId, updates });
      
      // First get the current term to have all required fields
      const currentTerms = await this.getUserTerms(userId);
      const currentTerm = currentTerms.find(t => t.id === termId);
      
      if (!currentTerm) {
        throw new Error('Term not found');
      }

      const requestData: UpdateExcludedTermRequest = {
        id: parseInt(termId),
        firebaseUserId: userId,
        term: updates.term || currentTerm.term,
        category: updates.category || currentTerm.category,
        isActive: updates.isActive !== undefined ? updates.isActive : currentTerm.isActive
      };

      const response = await fetch(`${BASE_API_URL}api/ExcludedTerms/${termId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'api-version': DEFAULT_API_VERSION,
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error(`Failed to update term: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 Update term response:', data);
      
      // Parse response to get the updated term
      let updatedTerm: BackendExcludedTerm;
      if (data && typeof data === 'object') {
        if (data.data) {
          updatedTerm = data.data;
        } else if (data.id) {
          updatedTerm = data;
        } else {
          throw new Error('Invalid response format from server');
        }
      } else {
        throw new Error('Invalid response format from server');
      }
      
      const convertedTerm = this.convertBackendTerm(updatedTerm);
      console.log('✅ Term updated successfully:', convertedTerm);
      
      return convertedTerm;
    } catch (error) {
      console.error('🚨 Error updating term:', error);
      throw error;
    }
  }

  /**
   * Toggle term active status
   */
  async toggleTerm(userId: string, termId: string): Promise<ExcludedTerm> {
    console.log('🔄 Toggling term status:', { userId, termId });
    
    // Get current term to determine new status
    const currentTerms = await this.getUserTerms(userId);
    const currentTerm = currentTerms.find(t => t.id === termId);
    
    if (!currentTerm) {
      throw new Error('Term not found');
    }
    
    return this.updateTerm(userId, termId, { isActive: !currentTerm.isActive });
  }

  /**
   * Check if text contains excluded terms
   */
  async containsExcludedTerms(userId: string, text: string): Promise<{ hasExcludedTerms: boolean; foundTerms: string[] }> {
    console.log('🔍 Checking text for excluded terms:', { userId, text: text.substring(0, 100) + '...' });
    
    const terms = await this.getUserTerms(userId);
    const activeTerms = terms.filter(term => term.isActive);
    
    const foundTerms: string[] = [];
    const lowerText = text.toLowerCase();
    
    for (const term of activeTerms) {
      if (lowerText.includes(term.term.toLowerCase())) {
        foundTerms.push(term.term);
      }
    }
    
    const result = {
      hasExcludedTerms: foundTerms.length > 0,
      foundTerms
    };
    
    console.log('🔍 Excluded terms check result:', result);
    return result;
  }

  /**
   * Filter text by removing excluded terms
   */
  async filterText(userId: string, text: string): Promise<{ filteredText: string; removedTerms: string[] }> {
    console.log('🧹 Filtering text for excluded terms:', { userId, text: text.substring(0, 100) + '...' });
    
    const terms = await this.getUserTerms(userId);
    const activeTerms = terms.filter(term => term.isActive);
    
    let filteredText = text;
    const removedTerms: string[] = [];
    
    for (const term of activeTerms) {
      const regex = new RegExp(term.term, 'gi');
      if (regex.test(filteredText)) {
        filteredText = filteredText.replace(regex, '').replace(/\s+/g, ' ').trim();
        removedTerms.push(term.term);
      }
    }
    
    const result = {
      filteredText,
      removedTerms
    };
    
    console.log('🧹 Text filtering result:', result);
    return result;
  }

  /**
   * Import multiple terms
   */
  async importTerms(userId: string, terms: string[], category: ExcludedTerm['category'] = 'custom'): Promise<ExcludedTerm[]> {
    console.log('📥 Importing terms:', { userId, count: terms.length, category });
    
    const results: ExcludedTerm[] = [];
    const errors: string[] = [];
    
    for (const term of terms) {
      try {
        const trimmedTerm = term.trim();
        if (trimmedTerm) {
          const addedTerm = await this.addTerm(userId, trimmedTerm, category);
          results.push(addedTerm);
        }
      } catch (error) {
        console.error(`🚨 Error importing term "${term}":`, error);
        errors.push(`${term}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (errors.length > 0) {
      console.warn('⚠️ Some terms failed to import:', errors);
    }
    
    console.log('📥 Import completed:', { successCount: results.length, errorCount: errors.length });
    return results;
  }

  /**
   * Export terms as string array
   */
  async exportTerms(userId: string): Promise<string[]> {
    console.log('📤 Exporting terms for user:', userId);
    
    const terms = await this.getUserTerms(userId);
    const exportData = terms.map(term => term.term);
    
    console.log('📤 Export completed:', { count: exportData.length });
    return exportData;
  }

  /**
   * Clear all terms for user
   */
  async clearAllTerms(userId: string): Promise<void> {
    console.log('🧹 Clearing all terms for user:', userId);
    
    const terms = await this.getUserTerms(userId);
    const errors: string[] = [];
    
    for (const term of terms) {
      try {
        await this.removeTerm(userId, term.id);
      } catch (error) {
        console.error(`🚨 Error removing term "${term.term}":`, error);
        errors.push(`${term.term}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    if (errors.length > 0) {
      console.warn('⚠️ Some terms failed to be removed:', errors);
      throw new Error(`Failed to remove ${errors.length} terms`);
    }
    
    console.log('🧹 All terms cleared successfully');
  }

  /**
   * Get statistics about excluded terms
   */
  async getStats(userId: string): Promise<{
    totalTerms: number;
    activeTerms: number;
    byCategory: Record<ExcludedTerm['category'], number>;
    isEnabled: boolean;
  }> {
    console.log('📊 Getting stats for user:', userId);
    
    const terms = await this.getUserTerms(userId);
    
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
      isEnabled: true // For now, always enabled
    };
    
    console.log('📊 Stats calculated:', stats);
    return stats;
  }

  /**
   * Validate a term before adding
   */
  validateTerm(term: string): { isValid: boolean; error?: string } {
    const trimmedTerm = term.trim();
    
    if (!trimmedTerm) {
      return { isValid: false, error: 'El término no puede estar vacío' };
    }
    
    if (trimmedTerm.length < 2) {
      return { isValid: false, error: 'El término debe tener al menos 2 caracteres' };
    }
    
    if (trimmedTerm.length > 100) {
      return { isValid: false, error: 'El término no puede tener más de 100 caracteres' };
    }
    
    // Basic character validation (letters, numbers, spaces, common punctuation)
    const validPattern = /^[a-zA-Z0-9\s\-_.,!?áéíóúñü]+$/i;
    if (!validPattern.test(trimmedTerm)) {
      return { isValid: false, error: 'El término contiene caracteres no válidos' };
    }
    
    return { isValid: true };
  }
}

// Export singleton instance
const excludedTermsService = new ExcludedTermsService();
export default excludedTermsService;
