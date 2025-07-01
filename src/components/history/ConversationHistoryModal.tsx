import React, { useState, useEffect } from 'react';
import { useConversationStorage } from '../../hooks/useConversationStorage';
import { StoredConversation, ConversationFilters } from '../../services/conversationStorageService';
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
  const {
    conversations,
    isLoading,
    error,
    deleteConversation,
    searchConversations,
    toggleStar,
    applyFilters,
    clearFilters,
    currentFilters,
    exportConversations,
    getStats,
    refreshConversations
  } = useConversationStorage();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StoredConversation[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ConversationFilters>({});
  const [stats, setStats] = useState<any>(null);
  const [selectedConversations, setSelectedConversations] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen]);

  const loadStats = async () => {
    try {
      const conversationStats = await getStats();
      setStats(conversationStats);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchConversations(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching:', err);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta conversación?')) {
      await deleteConversation(conversationId);
      // Update search results if showing search
      if (searchQuery) {
        await handleSearch();
      }
      await loadStats();
    }
  };

  const handleToggleStar = async (conversationId: string) => {
    await toggleStar(conversationId);
    // Update search results if showing search
    if (searchQuery) {
      await handleSearch();
    }
  };

  const handleApplyFilters = () => {
    applyFilters(filters);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setFilters({});
    clearFilters();
    setShowFilters(false);
  };

  const handleExport = async () => {
    try {
      const data = await exportConversations();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `conversaciones_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting:', err);
    }
  };

  const handleSelectConversation = (conversationId: string) => {
    const newSelected = new Set(selectedConversations);
    if (newSelected.has(conversationId)) {
      newSelected.delete(conversationId);
    } else {
      newSelected.add(conversationId);
    }
    setSelectedConversations(newSelected);
  };

  const handleBulkDelete = async () => {
    if (selectedConversations.size === 0) return;
    
    if (window.confirm(`¿Eliminar ${selectedConversations.size} conversaciones seleccionadas?`)) {
      for (const id of selectedConversations) {
        await deleteConversation(id);
      }
      setSelectedConversations(new Set());
      await loadStats();
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const displayConversations = searchQuery ? searchResults : conversations;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            📚 Historial de Conversaciones
          </h2>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-white hover:bg-purple-600"
            >
              🔍 Filtros
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExport}
              className="text-white hover:bg-purple-600"
            >
              📥 Exportar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-purple-600"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="bg-gray-750 p-3 border-b border-gray-600">
            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <span>📊 Total: {stats.totalConversations}</span>
              <span>💬 Mensajes: {stats.totalMessages}</span>
              <span>⭐ Favoritas: {stats.starredConversations}</span>
              <span>📈 Promedio: {stats.averageMessagesPerConversation.toFixed(1)} msgs/conv</span>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="p-4 border-b border-gray-600">
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar en conversaciones..."
              className="flex-grow bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none"
            />
            <Button
              variant="primary"
              size="sm"
              onClick={handleSearch}
              disabled={!searchQuery.trim()}
            >
              🔍 Buscar
            </Button>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="border border-gray-600"
              >
                ✕ Limpiar
              </Button>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedConversations.size > 0 && (
            <div className="flex items-center gap-2 mb-3 p-2 bg-gray-700 rounded">
              <span className="text-sm text-gray-300">
                {selectedConversations.size} seleccionadas
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBulkDelete}
                className="text-red-400 hover:text-red-300"
              >
                🗑️ Eliminar seleccionadas
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedConversations(new Set())}
                className="text-gray-400"
              >
                Deseleccionar todo
              </Button>
            </div>
          )}

          {/* Filters Panel */}
          {showFilters && (
            <div className="bg-gray-700 p-3 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Desde:</label>
                  <input
                    type="date"
                    value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateFrom: e.target.value ? new Date(e.target.value) : undefined
                    })}
                    className="w-full bg-gray-600 border border-gray-500 rounded p-1 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Hasta:</label>
                  <input
                    type="date"
                    value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                    onChange={(e) => setFilters({
                      ...filters,
                      dateTo: e.target.value ? new Date(e.target.value) : undefined
                    })}
                    className="w-full bg-gray-600 border border-gray-500 rounded p-1 text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Estado:</label>
                  <select
                    value={filters.starred === undefined ? '' : filters.starred.toString()}
                    onChange={(e) => setFilters({
                      ...filters,
                      starred: e.target.value === '' ? undefined : e.target.value === 'true'
                    })}
                    className="w-full bg-gray-600 border border-gray-500 rounded p-1 text-white"
                  >
                    <option value="">Todas</option>
                    <option value="true">Solo favoritas</option>
                    <option value="false">No favoritas</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={handleApplyFilters}>
                  Aplicar filtros
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-4 max-h-[50vh]">
          {error && (
            <ErrorMessage message={error} variant="error" className="mb-4" />
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-gray-400">Cargando conversaciones...</span>
            </div>
          ) : displayConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {searchQuery ? (
                <>
                  <p>No se encontraron conversaciones para "{searchQuery}"</p>
                  <p className="text-sm mt-2">Intenta con otros términos de búsqueda</p>
                </>
              ) : (
                <>
                  <p>No hay conversaciones guardadas</p>
                  <p className="text-sm mt-2">Las conversaciones se guardarán automáticamente</p>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {displayConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className="bg-gray-700 rounded-lg p-4 hover:bg-gray-650 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selectedConversations.has(conversation.id)}
                      onChange={() => handleSelectConversation(conversation.id)}
                      className="mt-1"
                    />
                    
                    <div className="flex-grow">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-gray-200">{conversation.title}</h3>
                        {conversation.metadata?.starred && (
                          <span className="text-yellow-400">⭐</span>
                        )}
                        {conversation.metadata?.tags && conversation.metadata.tags.length > 0 && (
                          <div className="flex gap-1">
                            {conversation.metadata.tags.slice(0, 3).map(tag => (
                              <span
                                key={tag}
                                className="text-xs bg-purple-600 text-white px-2 py-1 rounded"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-400 mb-2">
                        {conversation.metadata?.lastMessagePreview}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>📅 {formatDate(conversation.createdAt)}</span>
                        <span>💬 {conversation.metadata?.messageCount || 0} mensajes</span>
                        <span>🕒 {formatDate(conversation.updatedAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStar(conversation.id)}
                        className="text-yellow-400 hover:text-yellow-300"
                      >
                        {conversation.metadata?.starred ? '⭐' : '☆'}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => {
                          onLoadConversation(conversation.id);
                          onClose();
                        }}
                      >
                        📂 Cargar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteConversation(conversation.id)}
                        className="text-red-400 hover:text-red-300"
                      >
                        🗑️
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-750 p-4 flex justify-between items-center">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshConversations}
              className="border border-gray-600"
            >
              🔄 Actualizar
            </Button>
          </div>
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConversationHistoryModal;