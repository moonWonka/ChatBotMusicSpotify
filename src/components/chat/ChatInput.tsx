import React, { useState, useRef, useEffect } from 'react';
import { SendIcon } from '../shared/Icons';
import Button from '../shared/Button';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  placeholder?: string;
}

const MUSIC_SUGGESTIONS = [
  "¿Cuáles son las mejores canciones de rock de los 80?",
  "Recomiéndame música similar a The Beatles",
  "¿Qué géneros musicales están de moda?",
  "Busca canciones relajantes para estudiar",
  "¿Cuál es la discografía completa de Queen?",
  "Recomiéndame playlist para hacer ejercicio",
  "¿Qué artistas son similares a Billie Eilish?",
  "Busca música latina actual",
  "¿Cuáles son los mejores álbumes de jazz?",
  "Recomiéndame música para dormir"
];

const ChatInput: React.FC<ChatInputProps> = ({ 
  onSendMessage, 
  isLoading, 
  placeholder = "Pregunta sobre música..."
}) => {
  const [inputText, setInputText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (inputText.length > 0) {
      const filtered = MUSIC_SUGGESTIONS.filter(suggestion =>
        suggestion.toLowerCase().includes(inputText.toLowerCase())
      );
      setFilteredSuggestions(filtered.slice(0, 5));
      setShowSuggestions(filtered.length > 0 && inputText.length > 2);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
  }, [inputText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isLoading) {
      onSendMessage(inputText);
      setInputText('');
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputText(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
  };

  const handleInputFocus = () => {
    if (inputText.length === 0) {
      setFilteredSuggestions(MUSIC_SUGGESTIONS.slice(0, 5));
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      {/* Suggestions dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute bottom-full left-4 right-4 mb-2 bg-gray-700 rounded-lg border border-gray-600 shadow-xl z-10 max-h-60 overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs text-gray-400 mb-2 px-2">💡 Sugerencias musicales</div>
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 rounded transition-colors duration-150"
              >
                🎵 {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="p-4 bg-gray-800 border-t border-gray-700 flex items-center gap-3 sticky bottom-0">
        <div className="flex-grow relative">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            placeholder={isLoading ? "La IA está pensando..." : placeholder}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-shadow duration-150 disabled:opacity-50"
            disabled={isLoading}
            aria-label="Escribe tu mensaje aquí"
          />
          {inputText.length === 0 && !isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
              🎵 Haz click para ver sugerencias
            </div>
          )}
        </div>
        <Button
          type="submit"
          disabled={isLoading || !inputText.trim()}
          className="w-12 h-12 p-0"
          aria-label="Enviar mensaje"
        >
          <SendIcon size={20} />
        </Button>
      </form>
    </div>
  );
};

export default ChatInput;
