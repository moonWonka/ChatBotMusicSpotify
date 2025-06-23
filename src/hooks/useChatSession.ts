import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessageContent, MessageSender } from '../types';
import { bffChatService } from '../services/chatService';

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
      setError(null);

      // Nueva sesión siempre (sin persistencia)
      const newSessionId = generateSessionId();
      setCurrentSessionId(newSessionId);
      setSessionTitle('Nueva Conversación');
      
      const initialMessage: ChatMessageContent = {
        id: Date.now().toString() + '-ai-init',
        sender: MessageSender.AI,
        text: "¡Hola! Soy Skynet AI, tu asistente musical de Spotify. ¿De qué humor estás hoy? ¡Pregúntame sobre artistas, canciones, géneros o ideas para listas de reproducción! 🎵",
        timestamp: Date.now(),
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
  };

  // Función simplificada sin persistencia
  const saveCurrentSession = useCallback(async (sessionMessages: ChatMessageContent[]) => {
    // Solo mantenemos en memoria durante la sesión
    console.log('Sesión actual en memoria:', {
      id: currentSessionId,
      title: sessionTitle,
      messageCount: sessionMessages.length
    });
  }, [currentSessionId, sessionTitle]);

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessageContent = {
      id: Date.now().toString() + '-user',
      sender: MessageSender.USER,
      text: inputText,
      timestamp: Date.now(),
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
        (fullResponse: string) => {
          setIsLoading(false);
          // Guardar sesión después de completar la respuesta
          const finalMessages = messagesWithPlaceholder.map(msg =>
            msg.id === aiPlaceholderMessageId ? { ...msg, text: fullResponse } : msg
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
  }, [initChat]);
  return {
    messages,
    isLoading,
    error,
    currentSessionId,
    sessionTitle,
    handleSendMessage,
    startNewChat,
    clearError: () => setError(null),
  };
};
