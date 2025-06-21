
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chat } from '@google/genai';
import { MessageSender, ChatMessageContent } from './types';
import ChatHistory from './components/ChatHistory';
import ChatInput from './components/ChatInput';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessageContent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const apiKeyExists = useRef<boolean>(typeof process.env.API_KEY === 'string' && process.env.API_KEY.length > 0);


  const initChat = useCallback(async () => {
    if (!apiKeyExists.current) {
      setError("La variable de entorno API_KEY no está configurada. Por favor, configúrala para usar el chatbot.");
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const session = GeminiService.startChatSession();
      setChatSession(session);
      
      const initialMessage: ChatMessageContent = {
        id: Date.now().toString() + '-ai-init',
        sender: MessageSender.AI,
        text: "¡Hola! Soy Skynet AI, tu asistente musical de Spotify. ¿De qué humor estás hoy? ¡Pregúntame sobre artistas, canciones, géneros o ideas para listas de reproducción!",
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

  useEffect(() => {
    initChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initChat]);

  const handleSendMessage = async (inputText: string) => {
    if (!inputText.trim() || isLoading || !chatSession) return;

    const userMessage: ChatMessageContent = {
      id: Date.now().toString() + '-user',
      sender: MessageSender.USER,
      text: inputText,
      timestamp: Date.now(),
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setIsLoading(true);
    setError(null);

    const aiPlaceholderMessageId = Date.now().toString() + '-ai';
    const aiPlaceholderMessage: ChatMessageContent = {
      id: aiPlaceholderMessageId,
      sender: MessageSender.AI,
      text: '',
      timestamp: Date.now(),
    };
    setMessages(prevMessages => [...prevMessages, aiPlaceholderMessage]);

    let accumulatedResponse = "";

    try {
      await GeminiService.sendMessageStream(
        chatSession,
        inputText,
        (chunkText) => {
          accumulatedResponse += chunkText;
          setMessages(prevMessages =>
            prevMessages.map(msg =>
              msg.id === aiPlaceholderMessageId ? { ...msg, text: accumulatedResponse } : msg
            )
          );
        },
        () => { // onComplete
          setIsLoading(false);
        },
        (err) => { // onError
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
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <header className="bg-purple-700 p-4 shadow-md sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-center text-white">Chatbot de Música Spotify</h1>
      </header>
      
      {error && (
        <div className="bg-red-500 text-white p-3 text-center">
          <p>Error: {error}</p>
          {!apiKeyExists.current && <p>Asegúrate de que la API_KEY esté configurada correctamente en tus variables de entorno y actualiza la aplicación.</p>}
        </div>
      )}

      <ChatHistory messages={messages} />
      
      {isLoading && messages.length > 0 && messages[messages.length-1].sender === MessageSender.AI && messages[messages.length-1].text === '' && (
        <div className="px-6 py-2 text-sm text-gray-400 italic text-center">Harmony AI está pensando...</div>
      )}

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading || !apiKeyExists.current} />
    </div>
  );
};

export default App;
