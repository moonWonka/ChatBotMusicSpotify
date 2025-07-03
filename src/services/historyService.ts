import { ApiResponse, ChatSession } from '../types';
import { bffChatService, ConversationSummary, SearchResult } from './chatService';

/**
 * Servicio para gestión del historial de conversaciones
 * Utiliza el BFF para persistir y recuperar conversaciones
 */
class HistoryService {
  
  /**
   * Obtener todas las conversaciones
   */
  async getAllConversations(firebaseUserId: string): Promise<ApiResponse<ConversationSummary[]>> {
    try {
      const response = await bffChatService.getConversations(firebaseUserId);
      return response;
    } catch (error) {
      console.error('Error getting conversations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtener una conversación específica
   */
  async getConversation(sessionId: string): Promise<ApiResponse<ChatSession>> {
    try {
      const response = await bffChatService.getConversation(sessionId);
      return response;
    } catch (error) {
      console.error('Error getting conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Eliminar una conversación
   */
  async deleteConversation(sessionId: string): Promise<ApiResponse<{statusCode: number, message: string, error: string}>> {
    try {
      const response = await bffChatService.deleteConversation(sessionId);
      return response;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtener resumen de una conversación
   */
  async getConversationSummary(sessionId: string): Promise<ApiResponse<string>> {
    try {
      const response = await bffChatService.getConversationSummary(sessionId);
      return response;
    } catch (error) {
      console.error('Error getting conversation summary:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Buscar en conversaciones
   */
  async searchConversations(query: string): Promise<ApiResponse<SearchResult[]>> {
    try {
      const response = await bffChatService.searchConversations(query);
      return response;
    } catch (error) {
      console.error('Error searching conversations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Obtener estadísticas del historial de conversaciones
   */
  async getHistoryStats(firebaseUserId: string): Promise<{
    totalConversations: number;
    totalMessages: number;
    lastActivity: string | null;
  }> {
    try {
      const response = await this.getAllConversations(firebaseUserId);
      
      if (!response.success || !response.data || !Array.isArray(response.data)) {
        return {
          totalConversations: 0,
          totalMessages: 0,
          lastActivity: null,
        };
      }

      const conversations = response.data;
      const totalConversations = conversations.length;
      
      // Cada conversación representa al menos un intercambio (mensaje del usuario + respuesta)
      const totalMessages = totalConversations * 2; // Estimación: usuario + AI por cada conversación
      
      // Encontrar la actividad más reciente
      let lastActivity: string | null = null;
      if (conversations.length > 0) {
        // Ordenar por timestamp más reciente
        const sortedConversations = conversations.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        lastActivity = sortedConversations[0].timestamp;
      }

      return {
        totalConversations,
        totalMessages,
        lastActivity,
      };
    } catch (error) {
      console.error('Error getting history stats:', error);
      return {
        totalConversations: 0,
        totalMessages: 0,
        lastActivity: null,
      };
    }
  }

  /**
   * Obtener conversaciones recientes
   */
  async getRecentConversations(firebaseUserId: string, limit: number = 10): Promise<ApiResponse<ConversationSummary[]>> {
    try {
      const response = await this.getAllConversations(firebaseUserId);
      
      if (!response.success || !response.data) {
        return response;
      }

      // Ordenar por timestamp más reciente y limitar
      const recentConversations = response.data
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);

      return {
        success: true,
        data: recentConversations,
      };
    } catch (error) {
      console.error('Error getting recent conversations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Exportar historial de conversaciones
   */
  async exportConversations(firebaseUserId: string): Promise<ApiResponse<any[]>> {
    try {
      const response = await this.getAllConversations(firebaseUserId);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'No se pudieron obtener las conversaciones',
        };
      }

      // Obtener detalles completos de cada conversación
      const detailedConversations = [];
      for (const summary of response.data) {
        try {
          const conversationResponse = await this.getConversation(summary.sessionId);
          if (conversationResponse.success && conversationResponse.data) {
            detailedConversations.push({
              sessionId: summary.sessionId,
              timestamp: summary.timestamp,
              userPrompt: summary.userPrompt,
              fullConversation: conversationResponse.data,
            });
          }
        } catch (error) {
          console.warn(`Error getting details for conversation ${summary.sessionId}:`, error);
          // Incluir al menos el resumen
          detailedConversations.push({
            sessionId: summary.sessionId,
            timestamp: summary.timestamp,
            userPrompt: summary.userPrompt,
            fullConversation: null,
          });
        }
      }

      return {
        success: true,
        data: detailedConversations,
      };
    } catch (error) {
      console.error('Error exporting conversations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Limpiar historial antiguo
   */
  async cleanupOldConversations(firebaseUserId: string, olderThanDays: number = 30): Promise<ApiResponse<number>> {
    try {
      const response = await this.getAllConversations(firebaseUserId);
      
      if (!response.success || !response.data) {
        return {
          success: false,
          error: response.error || 'No se pudieron obtener las conversaciones',
        };
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const conversationsToDelete = response.data.filter(conv => 
        new Date(conv.timestamp) < cutoffDate
      );

      let deletedCount = 0;
      for (const conversation of conversationsToDelete) {
        try {
          const deleteResponse = await this.deleteConversation(conversation.sessionId);
          if (deleteResponse.success) {
            deletedCount++;
          }
        } catch (error) {
          console.warn(`Error deleting conversation ${conversation.sessionId}:`, error);
        }
      }

      return {
        success: true,
        data: deletedCount,
      };
    } catch (error) {
      console.error('Error cleaning up old conversations:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

export const historyService = new HistoryService();
export default historyService;
