import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach JWT Bearer Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed?.reg_number) {
          config.headers['x-user-reg'] = parsed.reg_number;
        }
      } catch (e) {
        // Ignore JSON parse error
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401, 403, and standard errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;

    // 401 Unauthorized: Session invalid or expired -> purge credentials and redirect to login
    if (status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    // 403 Forbidden: Authenticated user lacks permission -> keep session, propagate clean message
    let message = error.response?.data?.message || error.response?.data?.error;
    if (!message) {
      if (status === 403) {
        message = 'You do not have permission to access this page.';
      } else if (status === 401) {
        message = 'Your session has expired. Please log in again.';
      } else {
        message = error.message || 'Request failed';
      }
    }

    const customError = {
      status,
      message,
      data: error.response?.data
    };

    return Promise.reject(customError);
  }
);

export default api;
