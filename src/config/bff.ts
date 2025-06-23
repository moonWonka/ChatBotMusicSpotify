/**
 * Configuración del BFF (Backend for Frontend)
 * 
 * Este archivo contiene la configuración para comunicarse con el BFF
 * que maneja todas las llamadas a servicios de IA.
 */

export const BFF_CONFIG = {
  // URL base del BFF - se puede configurar via variable de entorno
  BASE_URL: process.env.VITE_BFF_URL || 'https://api.tu-bff.com/v1',
  
  // Endpoints disponibles en el BFF
  ENDPOINTS: {
    CHAT: '/chat',
    HEALTH: '/health',
  },
  
  // Configuración de timeouts
  TIMEOUTS: {
    DEFAULT: 30000, // 30 segundos
    STREAMING: 60000, // 60 segundos para streaming
  },
  
  // Headers por defecto para todas las peticiones
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * Valida si la configuración del BFF es válida
 */
export const validateBFFConfig = (): boolean => {
  try {
    const url = new URL(BFF_CONFIG.BASE_URL);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

/**
 * Obtiene la URL completa para un endpoint específico
 */
export const getBFFUrl = (endpoint: string): string => {
  return `${BFF_CONFIG.BASE_URL}${endpoint}`;
};
