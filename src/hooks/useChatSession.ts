import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessageContent, MessageSender, ChatSession } from '../types';
import { bffChatService } from '../services/chatService';
import { historyService } from '../services/historyService';

export const useChatSession = () => {
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
  };  // Función para guardar sesión en el BFF (automática al enviar mensajes)
  const saveCurrentSession = useCallback(async (sessionMessages: ChatMessageContent[]) => {
    if (!currentSessionId || sessionMessages.length === 0) return;
    try {
      // Guardar la conversación llamando al endpoint real
      const lastUserMessage = sessionMessages.filter(m => m.sender === MessageSender.USER).pop();
      if (lastUserMessage) {
        await bffChatService.sendMessage(lastUserMessage.text, currentSessionId);
      }
      // Puedes agregar aquí lógica adicional si necesitas manejar la respuesta
    } catch (error) {
      console.error('Error en saveCurrentSession:', error);
    }
  }, [currentSessionId, sessionTitle]);

  /**
   * Cargar una conversación existente desde el historial
   */
  const loadConversation = useCallback(async (sessionId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await historyService.getConversation(sessionId);
      
      if (response.success && response.data) {
        const conversation = response.data;
        setCurrentSessionId(conversation.sessionId || conversation.id);
        setSessionTitle(conversation.title);
        setMessages(conversation.messages);
      } else {
        setError(response.error || 'Error al cargar la conversación');
      }
    } catch (err) {
      setError('Error de conexión al cargar la conversación');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim() || isLoading) return;

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
      await bffChatService.sendMessageStream(
        inputText,
        currentSessionId || undefined,
        (chunkText: string) => {
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === aiPlaceholderMessageId ? { ...msg, text: chunkText } : msg
            )
          );
        },
        (fullResponse: string, returnedSessionId: string) => {
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
          console.error("Error al enviar mensaje:", err);
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
      console.error("Error en el manejo de sendMessageStream:", e);
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
