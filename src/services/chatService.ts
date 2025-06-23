import { ApiResponse } from '../types';
import { BFF_CONFIG, getBFFUrl } from '../config/bff';

export interface ChatResponse {
  response: string;
  sessionId: string;
}

/**
 * Servicio para comunicarse con el BFF (Backend for Frontend)
 * Maneja todas las llamadas relacionadas con el chat y la IA
 */
class BFFChatService {  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(getBFFUrl(endpoint), {
        headers: {
          ...BFF_CONFIG.DEFAULT_HEADERS,
          ...options.headers,
        },
        ...options,
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
      };    } catch (error) {
      console.error('BFF Chat API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  async sendMessage(message: string, sessionId?: string): Promise<ApiResponse<ChatResponse>> {
    return this.makeRequest<ChatResponse>(BFF_CONFIG.ENDPOINTS.CHAT, {
      method: 'POST',
      body: JSON.stringify({
        message,
        sessionId,
      }),
    });
  }

  // Método para simular streaming (puedes implementar Server-Sent Events más tarde)
  async sendMessageStream(
    message: string,
    sessionId: string | undefined,
    onChunk: (chunkText: string) => void,
    onComplete: (fullResponse: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const response = await this.sendMessage(message, sessionId);
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Failed to get response from chat service');
      }

      const fullResponse = response.data.response;
      
      // Simular streaming dividiendo la respuesta en chunks
      const words = fullResponse.split(' ');
      let accumulatedText = '';
      
      for (let i = 0; i < words.length; i++) {
        accumulatedText += (i > 0 ? ' ' : '') + words[i];
        onChunk(accumulatedText);
        
        // Simular delay entre chunks
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      onComplete(fullResponse);
    } catch (error) {
      console.error('Error in sendMessageStream:', error);
      onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
  }
}

export const bffChatService = new BFFChatService();
