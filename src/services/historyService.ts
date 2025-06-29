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
  async getAllConversations(): Promise<ApiResponse<ConversationSummary[]>> {
    try {
      const response = await bffChatService.getConversations();
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
   * Generar título para una conversación basado en el primer mensaje
   */
  generateConversationTitle(firstMessage: string): string {
    const maxLength = 50;
    if (firstMessage.length <= maxLength) {
      return firstMessage;
    }
    
    const truncated = firstMessage.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.7) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Formatear fecha para mostrar en la UI
   */
  formatDate(timestamp: number | string): string {
    try {
      const date = new Date(timestamp);
      
      // Verificar que la fecha es válida
      if (isNaN(date.getTime())) {
        return 'Fecha inválida';
      }
      
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInDays === 0) {
        return date.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });
      } else if (diffInDays === 1) {
        return 'Ayer';
      } else if (diffInDays < 7) {
        return `Hace ${diffInDays} días`;
      } else {
        return date.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit'
        });
      }
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Fecha inválida';
    }
  }

  /**
   * Obtener estadísticas del historial
   */
  async getHistoryStats(): Promise<{
    totalConversations: number;
    totalMessages: number;
    lastActivity: string | null;
  }> {
    try {
      const response = await this.getAllConversations();
      
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
      
      let lastActivity: string | null = null;
      
      if (conversations.length > 0) {
        try {
          // Filtrar timestamps válidos y convertir a números
          const validTimestamps = conversations
            .map(c => {
              const date = new Date(c.timestamp);
              return isNaN(date.getTime()) ? null : date.getTime();
            })
            .filter((timestamp): timestamp is number => timestamp !== null);
          
          if (validTimestamps.length > 0) {
            const mostRecentTimestamp = Math.max(...validTimestamps);
            lastActivity = this.formatDate(mostRecentTimestamp);
          }
        } catch (error) {
          console.error('Error calculating last activity:', error);
          lastActivity = 'N/A';
        }
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
}

export const historyService = new HistoryService();
