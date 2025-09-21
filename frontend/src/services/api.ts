import axios from 'axios';
import { InventoryItem, Sale, PaginatedResponse } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

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
};

// Health check
export const healthCheck = async (): Promise<{ status: string; timestamp: string }> => {
  const response = await api.get('/health');
  return response.data;
};

export default api;