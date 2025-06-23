import React from 'react';
import Button from '../shared/Button';

interface WelcomeScreenProps {
  onStartNewChat: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartNewChat
}) => {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Main Title */}
        <div className="space-y-4">
          <div className="text-6xl mb-6">🤖</div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            ASISTENTE MUSICAL INTELIGENTE
          </h1>
          <div className="w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          <p className="text-xl text-purple-300 font-medium">
            🎵 Tu compañero para explorar el mundo de la música
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 gap-6 text-left">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-purple-300 font-semibold mb-3 flex items-center gap-2">
              🧠 Inteligencia Artificial
            </h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Conversaciones contextuales</li>
              <li>• Recomendaciones personalizadas</li>
              <li>• Análisis musical profundo</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-purple-300 font-semibold mb-3 flex items-center gap-2">
              🎵 Funcionalidades Musicales
            </h3>
            <ul className="text-gray-300 text-sm space-y-2">
              <li>• Información de artistas y canciones</li>
              <li>• Análisis de géneros musicales</li>
              <li>• Ideas para listas de reproducción</li>
            </ul>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-300 mb-4">
              🚀 Comenzar
            </h3>            <div className="flex justify-center">
              <Button
                variant="primary"
                onClick={onStartNewChat}
                className="px-8 py-3 text-lg font-medium"
              >
                💬 Iniciar Nueva Conversación
              </Button>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg p-6">
          <h3 className="text-blue-300 font-semibold mb-3">
            💡 Consejos para mejores resultados
          </h3>
          <div className="text-blue-200 text-sm space-y-2 text-left">
            <p>• <strong>Sé específico:</strong> "Recomiéndame canciones de rock alternativo de los 90s"</p>
            <p>• <strong>Usa contexto:</strong> "Más canciones como esa" después de una recomendación </p>
            <p>• <strong>Explora géneros:</strong> "¿Qué caracteriza al jazz fusion?"</p>
            <p>• <strong>Descubre artistas:</strong> "Cuéntame sobre la historia de Radiohead"</p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-xs text-gray-500 border-t border-gray-700 pt-4">
          <p>Powered by BFF (.NET) + React • Integración con modelos de IA avanzados</p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
