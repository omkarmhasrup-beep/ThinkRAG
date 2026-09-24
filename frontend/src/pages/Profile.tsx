import React, { useState, useEffect } from 'react';
import { User, Loader2, CheckCircle2, AlertCircle, Check, Edit2 } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setUsername(user.username);
    }
  }, [user, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username === user?.username) {
      setIsEditing(false);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await api.put('/auth/me', { username });
      setUser(res.data);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const cancelEdit = () => {
    setUsername(user?.username || '');
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto h-full flex flex-col overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">Profile</h1>
        <p className="text-gray-500">Manage your personal information and account details.</p>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-2xl">
        <section className="bg-white/60 dark:bg-[#1a1a1a]/60 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User size={24} className="text-primary"/> Personal Information
            </h3>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-gray-900 dark:text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Edit2 size={14} /> Edit Profile
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-100 dark:border-white/5">
            <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-3xl font-bold text-indigo-600 dark:text-indigo-400 overflow-hidden shadow-inner shrink-0">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{user?.username}</h4>
              <p className="text-gray-500 text-sm">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}
            {success && (
              <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 text-green-600 dark:text-green-400 text-sm rounded-xl flex items-center gap-2">
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={!isEditing}
                className={`w-full rounded-xl px-4 py-3 text-sm outline-none transition-all shadow-sm ${
                  isEditing 
                    ? 'bg-gray-50 dark:bg-black/20 border-gray-200 dark:border-white/20 border focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-900 dark:text-white' 
                    : 'bg-gray-100/50 dark:bg-white/5 border-transparent text-gray-700 dark:text-gray-300 cursor-not-allowed'
                }`}
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <input 
                type="email" 
                value={user?.email || ''}
                disabled
                className="w-full bg-gray-100/50 dark:bg-white/5 border-transparent rounded-xl px-4 py-3 text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed shadow-sm"
              />
              <p className="text-xs text-gray-500 mt-2">Email address cannot be changed currently.</p>
            </div>
            
            {isEditing && (
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="px-6 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !username.trim() || username === user?.username}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </section>
      </div>
    </div>
  );
};

export default Profile;
