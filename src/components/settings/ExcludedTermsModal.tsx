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

  // Filtrar conversaciones por búsqueda
  const filteredTerms = terms.filter(term =>
    term.term.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (term.reason && term.reason.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-gray-800 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-red-700 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🚫 Términos Excluidos
            </h2>
            <p className="text-red-200 text-sm">
              Configura palabras y frases que serán filtradas de las búsquedas
            </p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-white">
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={(e) => toggleFeature(e.target.checked)}
                className="w-4 h-4 rounded"
              />
              <span className="text-sm font-medium">Filtro activo</span>
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

        {/* Stats Bar - Simplified */}
        {stats && (
          <div className="bg-gray-750 px-6 py-3 border-b border-gray-600">
            <div className="flex items-center justify-between text-sm text-gray-300">
              <div className="flex gap-6">
                <span>📊 Total: <strong>{stats.totalTerms}</strong></span>
                <span>✅ Activos: <strong>{stats.activeTerms}</strong></span>
                <span>🔑 Palabras clave: <strong>{stats.byCategory.keyword || 0}</strong></span>
                <span>🎵 Géneros: <strong>{stats.byCategory.genre || 0}</strong></span>
              </div>
              <span className={`font-medium ${isEnabled ? 'text-green-400' : 'text-red-400'}`}>
                {isEnabled ? '🟢 Filtro ON' : '🔴 Filtro OFF'}
              </span>
            </div>
          </div>
        )}

        {/* Add New Term - Simplified */}
        <div className="p-6 border-b border-gray-600 bg-gray-750">
          <div className="flex gap-5">
            <input
              type="text"
              value={newTerm}
              onChange={(e) => setNewTerm(e.target.value)}
              placeholder="Nuevo término a excluir..."
              className="flex-grow bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-base"
              onKeyPress={(e) => e.key === 'Enter' && handleAddTerm()}
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as ExcludedTerm['category'])}
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-w-[160px] text-base"
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
              className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none min-w-[180px] text-base"
            />
            <Button
              variant="primary"
              onClick={handleAddTerm}
              disabled={!newTerm.trim() || isLoading}
              className="bg-red-600 hover:bg-red-500 px-6 py-3 whitespace-nowrap text-base font-medium"
            >
              ➕ Agregar
            </Button>
          </div>
        </div>

        {/* Action Buttons - Simplified */}
        <div className="px-6 py-5 border-b border-gray-600 bg-gray-750">
          <div className="flex gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImport(true)}
              className="border border-gray-600 text-gray-300 hover:text-white"
            >
              📥 Importar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportTerms}
              className="border border-gray-600 text-gray-300 hover:text-white"
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
              className="border border-gray-600 text-gray-300 hover:text-white"
            >
              🔄 Actualizar
            </Button>
          </div>
        </div>

        {/* Search - Simplified */}
        <div className="p-6 border-b border-gray-600">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Buscar términos..."
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none text-base"
          />
        </div>

        {/* Terms List */}
        <div className="flex-grow overflow-y-auto" style={{ maxHeight: 'calc(95vh - 340px)' }}>
          {error && (
            <div className="p-4">
              <ErrorMessage message={error} variant="error" />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner />
              <span className="ml-3 text-gray-400">Cargando términos...</span>
            </div>
          ) : filteredTerms.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {searchFilter ? 
                'No se encontraron términos que coincidan' : 
                'No hay términos excluidos configurados'
              }
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredTerms.map((term) => (
                <div
                  key={term.id}
                  className={`bg-gray-700 rounded-lg p-5 border border-gray-600 hover:bg-gray-650 transition-colors ${!term.isActive ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-grow">
                      <span
                        className={`px-3 py-1 rounded text-sm font-medium text-white ${CATEGORY_COLORS[term.category]}`}
                      >
                        {CATEGORY_LABELS[term.category]}
                      </span>
                      <span className="text-white font-medium text-base">{term.term}</span>
                      {term.reason && (
                        <span className="text-gray-400 text-base">• {term.reason}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleTerm(term.id)}
                        className={`p-2 text-lg ${term.isActive ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                      >
                        {term.isActive ? '✅' : '⏸️'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveTerm(term.id)}
                        className="text-red-400 hover:text-red-300 p-2 text-lg"
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

        {/* Import Modal */}
        {showImport && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
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
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
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