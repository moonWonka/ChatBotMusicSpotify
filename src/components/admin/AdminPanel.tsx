import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../shared/Button';
import LoadingSpinner from '../shared/LoadingSpinner';
import ErrorMessage from '../shared/ErrorMessage';

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  context: string;
  template: string;
  variables: string[];
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DEFAULT_PROMPTS: PromptTemplate[] = [
  {
    id: 'spotify_music_expert',
    name: 'Experto Musical de Spotify',
    description: 'Especialista en música con acceso a información de Spotify',
    context: 'music_discovery',
    template: `Eres un experto en música con acceso a la base de datos de Spotify. Tu objetivo es ayudar a los usuarios a descubrir música, artistas y crear playlists personalizadas.

INSTRUCCIONES:
- Proporciona recomendaciones basadas en géneros, artistas, estados de ánimo y preferencias
- Usa datos actualizados de Spotify cuando sea posible
- Incluye enlaces de Spotify cuando menciones canciones o artistas
- Sé conversacional y entusiasta sobre la música
- Pregunta sobre las preferencias del usuario para dar mejores recomendaciones

VARIABLES DISPONIBLES:
{user_preference} - Preferencia musical del usuario
{mood} - Estado de ánimo del usuario
{genre} - Género musical solicitado
{artist} - Artista específico mencionado

FORMATO DE RESPUESTA:
- Usa emojis musicales (🎵, 🎶, 🎸, etc.)
- Incluye enlaces de Spotify cuando sea relevante
- Estructura las respuestas con listas cuando sea apropiado`,
    variables: ['user_preference', 'mood', 'genre', 'artist'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'playlist_creator',
    name: 'Creador de Playlists',
    description: 'Especializado en crear playlists temáticas y personalizadas',
    context: 'playlist_creation',
    template: `Eres un experto curador de playlists con años de experiencia en la industria musical. Tu especialidad es crear playlists cohesivas y atractivas para cualquier ocasión.

INSTRUCCIONES:
- Crea playlists balanceadas con variedad pero coherencia temática
- Incluye canciones populares y algunas joyas ocultas
- Considera el flujo y la transición entre canciones
- Proporciona una descripción del concepto de la playlist
- Sugiere entre 15-30 canciones dependiendo del contexto

VARIABLES DISPONIBLES:
{occasion} - Ocasión o evento específico
{duration} - Duración deseada de la playlist
{energy_level} - Nivel de energía deseado (bajo, medio, alto)
{theme} - Tema específico de la playlist

FORMATO:
- Nombre de la playlist
- Descripción breve
- Lista numerada de canciones con artista
- Breve explicación del concepto`,
    variables: ['occasion', 'duration', 'energy_level', 'theme'],
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'music_educator',
    name: 'Educador Musical',
    description: 'Enfoque educativo sobre teoría musical, historia y técnicas',
    context: 'music_education',
    template: `Eres un educador musical con amplio conocimiento en teoría musical, historia de la música y técnicas de interpretación. Tu objetivo es enseñar y explicar conceptos musicales de manera accesible.

INSTRUCCIONES:
- Explica conceptos complejos de manera simple y clara
- Usa ejemplos de canciones conocidas para ilustrar puntos
- Incluye contexto histórico cuando sea relevante
- Adapta el nivel de explicación a la audiencia
- Fomenta la exploración musical

VARIABLES DISPONIBLES:
{topic} - Tema musical específico
{skill_level} - Nivel de conocimiento del usuario (principiante, intermedio, avanzado)
{instrument} - Instrumento de interés
{genre_focus} - Género para enfocar la explicación

ESTRUCTURA:
- Introducción clara del concepto
- Explicación detallada con ejemplos
- Canciones o artistas que demuestran el concepto
- Ejercicios o siguiente pasos para el aprendizaje`,
    variables: ['topic', 'skill_level', 'instrument', 'genre_focus'],
    isActive: false,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [prompts, setPrompts] = useState<PromptTemplate[]>(DEFAULT_PROMPTS);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testInput, setTestInput] = useState('');
  const [testOutput, setTestOutput] = useState('');

  // Check if user is admin (in a real app, this would be checked against backend)
  const isAdmin = user?.email === 'admin@chatbotmusic.com' || user?.displayName?.includes('Admin');

  useEffect(() => {
    if (isOpen) {
      loadPrompts();
    }
  }, [isOpen]);

  const loadPrompts = () => {
    // In a real app, this would load from backend
    const savedPrompts = localStorage.getItem('admin_prompts');
    if (savedPrompts) {
      try {
        setPrompts(JSON.parse(savedPrompts));
      } catch (err) {
        console.error('Error parsing saved prompts:', err);
        setPrompts(DEFAULT_PROMPTS);
      }
    }
  };

  const savePrompts = (updatedPrompts: PromptTemplate[]) => {
    // In a real app, this would save to backend
    localStorage.setItem('admin_prompts', JSON.stringify(updatedPrompts));
    setPrompts(updatedPrompts);
  };

  const handleSavePrompt = () => {
    if (!selectedPrompt) return;

    setIsLoading(true);
    try {
      const updatedPrompts = prompts.map(p => 
        p.id === selectedPrompt.id 
          ? { ...selectedPrompt, updatedAt: Date.now() }
          : p
      );
      
      savePrompts(updatedPrompts);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Error al guardar el prompt');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePrompt = () => {
    const newPrompt: PromptTemplate = {
      id: `custom_${Date.now()}`,
      name: 'Nuevo Prompt',
      description: 'Descripción del prompt',
      context: 'general',
      template: 'Escribe aquí el template del prompt...',
      variables: [],
      isActive: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const updatedPrompts = [...prompts, newPrompt];
    savePrompts(updatedPrompts);
    setSelectedPrompt(newPrompt);
    setIsEditing(true);
  };

  const handleDeletePrompt = (promptId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este prompt?')) {
      const updatedPrompts = prompts.filter(p => p.id !== promptId);
      savePrompts(updatedPrompts);
      if (selectedPrompt?.id === promptId) {
        setSelectedPrompt(null);
        setIsEditing(false);
      }
    }
  };

  const handleToggleActive = (promptId: string) => {
    const updatedPrompts = prompts.map(p =>
      p.id === promptId 
        ? { ...p, isActive: !p.isActive, updatedAt: Date.now() }
        : p
    );
    savePrompts(updatedPrompts);
  };

  const handleTestPrompt = () => {
    if (!selectedPrompt || !testInput) return;

    setIsLoading(true);
    
    // Simulate prompt processing
    setTimeout(() => {
      let processedTemplate = selectedPrompt.template;
      
      // Replace variables with test input
      selectedPrompt.variables.forEach(variable => {
        const regex = new RegExp(`\\{${variable}\\}`, 'g');
        processedTemplate = processedTemplate.replace(regex, testInput);
      });
      
      setTestOutput(processedTemplate);
      setIsLoading(false);
    }, 1000);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('es-ES');
  };

  if (!isOpen) return null;

  if (!isAdmin) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-4">🔒 Acceso Restringido</h2>
            <p className="text-gray-300 mb-4">
              No tienes permisos de administrador para acceder a este panel.
            </p>
            <Button variant="primary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-indigo-700 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              ⚙️ Panel de Administración
            </h2>
            <p className="text-indigo-200 text-sm">
              Configuración de prompts y contextos de IA
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-indigo-600"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="flex h-[calc(95vh-80px)]">
          {/* Sidebar - Prompt List */}
          <div className="w-1/3 border-r border-gray-600 flex flex-col">
            <div className="p-4 border-b border-gray-600">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-200">Prompts Configurados</h3>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleCreatePrompt}
                  className="bg-indigo-600 hover:bg-indigo-500"
                >
                  ➕ Nuevo
                </Button>
              </div>
              <div className="text-sm text-gray-400">
                Total: {prompts.length} | Activos: {prompts.filter(p => p.isActive).length}
              </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4">
              <div className="space-y-2">
                {prompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedPrompt?.id === prompt.id
                        ? 'bg-indigo-600'
                        : 'bg-gray-700 hover:bg-gray-650'
                    }`}
                    onClick={() => {
                      setSelectedPrompt(prompt);
                      setIsEditing(false);
                      setTestOutput('');
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-200">{prompt.name}</span>
                      <div className="flex items-center gap-1">
                        <span className={`w-2 h-2 rounded-full ${prompt.isActive ? 'bg-green-400' : 'bg-gray-500'}`} />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleActive(prompt.id);
                          }}
                          className="text-xs"
                        >
                          {prompt.isActive ? '⏸️' : '▶️'}
                        </Button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400 mb-1">{prompt.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{prompt.context}</span>
                      <span>{formatDate(prompt.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-grow flex flex-col">
            {selectedPrompt ? (
              <>
                {/* Prompt Editor */}
                <div className="flex-grow p-4 overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-200">
                      {isEditing ? 'Editando Prompt' : 'Detalles del Prompt'}
                    </h3>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSavePrompt}
                            disabled={isLoading}
                            className="bg-green-600 hover:bg-green-500"
                          >
                            💾 Guardar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsEditing(false);
                              loadPrompts();
                            }}
                          >
                            ❌ Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setIsEditing(true)}
                            className="bg-indigo-600 hover:bg-indigo-500"
                          >
                            ✏️ Editar
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePrompt(selectedPrompt.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            🗑️ Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {error && (
                    <ErrorMessage message={error} variant="error" className="mb-4" />
                  )}

                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nombre del Prompt
                        </label>
                        <input
                          type="text"
                          value={selectedPrompt.name}
                          onChange={(e) => setSelectedPrompt({ ...selectedPrompt, name: e.target.value })}
                          disabled={!isEditing}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Contexto
                        </label>
                        <input
                          type="text"
                          value={selectedPrompt.context}
                          onChange={(e) => setSelectedPrompt({ ...selectedPrompt, context: e.target.value })}
                          disabled={!isEditing}
                          className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Descripción
                      </label>
                      <input
                        type="text"
                        value={selectedPrompt.description}
                        onChange={(e) => setSelectedPrompt({ ...selectedPrompt, description: e.target.value })}
                        disabled={!isEditing}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Variables (separadas por comas)
                      </label>
                      <input
                        type="text"
                        value={selectedPrompt.variables.join(', ')}
                        onChange={(e) => setSelectedPrompt({
                          ...selectedPrompt,
                          variables: e.target.value.split(',').map(v => v.trim()).filter(v => v)
                        })}
                        disabled={!isEditing}
                        placeholder="user_preference, mood, genre"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Template del Prompt
                      </label>
                      <textarea
                        value={selectedPrompt.template}
                        onChange={(e) => setSelectedPrompt({ ...selectedPrompt, template: e.target.value })}
                        disabled={!isEditing}
                        rows={12}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none disabled:opacity-50 font-mono text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Test Panel */}
                <div className="border-t border-gray-600 p-4">
                  <h4 className="font-semibold text-gray-200 mb-3">🧪 Probar Prompt</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Entrada de Prueba
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={testInput}
                          onChange={(e) => setTestInput(e.target.value)}
                          placeholder="Texto de prueba para las variables..."
                          className="flex-grow bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                        />
                        <Button
                          variant="primary"
                          onClick={handleTestPrompt}
                          disabled={!testInput || isLoading}
                          className="bg-indigo-600 hover:bg-indigo-500"
                        >
                          {isLoading ? <LoadingSpinner /> : '🧪 Probar'}
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Resultado
                      </label>
                      <div className="bg-gray-700 border border-gray-600 rounded-lg p-3 text-white text-sm max-h-32 overflow-y-auto">
                        {testOutput || 'El resultado aparecerá aquí...'}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <h3 className="text-lg font-medium mb-2">Selecciona un prompt</h3>
                  <p className="text-sm">Elige un prompt de la lista para ver sus detalles y configuración</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;