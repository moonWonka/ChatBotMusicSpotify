import React from 'react';
import { ChatMessageContent, MessageSender } from '../../types';
import { UserIcon, AiIcon } from '../shared/Icons';

interface ChatMessageItemProps {
  message: ChatMessageContent;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const isUser = message.sender === MessageSender.USER;

  // Basic markdown-like link detection and conversion
  const formatText = (text: string): React.ReactNode => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = linkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(
        <a
          key={match.index}
          href={match[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-purple-400 hover:text-purple-300 underline"
        >
          {match[1]}
        </a>
      );
      lastIndex = linkRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    // Convert newlines to <br />
    return parts.map((part, index) => 
        typeof part === 'string' 
        ? part.split('\n').map((line, i) => (
            <React.Fragment key={`${index}-${i}`}>
              {line}
              {i < part.split('\n').length - 1 && <br />}
            </React.Fragment>
          ))
        : part
    );
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
          <AiIcon size={20} className="text-purple-300" />
        </div>
      )}
      <div className="flex flex-col max-w-sm md:max-w-md lg:max-w-lg">
        <div
          className={`
            rounded-xl p-3 break-words shadow-sm
            ${isUser 
              ? 'bg-purple-600 text-white rounded-br-none' 
              : 'bg-gray-700 text-gray-200 rounded-bl-none'
            }
          `}
        >
          <p className="text-sm whitespace-pre-wrap">{formatText(message.text)}</p>
        </div>
        <span 
          className={`text-xs text-gray-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {formatTimestamp(message.timestamp)}
        </span>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
          <UserIcon size={20} className="text-white" />
        </div>
      )}
    </div>
  );
};

export default ChatMessageItem;
