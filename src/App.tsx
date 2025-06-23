import React from 'react';
import { useChatSession } from './hooks/useChatSession';
import ChatHistory from './components/chat/ChatHistory';
import ChatInput from './components/chat/ChatInput';
import ErrorMessage from './components/shared/ErrorMessage';
import Button from './components/shared/Button';

const App: React.FC = () => {  const {
    messages,
    isLoading,
    error,
    sessionTitle,
    handleSendMessage,
    startNewChat,
    clearError,
  } = useChatSession();
  const isTyping = isLoading && messages.length > 0 && 
    messages[messages.length - 1].sender === 'ai' && 
    messages[messages.length - 1].text === '';

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-grow">
        {/* Header */}
        <header className="bg-purple-700 p-4 shadow-md flex items-center gap-3 z-10">
          <div className="flex-grow">
            <h1 className="text-xl font-bold text-center">
              {sessionTitle}
            </h1>
            <p className="text-sm text-purple-200 text-center">
              Chatbot de Música Spotify
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={startNewChat}
            className="ml-auto"
          >
            Nueva Conversación
          </Button>
        </header>
          {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error}
            onDismiss={clearError}
            variant="error"
          />
        )}

        {/* Chat History */}
        <ChatHistory 
          messages={messages} 
          isLoading={isTyping}
        />

        {/* Chat Input */}
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading}
          placeholder="Pregunta sobre música, artistas, géneros..."
        />
      </div>
    </div>
  );
};

export default App;
