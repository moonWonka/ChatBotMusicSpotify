import React, { useState } from 'react';
import { ChatMessageContent, MessageSender } from '../../types';
import { UserIcon, AiIcon } from '../shared/Icons';

interface ChatMessageItemProps {
  message: ChatMessageContent;
  onShowDetails?: (message: ChatMessageContent) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message, onShowDetails }) => {
  const isUser = message.sender === MessageSender.USER;
  const [showActions, setShowActions] = useState(false);

  // Enhanced text formatting with Spotify link detection
  const formatText = (text: string): React.ReactNode => {
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const spotifyRegex = /(https?:\/\/open\.spotify\.com\/[^\s]+)/g;
    const musicEntityRegex = /🎵\s*([^🎵\n]+)/g; // Detect music entities marked with 🎵
    
    let formattedText = text;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;

    // Handle Spotify links first
    let match;
    while ((match = spotifyRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }
      elements.push(
        <a
          key={`spotify-${match.index}`}
          href={match[1]}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 underline"
        >
          🎵 Abrir en Spotify
        </a>
      );
      lastIndex = spotifyRegex.lastIndex;
    }

    // Reset for markdown links
    const remainingText = lastIndex < text.length ? text.substring(lastIndex) : text;
    const linkMatches = [];
    let linkMatch;
    const linkRegexNew = new RegExp(linkRegex.source, linkRegex.flags);
    
    while ((linkMatch = linkRegexNew.exec(remainingText)) !== null) {
      linkMatches.push(linkMatch);
    }

    if (linkMatches.length > 0) {
      let currentIndex = 0;
      linkMatches.forEach((linkMatch, i) => {
        if (linkMatch.index > currentIndex) {
          elements.push(remainingText.substring(currentIndex, linkMatch.index));
        }
        elements.push(
          <a
            key={`link-${i}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            {linkMatch[1]}
          </a>
        );
        currentIndex = linkMatch.index + linkMatch[0].length;
      });
      
      if (currentIndex < remainingText.length) {
        elements.push(remainingText.substring(currentIndex));
      }
    } else if (lastIndex === 0) {
      elements.push(text);
    }
    
    // Convert newlines to <br />
    return elements.map((part, index) => 
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

  const hasMusicContent = !isUser && (
    message.text.includes('🎵') || 
    message.text.includes('spotify.com') ||
    message.text.toLowerCase().includes('canción') ||
    message.text.toLowerCase().includes('artista') ||
    message.text.toLowerCase().includes('álbum')
  );

  return (
    <div 
      className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'} group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
          <AiIcon size={20} className="text-purple-300" />
        </div>
      )}
      <div className="flex flex-col max-w-sm md:max-w-md lg:max-w-lg relative">
        <div
          className={`
            rounded-xl p-3 break-words shadow-sm relative
            ${isUser 
              ? 'bg-purple-600 text-white rounded-br-none' 
              : 'bg-gray-700 text-gray-200 rounded-bl-none'
            }
            ${hasMusicContent ? 'border-l-4 border-green-400' : ''}
          `}
        >
          <p className="text-sm whitespace-pre-wrap">{formatText(message.text)}</p>
          
          {/* Action buttons for AI messages with music content */}
          {!isUser && hasMusicContent && showActions && onShowDetails && (
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={() => onShowDetails(message)}
                className="bg-gray-600 hover:bg-gray-500 text-white text-xs px-2 py-1 rounded opacity-75 hover:opacity-100 transition-opacity"
                title="Ver detalles musicales"
              >
                🎵 Detalles
              </button>
            </div>
          )}
        </div>
        
        {/* Enhanced timestamp with music indicator */}
        <div className={`flex items-center gap-2 mt-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          {hasMusicContent && (
            <span className="text-xs text-green-400">🎵</span>
          )}
          <span 
            className={`text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            {formatTimestamp(message.timestamp)}
          </span>
        </div>
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
