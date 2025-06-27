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

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessageContent[];
}

export interface IconProps {
  size?: number;
  className?: string;
}

export interface BaseResponse {
  statusCode?: number;
  description?: string | null;
  userFriendly?: string | null;
  moreInformation?: string | null;
}

export interface PostRegisterRequest {
  userEmail: string;
  password: string;
  displayName?: string | null;
}

export interface PostRegisterResponse extends BaseResponse {}

export interface GetUserInfoResponse extends BaseResponse {
  id?: string | null;
  userName?: string | null;
  email?: string | null;
  fullName?: string | null;
  phoneNumber?: string | null;
  role?: string | null;
}

export interface UpdateUserProfileRequest {
  userId?: string | null;
  displayName?: string | null;
  email?: string | null;
  age?: number | null;
  bio?: string | null;
  favoriteGenres?: string | null;
  profilePictureUrl?: string | null;
}

export interface UpdateUserProfileResponse extends BaseResponse {}

