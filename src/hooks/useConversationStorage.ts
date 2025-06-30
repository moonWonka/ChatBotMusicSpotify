import { useState, useEffect, useCallback } from 'react';
import { ChatSession } from '../types';
import { useAuth } from './useAuth';
import conversationStorageService, { 
  StoredConversation, 
  ConversationFilters 
} from '../services/conversationStorageService';

interface UseConversationStorageReturn {
  // State
  conversations: StoredConversation[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  saveConversation: (conversation: ChatSession) => Promise<StoredConversation | null>;
  loadConversation: (conversationId: string) => Promise<ChatSession | null>;
  deleteConversation: (conversationId: string) => Promise<boolean>;
  searchConversations: (query: string) => Promise<StoredConversation[]>;
  toggleStar: (conversationId: string) => Promise<boolean>;
  
  // Filtering
  applyFilters: (filters: ConversationFilters) => void;
  clearFilters: () => void;
  currentFilters: ConversationFilters;
  
  // Bulk operations
  exportConversations: () => Promise<string>;
  importConversations: (jsonData: string) => Promise<number>;
  
  // Stats
  getStats: () => Promise<{
    totalConversations: number;
    totalMessages: number;
    starredConversations: number;
    averageMessagesPerConversation: number;
    oldestConversation?: Date;
    newestConversation?: Date;
  }>;
  
  // Refresh data
  refreshConversations: () => Promise<void>;
}

export const useConversationStorage = (): UseConversationStorageReturn => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFilters, setCurrentFilters] = useState<ConversationFilters>({});

  // Initialize database and load conversations
  useEffect(() => {
    const initializeStorage = async () => {
      if (!user?.id) return;

      setIsLoading(true);
      setError(null);

      try {
        await conversationStorageService.initDB();
        await loadConversations();
      } catch (err) {
        console.error('Error initializing conversation storage:', err);
        setError('Error al inicializar el almacenamiento de conversaciones');
      } finally {
        setIsLoading(false);
      }
    };

    initializeStorage();
  }, [user?.id]);

  // Load conversations with current filters
  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      const filters = { ...currentFilters, userId: user.id };
      const loadedConversations = await conversationStorageService.getConversations(user.id, filters);
      setConversations(loadedConversations);
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Error al cargar las conversaciones');
    }
  }, [user?.id, currentFilters]);

  // Refresh conversations
  const refreshConversations = useCallback(async () => {
    setIsLoading(true);
    await loadConversations();
    setIsLoading(false);
  }, [loadConversations]);

  // Save conversation
  const saveConversation = useCallback(async (conversation: ChatSession): Promise<StoredConversation | null> => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return null;
    }

    try {
      const saved = await conversationStorageService.saveConversation(conversation, user.id);
      await loadConversations(); // Refresh list
      return saved;
    } catch (err) {
      console.error('Error saving conversation:', err);
      setError('Error al guardar la conversación');
      return null;
    }
  }, [user?.id, loadConversations]);

  // Load single conversation
  const loadConversation = useCallback(async (conversationId: string): Promise<ChatSession | null> => {
    try {
      const stored = await conversationStorageService.getConversation(conversationId);
      if (!stored) return null;

      // Convert StoredConversation back to ChatSession format
      const chatSession: ChatSession = {
        id: stored.id,
        sessionId: stored.id,
        title: stored.title,
        createdAt: stored.createdAt,
        updatedAt: stored.updatedAt,
        messages: stored.messages
      };

      return chatSession;
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Error al cargar la conversación');
      return null;
    }
  }, []);

  // Delete conversation
  const deleteConversation = useCallback(async (conversationId: string): Promise<boolean> => {
    try {
      const success = await conversationStorageService.deleteConversation(conversationId);
      if (success) {
        await loadConversations(); // Refresh list
      }
      return success;
    } catch (err) {
      console.error('Error deleting conversation:', err);
      setError('Error al eliminar la conversación');
      return false;
    }
  }, [loadConversations]);

  // Search conversations
  const searchConversations = useCallback(async (query: string): Promise<StoredConversation[]> => {
    if (!user?.id) return [];

    try {
      return await conversationStorageService.searchConversations(
        user.id, 
        query, 
        { includeMessages: true }
      );
    } catch (err) {
      console.error('Error searching conversations:', err);
      setError('Error en la búsqueda');
      return [];
    }
  }, [user?.id]);

  // Toggle star
  const toggleStar = useCallback(async (conversationId: string): Promise<boolean> => {
    try {
      const newStarStatus = await conversationStorageService.toggleConversationStar(conversationId);
      await loadConversations(); // Refresh list to update UI
      return newStarStatus;
    } catch (err) {
      console.error('Error toggling star:', err);
      setError('Error al cambiar el estado de favorito');
      return false;
    }
  }, [loadConversations]);

  // Apply filters
  const applyFilters = useCallback((filters: ConversationFilters) => {
    setCurrentFilters(filters);
  }, []);

  // Clear filters
  const clearFilters = useCallback(() => {
    setCurrentFilters({});
  }, []);

  // Export conversations
  const exportConversations = useCallback(async (): Promise<string> => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    try {
      return await conversationStorageService.exportConversations(user.id);
    } catch (err) {
      console.error('Error exporting conversations:', err);
      setError('Error al exportar conversaciones');
      throw err;
    }
  }, [user?.id]);

  // Import conversations
  const importConversations = useCallback(async (jsonData: string): Promise<number> => {
    if (!user?.id) throw new Error('Usuario no autenticado');

    try {
      const importedCount = await conversationStorageService.importConversations(jsonData, user.id);
      await loadConversations(); // Refresh list
      return importedCount;
    } catch (err) {
      console.error('Error importing conversations:', err);
      setError('Error al importar conversaciones');
      throw err;
    }
  }, [user?.id, loadConversations]);

  // Get stats
  const getStats = useCallback(async () => {
    if (!user?.id) {
      return {
        totalConversations: 0,
        totalMessages: 0,
        starredConversations: 0,
        averageMessagesPerConversation: 0
      };
    }

    try {
      return await conversationStorageService.getConversationStats(user.id);
    } catch (err) {
      console.error('Error getting stats:', err);
      setError('Error al obtener estadísticas');
      return {
        totalConversations: 0,
        totalMessages: 0,
        starredConversations: 0,
        averageMessagesPerConversation: 0
      };
    }
  }, [user?.id]);

  // Auto-reload when filters change
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  return {
    // State
    conversations,
    isLoading,
    error,
    
    // Actions
    saveConversation,
    loadConversation,
    deleteConversation,
    searchConversations,
    toggleStar,
    
    // Filtering
    applyFilters,
    clearFilters,
    currentFilters,
    
    // Bulk operations
    exportConversations,
    importConversations,
    
    // Stats
    getStats,
    
    // Refresh
    refreshConversations
  };
};