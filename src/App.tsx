import React, { useState } from 'react';
import { useChatSession } from './hooks/useChatSession';
import ChatHistory from './components/chat/ChatHistory';
import ChatInput from './components/chat/ChatInput';
import ErrorMessage from './components/shared/ErrorMessage';
import Button from './components/shared/Button';
import WelcomeScreen from './components/shared/WelcomeScreen';
import MainMenu from './components/menu/MainMenu';
import NewChatModal from './components/menu/NewChatModal';
import ConversationInfo from './components/menu/ConversationInfo';
import HistoryModal from './components/menu/HistoryModal';
import TestButton from './components/shared/TestButton';

const App: React.FC = () => {
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showConversationInfo, setShowConversationInfo] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini');const {
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

  const hasActiveConversation = messages.length > 0;
  // Handlers for menu actions
  const handleStartNewChat = () => {
    setShowNewChatModal(true);
  };  const handleShowHistory = () => {
    setShowHistoryModal(true);
  };

  const handleLoadConversation = (sessionId: string) => {
    // TODO: Implementar loadConversation en el hook useChatSession
    console.log('Loading conversation:', sessionId);
    alert(`Cargando conversación: ${sessionId}\n\nEsta funcionalidad se implementará cuando el hook soporte cargar conversaciones.`);
    setShowHistoryModal(false);  };

  const handleNewChatWithModel = (model: string) => {
    setSelectedModel(model);
    console.log(`🧠 Modelo seleccionado: ${model.charAt(0).toUpperCase() + model.slice(1)}`);
    startNewChat();
    setShowNewChatModal(false);
  };

  const handleShowConversationInfo = () => {
    if (hasActiveConversation) {
      setShowConversationInfo(true);
    }
  };
  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-grow">
        {/* Header */}
        <header className="bg-purple-700 p-4 shadow-md flex items-center gap-3 z-10">
          {/* Menu Button */}          <MainMenu
            onStartNewChat={handleStartNewChat}
            onShowHistory={handleShowHistory}
            isConversationActive={hasActiveConversation}
          />
            <div className="flex-grow">
            <h1 className="text-xl font-bold text-center">
              {sessionTitle}
            </h1>
            <p className="text-sm text-purple-200 text-center">
              Chatbot de Música Spotify
            </p>
            {hasActiveConversation && (
              <div className="text-center mt-1">
                <button
                  onClick={handleShowConversationInfo}
                  className="text-xs text-purple-300 hover:text-purple-100 underline"
                >
                  📊 Ver info de conversación
                </button>
              </div>
            )}
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={startNewChat}
            className="ml-auto"
          >
            Nueva Conversación
          </Button>
        </header>        {/* Error Message */}
        {error && (
          <ErrorMessage 
            message={error}
            onDismiss={clearError}
            variant="error"
          />
        )}

        {/* Test Button - Solo para desarrollo */}
        <div className="mb-4">
          <TestButton />
        </div>

        {/* Main Content */}
        {hasActiveConversation ? (
          <>
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
          </>        ) : (
          <WelcomeScreen
            onStartNewChat={handleStartNewChat}
          />        )}
      </div>

      {/* New Chat Modal */}
      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        onStartNewChat={handleNewChatWithModel}
        hasActiveConversation={hasActiveConversation}
      />      {/* Conversation Info Modal */}
      {hasActiveConversation && showConversationInfo && (
        <ConversationInfo
          messages={messages}
          sessionId="temp-session"
          selectedModel={selectedModel}
          onClose={() => setShowConversationInfo(false)}
        />
      )}      {/* History Modal */}
      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onLoadConversation={handleLoadConversation}
      />
    </div>
  );
};

export default App;
