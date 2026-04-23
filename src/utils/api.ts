// API utility functions
import { LocalStorageDB } from './localStorage';

// API utility functions to replace LocalStorageDB
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  if (process.env.NODE_ENV === 'production') {
    return `${window.location.origin}/api`;
  }
  return 'http://localhost:5000/api';
};

const API_BASE_URL = getApiBaseUrl();

// Generic API request wrapper
const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    const token = LocalStorageDB.getToken();
    if (token) {
      defaultOptions.headers = {
        ...(defaultOptions.headers as Record<string, string>),
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, defaultOptions);

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => '');

    if (!response.ok) {
      const serverMessage =
        payload && typeof payload === 'object' && 'message' in payload
          ? String((payload as any).message)
          : '';
      const detail = serverMessage ? ` - ${serverMessage}` : '';
      throw new Error(`HTTP error! status: ${response.status}${detail}`);
    }

    return payload;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Sales API
export const salesAPI = {
  getAll: () => apiRequest('/sales'),
  getById: (id: string) => apiRequest(`/sales/${id}`),
  create: (sale: any) => 
    apiRequest('/sales', {
      method: 'POST',
      body: JSON.stringify(sale),
    }),
  createBulk: (sales: any[]) => 
    apiRequest('/sales/bulk', {
      method: 'POST',
      body: JSON.stringify({ sales }),
    }),
  update: (id: string, sale: any) => 
    apiRequest(`/sales/${id}`, {
      method: 'PUT',
      body: JSON.stringify(sale),
    }),
  delete: (id: string) => 
    apiRequest(`/sales/${id}`, {
      method: 'DELETE',
    }),
  deleteAll: () => 
    apiRequest('/sales', {
      method: 'DELETE',
    }),
};

// Investments API
export const investmentsAPI = {
  getAll: () => apiRequest('/investments'),
  getById: (id: string) => apiRequest(`/investments/${id}`),
  create: (investment: any) => 
    apiRequest('/investments', {
      method: 'POST',
      body: JSON.stringify(investment),
    }),
  createBulk: (investments: any[]) => 
    apiRequest('/investments/bulk', {
      method: 'POST',
      body: JSON.stringify({ investments }),
    }),
  update: (id: string, investment: any) => 
    apiRequest(`/investments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(investment),
    }),
  delete: (id: string) => 
    apiRequest(`/investments/${id}`, {
      method: 'DELETE',
    }),
  deleteAll: () => 
    apiRequest('/investments', {
      method: 'DELETE',
    }),
};

// Leads API
export const leadsAPI = {
  getAll: () => apiRequest('/leads'),
  getById: (id: string) => apiRequest(`/leads/${id}`),
  create: (lead: any) => 
    apiRequest('/leads', {
      method: 'POST',
      body: JSON.stringify(lead),
    }),
  createBulk: (leads: any[]) => 
    apiRequest('/leads/bulk', {
      method: 'POST',
      body: JSON.stringify({ leads }),
    }),
  update: (id: string, lead: any) => 
    apiRequest(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(lead),
    }),
  delete: (id: string) => 
    apiRequest(`/leads/${id}`, {
      method: 'DELETE',
    }),
  deleteAll: () => 
    apiRequest('/leads', {
      method: 'DELETE',
    }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: (params?: any) => {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    return apiRequest(`/dashboard${queryString}`);
  },
};

// GST API
export const gstAPI = {
  getAll: () => apiRequest('/gst'),
  getById: (id: string) => apiRequest(`/gst/${id}`),
  create: (gst: any) => apiRequest('/gst', { method: 'POST', body: JSON.stringify(gst) }),
  createBulk: async (gstRecords: any[]) => Promise.all(gstRecords.map((gst) => apiRequest('/gst', { method: 'POST', body: JSON.stringify(gst) }))),
  update: (id: string, gst: any) => apiRequest(`/gst/${id}`, { method: 'PUT', body: JSON.stringify(gst) }),
  delete: (id: string) => apiRequest(`/gst/${id}`, { method: 'DELETE' }),
  deleteAll: () => apiRequest('/gst', { method: 'DELETE' }),
};

// Courier API
export const courierAPI = {
  getAll: () => apiRequest('/courier'),
  getById: (id: string) => apiRequest(`/courier/${id}`),
  create: (courier: any) => apiRequest('/courier', { method: 'POST', body: JSON.stringify(courier) }),
  createBulk: async (couriers: any[]) => Promise.all(couriers.map((courier) => apiRequest('/courier', { method: 'POST', body: JSON.stringify(courier) }))),
  update: (id: string, courier: any) => apiRequest(`/courier/${id}`, { method: 'PUT', body: JSON.stringify(courier) }),
  delete: (id: string) => apiRequest(`/courier/${id}`, { method: 'DELETE' }),
  deleteAll: () => apiRequest('/courier', { method: 'DELETE' }),
};

// Auth API
export const authAPI = {
  login: (email: string, password: string) => 
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

// Dynamic Form Config API
export const formConfigAPI = {
  getByModule: (module: 'leads' | 'sales' | 'investments' | 'gst' | 'courier' | 'stock') =>
    apiRequest(`/form-configs/${module}`),
  saveByModule: (
    module: 'leads' | 'sales' | 'investments' | 'gst' | 'courier' | 'stock',
    fields: any[]
  ) =>
    apiRequest(`/form-configs/${module}`, {
      method: 'PUT',
      body: JSON.stringify({ fields }),
    }),
};

// Users API
export const usersAPI = {
  getAll: () => apiRequest('/users'),
  create: (user: any) => 
    apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(user),
    }),
  update: (userId: string, userData: any) => 
    apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    }),
  updateRole: (userId: string, role: string) => 
    apiRequest(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    }),
  delete: (userId: string) => 
    apiRequest(`/users/${userId}`, {
      method: 'DELETE',
    }),
};

// Stock Management APIs
export const stockAPI = {
  getAll: (params?: { search?: string; category?: string; brand?: string; dealer?: string }) => {
    const queryString = new URLSearchParams(params as any).toString();
    return apiRequest(`/stock-items${queryString ? '?' + queryString : ''}`);
  },
  getById: (id: string) => apiRequest(`/stock-items/${id}`),
  create: (data: any) => 
    apiRequest('/stock-items', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) => 
    apiRequest(`/stock-items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => 
    apiRequest(`/stock-items/${id}`, {
      method: 'DELETE',
    }),
};

export const categoryAPI = {
  getAll: () => apiRequest('/categories'),
  getById: (id: string) => apiRequest(`/categories/${id}`),
  create: (data: any) => 
    apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) => 
    apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => 
    apiRequest(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

export const brandAPI = {
  getAll: () => apiRequest('/brands'),
  getById: (id: string) => apiRequest(`/brands/${id}`),
  create: (data: any) => 
    apiRequest('/brands', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) => 
    apiRequest(`/brands/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => 
    apiRequest(`/brands/${id}`, {
      method: 'DELETE',
    }),
};

export const dealerAPI = {
  getAll: () => apiRequest('/dealers'),
  getById: (id: string) => apiRequest(`/dealers/${id}`),
  create: (data: any) => 
    apiRequest('/dealers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: any) => 
    apiRequest(`/dealers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  delete: (id: string) => 
    apiRequest(`/dealers/${id}`, {
      method: 'DELETE',
    }),
};

export default {
  salesAPI,
  investmentsAPI,
  leadsAPI,
  dashboardAPI,
  gstAPI,
  courierAPI,
  authAPI,
  formConfigAPI,
  usersAPI,
  stockAPI,
  categoryAPI,
  brandAPI,
  dealerAPI,
};
