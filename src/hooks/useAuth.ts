import { useState, useEffect } from 'react';
import firebaseAuthService, { AuthUser } from '../services/firebaseAuthService';

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Iniciar en true para auth check
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = !!user;

  useEffect(() => {
    // Configurar listener para cambios en el estado de autenticación
    const unsubscribe = firebaseAuthService.onAuthStateChange((authUser) => {
      setUser(authUser);
      setIsLoading(false); // Auth check completado
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await firebaseAuthService.loginWithEmail(email, password);

      if (!response.success) {
        throw new Error(response.error || 'Error en el login');
      }
      // El usuario se actualizará automáticamente via onAuthStateChange
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  const register = async (email: string, password: string, displayName?: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await firebaseAuthService.registerWithEmail(email, password, displayName);

      if (!response.success) {
        throw new Error(response.error || 'Error en el registro');
      }
      // El usuario se actualizará automáticamente via onAuthStateChange
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await firebaseAuthService.loginWithGoogle();

      if (!response.success) {
        throw new Error(response.error || 'Error en el login con Google');
      }
      // El usuario se actualizará automáticamente via onAuthStateChange
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  const logout = async (): Promise<void> => {
    setError(null);
    try {
      await firebaseAuthService.logout();
      // El usuario se actualizará automáticamente via onAuthStateChange
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cerrar sesión';
      setError(errorMessage);
      throw err;
    }
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
    register,
    loginWithGoogle,
    logout,
    clearError,
  };
};