import axios, { AxiosInstance, AxiosResponse } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        // Block all game API calls for demo mode
        if (config.url?.includes('/game/challenge/demo-')) {
          console.log('🔧 Demo mode: Blocking API call to', config.url);
          return Promise.reject(new Error('Demo mode: API calls disabled for demo challenges'));
        }
        
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Skip auth for demo mode
          if (token === 'demo-access-token') {
            console.log('🔧 Demo mode: Skipping API call to', config.url);
            return Promise.reject(new Error('Demo mode: API calls disabled'));
          }
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await this.refreshToken(refreshToken);
              const { accessToken, refreshToken: newRefreshToken } = response.data.tokens;
              
              localStorage.setItem('accessToken', accessToken);
              localStorage.setItem('refreshToken', newRefreshToken);
              
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            }
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(userData: RegisterData): Promise<AxiosResponse<RegisterResponse>> {
    return this.api.post('/auth/register', userData);
  }

  async login(credentials: LoginData): Promise<AxiosResponse<LoginResponse>> {
    return this.api.post('/auth/login', credentials);
  }

  async logout(): Promise<AxiosResponse<{ message: string }>> {
    return this.api.post('/auth/logout');
  }

  async refreshToken(refreshToken: string): Promise<AxiosResponse<RefreshTokenResponse>> {
    return this.api.post('/auth/refresh-token', { refreshToken });
  }

  async requestPasswordReset(email: string): Promise<AxiosResponse<{ message: string }>> {
    return this.api.post('/auth/request-password-reset', { email });
  }

  async resetPassword(token: string, password: string): Promise<AxiosResponse<{ message: string }>> {
    return this.api.post('/auth/reset-password', { token, password });
  }

  async verifyEmail(token: string): Promise<AxiosResponse<{ message: string }>> {
    return this.api.get(`/auth/verify-email/${token}`);
  }

  async resendVerification(): Promise<AxiosResponse<{ message: string }>> {
    return this.api.post('/auth/resend-verification');
  }

  async getProfile(): Promise<AxiosResponse<ProfileResponse>> {
    return this.api.get('/auth/profile');
  }

  async updateProfile(profileData: UpdateProfileData): Promise<AxiosResponse<UpdateProfileResponse>> {
    return this.api.put('/auth/profile', profileData);
  }

  async updateCharacter(characterData: UpdateCharacterData): Promise<AxiosResponse<UpdateCharacterResponse>> {
    return this.api.put('/auth/character', characterData);
  }

  // Expose HTTP methods for other services
  get(url: string, config?: any) {
    return this.api.get(url, config);
  }

  post(url: string, data?: any, config?: any) {
    return this.api.post(url, data, config);
  }

  put(url: string, data?: any, config?: any) {
    return this.api.put(url, data, config);
  }

  delete(url: string, config?: any) {
    return this.api.delete(url, config);
  }
}

// Type definitions
export interface RegisterData {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  educationLevel?: 'O-Level' | 'A-Level' | 'Other';
  school?: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  educationLevel?: string;
  school?: string;
  isVerified: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface Character {
  id: string;
  userId: string;
  characterName: string;
  level: number;
  experiencePoints: number;
  totalGold: number;
  currentRealm?: string;
  avatarUrl?: string;
  title?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterResponse {
  message: string;
  user: User;
  character: Character;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
  verificationToken?: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  character: Character;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenResponse {
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ProfileResponse {
  user: User;
  character: Character;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  educationLevel?: 'O-Level' | 'A-Level' | 'Other';
  school?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export interface UpdateCharacterData {
  characterName?: string;
  avatarUrl?: string;
  title?: string;
}

export interface UpdateCharacterResponse {
  message: string;
  character: Character;
}

export default new ApiService();