import axios from 'axios';

async function test() {
  try {
    const api = axios.create({
      baseURL: 'http://127.0.0.1:8000',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    api.interceptors.request.use((config) => {
      const token = null;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    }, (error) => {
      return Promise.reject(error);
    });

    const formData = new URLSearchParams();
    formData.append('username', 'omkarmhasrup');
    formData.append('password', '123456789');
    
    console.log('Sending request...');
    const response = await api.post('/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    console.log('Response:', response.data);
  } catch (err: any) {
    console.log('Error message:', err.message);
    if (err.response) {
      console.log('Error response data:', err.response.data);
    }
  }
}

test();
