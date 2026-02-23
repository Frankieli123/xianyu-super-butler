import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';

const request: AxiosInstance = axios.create({
  baseURL: '',
  timeout: 30000,
});

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

request.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.dispatchEvent(new Event('auth:logout'));
    }
    return Promise.reject(error);
  }
);

export const get = async <T = any>(url: string, params?: any): Promise<T> => {
  const response = await request.get<T>(url, { params });
  return response.data;
};

export const post = async <T = any>(url: string, data?: any): Promise<T> => {
  const response = await request.post<T>(url, data);
  return response.data;
};

export const put = async <T = any>(url: string, data?: any): Promise<T> => {
  const response = await request.put<T>(url, data);
  return response.data;
};

export const del = async <T = any>(url: string): Promise<T> => {
  const response = await request.delete<T>(url);
  return response.data;
};

export default request;
