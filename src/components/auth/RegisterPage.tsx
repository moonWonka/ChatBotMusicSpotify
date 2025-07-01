import React, { useState } from 'react';
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import { useAuth } from '../../hooks/useAuth';

interface RegisterPageProps {
  onSuccess?: () => void;
}

const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess }) => {
  const { register, login, loginWithGoogle, isLoading, error, clearError } = useAuth();
  const [showLogin, setShowLogin] = useState(false);

  const handleRegister = async (email: string, password: string, displayName: string) => {
    const success = await register(email, password, displayName);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleLogin = async (email: string, password: string) => {
    const success = await login(email, password);
    if (success && onSuccess) {
      onSuccess();
    }
  };

  const handleGoogleLogin = async () => {
    const success = await loginWithGoogle();
    if (success && onSuccess) {
      onSuccess();
    }
  };

  if (showLogin) {
    return (
      <LoginForm
        onLogin={handleLogin}
        onGoogleLogin={handleGoogleLogin}
        isLoading={isLoading}
        error={error}
        onClearError={clearError}
      />
    );
  }

  return (
    <RegisterForm
      onRegister={handleRegister}
      onGoogleLogin={handleGoogleLogin}
      isLoading={isLoading}
      error={error}
      onClearError={clearError}
      onSwitchToLogin={() => setShowLogin(true)}
    />
  );
};

export default RegisterPage;