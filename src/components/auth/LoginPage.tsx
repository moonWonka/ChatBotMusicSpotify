import React, { useState } from 'react';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import { useAuth } from '../../hooks/useAuth';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const { login, register, loginWithGoogle, isLoading, error, clearError } = useAuth();

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

  const handleRegister = async (email: string, password: string, displayName: string): Promise<void> => {
    try {
      await register(email, password, displayName);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (err) {
      console.error('Register failed:', err);
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

  const switchToRegister = () => {
    setIsLoginMode(false);
    clearError();
  };

  const switchToLogin = () => {
    setIsLoginMode(true);
    clearError();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {isLoginMode ? (
          <LoginForm
            onLogin={handleLogin}
            onGoogleLogin={handleGoogleLogin}
            onSwitchToRegister={switchToRegister}
            isLoading={isLoading}
            error={error || undefined}
            onClearError={clearError}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onGoogleLogin={handleGoogleLogin}
            onSwitchToLogin={switchToLogin}
            isLoading={isLoading}
            error={error || undefined}
            onClearError={clearError}
          />
        )}
      </div>
    </div>
  );
};

export default LoginPage;