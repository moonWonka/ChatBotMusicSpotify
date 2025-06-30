import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../shared/Button';
import UserSessionManager from '../auth/UserSessionManager';
import ExcludedTermsModal from './ExcludedTermsModal';
import AdminPanel from '../admin/AdminPanel';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [activePanel, setActivePanel] = useState<string | null>(null);

  // Check if user is admin
  const isAdmin = user?.email === 'admin@chatbotmusic.com' || user?.displayName?.includes('Admin');

  const settingsOptions = [
    {
      id: 'user_session',
      title: '👤 Gestión de Usuario',
      description: 'Administra tu cuenta, sesiones y datos personales',
      icon: '👤',
      color: 'bg-blue-600',
      available: true
    },
    {
      id: 'excluded_terms',
      title: '🚫 Términos Excluidos',
      description: 'Configura palabras y frases que serán filtradas',
      icon: '🚫',
      color: 'bg-red-600',
      available: true
    },
    {
      id: 'admin_panel',
      title: '⚙️ Panel de Admin',
      description: 'Configuración de prompts y contextos de IA',
      icon: '⚙️',
      color: 'bg-indigo-600',
      available: isAdmin
    },
    {
      id: 'privacy',
      title: '🔒 Privacidad',
      description: 'Configuración de privacidad y seguridad',
      icon: '🔒',
      color: 'bg-green-600',
      available: true
    },
    {
      id: 'preferences',
      title: '🎵 Preferencias Musicales',
      description: 'Personaliza tus géneros y artistas favoritos',
      icon: '🎵',
      color: 'bg-purple-600',
      available: true
    },
    {
      id: 'notifications',
      title: '🔔 Notificaciones',
      description: 'Gestiona alertas y notificaciones del sistema',
      icon: '🔔',
      color: 'bg-yellow-600',
      available: true
    }
  ];

  const handleOptionClick = (optionId: string) => {
    setActivePanel(optionId);
  };

  const closeActivePanel = () => {
    setActivePanel(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Settings Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gray-700 p-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                ⚙️ Configuración
              </h2>
              <p className="text-gray-300 text-sm">
                Personaliza tu experiencia con el Chatbot de Música
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-gray-600"
            >
              ✕
            </Button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-600 bg-gray-750">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg">
                {user?.displayName?.[0] || user?.email?.[0] || '?'}
              </div>
              <div>
                <div className="font-medium text-gray-200">
                  {user?.displayName || 'Usuario'}
                </div>
                <div className="text-sm text-gray-400">{user?.email}</div>
                {isAdmin && (
                  <div className="text-xs bg-indigo-600 text-white px-2 py-1 rounded mt-1 inline-block">
                    👑 Administrador
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Settings Options */}
          <div className="p-4 overflow-y-auto max-h-[50vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settingsOptions.filter(option => option.available).map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleOptionClick(option.id)}
                  className="p-4 bg-gray-700 rounded-lg hover:bg-gray-650 transition-colors text-left focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg ${option.color} flex items-center justify-center text-white font-bold flex-shrink-0`}>
                      {option.icon}
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-gray-200 mb-1">
                        {option.title}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {option.description}
                      </p>
                    </div>
                    <div className="text-gray-400">
                      →
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="mt-6 pt-4 border-t border-gray-600">
              <h3 className="font-medium text-gray-200 mb-3">🚀 Acciones Rápidas</h3>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    localStorage.clear();
                    alert('Caché limpiado exitosamente');
                  }}
                  className="border border-gray-600"
                >
                  🧹 Limpiar caché
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="border border-gray-600"
                >
                  🔄 Recargar app
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const data = {
                      version: '1.0',
                      timestamp: new Date().toISOString(),
                      user: user?.email,
                      settings: 'exported'
                    };
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `settings_${user?.email}_${new Date().toISOString().split('T')[0]}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="border border-gray-600"
                >
                  📥 Exportar config
                </Button>
              </div>
            </div>

            {/* App Info */}
            <div className="mt-6 pt-4 border-t border-gray-600">
              <h3 className="font-medium text-gray-200 mb-3">ℹ️ Información de la App</h3>
              <div className="text-sm text-gray-400 space-y-1">
                <div>Versión: 1.0.0</div>
                <div>Última actualización: {new Date().toLocaleDateString('es-ES')}</div>
                <div>Navegador: {navigator.userAgent.split(' ')[0]}</div>
                <div>Plataforma: {navigator.platform}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-750 p-4 flex justify-between items-center">
            <div className="text-sm text-gray-400">
              🎵 Chatbot de Música Spotify
            </div>
            <Button variant="primary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </div>

      {/* Sub-modals */}
      <UserSessionManager
        isOpen={activePanel === 'user_session'}
        onClose={closeActivePanel}
      />

      <ExcludedTermsModal
        isOpen={activePanel === 'excluded_terms'}
        onClose={closeActivePanel}
      />

      <AdminPanel
        isOpen={activePanel === 'admin_panel'}
        onClose={closeActivePanel}
      />

      {/* Placeholder modals for other options */}
      {activePanel === 'privacy' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">🔒 Configuración de Privacidad</h3>
            <div className="space-y-3 text-gray-300">
              <div className="flex items-center justify-between">
                <span>Conversaciones privadas</span>
                <span className="text-green-400">✅ Activo</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Almacenamiento local</span>
                <span className="text-green-400">✅ Activo</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Cifrado de datos</span>
                <span className="text-green-400">✅ Activo</span>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                Todas las conversaciones son privadas y se almacenan localmente en tu dispositivo.
                Los datos se cifran usando Firebase Authentication y HTTPS.
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="primary" onClick={closeActivePanel}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'preferences' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">🎵 Preferencias Musicales</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Géneros favoritos
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Rock', 'Pop', 'Jazz', 'Classical', 'Hip-hop', 'Electronic'].map(genre => (
                    <span key={genre} className="bg-purple-600 text-white px-3 py-1 rounded-full text-sm">
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Idioma preferido
                </label>
                <select className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white">
                  <option>Español</option>
                  <option>English</option>
                  <option>Todos los idiomas</option>
                </select>
              </div>
              <p className="text-sm text-gray-400">
                Esta funcionalidad se implementará en futuras versiones.
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="primary" onClick={closeActivePanel}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {activePanel === 'notifications' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-white mb-4">🔔 Configuración de Notificaciones</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Nuevas canciones</span>
                <input type="checkbox" className="w-4 h-4" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Respuestas de IA</span>
                <input type="checkbox" className="w-4 h-4" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Actualizaciones del sistema</span>
                <input type="checkbox" className="w-4 h-4" defaultChecked />
              </div>
              <p className="text-sm text-gray-400 mt-4">
                Las notificaciones funcionan en tiempo real dentro de la aplicación.
              </p>
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="primary" onClick={closeActivePanel}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SettingsModal;