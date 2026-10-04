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

// ─── Phase 6: Inventory Management API ────────────────────────────────────────

export interface InventoryItem {
  id: string;
  productId: {
    _id?: string;
    id?: string;
    name: string;
    sku: string;
    category?: string;
    unitPrice?: number;
  };
  warehouseId: {
    _id?: string;
    id?: string;
    name: string;
    code: string;
  };
  locationId: {
    _id?: string;
    id?: string;
    name: string;
    code: string;
  };
  quantity: number;
  minimumStock: number;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  createdAt?: string;
  updatedAt?: string;
}

export interface InventoryFormData {
  productId: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
  minimumStock: number;
}

export const fetchInventory = async (params?: { warehouseId?: string; status?: string }): Promise<InventoryItem[]> => {
  const response = await api.get<InventoryItem[]>('/inventory', { params });
  return response.data;
};

export const createInventory = async (data: InventoryFormData): Promise<InventoryItem> => {
  const response = await api.post<InventoryItem>('/inventory', data);
  return response.data;
};

export const updateInventory = async (id: string, data: Partial<InventoryFormData>): Promise<InventoryItem> => {
  const response = await api.put<InventoryItem>(`/inventory/${id}`, data);
  return response.data;
};

export const deleteInventory = async (id: string): Promise<{ message: string; id: string }> => {
  const response = await api.delete<{ message: string; id: string }>(`/inventory/${id}`);
  return response.data;
};

// ─── Phase 7: Stock Movements API ─────────────────────────────────────────────

export interface StockMovementItem {
  id: string;
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  productId: { _id?: string; name: string; sku: string };
  warehouseId: { _id?: string; name: string; code: string };
  locationId: { _id?: string; name: string; code: string };
  toWarehouseId?: { _id?: string; name: string; code: string };
  toLocationId?: { _id?: string; name: string; code: string };
  quantity: number;
  reason: string;
  userId?: { name: string; email: string; role: string };
  createdAt: string;
}

export interface MovementFormData {
  type: 'IN' | 'OUT' | 'TRANSFER' | 'ADJUSTMENT';
  productId: string;
  warehouseId: string;
  locationId: string;
  toWarehouseId?: string;
  toLocationId?: string;
  quantity: number;
  reason: string;
}

export const fetchMovements = async (): Promise<StockMovementItem[]> => {
  const response = await api.get<StockMovementItem[]>('/movements');
  return response.data;
};

export const createMovement = async (data: MovementFormData): Promise<{ movement: StockMovementItem }> => {
  const response = await api.post<{ movement: StockMovementItem }>('/movements', data);
  return response.data;
};

// ─── Phase 8: Damaged Stock API ───────────────────────────────────────────────

export interface DamagedItem {
  id: string;
  productId: { _id?: string; name: string; sku: string; unitPrice?: number };
  warehouseId: { _id?: string; name: string; code: string };
  locationId: { _id?: string; name: string; code: string };
  quantity: number;
  reason: string;
  status: 'REPORTED' | 'RESOLVED';
  reportedBy?: { name: string; email: string };
  resolutionNotes?: string;
  createdAt: string;
}

export interface DamagedFormData {
  productId: string;
  warehouseId: string;
  locationId: string;
  quantity: number;
  reason: string;
}

export const fetchDamagedStock = async (): Promise<DamagedItem[]> => {
  const response = await api.get<DamagedItem[]>('/damaged');
  return response.data;
};

export const createDamagedStock = async (data: DamagedFormData): Promise<{ damaged: DamagedItem }> => {
  const response = await api.post<{ damaged: DamagedItem }>('/damaged', data);
  return response.data;
};

export const resolveDamagedStock = async (id: string, resolutionNotes?: string): Promise<DamagedItem> => {
  const response = await api.patch<DamagedItem>(`/damaged/${id}/resolve`, { resolutionNotes });
  return response.data;
};

// ─── Phase 9: Orders & Dispatch API ───────────────────────────────────────────

export interface OrderItemLine {
  productId: { _id?: string; id?: string; name: string; sku: string; unitPrice?: number };
  quantity: number;
  unitPrice: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  customerName: string;
  items: OrderItemLine[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PICKING' | 'READY' | 'DISPATCHED' | 'CANCELLED';
  dispatchBay: string;
  notes?: string;
  createdBy?: { name: string; email: string };
  createdAt: string;
}

export interface OrderFormData {
  customerName: string;
  items: { productId: string; quantity: number }[];
  dispatchBay?: string;
  notes?: string;
}

export const fetchOrders = async (status?: string): Promise<OrderRecord[]> => {
  const response = await api.get<OrderRecord[]>('/orders', { params: { status } });
  return response.data;
};

export const createOrder = async (data: OrderFormData): Promise<OrderRecord> => {
  const response = await api.post<OrderRecord>('/orders', data);
  return response.data;
};

export const updateOrderStatus = async (id: string, status: string, dispatchBay?: string): Promise<OrderRecord> => {
  const response = await api.patch<OrderRecord>(`/orders/${id}/status`, { status, dispatchBay });
  return response.data;
};

// ─── Phase 10: Reports & Dashboard Analytics API ──────────────────────────────

export interface DashboardSummary {
  totalProducts: number;
  totalWarehouses: number;
  totalLocations: number;
  totalStockUnits: number;
  totalStockValuation: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalDamagedItems: number;
  unresolvedDamagedCount: number;
  pendingOrders: number;
  confirmedOrders: number;
  pickingOrders: number;
  readyOrders: number;
  dispatchedOrders: number;
  cancelledOrders: number;
  totalOrders: number;
}

export interface AnalyticsResponse {
  summary: DashboardSummary;
  recentMovements: any[];
}

export const fetchDashboardStats = async (): Promise<AnalyticsResponse> => {
  const response = await api.get<AnalyticsResponse>('/reports/analytics');
  return response.data;
};

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api'),
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
