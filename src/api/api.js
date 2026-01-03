import axios from 'axios';

const API = axios.create({
  baseURL: 'https://church.altoservices.net/api',
});

API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');

    if (!token) return config;

    return {
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    };
  },
  (error) => Promise.reject(error),
);

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default API;
