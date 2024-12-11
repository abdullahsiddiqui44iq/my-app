import { API_CONFIG } from '../config/api';

interface RequestOptions {
  headers?: Record<string, string>;
  [key: string]: any;
}

class ApiService {
  static async post(endpoint: string, data: any, options: RequestOptions = {}) {
    try {
      // Set default headers
      const headers = {
        'Accept': 'application/json',
        ...(data instanceof FormData 
          ? {} // Don't set Content-Type for FormData, let the browser set it
          : { 'Content-Type': 'application/json' }
        ),
        ...options.headers
      };

      // Remove Content-Type if it's FormData (let browser set it)
      if (data instanceof FormData && headers['Content-Type']) {
        delete headers['Content-Type'];
      }

      const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: data instanceof FormData ? data : JSON.stringify(data),
        ...options
      });

      // Log response details for debugging
      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));
      
      // Try to get response text first
      const responseText = await response.text();
      console.log('API Response Text:', responseText);

      // Try to parse as JSON if possible
      try {
        const responseData = JSON.parse(responseText);
        if (!response.ok) {
          throw new Error(responseData.error || 'API request failed');
        }
        return { ok: response.ok, status: response.status, json: () => Promise.resolve(responseData) };
      } catch (e) {
        if (!response.ok) {
          throw new Error(responseText || 'API request failed');
        }
        return response;
      }
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
}

export default ApiService; 