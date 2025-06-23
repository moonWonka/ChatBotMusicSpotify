import React, { useState } from 'react';
import Button from '../shared/Button';
import ModelSelector from './ModelSelector';

interface NewChatModalProps {
    isOpen: boolean;
    onClose: () => void;
    onStartNewChat: (model: string) => void;
    hasActiveConversation: boolean;
}

const NewChatModal: React.FC<NewChatModalProps> = ({
    isOpen,
    onClose,
    onStartNewChat,
    hasActiveConversation
}) => {
    const [step, setStep] = useState<'confirm' | 'model'>('confirm');
    const [selectedModel, setSelectedModel] = useState<'gemini' | 'anthropic'>('gemini');
    if (!isOpen) return null;

    const handleConfirmStart = () => {
        setStep('model');
    };

    const handleModelSelected = (model: 'gemini' | 'anthropic') => {
        setSelectedModel(model);
        onStartNewChat(model);
        handleClose();
    };

    const handleClose = () => {
        setStep('confirm');
        onClose();
    };

    const renderConfirmStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">
                    💬 NUEVO CHAT
                </h2>
                <div className="w-full h-px bg-gradient-to-r from-purple-500 to-pink-500"></div>
            </div>

            {hasActiveConversation && (
                <div className="bg-yellow-900 bg-opacity-50 border border-yellow-500 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                        <div className="text-yellow-400 text-xl">⚠️</div>
                        <div>
                            <h3 className="text-yellow-300 font-medium mb-2">
                                Ya hay una conversación en curso
                            </h3>
                            <p className="text-yellow-200 text-sm mb-4">
                                Si inicias una nueva conversación, la actual se guardará automáticamente en el historial.
                            </p>
                            <div className="text-sm text-yellow-200">
                                <p className="mb-2">🔄 Opciones disponibles:</p>
                                <ul className="space-y-1 ml-4">
                                    <li>• Iniciar nueva conversación (la actual se guarda automáticamente)</li>
                                    <li>• Volver al menú principal</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!hasActiveConversation && (
                <div className="text-center py-8">
                    <div className="text-6xl mb-4">🚀</div>
                    <h3 className="text-lg font-medium text-white mb-2">
                        ¡Iniciemos una nueva conversación!
                    </h3>
                    <p className="text-gray-300 text-sm">
                        Prepárate para explorar el mundo de la música con tu asistente IA
                    </p>
                </div>
            )}

            <div className="flex gap-3">
                <Button
                    variant="secondary"
                    onClick={handleClose}
                    className="flex-1"
                >
                    🔙 Volver al Menú
                </Button>
                <Button
                    variant="primary"
                    onClick={handleConfirmStart}
                    className="flex-1"
                >
                    {hasActiveConversation ? '🔄 Iniciar Nueva' : '🚀 Continuar'}
                </Button>
            </div>
        </div>
    );

    const renderModelStep = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">
                    🚀 Iniciando nueva conversación...
                </h2>
                <div className="w-full h-px bg-gradient-to-r from-purple-500 to-pink-500"></div>
            </div>

            <ModelSelector
                onModelSelected={handleModelSelected}
                currentModel={selectedModel}
            />

            <div className="flex gap-3">
                <Button
                    variant="secondary"
                    onClick={() => setStep('confirm')}
                    className="flex-1"
                >
                    ← Atrás
                </Button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                {step === 'confirm' ? renderConfirmStep() : renderModelStep()}
            </div>
        </div>
    );
};

export default NewChatModal;
