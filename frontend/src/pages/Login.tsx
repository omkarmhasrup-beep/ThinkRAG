import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Eye, EyeOff } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', {
        username: username.trim(),
        password: password.trim()
      }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      await login(response.data.access_token);
      navigate('/');
    } catch (err: any) {
      const status = err.response?.status;
      const detail = err.response?.data?.detail;
      if (status === 502 || err.message.includes('502') || err.code === 'ERR_NETWORK') {
        setError('Cannot connect to the server. Please check if the backend is running.');
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError(err.message || 'Login failed');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md glass p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to continue to AI Chatbot</p>
        </div>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-sm font-medium mb-1">Username or Email</label>
            <input 
              id="username"
              name="username"
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Enter your username or email"
              autoComplete="off"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input 
                id="password"
                name="password"
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors focus:outline-none"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">Forgot Password?</Link>
          </div>
          
          <button 
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-secondary text-gray-900 dark:text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            Sign In
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm text-gray-500">
          Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Sign up</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
