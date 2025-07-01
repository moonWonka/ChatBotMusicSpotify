import React, { useEffect, useRef, useState } from 'react';
import { ChatMessageContent } from '../../types';
import ChatMessageItem from './ChatMessageItem';
import LoadingSpinner from '../shared/LoadingSpinner';
import MusicDetailsModal from './MusicDetailsModal';

interface ChatHistoryProps {
  messages: ChatMessageContent[];
  isLoading?: boolean;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages, isLoading = false }) => {
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessageContent | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  const handleShowDetails = (message: ChatMessageContent) => {
    setSelectedMessage(message);
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
    setSelectedMessage(null);
  };

  return (
    <div 
      ref={chatHistoryRef} 
      className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-850 custom-scrollbar"
    >
      {messages.length === 0 ? (
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-gray-400">
            <h3 className="text-lg font-medium mb-2">¡Bienvenido!</h3>
            <p className="text-sm">Comienza una conversación sobre música</p>
          </div>
        </div>
      ) : (
        messages.map((msg) => (
          <ChatMessageItem 
            key={msg.id} 
            message={msg} 
            onShowDetails={handleShowDetails}
          />
        ))
      )}
      
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner />
          <span className="ml-2 text-sm text-gray-400">Skynet AI está pensando...</span>
        </div>
      )}

      {/* Music Details Modal */}
      <MusicDetailsModal
        isOpen={showDetailsModal}
        message={selectedMessage}
        onClose={handleCloseDetails}
      />
    </div>
  );
};

export default ChatHistory;
