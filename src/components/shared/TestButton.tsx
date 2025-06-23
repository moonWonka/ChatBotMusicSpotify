import React, { useState } from 'react';
import { BASE_API_URL } from '../../config/config';
import Button from './Button';

const TestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testBackendConnection = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch(`${BASE_API_URL}api/Chat/conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': '*/*'
        },
        body: JSON.stringify({
          userPrompt: 'prueba pregunta 3',
          aiResponse: 'test response ia 3 resss',
          sessionId: 'yeuryue343ss43ss'
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResult(`✅ Conexión exitosa! Status: ${response.status}\nRespuesta: ${JSON.stringify(data, null, 2)}`);
      } else {
        setError(`❌ Error ${response.status}: ${JSON.stringify(data, null, 2)}`);
      }
    } catch (err) {
      setError(`❌ Error de conexión: ${err instanceof Error ? err.message : 'Error desconocido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-600">
      <h3 className="text-white font-semibold mb-3">🧪 Prueba de Conexión al BFF</h3>
      
      <Button
        onClick={testBackendConnection}
        disabled={isLoading}
        variant="primary"
        className="mb-3"
      >
        {isLoading ? '⏳ Probando...' : '🔍 Probar Conexión'}
      </Button>

      {result && (
        <div className="bg-green-900 bg-opacity-50 border border-green-500 rounded-lg p-3 mb-3">
          <pre className="text-green-200 text-sm whitespace-pre-wrap">{result}</pre>
        </div>
      )}

      {error && (
        <div className="bg-red-900 bg-opacity-50 border border-red-500 rounded-lg p-3 mb-3">
          <pre className="text-red-200 text-sm whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      <div className="text-gray-400 text-xs">
        <p>Endpoint: {BASE_API_URL}api/Chat/conversation</p>
      </div>
    </div>
  );
};

export default TestButton;
