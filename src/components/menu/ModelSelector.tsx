import React, { useState } from 'react';
import Button from '../shared/Button';

interface ModelSelectorProps {
  onModelSelected: (model: 'gemini' | 'anthropic') => void;
  currentModel?: 'gemini' | 'anthropic';
}

const ModelSelector: React.FC<ModelSelectorProps> = ({ 
  onModelSelected, 
  currentModel = 'gemini' 
}) => {
  const [selectedModel, setSelectedModel] = useState<'gemini' | 'anthropic'>(currentModel);

  const models = [
    {
      id: 'gemini' as const,
      name: '🔹 Gemini (Google)',
      description: 'Modelo de Google optimizado para conversaciones fluidas',
      features: ['Respuestas contextuales', 'Análisis musical avanzado', 'Recomendaciones personalizadas']
    },
    {
      id: 'anthropic' as const,
      name: '🔸 Anthropic (Claude)',
      description: 'Modelo de Anthropic con enfoque en seguridad y precisión',
      features: ['Análisis detallado', 'Respuestas estructuradas', 'Contexto musical profundo']
    }
  ];

  const handleSelection = (modelId: 'gemini' | 'anthropic') => {
    setSelectedModel(modelId);
  };

  const handleConfirm = () => {
    onModelSelected(selectedModel);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-white mb-2">
          🧠 SELECCIÓN DE MODELO DE IA
        </h3>
        <div className="w-full h-px bg-gradient-to-r from-purple-500 to-pink-500"></div>
      </div>

      <div className="space-y-4">
        {models.map((model) => (
          <div
            key={model.id}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all duration-200
              ${selectedModel === model.id 
                ? 'border-purple-500 bg-purple-900 bg-opacity-30' 
                : 'border-gray-600 bg-gray-700 hover:border-gray-500'
              }
            `}
            onClick={() => handleSelection(model.id)}
          >
            <div className="flex items-start gap-3">
              <input
                type="radio"
                name="model"
                value={model.id}
                checked={selectedModel === model.id}
                onChange={() => handleSelection(model.id)}
                className="mt-1 text-purple-500"
              />
              <div className="flex-1">
                <h4 className="text-white font-medium mb-2">
                  {model.name}
                </h4>
                <p className="text-gray-300 text-sm mb-3">
                  {model.description}
                </p>
                <div className="space-y-1">
                  {model.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-purple-400 rounded-full"></div>
                      <span className="text-gray-400 text-xs">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-600">
        <div className="text-sm text-gray-400">
          Modelo actual: <span className="text-purple-300 font-medium">
            {selectedModel === 'gemini' ? 'Gemini' : 'Anthropic'}
          </span>
        </div>
        <Button
          variant="primary"
          onClick={handleConfirm}
          className="px-6"
        >
          ✅ Confirmar Selección
        </Button>
      </div>
    </div>
  );
};

export default ModelSelector;
