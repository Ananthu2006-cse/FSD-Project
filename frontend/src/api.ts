import axios from 'axios';

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UserSummary {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  createdAt: string;
}

export const fetchUsers = async (): Promise<UserSummary[]> => {
  const response = await api.get<UserSummary[]>('/users');
  return response.data;
};

export const updateUserStatus = async (id: number, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
  await api.patch(`/users/${id}/status`, { status });
};

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically include JWT token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
