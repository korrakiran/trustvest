import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, register } from '../services/mockBackend';
import { ShieldCheck, Lock, User } from 'lucide-react';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      if (isRegister) {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        await register(username, email, password);
      } else {
        await login(email, password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center p-4">
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-2xl mb-4 shadow-lg shadow-emerald-500/20">
          <ShieldCheck className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">TrustVest</h1>
        <p className="text-slate-400 mt-2">Secure Micro-Investing for Everyone</p>
      </div>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="p-8">
           <div className="flex items-center justify-between mb-6">
             <h2 className="text-xl font-bold text-slate-900">
               {isRegister ? 'Create Your Account' : 'Sign In to Your Account'}
             </h2>
             <button
               type="button"
               onClick={() => {
                 setIsRegister(!isRegister);
                 setError('');
                 setUsername('');
                 setEmail('');
                 setPassword('');
               }}
               className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
             >
               {isRegister ? 'Sign In' : 'Sign Up'}
             </button>
           </div>

           {error && (
             <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
               {error}
             </div>
           )}

           <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                  <div className="relative">
                    <input 
                      required
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none pl-10"
                      placeholder="johndoe"
                      minLength={3}
                    />
                    <User className="absolute left-3 top-2.5 text-slate-400" size={16} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Must be unique. Min 3 characters.</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  required
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input 
                    required
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none pr-10"
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <Lock className="absolute right-3 top-2.5 text-slate-400" size={16} />
                </div>
                {isRegister && (
                  <p className="text-xs text-slate-500 mt-1">Min 6 characters.</p>
                )}
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-lg shadow-md transition-colors mt-2 disabled:opacity-50"
              >
                {loading 
                  ? (isRegister ? 'Creating Account...' : 'Securing Connection...') 
                  : (isRegister ? 'Create Account' : 'Secure Login')
                }
              </button>
           </form>

           <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-100 pt-4">
              <p>Protected by reCAPTCHA and Subject to Privacy Policy.</p>
              {!isRegister && (
                <p className="mt-1">Don't have an account? <button onClick={() => setIsRegister(true)} className="text-emerald-600 hover:text-emerald-700 font-medium">Sign up</button></p>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;