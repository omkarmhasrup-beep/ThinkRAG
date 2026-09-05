import axios from 'axios';

// Updated to use Localhost since Render is giving 502 errors
const API_URL = 'http://127.0.0.1:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


api.interceptors.request.use((config) => {
  // @ts-ignore
  config.metadata = { startTime: new Date().getTime() };
  
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (config.url === '/health') {
      console.log(`[PERF] /health request started: ${new Date().getTime()}`);
  }
  console.log(`[PERF] Frontend request started: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use((response) => {
  // @ts-ignore
  const duration = new Date().getTime() - response.config.metadata.startTime;
  if (response.config.url === '/health') {
      console.log(`[PERF] /health response received: ${new Date().getTime()}`);
  }
  console.log(`[PERF] Frontend response received: ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    localStorage.removeItem('token');
    // We could dispatch an event or force reload if desired
    if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
      window.location.href = '/login';
    }
  }

  // @ts-ignore
  if (error.config && error.config.metadata) {
  // @ts-ignore
    const duration = new Date().getTime() - error.config.metadata.startTime;
    console.log(`[PERF] Frontend response error: ${error.config.method?.toUpperCase()} ${error.config.url} - ${duration}ms`);
  }
  return Promise.reject(error);
});


export default api;
