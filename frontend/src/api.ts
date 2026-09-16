import axios from 'axios';

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface UserSummary {
  id: string | number;
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

export const updateUserStatus = async (id: string | number, status: 'ACTIVE' | 'INACTIVE'): Promise<void> => {
  await api.patch(`/users/${id}/status`, { status });
};

// ─── Product Management API ───────────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  category: string;
  unitPrice: number;
  quantity: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductFormData {
  name: string;
  sku: string;
  description: string;
  category: string;
  unitPrice: number | string;
  quantity: number | string;
  status: 'ACTIVE' | 'INACTIVE';
}

export const fetchProducts = async (params?: { search?: string; category?: string; status?: string }): Promise<Product[]> => {
  const response = await api.get<Product[]>('/products', { params });
  return response.data;
};

export const fetchProductById = async (id: string | number): Promise<Product> => {
  const response = await api.get<Product>(`/products/${id}`);
  return response.data;
};

export const createProduct = async (data: Partial<ProductFormData>): Promise<Product> => {
  const response = await api.post<Product>('/products', data);
  return response.data;
};

export const updateProduct = async (id: string | number, data: Partial<ProductFormData>): Promise<Product> => {
  const response = await api.put<Product>(`/products/${id}`, data);
  return response.data;
};

export const deleteProduct = async (id: string | number): Promise<{ message: string; id: string }> => {
  const response = await api.delete<{ message: string; id: string }>(`/products/${id}`);
  return response.data;
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
