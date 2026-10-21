import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ChefHat,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Users,
  Crown,
  Clock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { restaurantConfig } from '../../lib/mockData';

export default function StaffLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, login, error } = useAuth();
  const navigate = useNavigate();

  // If already authenticated and session is active within 3 hours, redirect immediately
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') navigate('/admin', { replace: true });
      else if (user.role === 'kitchen') navigate('/kitchen', { replace: true });
      else navigate('/waiter', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const loggedUser = await login(email, password);
      if (loggedUser.role === 'admin') navigate('/admin');
      else if (loggedUser.role === 'kitchen') navigate('/kitchen');
      else navigate('/waiter');
    } catch {
      /* error displayed from context */
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (id: string, pass: string) => {
    setEmail(id);
    setPassword(pass);
    setLoading(true);
    try {
      const loggedUser = await login(id, pass);
      if (loggedUser.role === 'admin') navigate('/admin', { replace: true });
      else if (loggedUser.role === 'kitchen') navigate('/kitchen', { replace: true });
      else navigate('/waiter', { replace: true });
    } catch {
      /* error displayed from context */
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans selection:bg-orange-500 selection:text-white">
      {/* 3D Ambient Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-orange-600/15 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-blue-600/15 blur-[140px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm perspective-1000 z-10"
      >
        {/* Logo & Headline */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 flex items-center justify-center mx-auto mb-3 shadow-2xl shadow-orange-500/30 ring-1 ring-white/20">
            <ChefHat className="h-8 w-8 text-white drop-shadow" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            {restaurantConfig.name}
          </h1>
          <p className="text-xs text-orange-400 font-bold uppercase tracking-wider mt-0.5">
            3D Staff Terminal
          </p>
        </div>

        {/* 3D Glass Card Form */}
        <div className="glass-card-3d rounded-3xl p-6 border border-white/10 shadow-2xl relative">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold text-white">Authorized Access</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                Staff Username or Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter username or email"
                  className="w-full bg-[#14171d] border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  className="w-full bg-[#14171d] border border-white/10 rounded-2xl pl-10 pr-10 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-xl font-medium"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-3d w-full bg-gradient-to-r from-orange-500 to-amber-600 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-xl hover:shadow-orange-500/20 transition-all"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Enter Terminal</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* ── Quick Role Direct Login Options ── */}
          <div className="mt-5 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3 px-0.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-orange-400" />
                Quick Station Login
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                3-Hr Stay Logged In
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {/* Waiter Option */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('waiter', 'waiter123')}
                className="p-2.5 rounded-2xl bg-gradient-to-b from-[#161a22] to-[#0e1117] border border-blue-500/25 hover:border-blue-400/60 hover:bg-blue-500/10 transition-all flex flex-col items-center text-center group active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-blue-500/10"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 group-hover:scale-110 group-hover:bg-blue-500/25 transition-all mb-1.5">
                  <Users className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-blue-300">Waiter</span>
                <span className="text-[10px] text-slate-400">Floor & Tables</span>
                <span className="mt-1.5 text-[9px] font-bold text-blue-300 bg-blue-500/20 px-1.5 py-0.5 rounded border border-blue-500/30">
                  Tap to Enter
                </span>
              </button>

              {/* Cooker / Staff Option */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('cooker', 'cooker123')}
                className="p-2.5 rounded-2xl bg-gradient-to-b from-[#161a22] to-[#0e1117] border border-amber-500/25 hover:border-amber-400/60 hover:bg-amber-500/10 transition-all flex flex-col items-center text-center group active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-amber-500/10"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 group-hover:bg-amber-500/25 transition-all mb-1.5">
                  <ChefHat className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-amber-300">Cooker</span>
                <span className="text-[10px] text-slate-400">Kitchen KDS</span>
                <span className="mt-1.5 text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/30">
                  Tap to Enter
                </span>
              </button>

              {/* Admin Option */}
              <button
                type="button"
                disabled={loading}
                onClick={() => handleQuickLogin('adminmain23@gmail.com', 'royalchef200')}
                className="p-2.5 rounded-2xl bg-gradient-to-b from-[#161a22] to-[#0e1117] border border-purple-500/25 hover:border-purple-400/60 hover:bg-purple-500/10 transition-all flex flex-col items-center text-center group active:scale-95 disabled:opacity-50 cursor-pointer shadow-lg hover:shadow-purple-500/10"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 group-hover:scale-110 group-hover:bg-purple-500/25 transition-all mb-1.5">
                  <Crown className="h-4.5 w-4.5" />
                </div>
                <span className="text-xs font-bold text-white group-hover:text-purple-300">Admin</span>
                <span className="text-[10px] text-slate-400">Management</span>
                <span className="mt-1.5 text-[9px] font-bold text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                  Tap to Enter
                </span>
              </button>
            </div>
          </div>

          {/* Security footnote */}
          <div className="mt-5 pt-3 border-t border-white/5 text-center">
            <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Multi-Device Terminal • Auto-Saved Session</span>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
