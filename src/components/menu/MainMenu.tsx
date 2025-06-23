import React, { useState } from 'react';
import Button from '../shared/Button';
import { MenuIcon, ChatIcon, HistoryIcon } from '../shared/Icons';

interface MenuOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action: () => void;
}

interface MainMenuProps {
  onStartNewChat: () => void;
  onShowHistory: () => void;
  isConversationActive: boolean;
}

const MainMenu: React.FC<MainMenuProps> = ({
  onStartNewChat,
  onShowHistory,
  isConversationActive
}) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuOptions: MenuOption[] = [
    {
      id: 'new-chat',
      title: '💬 Iniciar nuevo chat',
      description: 'Comienza una nueva conversación musical',
      icon: <ChatIcon size={24} />,
      action: () => {
        onStartNewChat();
        setShowMenu(false);
      }
    },
    {
      id: 'history',
      title: '📚 Ver historial',
      description: 'Explorar conversaciones anteriores',
      icon: <HistoryIcon size={24} />,
      action: () => {
        onShowHistory();
        setShowMenu(false);
      }
    }
  ];

  return (
    <>
      {/* Menu Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowMenu(!showMenu)}
        className="relative z-50"
      >
        <MenuIcon size={20} />
      </Button>

      {/* Overlay */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowMenu(false)}
        />
      )}

      {/* Menu Panel */}
      <div className={`
        fixed top-0 left-0 h-full w-80 bg-gray-800 shadow-2xl transform transition-transform duration-300 z-50
        ${showMenu ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">🤖 ASISTENTE MUSICAL</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMenu(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </Button>
            </div>
            <p className="text-purple-300 text-sm">
              🎵 Tu compañero para explorar el mundo de la música
            </p>
            <div className="w-full h-px bg-gradient-to-r from-purple-500 to-pink-500 mt-4"></div>
          </div>

          {/* Status */}
          {isConversationActive && (
            <div className="mb-6 p-3 bg-green-900 bg-opacity-50 rounded-lg border border-green-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-300 text-sm font-medium">
                  Conversación activa
                </span>
              </div>
            </div>
          )}

          {/* Menu Options */}
          <div className="space-y-3">
            <h3 className="text-gray-300 text-sm font-semibold mb-3 uppercase tracking-wide">
              🚀 Opciones disponibles
            </h3>
            
            {menuOptions.map((option) => (
              <button
                key={option.id}
                onClick={option.action}
                className="
                  w-full p-4 bg-gray-700 hover:bg-gray-600 rounded-lg 
                  transition-all duration-200 text-left group
                  hover:shadow-lg hover:scale-105
                "
              >
                <div className="flex items-start gap-3">
                  <div className="text-purple-400 group-hover:text-purple-300 transition-colors">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-white font-medium mb-1">
                      {option.title}
                    </h4>
                    <p className="text-gray-400 text-sm">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-600">
            <p className="text-gray-400 text-xs text-center">
              Powered by BFF (.NET) + React
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MainMenu;
