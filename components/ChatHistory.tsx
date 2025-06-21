
import React, { useEffect, useRef } from 'react';
import { ChatMessageContent } from '../types';
import ChatMessageItem from './ChatMessageItem';

interface ChatHistoryProps {
  messages: ChatMessageContent[];
}

const ChatHistory: React.FC<ChatHistoryProps> = ({ messages }) => {
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div ref={chatHistoryRef} className="flex-grow overflow-y-auto p-6 space-y-4 bg-gray-850 custom-scrollbar">
      {messages.map((msg) => (
        <ChatMessageItem key={msg.id} message={msg} />
      ))}
    </div>
  );
};

export default ChatHistory;
