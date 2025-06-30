import React, { useState, useEffect } from 'react';
import { useExcludedTerms } from '../../hooks/useExcludedTerms';
import { ExcludedTerm } from '../../services/excludedTermsService';
import Button from '../shared/Button';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

interface ExcludedTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CATEGORY_LABELS: Record<ExcludedTerm['category'], string> = {
  artist: 'Artista',
  genre: 'Género',
  song: 'Canción',
  album: 'Álbum',
  keyword: 'Palabra clave',
  custom: 'Personalizado'
};

const CATEGORY_COLORS: Record<ExcludedTerm['category'], string> = {
  artist: 'bg-blue-600',
  genre: 'bg-green-600',
  song: 'bg-purple-600',
  album: 'bg-orange-600',
  keyword: 'bg-red-600',
  custom: 'bg-gray-600'
};

const ExcludedTermsModal: React.FC<ExcludedTermsModalProps> = ({ isOpen, onClose }) => {
  const {
    terms,
    isEnabled,
    isLoading,
    error,
    addTerm,
    removeTerm,
    updateTerm,
    toggleTerm,
    toggleFeature,
    importTerms,
    exportTerms,
    clearAllTerms,
    validateTerm,
    getStats,
    refreshTerms
  } = useExcludedTerms();

  const [newTerm, setNewTerm] = useState('');
  const [newCategory, setNewCategory] = useState<ExcludedTerm['category']>('custom');
  const [newReason, setNewReason] = useState('');
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ExcludedTerm['category'] | 'all'>('all');
  const [editingTerm, setEditingTerm] = useState<ExcludedTerm | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadStats();
    }
  }, [isOpen, terms]);

  const loadStats = async () => {
    try {
      const statistics = await getStats();
      setStats(statistics);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleAddTerm = async () => {
    const validation = validateTerm(newTerm);
    if (!validation.isValid) {
      return;
    }

    const success = await addTerm(newTerm, newCategory, newReason || undefined);
    if (success) {
      setNewTerm('');
      setNewReason('');
      setNewCategory('custom');
      await loadStats();
    }
  };

  const handleRemoveTerm = async (termId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este término?')) {
      const success = await removeTerm(termId);
      if (success) {
        await loadStats();
      }
    }
  };

  const handleUpdateTerm = async () => {
    if (!editingTerm) return;

    const success = await updateTerm(editingTerm.id, {
      term: editingTerm.term,
      category: editingTerm.category,
      reason: editingTerm.reason,
      isActive: editingTerm.isActive
    });

    if (success) {
      setEditingTerm(null);
      await loadStats();
    }
  };

  const handleToggleTerm = async (termId: string) => {
    const success = await toggleTerm(termId);
    if (success) {
      await loadStats();
    }
  };

  const handleImportTerms = async () => {
    const termList = importText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    if (termList.length === 0) {
      return;
    }

    const importedCount = await importTerms(termList, newCategory);
    if (importedCount > 0) {
      setImportText('');
      setShowImport(false);
      await loadStats();
      alert(`${importedCount} términos importados exitosamente`);
    }
  };

  const handleExportTerms = async () => {
    try {
      const termList = await exportTerms();
      const text = termList.join('\n');
      
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `terminos_excluidos_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting terms:', err);
    }
  };

  const handleClearAll = async () => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar TODOS los términos excluidos?

Esta acción eliminará ${terms.length} términos y NO se puede deshacer.`;

    if (window.confirm(confirmMessage)) {
      await clearAllTerms();
      await loadStats();
    }
  };

  const filteredTerms = terms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         (term.reason && term.reason.toLowerCase().includes(searchFilter.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || term.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              🚫 Términos Excluidos
            </h2>
            <p className="text-red-200 text-sm">
              Configura palabras y frases que serán filtradas de las búsquedas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => toggleFeature(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Filtro activo</span>
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-red-600"
            >
              ✕
            </Button>
          </div>
        </div>

        {/* Stats Bar */}
        {stats && (
          <div className="bg-gray-750 p-3 border-b border-gray-600">
            <div className="flex flex-wrap gap-4 text-sm text-gray-300">
              <span>📊 Total: {stats.totalTerms}</span>
              <span>✅ Activos: {stats.activeTerms}</span>
              <span>🎨 Artistas: {stats.byCategory.artist || 0}</span>
              <span>🎵 Géneros: {stats.byCategory.genre || 0}</span>
              <span>🔑 Palabras clave: {stats.byCategory.keyword || 0}</span>
              <span className={isEnabled ? 'text-green-400' : 'text-red-400'}>
                {isEnabled ? '🟢 Filtro ON' : '🔴 Filtro OFF'}
              </span>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-160px)]">
          {/* Add New Term */}
          <div className="p-4 border-b border-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
              <input
                type="text"
                value={newTerm}
                onChange={(e) => setNewTerm(e.target.value)}
                placeholder="Nuevo término a excluir..."
                className="bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as ExcludedTerm['category'])}
                className="bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              >
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <input
                type="text"
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="Razón (opcional)"
                className="bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
              <Button
                variant="primary"
                onClick={handleAddTerm}
                disabled={!newTerm.trim() || isLoading}
                className="bg-red-600 hover:bg-red-500"
              >
                ➕ Agregar
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowImport(true)}
                className="border border-gray-600"
              >
                📥 Importar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExportTerms}
                className="border border-gray-600"
              >
                📤 Exportar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={terms.length === 0}
                className="border border-red-600 text-red-400 hover:text-red-300"
              >
                🗑️ Eliminar todos
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshTerms}
                className="border border-gray-600"
              >
                🔄 Actualizar
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-600">
            <div className="flex gap-3">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Buscar términos..."
                className="flex-grow bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as any)}
                className="bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              >
                <option value="all">Todas las categorías</option>
                {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Terms List */}
          <div className="flex-grow overflow-y-auto p-4">
            {error && (
              <ErrorMessage message={error} variant="error" className="mb-4" />
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner />
                <span className="ml-2 text-gray-400">Cargando términos...</span>
              </div>
            ) : filteredTerms.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                {searchFilter || categoryFilter !== 'all' ? (
                  <p>No se encontraron términos con los filtros aplicados</p>
                ) : (
                  <p>No hay términos excluidos configurados</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTerms.map((term) => (
                  <div
                    key={term.id}
                    className={`bg-gray-700 rounded-lg p-3 ${!term.isActive ? 'opacity-50' : ''}`}
                  >
                    {editingTerm?.id === term.id ? (
                      /* Edit Mode */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={editingTerm.term}
                            onChange={(e) => setEditingTerm({ ...editingTerm, term: e.target.value })}
                            className="bg-gray-600 border border-gray-500 rounded p-2 text-white"
                          />
                          <select
                            value={editingTerm.category}
                            onChange={(e) => setEditingTerm({ ...editingTerm, category: e.target.value as ExcludedTerm['category'] })}
                            className="bg-gray-600 border border-gray-500 rounded p-2 text-white"
                          >
                            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                              <option key={value} value={value}>{label}</option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editingTerm.reason || ''}
                            onChange={(e) => setEditingTerm({ ...editingTerm, reason: e.target.value })}
                            placeholder="Razón"
                            className="bg-gray-600 border border-gray-500 rounded p-2 text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleUpdateTerm}
                            className="bg-green-600 hover:bg-green-500"
                          >
                            ✅ Guardar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTerm(null)}
                          >
                            ❌ Cancelar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      /* View Mode */
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className={`inline-block px-2 py-1 rounded text-xs text-white ${CATEGORY_COLORS[term.category]}`}
                          >
                            {CATEGORY_LABELS[term.category]}
                          </span>
                          <span className="text-gray-200 font-medium">{term.term}</span>
                          {term.reason && (
                            <span className="text-gray-400 text-sm">• {term.reason}</span>
                          )}
                          <span className="text-gray-500 text-xs">
                            {formatDate(term.createdAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleTerm(term.id)}
                            className={term.isActive ? 'text-green-400' : 'text-gray-500'}
                          >
                            {term.isActive ? '✅' : '⏸️'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingTerm(term)}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            ✏️
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveTerm(term.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            🗑️
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Import Modal */}
        {showImport && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold text-white mb-4">Importar Términos</h3>
              <div className="space-y-3">
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as ExcludedTerm['category'])}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white"
                >
                  {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Escribe cada término en una línea separada..."
                  rows={6}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    onClick={handleImportTerms}
                    disabled={!importText.trim()}
                    className="bg-red-600 hover:bg-red-500"
                  >
                    📥 Importar
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowImport(false);
                      setImportText('');
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcludedTermsModal;