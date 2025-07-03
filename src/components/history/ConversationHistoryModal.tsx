import React, { useState, useEffect } from 'react';
import { bffChatService, ConversationSummary } from '../../services/chatService';
import { useAuth } from '../../hooks/useAuth';
import Button from '../shared/Button';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

interface ConversationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (conversationId: string) => void;
}

const ConversationHistoryModal: React.FC<ConversationHistoryModalProps> = ({
  isOpen,
  onClose,
  onLoadConversation
}) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Cargar conversaciones desde el backend
  const loadConversations = async () => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await bffChatService.getConversations(user.id);
      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        setError(response.error || 'Error al cargar conversaciones');
      }
    } catch (err) {
      setError('Error de conexión al cargar conversaciones');
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar conversaciones cuando se abre el modal
  useEffect(() => {
    if (isOpen && user?.id) {
      loadConversations();
    }
  }, [isOpen, user?.id]);

  // Filtrar conversaciones por búsqueda
  const filteredConversations = conversations.filter(conv =>
    conv.userPrompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Manejar clic en conversación
  const handleConversationClick = (sessionId: string) => {
    onLoadConversation(sessionId);
  };

  // Eliminar conversación
  const handleDeleteConversation = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      return;
    }
    
    try {
      const response = await bffChatService.deleteConversation(sessionId);
      if (response.success) {
        setConversations(prev => prev.filter(conv => conv.sessionId !== sessionId));
      } else {
        setError(response.error || 'Error al eliminar conversación');
      }
    } catch (err) {
      setError('Error al eliminar conversación');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[80vh] p-6 m-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Historial de Conversaciones</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </Button>
        </div>

        {/* Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Error */}
        {error && (
          <ErrorMessage 
            message={error}
            onDismiss={() => setError(null)}
            variant="error"
          />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        )}

        {/* Conversations List */}
        {!isLoading && (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {searchQuery ? 'No se encontraron conversaciones que coincidan' : 'No hay conversaciones guardadas'}
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.sessionId}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors cursor-pointer"
                  onClick={() => handleConversationClick(conversation.sessionId)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-grow">
                      <h3 className="font-medium text-white mb-1">
                        {conversation.userPrompt.substring(0, 60)}
                        {conversation.userPrompt.length > 60 ? '...' : ''}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {new Date(conversation.timestamp).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.sessionId);
                      }}
                      className="text-gray-400 hover:text-red-400 ml-2 p-1 rounded"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-between items-center">
          <span className="text-sm text-gray-400">
            {filteredConversations.length} conversación(es)
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
            >
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistoryModal;