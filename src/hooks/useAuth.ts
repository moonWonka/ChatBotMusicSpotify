import { useState, useEffect } from 'react';
import firebaseAuthService, { AuthUser } from '../services/firebaseAuthService';

interface UseAuthReturn {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, password: string, displayName?: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
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

    // Verificar resultado de redirect al inicializar
    firebaseAuthService.handleRedirectResult().then((result) => {
      if (result.success && result.user) {
        console.log('✅ Usuario autenticado via redirect:', result.user.email);
      } else if (result.error) {
        setError(result.error);
      }
    });

    // Cleanup function
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await firebaseAuthService.loginWithEmail(email, password);

      if (!response.success) {
        setError(response.error || 'Error en el login');
        setIsLoading(false);
        return false;
      }
      // El usuario se actualizará automáticamente via onAuthStateChange
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  const register = async (email: string, password: string, displayName?: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await firebaseAuthService.registerWithEmail(email, password, displayName);

      if (!response.success) {
        setError(response.error || 'Error en el registro');
        setIsLoading(false);
        return false;
      }
      // El usuario se actualizará automáticamente via onAuthStateChange
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setIsLoading(false);
      return false;
    }
  };

  const loginWithGoogle = async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await firebaseAuthService.loginWithGoogle();

      if (!response.success) {
        setError(response.error || 'Error en el login con Google');
        setIsLoading(false);
        return false;
      }
      // El usuario se actualizará automáticamente via onAuthStateChange
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setIsLoading(false);
      return false;
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