import React, { useState, useEffect } from 'react';
import Button from '../shared/Button';
import LoadingSpinner from '../shared/LoadingSpinner';
import { CloseIcon, HistoryIcon, TrashIcon } from '../shared/Icons';
import { historyService } from '../../services/historyService';
import { ConversationSummary } from '../../services/chatService';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadConversation: (sessionId: string) => void;
}

const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  onLoadConversation
}) => {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
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
    setLoading(true);
    setError(null);

    try {
      const response = await historyService.getAllConversations();
      
      if (response.success && response.data) {
        setConversations(response.data);
      } else {
        setError(response.error || 'Error al cargar conversaciones');
      }
    } catch (err) {
      setError('Error de conexión al cargar conversaciones');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const historyStats = await historyService.getHistoryStats();
      setStats(historyStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleDeleteConversation = async (sessionId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      return;
    }

    try {
      const response = await historyService.deleteConversation(sessionId);
      
      if (response.success) {
        setConversations(prev => prev.filter(conv => conv.sessionId !== sessionId));
        loadStats(); // Actualizar estadísticas
      } else {
        alert('Error al eliminar la conversación: ' + response.error);
      }
    } catch (err) {
      alert('Error de conexión al eliminar conversación');
    }
  };

  const handleLoadConversation = (sessionId: string) => {
    onLoadConversation(sessionId);
    onClose();
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadConversations();
      return;
    }

    setLoading(true);
    try {
      const response = await historyService.searchConversations(searchQuery);
        if (response.success && response.data) {
        // Convertir resultados de búsqueda a formato ConversationSummary
        const searchResults: ConversationSummary[] = response.data.map(result => ({
          sessionId: result.sessionId,
          userPrompt: result.userPrompt || 'Sin título',
          timestamp: result.timestamp || new Date().toISOString(),
        }));
        setConversations(searchResults);
      } else {
        setError(response.error || 'Error en la búsqueda');
      }
    } catch (err) {
      setError('Error de conexión en la búsqueda');
    } finally {
      setLoading(false);
    }
  };
  const filteredConversations = conversations.filter(conv =>
    conv.userPrompt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <HistoryIcon size={24} className="text-purple-400" />
            <h2 className="text-xl font-bold text-white">📚 Historial de Conversaciones</h2>
          </div>
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
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{stats.totalConversations}</div>
            <div className="text-xs text-gray-400">Conversaciones</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{stats.totalMessages}</div>
            <div className="text-xs text-gray-400">Mensajes</div>
          </div>
          <div className="bg-gray-700 rounded-lg p-3 text-center">
            <div className="text-sm font-bold text-green-400">
              {stats.lastActivity || 'N/A'}
            </div>
            <div className="text-xs text-gray-400">Última actividad</div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Buscar conversaciones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-md
                text-white placeholder-gray-400 focus:outline-none focus:ring-2 
                focus:ring-purple-500 focus:border-transparent
              "
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button
              variant="primary"
              onClick={handleSearch}
              disabled={loading}
            >
              🔍 Buscar
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="text-center text-red-400 p-8">
              <p className="text-lg mb-2">❌ Error</p>
              <p className="text-sm">{error}</p>
              <Button
                variant="secondary"
                onClick={loadConversations}
                className="mt-4"
              >
                🔄 Reintentar
              </Button>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center text-gray-400 p-8">
              <div className="text-6xl mb-4">📝</div>
              <p className="text-lg mb-2">No hay conversaciones</p>
              <p className="text-sm">
                {searchQuery ? 'No se encontraron resultados para tu búsqueda' : 'Inicia tu primera conversación'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.sessionId}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 cursor-pointer" onClick={() => handleLoadConversation(conversation.sessionId)}>                      <h3 className="text-white font-medium mb-1 line-clamp-1">
                        {conversation.userPrompt || 'Sin título'}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>Conversación</span>
                        <span>{new Date(conversation.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadConversation(conversation.sessionId)}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        📄 Cargar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConversation(conversation.sessionId)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <TrashIcon size={16} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-600">
          <Button
            variant="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cerrar
          </Button>
          <Button
            variant="primary"
            onClick={loadConversations}
            disabled={loading}
            className="flex-1"
          >
            🔄 Actualizar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;
