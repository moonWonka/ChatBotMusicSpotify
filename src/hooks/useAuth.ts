import { useState, useEffect } from 'react';
import authService, { PostLoginRequest } from '../services/authService';

interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  useEffect(() => {
    const token = authService.getAuthToken();
    const userData = authService.getUserData();
    
    if (token && userData) {
      setUser(userData);
    }
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const payload: PostLoginRequest = {
        userEmail: email,
        password: password,
      };

      const response = await authService.login(payload);

      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        if (token && userData) {
          authService.setAuthToken(token);
          authService.setUserData(userData);
          setUser(userData);
        } else {
          throw new Error('Respuesta de login inválida');
        }
      } else {
        throw new Error(response.error || 'Error en el login');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.loginWithGoogle();

      if (response.success && response.data) {
        const { token, user: userData } = response.data;
        
        if (token && userData) {
          authService.setAuthToken(token);
          authService.setUserData(userData);
          setUser(userData);
        } else {
          throw new Error('Respuesta de Google login inválida');
        }
      } else {
        throw new Error(response.error || 'Error en el login con Google');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const clearError = (): void => {
    setError(null);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    loginWithGoogle,
    logout,
    clearError,
  };
};