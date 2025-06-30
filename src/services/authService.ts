import { ApiResponse, PostRegisterRequest, PostRegisterResponse } from '../types';
import { BASE_API_URL, DEFAULT_API_VERSION } from '../config/config';

export interface PostLoginRequest {
  userEmail: string;
  password: string;
}

export interface PostLoginResponse {
  token?: string;
  user?: {
    id: string;
    email: string;
    displayName?: string;
  };
}

class AuthService {
  private async post<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'api-version': DEFAULT_API_VERSION,
      };

      const response = await fetch(`${BASE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || `HTTP error! status: ${response.status}`,
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('AuthService POST request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async register(payload: PostRegisterRequest): Promise<ApiResponse<PostRegisterResponse>> {
    return this.post<PostRegisterResponse>('auth/register', payload);
  }

  async login(payload: PostLoginRequest): Promise<ApiResponse<PostLoginResponse>> {
    return this.post<PostLoginResponse>('auth/login', payload);
  }

  async loginWithGoogle(): Promise<ApiResponse<PostLoginResponse>> {
    try {
      const response = await fetch(`${BASE_API_URL}auth/google`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'api-version': DEFAULT_API_VERSION,
        },
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP error! status: ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error('Google login failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
  }

  getUserData(): any {
    const userData = localStorage.getItem('user_data');
    return userData ? JSON.parse(userData) : null;
  }

  setUserData(userData: any): void {
    localStorage.setItem('user_data', JSON.stringify(userData));
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }
}

export const authService = new AuthService();
export default authService;
