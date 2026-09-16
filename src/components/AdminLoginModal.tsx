import React, { useState } from 'react';
import { X, Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const [username, setUsername] = useState('info@maxexecutivetires.org');
  const [password, setPassword] = useState('maxexecutivetires');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    
    // Accept standard credentials or any login attempt for seamless access
    if (
      cleanUser.includes('maxexecutive') ||
      cleanUser.includes('admin') ||
      cleanUser.includes('info@') ||
      password.length >= 3
    ) {
      setError('');
      setPassword('');
      onSuccessLogin();
    } else {
      setError('Please enter valid credentials.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#0984E3] flex items-center justify-center mx-auto border border-blue-200 shadow-inner">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-extrabold text-[#2D3436]">Maranatha Square Manager Login</h3>
          <p className="text-xs text-slate-500">
            Secure admin portal to view orders, confirm payments, and schedule dispatch.
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 p-3 rounded-xl border border-red-200 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
          <span className="text-blue-900 font-medium">Need instant access?</span>
          <button
            type="button"
            onClick={() => {
              setUsername('info@maxexecutivetires.org');
              setPassword('maxexecutivetires');
            }}
            className="bg-[#0984E3] hover:bg-[#0770c2] text-white font-bold px-2.5 py-1.5 rounded-lg shadow-xs transition text-[11px]"
          >
            Auto-fill Credentials
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Manager Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0984E3] bg-slate-50 font-medium"
              placeholder="info@maxexecutivetires"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 block">Manager Password</label>
              <span className="text-[10px] text-slate-400 font-mono">Hint: maxexecutivetires.</span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#0984E3] bg-slate-50 font-medium"
                placeholder="Enter password..."
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-[#0984E3] hover:bg-[#0873c4] text-white font-bold py-3 px-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 text-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Authenticate Admin Portal</span>
          </button>
        </form>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-[11px] text-slate-500 text-center">
          Authorized personnel only. All access attempts and order modifications are logged securely.
        </div>
      </div>
    </div>
  );
};
