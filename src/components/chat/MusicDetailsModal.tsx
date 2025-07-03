import React from 'react';
import { ChatMessageContent } from '../../types';
import Button from '../shared/Button';

interface MusicDetailsModalProps {
  isOpen: boolean;
  message: ChatMessageContent | null;
  onClose: () => void;
}

interface DatabaseResult {
  [key: string]: any;
}

const MusicDetailsModal: React.FC<MusicDetailsModalProps> = ({ 
  isOpen, 
  message, 
  onClose 
}) => {
  if (!isOpen || !message) return null;

  // Extraer datos de la base de datos desde el mensaje
  // Prioritiza databaseResults si existe, sino usa datos mock para demostración
  const getDatabaseResults = (): DatabaseResult[] => {
    // Si el mensaje tiene databaseResults del backend, úsalos
    if (message && (message as any).databaseResults) {
      return (message as any).databaseResults;
    }

    // Datos mock para demostración - se reemplazarán con datos reales del backend
    const mockData: DatabaseResult[] = [
      {
        nombre: "Bohemian Rhapsody",
        artista: "Queen",
        album: "A Night at the Opera",
        duracion: "5:55",
        genero: "Rock",
        energia: "0.89",
        popularidad: "100"
      },
      {
        nombre: "Hotel California",
        artista: "Eagles",
        album: "Hotel California",
        duracion: "6:30",
        genero: "Rock",
        energia: "0.74",
        popularidad: "98"
      },
      {
        nombre: "Imagine",
        artista: "John Lennon",
        album: "Imagine",
        duracion: "3:03",
        genero: "Rock/Pop",
        energia: "0.23",
        popularidad: "95"
      }
    ];

    return mockData;
  };

  const databaseResults = getDatabaseResults();

  const renderTable = (data: DatabaseResult[]) => {
    if (!data || data.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <div className="text-4xl mb-2">🎵</div>
          <p className="text-lg">No hay resultados de la base de datos</p>
          <p className="text-sm mt-1">Los datos aparecerán aquí cuando estén disponibles</p>
        </div>
      );
    }

    // Obtener todas las claves únicas de todos los objetos
    const allKeys = [...new Set(data.flatMap(item => Object.keys(item)))];

    return (
      <div className="overflow-x-auto rounded-lg border border-gray-600">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-purple-700 to-purple-600">
              {allKeys.map((key) => (
                <th 
                  key={key}
                  className="px-4 py-3 text-left text-sm font-semibold text-white capitalize border-r border-purple-500 last:border-r-0"
                >
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr 
                key={index}
                className={`${index % 2 === 0 ? 'bg-gray-800' : 'bg-gray-750'} hover:bg-gray-600 transition-all duration-200`}
              >
                {allKeys.map((key) => (
                  <td 
                    key={key}
                    className="px-4 py-3 text-sm text-gray-300 border-r border-gray-600 last:border-r-0"
                  >
                    <span className="inline-block">
                      {row[key] || '-'}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-2xl">🎵</div>
            <div>
              <h2 className="text-xl font-bold text-white">Detalles Musicales</h2>
              <p className="text-purple-100 text-sm">Respuesta de IA y resultados de búsqueda</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-purple-600 rounded-full w-8 h-8 flex items-center justify-center"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Respuesta de la IA */}
          <div className="bg-gray-700 rounded-lg p-5 border border-gray-600">
            <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="text-lg">🤖</span>
              Respuesta de la IA
            </h3>
            <div className="bg-gray-800 p-4 rounded-lg text-gray-200 leading-relaxed border border-gray-600">
              <div className="prose prose-sm max-w-none text-gray-200">
                {message.text}
              </div>
            </div>
          </div>

          {/* Resultados de la Base de Datos */}
          <div className="bg-gray-700 rounded-lg p-5 border border-gray-600">
            <h3 className="font-semibold text-gray-200 mb-4 flex items-center gap-2">
              <span className="text-lg">🗃️</span>
              Resultados de la Base de Datos
              <span className="text-xs bg-gray-600 px-2 py-1 rounded-full text-gray-300">
                {databaseResults.length} resultado(s)
              </span>
            </h3>
            {renderTable(databaseResults)}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-750 p-4 flex justify-between items-center border-t border-gray-600">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(message.text)}
              className="border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
            >
              📋 Copiar respuesta
            </Button>
            {databaseResults.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const tableData = databaseResults.map(row => 
                    Object.entries(row).map(([key, value]) => `${key}: ${value}`).join(' | ')
                  ).join('\n');
                  navigator.clipboard.writeText(`Resultados de la base de datos:\n\n${tableData}`);
                }}
                className="border border-gray-600 text-gray-300 hover:text-white hover:border-gray-500"
              >
                📊 Exportar datos
              </Button>
            )}
          </div>
          <Button
            variant="primary"
            onClick={onClose}
            className="bg-purple-600 hover:bg-purple-500 px-6"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MusicDetailsModal;