import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const ForgotPassword = () => {
  const [identifier, setIdentifier] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    setResetToken(null);
    try {
      const response = await api.post('/forgot-password', {
        identifier: identifier.trim()
      });
      setMessage(response.data.message);
      if (response.data.reset_token) {
        setResetToken(response.data.reset_token);
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError(err.message || 'Failed to request password reset');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md glass p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Forgot Password</h1>
          <p className="text-gray-500 mt-2">Enter your email or username to reset your password</p>
        </div>
        
        {error && <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg mb-6 text-sm">{error}</div>}
        {message && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 p-3 rounded-lg mb-6 text-sm flex flex-col space-y-2">
            <span>{message}</span>
            {resetToken && (
              <div className="mt-2 p-2 bg-gray-900 text-white rounded text-xs break-all">
                <strong>Test Mode - Reset Link: </strong>
                <Link to={`/reset-password?token=${resetToken}`} className="text-primary hover:underline">
                  Click here to reset your password
                </Link>
              </div>
            )}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Username or Email</label>
            <input 
              type="text" 
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              placeholder="Enter your username or email"
              required
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className={`w-full bg-gradient-to-r from-primary to-secondary text-gray-900 dark:text-white font-medium py-3 rounded-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/20 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-primary hover:underline font-medium">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
