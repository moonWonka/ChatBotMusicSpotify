import React from 'react';

interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
  variant?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message, 
  onDismiss, 
  variant = 'error' 
}) => {
  const variantClasses = {
    error: 'bg-red-500 border-red-600',
    warning: 'bg-yellow-500 border-yellow-600',
    info: 'bg-blue-500 border-blue-600',
  };
  
  return (
    <div className={`${variantClasses[variant]} text-white p-3 border-l-4 flex items-center justify-between`}>
      <p className="text-sm font-medium">{message}</p>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-3 text-white hover:text-gray-200 transition-colors"
          aria-label="Cerrar mensaje"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;
