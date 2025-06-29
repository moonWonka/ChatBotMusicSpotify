import { ApiResponse, PostRegisterRequest, PostRegisterResponse } from '../types';
import { BASE_API_URL, DEFAULT_API_VERSION } from '../config/config';

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
}

export const authService = new AuthService();
export default authService;
