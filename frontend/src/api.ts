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

// ─── Warehouse & Location Management API ──────────────────────────────────────

export interface Warehouse {
  id: string;
  name: string;
  code: string;
  address: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface WarehouseFormData {
  name: string;
  code: string;
  address?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface LocationItem {
  id: string;
  warehouseId: string | { _id: string; name: string; code: string };
  name: string;
  code: string;
  description: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface LocationFormData {
  warehouseId: string;
  name: string;
  code: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export const fetchWarehouses = async (): Promise<Warehouse[]> => {
  const response = await api.get<Warehouse[]>('/warehouses');
  return response.data;
};

export const fetchWarehouseById = async (id: string): Promise<Warehouse> => {
  const response = await api.get<Warehouse>(`/warehouses/${id}`);
  return response.data;
};

export const createWarehouse = async (data: WarehouseFormData): Promise<Warehouse> => {
  const response = await api.post<Warehouse>('/warehouses', data);
  return response.data;
};

export const updateWarehouse = async (id: string, data: Partial<WarehouseFormData>): Promise<Warehouse> => {
  const response = await api.put<Warehouse>(`/warehouses/${id}`, data);
  return response.data;
};

export const deleteWarehouse = async (id: string): Promise<{ message: string; id: string }> => {
  const response = await api.delete<{ message: string; id: string }>(`/warehouses/${id}`);
  return response.data;
};

export const fetchLocations = async (): Promise<LocationItem[]> => {
  const response = await api.get<LocationItem[]>('/locations');
  return response.data;
};

export const fetchLocationsByWarehouse = async (warehouseId: string): Promise<LocationItem[]> => {
  const response = await api.get<LocationItem[]>(`/warehouses/${warehouseId}/locations`);
  return response.data;
};

export const createLocation = async (data: LocationFormData): Promise<LocationItem> => {
  const response = await api.post<LocationItem>('/locations', data);
  return response.data;
};

export const updateLocation = async (id: string, data: Partial<LocationFormData>): Promise<LocationItem> => {
  const response = await api.put<LocationItem>(`/locations/${id}`, data);
  return response.data;
};

export const deleteLocation = async (id: string): Promise<{ message: string; id: string }> => {
  const response = await api.delete<{ message: string; id: string }>(`/locations/${id}`);
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
