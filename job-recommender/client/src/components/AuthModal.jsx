import React, { useState } from 'react';
import axios from 'axios';

export default function AuthModal({ isOpen, onClose, onAuthSuccess }) {
  if (!isOpen) return null;

  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const url = isLogin 
      ? 'http://localhost:5002/api/auth/login' 
      : 'http://localhost:5002/api/auth/register';

    try {
      const response = await axios.post(url, { email, password });
      const { token, user } = response.data;
      
      // Save credentials locally and trigger parent update callback
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      onAuthSuccess(token, user);
      onClose();
    } catch (err) {
      const serverMsg = err.response?.data?.error || 'Authentication failed. Please try again.';
      setError(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in">
      <div className="glass-panel w-full max-w-md p-8 rounded-2xl relative shadow-2xl border border-white/10 animate-scale-up">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-white font-bold text-2xl transition-all"
        >
          &times;
        </button>

        {/* Tab Header Selector */}
        <div className="flex border-b border-gray-800 pb-3 mb-6">
          <button 
            type="button"
            onClick={() => { setIsLogin(true); setError(''); }}
            className={`flex-1 text-center font-head font-bold text-lg pb-1 transition-all ${
              isLogin ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Log In
          </button>
          <button 
            type="button"
            onClick={() => { setIsLogin(false); setError(''); }}
            className={`flex-1 text-center font-head font-bold text-lg pb-1 transition-all ${
              !isLogin ? 'text-indigo-400 border-b-2 border-indigo-500' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Indicator */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold rounded-lg mb-4">
            <i className="fa-solid fa-circle-exclamation flex-shrink-0"></i>
            <span>{error}</span>
          </div>
        )}

        {/* Input fields form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
            <div className="flex items-center gap-2.5 bg-black/45 border border-white/10 rounded-xl px-3.5 py-3 focus-within:border-indigo-500 transition-all">
              <i className="fa-regular fa-envelope text-indigo-400 text-sm"></i>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@example.com" 
                className="bg-transparent border-none outline-none text-sm text-gray-100 w-full placeholder-gray-600"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
            <div className="flex items-center gap-2.5 bg-black/45 border border-white/10 rounded-xl px-3.5 py-3 focus-within:border-indigo-500 transition-all">
              <i className="fa-solid fa-lock text-indigo-400 text-sm"></i>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="bg-transparent border-none outline-none text-sm text-gray-100 w-full placeholder-gray-600"
                required
              />
            </div>
            {!isLogin && (
              <span className="text-[10px] text-gray-500 font-semibold mt-1">Must be at least 6 characters long</span>
            )}
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-head font-bold text-sm py-3.5 rounded-xl shadow-lg shadow-indigo-500/15 flex items-center justify-center gap-2 active:translate-y-[1px] disabled:opacity-50 transition-all mt-3"
          >
            {loading ? (
              <>
                <span>Processing...</span>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
              </>
            ) : (
              <span>{isLogin ? 'Log In' : 'Sign Up'}</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
