import { ApiResponse, GetUserInfoResponse, UpdateUserProfileRequest, UpdateUserProfileResponse } from '../types';
import { BASE_API_URL } from '../config/config';

class UserService {
  private async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_API_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || `HTTP error! status: ${response.status}` };
      }

      return { success: true, data };
    } catch (error) {
      console.error('UserService GET request failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  private async put<T>(endpoint: string, body: any): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${BASE_API_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || `HTTP error! status: ${response.status}` };
      }

      return { success: true, data };
    } catch (error) {
      console.error('UserService PUT request failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Network error' };
    }
  }

  async getUserInfo(id: string): Promise<ApiResponse<GetUserInfoResponse>> {
    return this.get<GetUserInfoResponse>(`User/${id}/info`);
  }

  async updateUserProfile(id: string, payload: UpdateUserProfileRequest): Promise<ApiResponse<UpdateUserProfileResponse>> {
    return this.put<UpdateUserProfileResponse>(`User/${id}/profile`, payload);
  }
}

export const userService = new UserService();
export default userService;
