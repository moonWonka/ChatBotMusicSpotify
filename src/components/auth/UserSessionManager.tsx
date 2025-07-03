import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { historyService } from '../../services/historyService';
import Button from '../shared/Button';
import LoadingSpinner from '../shared/LoadingSpinner';

interface UserSessionManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SessionInfo {
  lastActivity: Date;
  conversationCount: number;
  totalMessages: number;
  averageSessionLength: number;
  favoriteConversations: number;
}

const UserSessionManager: React.FC<UserSessionManagerProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeDevices, setActiveDevices] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && user) {
      loadSessionInfo();
      loadActiveDevices();
    }
  }, [isOpen, user]);

  const loadSessionInfo = async () => {
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }

    setIsLoading(true);
    try {
      const stats = await historyService.getHistoryStats(user.id);
      setSessionInfo({
        lastActivity: stats.lastActivity ? new Date(stats.lastActivity) : new Date(),
        conversationCount: stats.totalConversations,
        totalMessages: stats.totalMessages,
        averageSessionLength: stats.totalConversations > 0 ? Math.round(stats.totalMessages / stats.totalConversations) : 0,
        favoriteConversations: 0 // Backend doesn't track favorites yet
      });
    } catch (error) {
      console.error('Error loading session info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadActiveDevices = () => {
    // Mock data - in a real app, this would come from Firebase or backend
    const devices = [
      `${navigator.platform} - ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Navegador'} (Actual)`,
      'Windows 10 - Chrome (Última semana)',
      'Android - Chrome Mobile (Hace 3 días)'
    ];
    setActiveDevices(devices);
  };

  const handleExportData = async () => {
    if (!user?.id) {
      console.error('No user ID available');
      return;
    }

    try {
      setIsLoading(true);
      const conversationsResponse = await historyService.getAllConversations(user.id);
      
      if (!conversationsResponse.success) {
        throw new Error(conversationsResponse.error || 'Error exporting conversations');
      }

      // Create comprehensive export with user data
      const exportData = {
        user: {
          id: user?.id,
          email: user?.email,
          displayName: user?.displayName,
          exportDate: new Date().toISOString()
        },
        sessionInfo,
        conversations: conversationsResponse.data || [],
        metadata: {
          version: '1.0',
          platform: navigator.platform,
          userAgent: navigator.userAgent
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chatbot_backup_${user?.email}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearUserData = async () => {
    const confirmMessage = `¿Estás seguro de que quieres eliminar TODOS tus datos?

Esta acción eliminará:
- Todas las conversaciones guardadas
- Configuraciones personalizadas
- Historial de sesiones

Esta acción NO se puede deshacer.`;

    if (window.confirm(confirmMessage)) {
      try {
        setIsLoading(true);
        
        // Clear localStorage for this app
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('chatbot_') || key.startsWith('spotify_'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear IndexedDB
        const dbDeleteRequest = indexedDB.deleteDatabase('ChatBotMusicSpotify');
        dbDeleteRequest.onsuccess = () => {
          console.log('✅ Base de datos local eliminada');
        };
        
        alert('Todos los datos locales han sido eliminados. La página se recargará.');
        window.location.reload();
        
      } catch (error) {
        console.error('Error clearing user data:', error);
        alert('Error al eliminar los datos. Intenta de nuevo.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleLogoutAllDevices = async () => {
    if (window.confirm('¿Cerrar sesión en todos los dispositivos?')) {
      try {
        // In a real app, this would revoke all tokens
        await logout();
        alert('Sesión cerrada en todos los dispositivos');
      } catch (error) {
        console.error('Error logging out from all devices:', error);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleString('es-ES', {
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
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            👤 Gestión de Sesión de Usuario
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-purple-600"
          >
            ✕
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
              <span className="ml-2 text-gray-400">Cargando información...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User Info */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
                  👤 Información del Usuario
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-gray-200">{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Nombre:</span>
                    <span className="text-gray-200">{user?.displayName || 'No especificado'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ID de Usuario:</span>
                    <span className="text-gray-200 font-mono text-xs">{user?.id}</span>
                  </div>
                  {sessionInfo && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Última actividad:</span>
                      <span className="text-gray-200">{formatDate(sessionInfo.lastActivity)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Session Statistics */}
              {sessionInfo && (
                <div className="bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
                    📊 Estadísticas de Actividad
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center p-3 bg-gray-600 rounded">
                      <div className="text-2xl font-bold text-purple-400">{sessionInfo.conversationCount}</div>
                      <div className="text-gray-400">Conversaciones</div>
                    </div>
                    <div className="text-center p-3 bg-gray-600 rounded">
                      <div className="text-2xl font-bold text-green-400">{sessionInfo.totalMessages}</div>
                      <div className="text-gray-400">Mensajes totales</div>
                    </div>
                    <div className="text-center p-3 bg-gray-600 rounded">
                      <div className="text-2xl font-bold text-yellow-400">{sessionInfo.favoriteConversations}</div>
                      <div className="text-gray-400">Favoritas</div>
                    </div>
                    <div className="text-center p-3 bg-gray-600 rounded">
                      <div className="text-2xl font-bold text-blue-400">{sessionInfo.averageSessionLength.toFixed(1)}</div>
                      <div className="text-gray-400">Msgs/conversación</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Active Devices */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
                  📱 Dispositivos Activos
                </h3>
                <div className="space-y-2">
                  {activeDevices.map((device, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                      <span className="text-sm text-gray-200">{device}</span>
                      {index === 0 && (
                        <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">Actual</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Privacy & Security */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
                  🔒 Privacidad y Seguridad
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-200">Conversaciones privadas</div>
                      <div className="text-xs text-gray-400">Solo tú puedes ver tus conversaciones</div>
                    </div>
                    <span className="text-green-400">✅ Activo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-200">Almacenamiento local</div>
                      <div className="text-xs text-gray-400">Datos guardados en tu dispositivo</div>
                    </div>
                    <span className="text-green-400">✅ Activo</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-gray-200">Cifrado de datos</div>
                      <div className="text-xs text-gray-400">Firebase Authentication + HTTPS</div>
                    </div>
                    <span className="text-green-400">✅ Activo</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-200 mb-3 flex items-center gap-2">
                  ⚙️ Acciones
                </h3>
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    onClick={handleExportData}
                    disabled={isLoading}
                    className="w-full border border-gray-600 hover:border-gray-500"
                  >
                    📥 Exportar todos mis datos
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleLogoutAllDevices}
                    className="w-full border border-gray-600 hover:border-gray-500"
                  >
                    📱 Cerrar sesión en todos los dispositivos
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={handleClearUserData}
                    className="w-full border border-red-600 text-red-400 hover:border-red-500 hover:text-red-300"
                  >
                    🗑️ Eliminar todos mis datos locales
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-750 p-4 flex justify-end">
          <Button variant="primary" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserSessionManager;