export interface ExcludedTerm {
  id: string;
  term: string;
  category: 'artist' | 'genre' | 'song' | 'album' | 'keyword' | 'custom';
  reason?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface ExcludedTermsConfig {
  userId: string;
  terms: ExcludedTerm[];
  globallyExcluded: string[]; // Terms excluded by admin
  isEnabled: boolean;
  lastUpdated: number;
}

class ExcludedTermsService {
  private dbName = 'ChatBotMusicSpotify';
  private storeName = 'excludedTerms';
  private db: IDBDatabase | null = null;

  // Default terms that are commonly excluded
  private defaultExcludedTerms: Omit<ExcludedTerm, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      term: 'explicit',
      category: 'keyword',
      reason: 'Contenido explícito',
      isActive: true
    },
    {
      term: 'violence',
      category: 'keyword', 
      reason: 'Contenido violento',
      isActive: true
    },
    {
      term: 'hate',
      category: 'keyword',
      reason: 'Contenido de odio',
      isActive: true
    }
  ];

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'userId' });
          store.createIndex('userId', 'userId', { unique: true });
          store.createIndex('lastUpdated', 'lastUpdated', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  // Get user's excluded terms configuration
  async getUserConfig(userId: string): Promise<ExcludedTermsConfig> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(userId);
      
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Create default config for new user
          const defaultConfig: ExcludedTermsConfig = {
            userId,
            terms: this.defaultExcludedTerms.map(term => ({
              ...term,
              id: this.generateId(),
              createdAt: Date.now(),
              updatedAt: Date.now()
            })),
            globallyExcluded: [],
            isEnabled: true,
            lastUpdated: Date.now()
          };
          resolve(defaultConfig);
        }
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Save user's excluded terms configuration
  async saveUserConfig(config: ExcludedTermsConfig): Promise<void> {
    const db = await this.ensureDB();
    
    config.lastUpdated = Date.now();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(config);
      
      request.onsuccess = () => {
        console.log('✅ Configuración de términos excluidos guardada');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Add a new excluded term
  async addExcludedTerm(
    userId: string, 
    term: string, 
    category: ExcludedTerm['category'], 
    reason?: string
  ): Promise<ExcludedTerm> {
    const config = await this.getUserConfig(userId);
    
    // Check if term already exists
    const existingTerm = config.terms.find(t => 
      t.term.toLowerCase() === term.toLowerCase()
    );
    
    if (existingTerm) {
      throw new Error('Este término ya está en la lista de excluidos');
    }
    
    const newTerm: ExcludedTerm = {
      id: this.generateId(),
      term: term.trim(),
      category,
      reason,
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    
    config.terms.push(newTerm);
    await this.saveUserConfig(config);
    
    return newTerm;
  }

  // Remove an excluded term
  async removeExcludedTerm(userId: string, termId: string): Promise<boolean> {
    const config = await this.getUserConfig(userId);
    
    const initialLength = config.terms.length;
    config.terms = config.terms.filter(term => term.id !== termId);
    
    if (config.terms.length === initialLength) {
      return false; // Term not found
    }
    
    await this.saveUserConfig(config);
    return true;
  }

  // Update an excluded term
  async updateExcludedTerm(
    userId: string, 
    termId: string, 
    updates: Partial<Pick<ExcludedTerm, 'term' | 'category' | 'reason' | 'isActive'>>
  ): Promise<boolean> {
    const config = await this.getUserConfig(userId);
    
    const termIndex = config.terms.findIndex(term => term.id === termId);
    if (termIndex === -1) {
      return false; // Term not found
    }
    
    // Check for duplicate if updating term text
    if (updates.term) {
      const duplicateTerm = config.terms.find((t, index) => 
        index !== termIndex && t.term.toLowerCase() === updates.term!.toLowerCase()
      );
      if (duplicateTerm) {
        throw new Error('Ya existe un término con ese texto');
      }
    }
    
    config.terms[termIndex] = {
      ...config.terms[termIndex],
      ...updates,
      updatedAt: Date.now()
    };
    
    await this.saveUserConfig(config);
    return true;
  }

  // Toggle excluded terms feature on/off
  async toggleExcludedTerms(userId: string, enabled: boolean): Promise<void> {
    const config = await this.getUserConfig(userId);
    config.isEnabled = enabled;
    await this.saveUserConfig(config);
  }

  // Get active excluded terms for filtering
  async getActiveExcludedTerms(userId: string): Promise<string[]> {
    const config = await this.getUserConfig(userId);
    
    if (!config.isEnabled) {
      return [];
    }
    
    const activeTerms = config.terms
      .filter(term => term.isActive)
      .map(term => term.term.toLowerCase());
    
    // Add globally excluded terms
    const globalTerms = config.globallyExcluded.map(term => term.toLowerCase());
    
    return [...new Set([...activeTerms, ...globalTerms])];
  }

  // Check if a text contains excluded terms
  async containsExcludedTerms(userId: string, text: string): Promise<{
    hasExcludedTerms: boolean;
    foundTerms: string[];
  }> {
    const excludedTerms = await this.getActiveExcludedTerms(userId);
    const textLower = text.toLowerCase();
    
    const foundTerms = excludedTerms.filter(term => 
      textLower.includes(term)
    );
    
    return {
      hasExcludedTerms: foundTerms.length > 0,
      foundTerms
    };
  }

  // Filter text by removing excluded terms
  async filterText(userId: string, text: string): Promise<{
    filteredText: string;
    removedTerms: string[];
  }> {
    const excludedTerms = await this.getActiveExcludedTerms(userId);
    let filteredText = text;
    const removedTerms: string[] = [];
    
    excludedTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi');
      if (regex.test(filteredText)) {
        removedTerms.push(term);
        filteredText = filteredText.replace(regex, '[TERM_FILTERED]');
      }
    });
    
    // Clean up multiple spaces and filtered placeholders
    filteredText = filteredText
      .replace(/\[TERM_FILTERED\]/g, '***')
      .replace(/\s+/g, ' ')
      .trim();
    
    return {
      filteredText,
      removedTerms
    };
  }

  // Import terms from a list
  async importTerms(
    userId: string, 
    terms: string[], 
    category: ExcludedTerm['category'] = 'custom'
  ): Promise<number> {
    const config = await this.getUserConfig(userId);
    let importedCount = 0;
    
    for (const term of terms) {
      const trimmedTerm = term.trim();
      if (!trimmedTerm) continue;
      
      // Check if term already exists
      const exists = config.terms.some(t => 
        t.term.toLowerCase() === trimmedTerm.toLowerCase()
      );
      
      if (!exists) {
        const newTerm: ExcludedTerm = {
          id: this.generateId(),
          term: trimmedTerm,
          category,
          reason: 'Importado',
          isActive: true,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        
        config.terms.push(newTerm);
        importedCount++;
      }
    }
    
    if (importedCount > 0) {
      await this.saveUserConfig(config);
    }
    
    return importedCount;
  }

  // Export terms to a list
  async exportTerms(userId: string): Promise<string[]> {
    const config = await this.getUserConfig(userId);
    return config.terms.map(term => term.term);
  }

  // Get statistics
  async getStats(userId: string): Promise<{
    totalTerms: number;
    activeTerms: number;
    byCategory: Record<ExcludedTerm['category'], number>;
    isEnabled: boolean;
  }> {
    const config = await this.getUserConfig(userId);
    
    const byCategory = config.terms.reduce((acc, term) => {
      acc[term.category] = (acc[term.category] || 0) + 1;
      return acc;
    }, {} as Record<ExcludedTerm['category'], number>);
    
    return {
      totalTerms: config.terms.length,
      activeTerms: config.terms.filter(t => t.isActive).length,
      byCategory,
      isEnabled: config.isEnabled
    };
  }

  // Clear all terms for a user
  async clearAllTerms(userId: string): Promise<void> {
    const config = await this.getUserConfig(userId);
    config.terms = [];
    await this.saveUserConfig(config);
  }

  // Generate unique ID
  private generateId(): string {
    return `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Validate term
  validateTerm(term: string): { isValid: boolean; error?: string } {
    const trimmed = term.trim();
    
    if (!trimmed) {
      return { isValid: false, error: 'El término no puede estar vacío' };
    }
    
    if (trimmed.length < 2) {
      return { isValid: false, error: 'El término debe tener al menos 2 caracteres' };
    }
    
    if (trimmed.length > 50) {
      return { isValid: false, error: 'El término no puede tener más de 50 caracteres' };
    }
    
    // Check for invalid characters
    if (!/^[a-zA-Z0-9\s\-']+$/.test(trimmed)) {
      return { isValid: false, error: 'El término contiene caracteres no válidos' };
    }
    
    return { isValid: true };
  }
}

export const excludedTermsService = new ExcludedTermsService();
export default excludedTermsService;