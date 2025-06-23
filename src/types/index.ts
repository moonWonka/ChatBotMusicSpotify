export enum MessageSender {
  USER = 'user',
  AI = 'ai',
}

export interface ChatMessageContent {
  id: string;
  sender: MessageSender;
  text: string;
  timestamp: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface IconProps {
  size?: number;
  className?: string;
}
