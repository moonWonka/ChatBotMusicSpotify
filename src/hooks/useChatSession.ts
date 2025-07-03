import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessageContent, MessageSender } from '../types';
import { bffChatService } from '../services/chatService';
import { historyService } from '../services/historyService';
import { useAuth } from './useAuth';

export const useChatSession = (selectedModel: string = 'gemini') => {
  const { user } = useAuth(); // Obtener el usuario autenticado
  const [messages, setMessages] = useState<ChatMessageContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionTitle, setSessionTitle] = useState<string>('Nueva Conversación');
  
  const hasInitialized = useRef<boolean>(false);

  const generateSessionId = (): string => {
    return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
  };
  const initChat = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);      // Nueva sesión (el BFF manejará la persistencia automáticamente)
      const newSessionId = generateSessionId();
      setCurrentSessionId(newSessionId);
      setSessionTitle('Nueva Conversación');
      
      const initialMessage: ChatMessageContent = {
        id: Date.now().toString() + '-ai-init',
        sender: MessageSender.AI,
        text: "¡Hola! Soy Skynet AI, tu asistente musical de Spotify. ¿De qué humor estás hoy? ¡Pregúntame sobre artistas, canciones, géneros o ideas para listas de reproducción! 🎵",
        timestamp: Date.now(),
        sessionId: newSessionId,
      };
      
      setMessages([initialMessage]);
      setError(null);
    } catch (e) {
      console.error("No se pudo inicializar la sesión de chat:", e);
      setError(e instanceof Error ? e.message : "Ocurrió un error desconocido durante la inicialización.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  // Función para generar título basado en el primer mensaje
  const generateSessionTitle = (firstMessage: string): string => {
    const cleaned = firstMessage.trim();
    if (cleaned.length <= 50) {
      return cleaned;
    }
    
    // Busca una oración completa
    const sentences = cleaned.split(/[.!?]+/);
    if (sentences[0] && sentences[0].length <= 50) {
      return sentences[0].trim();
    }
    
    // Trunca a 50 caracteres
    return cleaned.substring(0, 47) + '...';
  };  // Función para guardar sesión - Solo en backend con Firebase UID
  const saveCurrentSession = useCallback(async (sessionMessages: ChatMessageContent[]) => {
    if (!currentSessionId || sessionMessages.length === 0 || !user?.id) return;
    
    try {
      // El guardado se hace automáticamente en sendMessageStream con Firebase UID
      console.log('💾 Conversación guardada en backend con Firebase UID:', user.id);
      console.log('📝 Título de sesión:', sessionTitle);
      console.log('📊 Total de mensajes:', sessionMessages.length);
    } catch (error) {
      console.error('Error en saveCurrentSession:', error);
    }
  }, [currentSessionId, sessionTitle, user?.id]);

  /**
   * Cargar una conversación existente desde el backend
   */
  const loadConversation = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Cargar directamente desde el backend
      const response = await historyService.getConversation(sessionId);
      
      if (response.success && response.data) {
        const conversation = response.data;
        setCurrentSessionId(conversation.sessionId || conversation.id);
        setSessionTitle(conversation.title);
        setMessages(conversation.messages);
        console.log('📂 Conversación cargada desde backend:', conversation.title);
      } else {
        setError(response.error || 'Error al cargar la conversación');
      }
    } catch (err) {
      console.error('Error loading conversation:', err);
      setError('Error de conexión al cargar la conversación');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSendMessage = async (inputText: string) => {
    console.log('🚀 Iniciando envío de mensaje:', inputText);
    console.log('👤 Usuario autenticado:', user?.id);
    console.log('🆔 Session ID actual:', currentSessionId);
    
    if (!inputText.trim() || isLoading || !user?.id) {
      if (!user?.id) {
        console.error('❌ Usuario no autenticado');
        setError('Error: Usuario no autenticado');
      }
      return;
    }

    const userMessage: ChatMessageContent = {
      id: Date.now().toString() + '-user',
      sender: MessageSender.USER,
      text: inputText,
      timestamp: Date.now(),
      sessionId: currentSessionId || undefined,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setIsLoading(true);
    setError(null);    // Generar título de sesión si es el primer mensaje del usuario
    if (messages.length === 1 && sessionTitle === 'Nueva Conversación') {
      const newTitle = generateSessionTitle(inputText);
      setSessionTitle(newTitle);
    }

    const aiPlaceholderMessageId = Date.now().toString() + '-ai';
    const aiPlaceholderMessage: ChatMessageContent = {
      id: aiPlaceholderMessageId,
      sender: MessageSender.AI,
      text: '',
      timestamp: Date.now(),
      sessionId: currentSessionId || undefined,
    };
    
    const messagesWithPlaceholder = [...newMessages, aiPlaceholderMessage];
    setMessages(messagesWithPlaceholder);    try {
      console.log('📞 Llamando al servicio sendMessageStream...');
      console.log('🧠 Modelo de IA seleccionado:', selectedModel);
      await bffChatService.sendMessageStream(
        inputText,
        user.id, // Firebase UID
        selectedModel, // Modelo de IA seleccionado
        currentSessionId || undefined,
        (chunkText: string) => {
          console.log('📝 Chunk recibido:', chunkText.substring(0, 50) + '...');
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === aiPlaceholderMessageId ? { ...msg, text: chunkText } : msg
            )
          );
        },
        (fullResponse: string, returnedSessionId: string) => {
          console.log('✅ Respuesta completa recibida');
          console.log('🆔 Nuevo Session ID:', returnedSessionId);
          setIsLoading(false);
          setCurrentSessionId(returnedSessionId);
          const finalMessages = messagesWithPlaceholder.map(msg =>
            msg.id === aiPlaceholderMessageId
              ? { ...msg, text: fullResponse, sessionId: returnedSessionId }
              : msg
          );
          saveCurrentSession(finalMessages);
        },
        (err: Error) => {
          console.error("❌ Error al enviar mensaje:", err);
          setError(err.message || "No se pudo obtener respuesta de la IA.");
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === aiPlaceholderMessageId ? { ...msg, text: "Lo siento, encontré un error. Por favor, inténtalo de nuevo." } : msg
            )
          );
          setIsLoading(false);
        }
      );
    } catch (e) {
      console.error("🚨 Error en el manejo de sendMessageStream:", e);
      setError(e instanceof Error ? e.message : "Ocurrió un error inesperado.");
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === aiPlaceholderMessageId ? { ...msg, text: "Lo siento, ocurrió un error crítico." } : msg
        )
      );
      setIsLoading(false);
    }
  };  const startNewChat = useCallback(() => {
    setMessages([]);
    setCurrentSessionId(null);
    setSessionTitle('Nueva Conversación');
    setError(null);
    initChat();
  }, [initChat]);

  useEffect(() => {
    if (!hasInitialized.current) {
      initChat();
      hasInitialized.current = true;
    }
  }, [initChat]);  return {
    messages,
    isLoading,
    error,
    currentSessionId,
    sessionTitle,
    handleSendMessage,
    startNewChat,
    loadConversation,
    clearError: () => setError(null),
  };
};
