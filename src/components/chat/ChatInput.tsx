import React, { useState } from 'react';
import { SendIcon } from '../shared/Icons';
import Button from '../shared/Button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  placeholder = "Pregunta sobre música..."
}) => {
  const [inputText, setInputText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700 flex items-center gap-3 sticky bottom-0">
      <input
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={isLoading ? "La IA está pensando..." : placeholder}
        className="flex-grow bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow duration-150 disabled:opacity-50"
        disabled={isLoading}
        aria-label="Escribe tu mensaje aquí"
      />
      <Button
        type="submit"
        disabled={isLoading || !inputText.trim()}
        className="w-12 h-12 p-0"
        aria-label="Enviar mensaje"
      >
        <SendIcon size={20} />
      </Button>
    </form>
  );
};

export default ChatInput;
