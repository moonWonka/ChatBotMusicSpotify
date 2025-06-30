import React from 'react';
import { ChatMessageContent } from '../../types';
import Button from '../shared/Button';

interface MusicDetailsModalProps {
  isOpen: boolean;
  message: ChatMessageContent | null;
  onClose: () => void;
}

interface MusicEntity {
  type: 'artist' | 'song' | 'album' | 'genre' | 'playlist';
  name: string;
  details?: string;
  spotifyUrl?: string;
}

const MusicDetailsModal: React.FC<MusicDetailsModalProps> = ({ 
  isOpen, 
  message, 
  onClose 
}) => {
  if (!isOpen || !message) return null;

  // Extract music entities from the message text
  const extractMusicEntities = (text: string): MusicEntity[] => {
    const entities: MusicEntity[] = [];
    
    // Extract Spotify URLs
    const spotifyRegex = /https?:\/\/open\.spotify\.com\/([^\/]+)\/([^?\s]+)/g;
    let match;
    while ((match = spotifyRegex.exec(text)) !== null) {
      const type = match[1] as MusicEntity['type'];
      entities.push({
        type: type === 'track' ? 'song' : type as MusicEntity['type'],
        name: `Contenido de Spotify (${type})`,
        spotifyUrl: match[0]
      });
    }

    // Extract marked music entities (🎵 Artist Name)
    const musicMarkRegex = /🎵\s*([^🎵\n]+)/g;
    while ((match = musicMarkRegex.exec(text)) !== null) {
      const entityText = match[1].trim();
      entities.push({
        type: 'artist', // Default to artist, could be enhanced
        name: entityText,
        details: 'Entidad musical detectada en la respuesta'
      });
    }

    // Extract common music terms
    const patterns = [
      { regex: /(?:canción|tema|song)[:\s]+"([^"]+)"/gi, type: 'song' as const },
      { regex: /(?:artista|artist)[:\s]+"([^"]+)"/gi, type: 'artist' as const },
      { regex: /(?:álbum|album)[:\s]+"([^"]+)"/gi, type: 'album' as const },
      { regex: /(?:género|genre)[:\s]+"([^"]+)"/gi, type: 'genre' as const },
      { regex: /(?:playlist)[:\s]+"([^"]+)"/gi, type: 'playlist' as const }
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        entities.push({
          type: pattern.type,
          name: match[1],
          details: `${pattern.type} mencionado en la respuesta`
        });
      }
    });

    // If no specific entities found, look for capitalized words that might be music entities
    if (entities.length === 0) {
      const capitalizedWords = text.match(/\b[A-Z][a-zA-Z\s]+\b/g);
      if (capitalizedWords) {
        capitalizedWords.slice(0, 3).forEach(word => {
          if (word.length > 3 && !['Spotify', 'ChatGPT', 'OpenAI'].includes(word)) {
            entities.push({
              type: 'artist',
              name: word.trim(),
              details: 'Posible entidad musical detectada'
            });
          }
        });
      }
    }

    return entities;
  };

  const musicEntities = extractMusicEntities(message.text);

  const getEntityIcon = (type: MusicEntity['type']) => {
    switch (type) {
      case 'artist': return '👤';
      case 'song': return '🎵';
      case 'album': return '💿';
      case 'genre': return '🎪';
      case 'playlist': return '📝';
      default: return '🎶';
    }
  };

  const getEntityColor = (type: MusicEntity['type']) => {
    switch (type) {
      case 'artist': return 'bg-blue-600';
      case 'song': return 'bg-green-600';
      case 'album': return 'bg-purple-600';
      case 'genre': return 'bg-orange-600';
      case 'playlist': return 'bg-pink-600';
      default: return 'bg-gray-600';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            🎵 Detalles Musicales
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-purple-600"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* Message Info */}
          <div className="mb-6 p-4 bg-gray-700 rounded-lg">
            <h3 className="font-semibold text-gray-200 mb-2">Información del Mensaje</h3>
            <p className="text-sm text-gray-400 mb-2">
              Enviado: {formatTimestamp(message.timestamp)}
            </p>
            <div className="bg-gray-600 p-3 rounded text-sm text-gray-200 max-h-32 overflow-y-auto">
              {message.text}
            </div>
          </div>

          {/* Music Entities */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
              🎶 Entidades Musicales Detectadas
            </h3>
            
            {musicEntities.length > 0 ? (
              <div className="space-y-3">
                {musicEntities.map((entity, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-full ${getEntityColor(entity.type)} flex items-center justify-center text-white font-bold`}>
                      {getEntityIcon(entity.type)}
                    </div>
                    <div className="flex-grow">
                      <div className="font-medium text-gray-200">{entity.name}</div>
                      <div className="text-sm text-gray-400 capitalize">
                        {entity.type} {entity.details && `• ${entity.details}`}
                      </div>
                    </div>
                    {entity.spotifyUrl && (
                      <a
                        href={entity.spotifyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-green-600 hover:bg-green-500 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        🎵 Spotify
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <p>No se detectaron entidades musicales específicas en este mensaje.</p>
                <p className="text-sm mt-2">
                  El sistema busca artistas, canciones, álbumes y enlaces de Spotify.
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-700 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-200 mb-3">Acciones Disponibles</h3>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigator.clipboard.writeText(message.text)}
                className="text-gray-300 hover:text-white border border-gray-600"
              >
                📋 Copiar texto
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const entities = musicEntities.map(e => e.name).join(', ');
                  navigator.clipboard.writeText(entities);
                }}
                className="text-gray-300 hover:text-white border border-gray-600"
                disabled={musicEntities.length === 0}
              >
                🎵 Copiar entidades
              </Button>
              {musicEntities.some(e => e.spotifyUrl) && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const spotifyUrls = musicEntities
                      .filter(e => e.spotifyUrl)
                      .map(e => e.spotifyUrl)
                      .join('\n');
                    navigator.clipboard.writeText(spotifyUrls);
                  }}
                  className="bg-green-600 hover:bg-green-500"
                >
                  🔗 Copiar enlaces Spotify
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-750 p-4 flex justify-end">
          <Button
            variant="primary"
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-500"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MusicDetailsModal;