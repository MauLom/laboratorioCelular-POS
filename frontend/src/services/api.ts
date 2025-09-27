import axios from 'axios';
import { 
  InventoryItem, 
  Sale, 
  PaginatedResponse,
  User,
  LoginRequest,
  LoginResponse,
  UserPaginatedResponse,
  FranchiseLocation,
  LocationPaginatedResponse
} from '../types';

// Environment validation
const validateEnv = () => {
  const env = process.env.REACT_APP_ENV || 'development';
  console.log(`🚀 Frontend Environment: ${env}`);
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
  console.log(`⏱️ API Timeout: ${API_TIMEOUT}ms`);
  
  if (env === 'production' && API_BASE_URL.includes('localhost')) {
    console.warn('⚠️ Warning: Using localhost API URL in production environment');
  }
};

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const API_TIMEOUT = parseInt(process.env.REACT_APP_API_TIMEOUT || '10000', 10);

// Validate environment on load
validateEnv();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Inventory API
export const inventoryApi = {
  // Get all inventory items
  getAll: async (params?: {
    state?: string;
    branch?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<InventoryItem>> => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  // Get item by IMEI
  getByImei: async (imei: string): Promise<InventoryItem> => {
    const response = await api.get(`/inventory/${imei}`);
    return response.data;
  },

  // Create new item
  create: async (item: Omit<InventoryItem, '_id' | 'createdAt' | 'updatedAt'>): Promise<InventoryItem> => {
    const response = await api.post('/inventory', item);
    return response.data;
  },

  // Update item
  update: async (imei: string, item: Partial<InventoryItem>): Promise<InventoryItem> => {
    const response = await api.put(`/inventory/${imei}`, item);
    return response.data;
  },

  // Delete item
  delete: async (imei: string): Promise<void> => {
    await api.delete(`/inventory/${imei}`);
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get('/inventory/stats/summary');
    return response.data;
  },
};

// Sales API
export const salesApi = {
  // Get all sales
  getAll: async (params?: {
    description?: string;
    finance?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<Sale>> => {
    const response = await api.get('/sales', { params });
    return response.data;
  },

  // Get sale by ID
  getById: async (id: string): Promise<Sale> => {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  },

  // Create new sale
  create: async (sale: Omit<Sale, '_id' | 'createdAt' | 'updatedAt'>): Promise<Sale> => {
    const response = await api.post('/sales', sale);
    return response.data;
  },

  // Update sale
  update: async (id: string, sale: Partial<Sale>): Promise<Sale> => {
    const response = await api.put(`/sales/${id}`, sale);
    return response.data;
  },

  // Delete sale
  delete: async (id: string): Promise<void> => {
    await api.delete(`/sales/${id}`);
  },

  // Get statistics
  getStats: async () => {
    const response = await api.get('/sales/stats/summary');
    return response.data;
  },

  // Export sales to Excel
  exportToExcel: async (params?: {
    description?: string;
    finance?: string;
    franchiseLocation?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Blob> => {
    const response = await api.get('/sales/export', { 
      params,
      responseType: 'blob' 
    });
    return response.data;
  },
};

// Health check
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  const response = await api.get('/health');
  return response.data;
};

// Authentication API
export const authApi = {
  // Login
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (updates: Partial<User>): Promise<{ message: string; user: User }> => {
    const response = await api.put('/auth/profile', updates);
    return response.data;
  },

  // Change password
  changePassword: async (data: { currentPassword: string; newPassword: string }): Promise<{ message: string }> => {
    const response = await api.put('/auth/change-password', data);
    return response.data;
  },

  // Verify token
  verify: async (): Promise<{ valid: boolean; user: User }> => {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  // Logout
  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Users API (Master admin only)
export const usersApi = {
  // Get all users
  getAll: async (params?: {
    role?: string;
    franchiseLocation?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<UserPaginatedResponse> => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get user by ID
  getById: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  create: async (user: Omit<User, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<{ message: string; user: User }> => {
    const response = await api.post('/users', user);
    return response.data;
  },

  // Update user
  update: async (id: string, updates: Partial<User>): Promise<{ message: string; user: User }> => {
    const response = await api.put(`/users/${id}`, updates);
    return response.data;
  },

  // Delete user (deactivate)
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Reset user password
  resetPassword: async (id: string, newPassword: string): Promise<{ message: string }> => {
    const response = await api.post(`/users/${id}/reset-password`, { newPassword });
    return response.data;
  },

  // Get user statistics
  getStats: async () => {
    const response = await api.get('/users/stats/summary');
    return response.data;
  }
};

// Franchise Locations API
export const franchiseLocationsApi = {
  // Get all locations (Master admin only)
  getAll: async (params?: {
    type?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
  }): Promise<LocationPaginatedResponse> => {
    const response = await api.get('/franchise-locations', { params });
    return response.data;
  },

  // Get active locations (for dropdowns)
  getActive: async (): Promise<FranchiseLocation[]> => {
    const response = await api.get('/franchise-locations/active');
    return response.data;
  },

  // Get location by ID
  getById: async (id: string): Promise<FranchiseLocation> => {
    const response = await api.get(`/franchise-locations/${id}`);
    return response.data;
  },

  // Create new location
  create: async (location: Omit<FranchiseLocation, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'>): Promise<{ message: string; location: FranchiseLocation }> => {
    const response = await api.post('/franchise-locations', location);
    return response.data;
  },

  // Update location
  update: async (id: string, updates: Partial<FranchiseLocation>): Promise<{ message: string; location: FranchiseLocation }> => {
    const response = await api.put(`/franchise-locations/${id}`, updates);
    return response.data;
  },

  // Delete location (deactivate)
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await api.delete(`/franchise-locations/${id}`);
    return response.data;
  },

  // Get location statistics
  getStats: async () => {
    const response = await api.get('/franchise-locations/stats/summary');
    return response.data;
  }
};

// Configuration API
export const configurationsApi = {
  // Get all configurations or specific by key
  getAll: async (key?: string): Promise<any> => {
    const response = await api.get('/configurations', { params: key ? { key } : {} });
    return response.data;
  },

  // Get configuration by key
  getByKey: async (key: string): Promise<any> => {
    const response = await api.get('/configurations', { params: { key } });
    return response.data;
  },

  // Create or update configuration (Master admin only)
  createOrUpdate: async (config: {
    key: string;
    name: string;
    description?: string;
    values: Array<{ value: string; label: string; isActive?: boolean }>;
  }): Promise<any> => {
    const response = await api.post('/configurations', config);
    return response.data;
  },

  // Update configuration values (Master admin only)
  updateValues: async (key: string, values: Array<{ value: string; label: string; isActive?: boolean }>): Promise<any> => {
    const response = await api.put(`/configurations/${key}`, { values });
    return response.data;
  },

  // Delete configuration (Master admin only)
  delete: async (key: string): Promise<{ message: string }> => {
    const response = await api.delete(`/configurations/${key}`);
    return response.data;
  }
};

// Brands & Characteristics API
export const catalogsApi = {
  // Get all brands
  getBrands: async (): Promise<any[]> => {
    const response = await api.get('/brands');
    return response.data;
  },

  // Get characteristics
  getCharacteristics: async (): Promise<any[]> => {
    const response = await api.get('/characteristics');
    return response.data;
  },

  // Get values for a specific characteristic, optionally filtered by brand
  getCharacteristicValues: async (characteristicId: string, brandId?: string): Promise<any[]> => {
    const params: any = {};
    if (brandId) params.brandId = brandId;
    const response = await api.get(`/characteristics/${characteristicId}/values`, { params });
    return response.data;
  }
  ,
  // Brand management
  createBrand: async (payload: { name: string; description?: string }) => {
    const response = await api.post('/brands', payload);
    return response.data;
  },
  updateBrand: async (id: string, payload: { name: string; description?: string }) => {
    const response = await api.put(`/brands/${id}`, payload);
    return response.data;
  },
  deleteBrand: async (id: string) => {
    const response = await api.delete(`/brands/${id}`);
    return response.data;
  },
  // Characteristic management
  createCharacteristic: async (payload: { name: string; description?: string; type?: string }) => {
    const response = await api.post('/characteristics', payload);
    return response.data;
  },
  updateCharacteristic: async (id: string, payload: { name: string; description?: string; type?: string }) => {
    const response = await api.put(`/characteristics/${id}`, payload);
    return response.data;
  },
  deleteCharacteristic: async (id: string) => {
    const response = await api.delete(`/characteristics/${id}`);
    return response.data;
  },
  createCharacteristicValue: async (characteristicId: string, payload: { brandId: string; value: string; displayName: string; hexColor?: string }) => {
    const response = await api.post(`/characteristics/${characteristicId}/values`, payload);
    return response.data;
  }
};

export default api;