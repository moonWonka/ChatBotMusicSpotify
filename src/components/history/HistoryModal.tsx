import React, { useState, useEffect } from 'react';
import { historyService } from '../../services/historyService';
import { ConversationSummary } from '../../services/chatService';
import Button from '../shared/Button';
import LoadingSpinner from '../shared/LoadingSpinner';
import { HistoryIcon, TrashIcon, CloseIcon } from '../shared/Icons';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectConversation: (sessionId: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onSelectConversation
}) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalConversations: 0,
    totalMessages: 0,
    lastActivity: null as string | null,
  });

  useEffect(() => {
    if (isOpen) {
      loadConversations();
      loadStats();
    }
  }, [isOpen]);

  const loadConversations = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await historyService.getAllConversations();
      
      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        setError(response.error || 'Error al cargar conversaciones');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const stats = await historyService.getHistoryStats();
      setStats(stats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleDeleteConversation = async (sessionId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      return;
    }

    try {
      const response = await historyService.deleteConversation(sessionId);
      
      if (response.success) {
        setConversations(prev => prev.filter(conv => conv.sessionId !== sessionId));
        loadStats(); // Actualizar estadísticas
      } else {
        alert('Error al eliminar la conversación: ' + (response.error || 'Error desconocido'));
      }
    } catch (err) {
      alert('Error de conexión al eliminar la conversación');
    }
  };

  const handleSelectConversation = (sessionId: string) => {
    onSelectConversation(sessionId);
    onClose();
  };

  const filteredConversations = conversations.filter(conv =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg w-full max-w-4xl mx-4 h-[80vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <HistoryIcon size={28} />
              📚 Historial de Conversaciones
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <CloseIcon size={20} />
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-300">{stats.totalConversations}</div>
              <div className="text-xs text-gray-400">Conversaciones</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-300">{stats.totalMessages}</div>
              <div className="text-xs text-gray-400">Mensajes</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-3 text-center">
              <div className="text-sm font-medium text-green-300">
                {stats.lastActivity || 'N/A'}
              </div>
              <div className="text-xs text-gray-400">Última actividad</div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg
                text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                focus:ring-purple-500 focus:border-transparent
              "
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <LoadingSpinner />
              <span className="ml-3 text-gray-300">Cargando conversaciones...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-red-400 text-lg mb-2">❌ Error</div>
                <p className="text-gray-300 mb-4">{error}</p>
                <Button variant="primary" onClick={loadConversations}>
                  Reintentar
                </Button>
              </div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-medium text-white mb-2">
                  {searchQuery ? 'No se encontraron conversaciones' : 'Sin historial'}
                </h3>
                <p className="text-gray-400">
                  {searchQuery 
                    ? 'Intenta con otros términos de búsqueda'
                    : 'Inicia una nueva conversación para comenzar'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 h-full overflow-y-auto">
              <div className="space-y-3">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.sessionId}
                    onClick={() => handleSelectConversation(conversation.sessionId)}
                    className="
                      bg-gray-700 hover:bg-gray-600 rounded-lg p-4 cursor-pointer
                      transition-all duration-200 border border-gray-600
                      hover:border-purple-500 hover:shadow-lg group
                    "
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-medium mb-1 truncate">
                          {conversation.title}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>
                            {historyService.formatDate(conversation.updatedAt)}
                          </span>
                          <span>
                            {conversation.messageCount} mensajes
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(conversation.sessionId, e)}
                        className="
                          opacity-0 group-hover:opacity-100 transition-opacity
                          p-2 text-gray-400 hover:text-red-400 hover:bg-red-900
                          hover:bg-opacity-20 rounded-lg
                        "
                        title="Eliminar conversación"
                      >
                        <TrashIcon size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {filteredConversations.length} conversaciones
              {searchQuery && ` (filtradas)`}
            </div>
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
