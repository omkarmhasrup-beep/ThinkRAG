import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import { Eye, EyeOff, Check, X } from 'lucide-react';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const passwordRules = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
  };

  const isPasswordValid = Object.values(passwordRules).every(Boolean);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/register', { username, email, password });
      
      // Auto login after register
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
        setError(err.message || 'Registration failed');
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md glass p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Create Account</h1>
          <p className="text-gray-500 mt-2">Join AI Chatbot today</p>
        </div>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Choose a username"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                placeholder="Create a password"
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

          {/* Password Strength Checklist */}
          <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg space-y-2 mt-2 border border-gray-100 dark:border-white/5">
            <p className="text-xs font-medium text-gray-500 mb-1">Password must contain:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className={`flex items-center gap-1.5 ${passwordRules.length ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
                {passwordRules.length ? <Check size={14} /> : <X size={14} />} 8+ characters
              </div>
              <div className={`flex items-center gap-1.5 ${passwordRules.upper ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
                {passwordRules.upper ? <Check size={14} /> : <X size={14} />} Uppercase
              </div>
              <div className={`flex items-center gap-1.5 ${passwordRules.lower ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
                {passwordRules.lower ? <Check size={14} /> : <X size={14} />} Lowercase
              </div>
              <div className={`flex items-center gap-1.5 ${passwordRules.number ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
                {passwordRules.number ? <Check size={14} /> : <X size={14} />} Number
              </div>
              <div className={`flex items-center gap-1.5 ${passwordRules.special ? 'text-green-500 font-medium' : 'text-gray-400'}`}>
                {passwordRules.special ? <Check size={14} /> : <X size={14} />} Special character
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={!isPasswordValid || !username || !email}
            className="w-full bg-gradient-to-r from-primary to-secondary text-gray-900 dark:text-white font-medium py-3 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-lg shadow-primary/20 mt-2"
          >
            Create Account
          </button>
        </form>
        
        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
