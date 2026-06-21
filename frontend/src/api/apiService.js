import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const apiService = {
  // Health
  getHealth: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  // Brain Dumps
  createDump: async (rawContent) => {
    const response = await api.post('/dumps', { rawContent });
    return response.data;
  },
  
  getDumps: async () => {
    const response = await api.get('/dumps');
    return response.data;
  },

  deleteDump: async (dumpId) => {
    const response = await api.delete(`/dumps/${dumpId}`);
    return response.data;
  },

  // Thoughts / Triage Items
  getItems: async () => {
    const response = await api.get('/items');
    return response.data;
  },

  updateItem: async (itemId, updatedData) => {
    const response = await api.put(`/items/${itemId}`, updatedData);
    return response.data;
  },

  deleteItem: async (itemId) => {
    const response = await api.delete(`/items/${itemId}`);
    return response.data;
  },

  // App Settings
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },

  updateSetting: async (key, value) => {
    const response = await api.post('/settings', { key, value });
    return response.data;
  },

  // Safety Intercepts
  getSafetyKeywords: async () => {
    const response = await api.get('/safety');
    return response.data;
  },

  addSafetyKeyword: async (keyword, category = 'distress') => {
    const response = await api.post('/safety', { keyword, category });
    return response.data;
  },

  deleteSafetyKeyword: async (id) => {
    const response = await api.delete(`/safety/${id}`);
    return response.data;
  },
};

export default apiService;
