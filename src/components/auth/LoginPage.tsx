import React from 'react';
import LoginForm from './LoginForm';
import { useAuth } from '../../hooks/useAuth';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const { login, loginWithGoogle, isLoading, error, clearError } = useAuth();

  const handleLogin = async (email: string, password: string): Promise<void> => {
    try {
      await login(email, password);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleGoogleLogin = async (): Promise<void> => {
    try {
      await loginWithGoogle();
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Google login failed:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm
          onLogin={handleLogin}
          onGoogleLogin={handleGoogleLogin}
          isLoading={isLoading}
          error={error}
          onClearError={clearError}
        />
      </div>
    </div>
  );
};

export default LoginPage;