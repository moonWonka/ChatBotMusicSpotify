import { ChatSession, ChatMessageContent, MessageSender } from '../types';

export interface StoredConversation {
  id: string;
  title: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessageContent[];
  metadata?: {
    messageCount: number;
    lastMessagePreview: string;
    tags?: string[];
    starred?: boolean;
  };
}

export interface ConversationFilters {
  userId?: string;
  search?: string;
  dateFrom?: Date;
  dateTo?: Date;
  starred?: boolean;
  tags?: string[];
}

class ConversationStorageService {
  private dbName = 'ChatBotMusicSpotify';
  private dbVersion = 1;
  private storeName = 'conversations';
  private db: IDBDatabase | null = null;

  async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('userId', 'userId', { unique: false });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('title', 'title', { unique: false });
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

  // Save conversation to IndexedDB
  async saveConversation(conversation: ChatSession, userId: string): Promise<StoredConversation> {
    const db = await this.ensureDB();
    
    const storedConversation: StoredConversation = {
      id: conversation.id,
      title: conversation.title,
      userId,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt || Date.now(),
      messages: conversation.messages,
      metadata: {
        messageCount: conversation.messages.length,
        lastMessagePreview: conversation.messages.length > 0 
          ? conversation.messages[conversation.messages.length - 1].text.slice(0, 100)
          : '',
        tags: this.extractTags(conversation.messages),
        starred: false
      }
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(storedConversation);
      
      request.onsuccess = () => {
        console.log('✅ Conversación guardada:', storedConversation.title);
        resolve(storedConversation);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get all conversations for a user
  async getConversations(userId: string, filters?: ConversationFilters): Promise<StoredConversation[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('userId');
      const request = index.getAll(userId);
      
      request.onsuccess = () => {
        let conversations = request.result as StoredConversation[];
        
        // Apply filters
        if (filters) {
          conversations = this.applyFilters(conversations, filters);
        }
        
        // Sort by updatedAt descending (most recent first)
        conversations.sort((a, b) => b.updatedAt - a.updatedAt);
        
        resolve(conversations);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Get single conversation
  async getConversation(conversationId: string): Promise<StoredConversation | null> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(conversationId);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Delete conversation
  async deleteConversation(conversationId: string): Promise<boolean> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(conversationId);
      
      request.onsuccess = () => {
        console.log('🗑️ Conversación eliminada:', conversationId);
        resolve(true);
      };
      request.onerror = () => reject(request.error);
    });
  }

  // Update conversation metadata
  async updateConversationMetadata(
    conversationId: string, 
    updates: Partial<StoredConversation['metadata']>
  ): Promise<boolean> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) return false;

    conversation.metadata = { ...conversation.metadata, ...updates };
    conversation.updatedAt = Date.now();

    const db = await this.ensureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(conversation);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  // Star/unstar conversation
  async toggleConversationStar(conversationId: string): Promise<boolean> {
    const conversation = await this.getConversation(conversationId);
    if (!conversation) return false;

    const newStarredStatus = !conversation.metadata?.starred;
    await this.updateConversationMetadata(conversationId, { starred: newStarredStatus });
    
    return newStarredStatus;
  }

  // Export conversations
  async exportConversations(userId: string): Promise<string> {
    const conversations = await this.getConversations(userId);
    return JSON.stringify(conversations, null, 2);
  }

  // Import conversations
  async importConversations(jsonData: string, userId: string): Promise<number> {
    try {
      const conversations = JSON.parse(jsonData) as StoredConversation[];
      let importedCount = 0;

      for (const conversation of conversations) {
        conversation.userId = userId; // Ensure correct user ownership
        conversation.id = this.generateId(); // Generate new ID to avoid conflicts
        await this.saveConversation(conversation, userId);
        importedCount++;
      }

      return importedCount;
    } catch (error) {
      console.error('Error importing conversations:', error);
      throw error;
    }
  }

  // Search conversations
  async searchConversations(
    userId: string, 
    query: string, 
    options?: { includeMessages?: boolean }
  ): Promise<StoredConversation[]> {
    const conversations = await this.getConversations(userId);
    const searchTerm = query.toLowerCase();
    
    return conversations.filter(conversation => {
      // Search in title
      if (conversation.title.toLowerCase().includes(searchTerm)) {
        return true;
      }
      
      // Search in messages if enabled
      if (options?.includeMessages) {
        return conversation.messages.some(message => 
          message.text.toLowerCase().includes(searchTerm)
        );
      }
      
      return false;
    });
  }

  // Get conversation statistics
  async getConversationStats(userId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    starredConversations: number;
    averageMessagesPerConversation: number;
    oldestConversation?: Date;
    newestConversation?: Date;
  }> {
    const conversations = await this.getConversations(userId);
    
    const totalConversations = conversations.length;
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    const starredConversations = conversations.filter(conv => conv.metadata?.starred).length;
    
    const dates = conversations.map(conv => conv.createdAt);
    const oldestDate = dates.length > 0 ? new Date(Math.min(...dates)) : undefined;
    const newestDate = dates.length > 0 ? new Date(Math.max(...dates)) : undefined;
    
    return {
      totalConversations,
      totalMessages,
      starredConversations,
      averageMessagesPerConversation: totalConversations > 0 ? totalMessages / totalConversations : 0,
      oldestConversation: oldestDate,
      newestConversation: newestDate
    };
  }

  // Helper methods
  private applyFilters(conversations: StoredConversation[], filters: ConversationFilters): StoredConversation[] {
    return conversations.filter(conversation => {
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesTitle = conversation.title.toLowerCase().includes(searchTerm);
        const matchesContent = conversation.messages.some(msg => 
          msg.text.toLowerCase().includes(searchTerm)
        );
        if (!matchesTitle && !matchesContent) return false;
      }
      
      if (filters.dateFrom && conversation.createdAt < filters.dateFrom.getTime()) {
        return false;
      }
      
      if (filters.dateTo && conversation.createdAt > filters.dateTo.getTime()) {
        return false;
      }
      
      if (filters.starred !== undefined && conversation.metadata?.starred !== filters.starred) {
        return false;
      }
      
      if (filters.tags && filters.tags.length > 0) {
        const conversationTags = conversation.metadata?.tags || [];
        const hasMatchingTag = filters.tags.some(tag => conversationTags.includes(tag));
        if (!hasMatchingTag) return false;
      }
      
      return true;
    });
  }

  private extractTags(messages: ChatMessageContent[]): string[] {
    const tags = new Set<string>();
    
    messages.forEach(message => {
      const text = message.text.toLowerCase();
      
      // Extract music genres
      const genres = ['rock', 'pop', 'jazz', 'classical', 'reggae', 'hip-hop', 'country', 
                     'electronic', 'folk', 'blues', 'metal', 'indie', 'latin', 'reggaeton'];
      genres.forEach(genre => {
        if (text.includes(genre)) tags.add(genre);
      });
      
      // Extract decades
      const decades = ['60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'];
      decades.forEach(decade => {
        if (text.includes(decade)) tags.add(decade);
      });
      
      // Extract common music terms
      if (text.includes('playlist')) tags.add('playlist');
      if (text.includes('album')) tags.add('albums');
      if (text.includes('concert')) tags.add('concerts');
      if (text.includes('spotify')) tags.add('spotify');
    });
    
    return Array.from(tags);
  }

  generateId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear all data (for debugging/reset)
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log('🗑️ Todas las conversaciones eliminadas');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
}

export const conversationStorageService = new ConversationStorageService();
export default conversationStorageService;