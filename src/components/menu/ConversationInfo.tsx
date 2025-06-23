import React from 'react';
import { ChatMessageContent } from '../../types';
import Button from '../shared/Button';

interface ConversationInfoProps {
  messages: ChatMessageContent[];
  sessionId: string | null;
  selectedModel: string;
  onClose: () => void;
}

const ConversationInfo: React.FC<ConversationInfoProps> = ({
  messages,
  sessionId,
  selectedModel,
  onClose
}) => {
  const sessionShort = sessionId ? sessionId.substring(0, 8) : 'N/A';
  const messageCount = messages.length;
  const userMessages = messages.filter(m => m.sender === 'user').length;
  const aiMessages = messages.filter(m => m.sender === 'ai').length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-2">
              📊 INFORMACIÓN DE LA CONVERSACIÓN
            </h2>
            <div className="w-full h-px bg-gradient-to-r from-purple-500 to-pink-500"></div>
          </div>

          {/* Session Info */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-purple-300 font-medium mb-3">
              🔧 Detalles de la Sesión
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">ID de Sesión:</span>
                <span className="text-white font-mono">{sessionShort}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Modelo de IA:</span>
                <span className="text-purple-300 font-medium">
                  {selectedModel === 'gemini' ? '🔹 Gemini' : '🔸 Anthropic'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Estado:</span>
                <span className="text-green-300 font-medium">
                  ✅ Activa
                </span>
              </div>
            </div>
          </div>

          {/* Message Statistics */}
          <div className="bg-gray-700 rounded-lg p-4">
            <h3 className="text-purple-300 font-medium mb-3">
              📈 Estadísticas de Mensajes
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-600 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{messageCount}</div>
                <div className="text-xs text-gray-400">Total</div>
              </div>
              <div className="bg-blue-900 bg-opacity-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-300">{userMessages}</div>
                <div className="text-xs text-gray-400">Usuario</div>
              </div>
              <div className="bg-purple-900 bg-opacity-50 rounded-lg p-3">
                <div className="text-2xl font-bold text-purple-300">{aiMessages}</div>
                <div className="text-xs text-gray-400">IA</div>
              </div>
            </div>
          </div>

          {/* Recent Messages Preview */}
          {messages.length > 0 && (
            <div className="bg-gray-700 rounded-lg p-4">
              <h3 className="text-purple-300 font-medium mb-3">
                💬 Historial de Conversación
              </h3>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {messages.slice(-5).map((message, index) => (
                  <div key={message.id} className="bg-gray-600 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <div className={`
                        text-xs px-2 py-1 rounded font-medium
                        ${message.sender === 'user' 
                          ? 'bg-blue-600 text-blue-100' 
                          : 'bg-purple-600 text-purple-100'
                        }
                      `}>
                        {message.sender === 'user' ? '👤 Tú' : '🤖 IA'}
                      </div>
                      <div className="text-xs text-gray-400">
                        #{messages.length - 5 + index + 1}
                      </div>
                    </div>
                    <div className="text-sm text-gray-200 mt-2 line-clamp-2">
                      {message.text.substring(0, 150)}
                      {message.text.length > 150 && '...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-4">
            <h3 className="text-blue-300 font-medium mb-2">
              💡 Consejos de Uso
            </h3>
            <ul className="text-sm text-blue-200 space-y-1">
              <li>• Puedes hacer referencias como "esa canción", "el artista anterior"</li>
              <li>• El asistente recuerda toda la conversación actual</li>
              <li>• Usa "más como esa" para recomendaciones similares</li>
              <li>• Las conversaciones no se guardan (solo en memoria)</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              ✕ Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationInfo;
