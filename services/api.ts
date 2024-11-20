import { API_CONFIG } from '../config/api';

interface RequestOptions {
  headers?: Record<string, string>;
  [key: string]: any;
}

class ApiService {
  static async post(endpoint: string, data: any, options: RequestOptions = {}) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        body: data instanceof FormData ? data : JSON.stringify(data),
        ...options
      });
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  static async get(endpoint: string, options: RequestOptions = {}) {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...options.headers
        },
        ...options
      });
      return response;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Add more methods as needed
}

export default ApiService; 