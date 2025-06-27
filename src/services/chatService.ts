import { ApiResponse, ChatSession, ChatMessageContent } from '../types';
import { BASE_API_URL } from '../config/config';

export interface ChatResponse {
  response: string;
  sessionId: string;
}

export interface ConversationsResponse {
  conversations: ConversationSummary[];
}

export interface ConversationSummary {
  sessionId: string;
  userPrompt: string;
  timestamp: string;
}

export interface SearchResult {
  sessionId: string;
  userPrompt: string;
  timestamp: string;
}

/**
 * Servicio para comunicarse con el BFF (Backend for Frontend)
 * Maneja todas las llamadas relacionadas con el chat, la IA y el historial
 */
class BFFChatService {
  private async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('BFF GET request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('BFF POST request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('BFF DELETE request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }  }

  async sendMessage(message: string, sessionId?: string): Promise<ApiResponse<ChatResponse>> {
    return this.post<ChatResponse>('api/Chat/conversation', {
      userPrompt: message,
      sessionId,
    });
  }

  // =============================
  // MÉTODOS DE HISTORIAL Y CONVERSACIONES
  // =============================

  /**
   * Obtener todas las conversaciones del usuario
   */
  async getConversations(): Promise<ApiResponse<ConversationSummary[]>> {
    const response = await this.get<ConversationsResponse>('api/Chat/conversations');
    
    if (response.success && response.data) {
      return {
        success: true,
        data: response.data.conversations
      };
    }
    
    return {
      success: false,
      error: response.error || 'Error al obtener conversaciones'
    };
  }

  /**
   * Obtener una conversación específica por sessionId
   */
  async getConversation(sessionId: string): Promise<ApiResponse<ChatSession>> {
    return this.get<ChatSession>(`api/Chat/conversation/${sessionId}`);
  }

  /**
   * Eliminar una conversación específica
   */
  async deleteConversation(sessionId: string): Promise<ApiResponse<boolean>> {
    return this.delete<boolean>(`api/Chat/conversation/${sessionId}`);
  }

  /**
   * Obtener resumen de una conversación
   */
  async getConversationSummary(sessionId: string): Promise<ApiResponse<string>> {
    return this.get<string>(`api/Chat/conversation/${sessionId}/summary`);
  }

  /**
   * Buscar en conversaciones
   */
  async searchConversations(query: string): Promise<ApiResponse<SearchResult[]>> {
    return this.get<SearchResult[]>(`api/Chat/search?q=${encodeURIComponent(query)}`);
  }

  // Método para simular streaming (puedes implementar Server-Sent Events más tarde)
  async sendMessageStream(
    message: string,
    sessionId: string | undefined,
    onChunk: (chunkText: string) => void,
    onComplete: (fullResponse: string, sessionId: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await this.sendMessage(message, sessionId);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get response from chat service');
      }

      const fullResponse = response.data.response;
      const newSessionId = response.data.sessionId;
      
      // Simular streaming dividiendo la respuesta en chunks
      const words = fullResponse.split(' ');
      let accumulatedText = '';
      
      for (let i = 0; i < words.length; i++) {
        accumulatedText += (i > 0 ? ' ' : '') + words[i];
        onChunk(accumulatedText);
        
        // Simular delay entre chunks
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      onComplete(fullResponse, newSessionId);
    } catch (error) {
      console.error('Error in sendMessageStream:', error);
      onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
  }
}

export const bffChatService = new BFFChatService();
