import { ApiResponse, ChatSession } from '../types';
import { BASE_API_URL, DEFAULT_API_VERSION } from '../config/config';

/**
 * FLUJO DE CONVERSACIÓN CON DOS ENDPOINTS:
 * 
 * 1. `/api/AI/process-question` - Procesa la pregunta del usuario y retorna la respuesta de la IA
 *    - Input: pregunta del usuario, sessionId, firebaseUserId
 *    - Output: respuesta procesada por la IA
 * 
 * 2. `/api/Chat/conversation` - Guarda la conversación completa en la base de datos
 *    - Input: sessionId, mensaje del usuario, respuesta de la IA, firebaseUserId
 *    - Output: confirmación de guardado
 * 
 * El flujo es secuencial:
 * 1. Primero se procesa la pregunta con AI/process-question
 * 2. Se muestra la respuesta al usuario
 * 3. Se guarda la conversación completa con Chat/conversation
 */

export interface ChatResponse {
  statusCode: number;
  message: string;
  error: string;
  isSuccess: boolean;
  originalQuestion: string;
  contextualizedQuestion: string;
  isContextualized: boolean;
  validationStatus: string;
  clarificationMessage: string;
  generatedSQL: string | null;
  databaseResults: string | null;
  naturalResponse: string | null;
  aiModelUsed: string;
  processingTimeMs: number;
  steps: {
    contextualizationTimeMs: number;
    validationTimeMs: number;
    sqlGenerationTimeMs: number;
    sqlExecutionTimeMs: number;
    naturalResponseTimeMs: number;
  };
  sessionId?: string;
  // Campos adicionales que pueden venir del endpoint AI/process-question
  description?: string | null;
  userFriendly?: string | null;
  moreInformation?: string | null;
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
      const url = `${BASE_API_URL}${endpoint}`;
      console.log('🌐 URL completa:', url);
      console.log('📦 Body enviado:', body);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'api-version': DEFAULT_API_VERSION,
        },
        body: JSON.stringify(body),
      });

      console.log('📡 Respuesta del servidor:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📄 Datos recibidos:', data);

      if (!response.ok) {
        console.error('❌ Error en respuesta:', data);
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
      console.error('🚨 BFF POST request failed:', error);
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

  /**
   * Procesar pregunta usando el endpoint AI/process-question
   */
  async processQuestion(message: string, firebaseUserId: string, aiModel: string = 'gemini', sessionId?: string): Promise<ApiResponse<ChatResponse>> {
    console.log('🔥 Procesando pregunta con endpoint:', 'api/AI/process-question');
    console.log('🧠 Modelo de IA enviado al backend:', aiModel);
    console.log('📝 Datos enviados:', {
      sessionId: sessionId,
      question: message,
      aiModel: aiModel,
      includeContext: true,
      contextLimit: 10,
      firebaseUserId: firebaseUserId
    });
    
    return this.post<ChatResponse>('api/AI/process-question', {
      sessionId: sessionId,
      question: message,
      aiModel: aiModel,
      includeContext: true,
      contextLimit: 10,
      firebaseUserId: firebaseUserId
    });
  }

  /**
   * Guardar conversación usando el endpoint Chat/conversation
   */
  async saveConversation(
    sessionId: string,
    userMessage: string,
    assistantResponse: string,
    firebaseUserId: string
  ): Promise<ApiResponse<any>> {
    console.log('💾 Guardando conversación con endpoint:', 'api/Chat/conversation');
    
    const conversationData = {
      sessionId,
      userMessage,
      assistantResponse,
      firebaseUserId,
      timestamp: new Date().toISOString()
    };
    
    console.log('📝 Datos enviados:', conversationData);
    
    return this.post<any>('api/Chat/conversation', conversationData);
  }

  async sendMessage(message: string, firebaseUserId: string, aiModel: string = 'gemini', sessionId?: string): Promise<ApiResponse<ChatResponse>> {
    // Este método ahora es un wrapper que llama a processQuestion
    return this.processQuestion(message, firebaseUserId, aiModel, sessionId);
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
   * Streaming real usando ambos endpoints
   */
  async sendMessageStream(
    message: string,
    firebaseUserId: string,
    aiModel: string,
    sessionId: string | undefined,
    onChunk: (chunkText: string) => void,
    onComplete: (fullResponse: string, sessionId: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      console.log('📡 Iniciando sendMessageStream con dos endpoints');
      console.log('🤖 1. Procesando pregunta con AI/process-question');
      console.log('🧠 Modelo de IA seleccionado:', aiModel);
      
      // Paso 1: Procesar la pregunta con el endpoint AI
      const response = await this.processQuestion(message, firebaseUserId, aiModel, sessionId);

      if (!response.success || !response.data) {
        console.error('❌ Error en respuesta del servicio AI:', response.error);
        throw new Error(response.error || 'Failed to get response from AI service');
      }

      const responseData = response.data;
      console.log('📦 Respuesta del AI:', responseData);
      
      // Extraer la respuesta con la prioridad ampliada
      let fullResponse = responseData.naturalResponse
        || responseData.clarificationMessage
        || responseData.userFriendly
        || responseData.description
        || responseData.message
        || responseData.contextualizedQuestion
        || 'No se pudo obtener respuesta.';

      const newSessionId = responseData.sessionId || sessionId || `session_${Date.now()}`;
      console.log('🆔 Session ID para guardar:', newSessionId);
      console.log('💬 Respuesta AI procesada:', fullResponse.substring(0, 100) + '...');

      // Paso 2: Mostrar la respuesta al usuario primero
      onChunk(fullResponse);

      // Paso 3: Guardar la conversación en el endpoint Chat
      console.log('💾 2. Guardando conversación con Chat/conversation');
      try {
        const saveResponse = await this.saveConversation(
          newSessionId,
          message,
          fullResponse,
          firebaseUserId
        );

        if (!saveResponse.success) {
          console.warn('⚠️ Advertencia: No se pudo guardar la conversación:', saveResponse.error);
          // No interrumpimos el flujo, solo logueamos la advertencia
        } else {
          console.log('✅ Conversación guardada exitosamente');
        }
      } catch (saveError) {
        console.warn('⚠️ Error al guardar conversación:', saveError);
        // No interrumpimos el flujo, solo logueamos el error
      }

      // Paso 4: Completar el flujo
      onComplete(fullResponse, newSessionId);
    } catch (error) {
      console.error('🚨 Error in sendMessageStream:', error);
      onError(error instanceof Error ? error : new Error('Unknown error occurred'));
    }
  }
}

export const bffChatService = new BFFChatService();
