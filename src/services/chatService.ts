import { ApiResponse, ChatSession } from '../types';
import { BASE_API_URL, DEFAULT_API_VERSION } from '../config/config';

export interface ChatResponse {
  statusCode: number;
  response: string;
  error: string;
  isSuccess: boolean;
  contextualizedQuestions: string;
  isContextualized: boolean;
  validationResults: string;
  classificationResults: string;
  databaseResults: string;
  naturalResponse: string;
  processingTimeMs: number;
  steps: {
    validationTimeMs: number;
    sqlGenerationTimeMs: number;
    databaseQueryTimeMs: number;
    naturalResponseTimeMs: number;
  };
  sessionId?: string; // Puede que venga en la respuesta o necesitemos manejarlo por separado
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
          'api-version': DEFAULT_API_VERSION,
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
          'api-version': DEFAULT_API_VERSION,
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
      const headers = {
        'Accept': 'application/json',
        'api-version': DEFAULT_API_VERSION,
      };

      const response = await fetch(`${BASE_API_URL}${endpoint}`, {
        method: 'DELETE',
        headers: headers,
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
    }
  }

  async sendMessage(message: string, sessionId?: string, model?: string): Promise<ApiResponse<ChatResponse>> {
    const requestBody = {
      sessionId: sessionId || null,
      question: message,
      sModel: model || 'string',
      includeContext: true,
      contextIds: []
    };

    const response = await this.post<ChatResponse>('api/AI/process-question', requestBody);
    
    // ✅ CORRECCIÓN: Verificar statusCode además de success
    if (response.success && response.data) {
      // Si la respuesta HTTP fue exitosa pero el backend indica un problema específico
      const statusCode = response.data.statusCode;
      
      // Solo considerar como error si el statusCode está fuera del rango 200-299
      if (statusCode < 200 || statusCode >= 300) {
        return {
          success: false,
          error: response.data.error || `Backend returned status ${statusCode}`
        };
      }

      // Si no incluye sessionId, lo generamos o mantenemos el existente
      if (!response.data.sessionId) {
        response.data.sessionId = sessionId || this.generateSessionId();
      }
    }
    
    return response;
  }

  /**
   * Genera un ID de sesión único
   */
  private generateSessionId(): string {
    return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
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
  async deleteConversation(sessionId: string): Promise<ApiResponse<{statusCode: number, message: string, error: string}>> {
    debugger
    return this.delete<{statusCode: number, message: string, error: string}>(`api/Chat/conversation/${sessionId}`);
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

  /**
   * MÉTODO PRINCIPAL DE CHAT - Punto único de comunicación con el backend
   * Implementa streaming real con Server-Sent Events (SSE)
   * Fallback a simulación si SSE no está disponible
   */
  async sendMessageStream(
    message: string,
    sessionId: string | undefined,
    onChunk: (chunkText: string) => void,
    onComplete: (fullResponse: string, sessionId: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    // Usar simulado por defecto hasta que el streaming esté implementado en el backend
    const useRealStreaming = false; // TODO: Cambiar a true cuando el backend soporte streaming
    
    if (useRealStreaming) {
      return this.sendMessageStreamReal(message, sessionId, onChunk, onComplete, onError);
    } else {
      return this.sendMessageStreamSimulated(message, sessionId, onChunk, onComplete, onError);
    }
  }

  /**
   * Implementación real de streaming con Server-Sent Events
   */
  private async sendMessageStreamReal(
    message: string,
    sessionId: string | undefined,
    onChunk: (chunkText: string) => void,
    onComplete: (fullResponse: string, sessionId: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const requestBody = {
        sessionId: sessionId || null,
        question: message,
        sModel: 'string',
        includeContext: true,
        contextIds: []
      };

      // Usar endpoint de streaming del backend según especificación
      const response = await fetch(`${BASE_API_URL}api/AI/process-question`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'api-version': DEFAULT_API_VERSION,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = '';
      let returnedSessionId = sessionId || '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.substring(6));
                
                if (data.type === 'chunk' && data.content) {
                  accumulatedText += data.content;
                  onChunk(accumulatedText);
                } else if (data.type === 'session' && data.sessionId) {
                  returnedSessionId = data.sessionId;
                } else if (data.type === 'complete') {
                  onComplete(accumulatedText, returnedSessionId);
                  return;
                } else if (data.type === 'error') {
                  throw new Error(data.message || 'Stream error');
                }
              } catch (parseError) {
                console.warn('Error parsing SSE data:', parseError);
              }
            }
          }
        }

        // Si llegamos aquí, el stream terminó sin mensaje de completado
        onComplete(accumulatedText, returnedSessionId);
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      console.error('Error in real streaming:', error);
      
      // Fallback a método simulado en caso de error
      console.log('Falling back to simulated streaming...');
      return this.sendMessageStreamSimulated(message, sessionId, onChunk, onComplete, onError);
    }
  }

  /**
   * Implementación simulada de streaming (fallback)
   */
  private async sendMessageStreamSimulated(
    message: string,
    sessionId: string | undefined,
    onChunk: (chunkText: string) => void,
    onComplete: (fullResponse: string, sessionId: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      console.log('🔄 Usando streaming simulado...');
      
      const response = await this.sendMessage(message, sessionId);
      
      // Verificar si la respuesta HTTP fue exitosa
      if (!response.success) {
        throw new Error(response.error || 'Failed to get response from chat service');
      }

      // Verificar si tenemos datos
      if (!response.data) {
        throw new Error('No data received from chat service');
      }

      // ✅ CORRECCIÓN: Manejar respuestas donde isSuccess puede ser false pero el statusCode es 200
      const responseData = response.data;
      
      // Verificar si el statusCode indica éxito (200-299)
      const isHttpSuccess = responseData.statusCode >= 200 && responseData.statusCode < 300;
      
      if (!isHttpSuccess) {
        // Si el statusCode no es exitoso, tratar como error
        const errorMessage = responseData.error || `HTTP ${responseData.statusCode}: Request failed`;
        throw new Error(errorMessage);
      }

      // Extraer la respuesta según la nueva estructura del API
      // Priorizar naturalResponse > response > mensaje de error contextual
      let fullResponse = '';
      
      if (responseData.naturalResponse && responseData.naturalResponse.trim()) {
        fullResponse = responseData.naturalResponse;
      } else if (responseData.response && responseData.response.trim()) {
        fullResponse = responseData.response;
      } else if (responseData.contextualizedQuestions && responseData.contextualizedQuestions.trim()) {
        // Si no hay respuesta directa, usar las preguntas contextualizadas como fallback
        fullResponse = responseData.contextualizedQuestions;
      } else {
        // Si no hay ninguna respuesta, mostrar mensaje indicativo
        fullResponse = "Lo siento, no pude generar una respuesta apropiada. ¿Podrías reformular tu pregunta?";
      }

      const newSessionId = responseData.sessionId || sessionId || this.generateSessionId();
      
      // Simular streaming dividiendo la respuesta en chunks más naturales
      const chunks = this.splitIntoNaturalChunks(fullResponse);
      let accumulatedText = '';
      
      for (const chunk of chunks) {
        accumulatedText += chunk;
        onChunk(accumulatedText);
        
        // Delay variable según la longitud del chunk
        const delay = Math.min(Math.max(chunk.length * 20, 30), 150);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      onComplete(fullResponse, newSessionId);
    } catch (error) {
      console.error('Error in simulated streaming:', error);
      onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
  }

  /**
   * Divide el texto en chunks más naturales (por frases/párrafos)
   */
  private splitIntoNaturalChunks(text: string): string[] {
    // Dividir por frases y párrafos para un streaming más natural
    const sentences = text.split(/([.!?]\s+)/);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (let i = 0; i < sentences.length; i++) {
      currentChunk += sentences[i];
      
      // Si es una oración completa o hemos acumulado suficiente texto
      if (sentences[i].match(/[.!?]\s+/) || currentChunk.length > 50) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk);
          currentChunk = '';
        }
      }
    }
    
    // Agregar cualquier texto restante
    if (currentChunk.trim()) {
      chunks.push(currentChunk);
    }
    
    return chunks.length > 0 ? chunks : [text];
  }
}

export const bffChatService = new BFFChatService();
