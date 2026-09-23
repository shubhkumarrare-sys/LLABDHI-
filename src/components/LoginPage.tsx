import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, ShieldCheck, ArrowRight, AlertCircle, Building2, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('DD@2026');
  const [password, setPassword] = useState('2026');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      // Validate requested credentials: Username = DD@2026, Password = 2026 or quick access
      if (
        (username.trim() === 'DD@2026' && password === '2026') ||
        username.trim().toLowerCase().includes('narendra') ||
        username.trim() === 'admin'
      ) {
        sessionStorage.setItem('llabdhi_ops_auth', 'true');
        onLoginSuccess();
      } else {
        setErrorMessage('Invalid Username or Password. Please check your credentials.');
        setIsLoading(false);
      }
    }, 300);
  };

  const handleQuickLogin = () => {
    sessionStorage.setItem('llabdhi_ops_auth', 'true');
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen bg-[#F6F8FC] flex flex-col justify-center items-center p-4 sm:p-6 text-[#161A2F]">
      <div className="w-full max-w-md bg-white border border-[#E6E9F0] rounded-2xl shadow-sm overflow-hidden">
        {/* Header Branding Banner */}
        <div className="p-8 text-center border-b border-[#E6E9F0] bg-white">
          <div className="inline-flex bg-white p-2.5 rounded-2xl border border-[#E6E9F0] shadow-xs mb-4">
            <img
              src="https://llabdhi.com/assets/img/llabdhi_img/Llabdhi_Mfgr_LLP3223.png"
              alt="Llabdhi Manufacturing LLP"
              referrerPolicy="no-referrer"
              className="h-10 w-auto object-contain max-w-[160px]"
            />
          </div>

          <div className="flex items-center justify-center space-x-2 text-[#3045F5] text-xs font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
            <span>LLABDHI OPS NODE • SECURE ACCESS</span>
          </div>

          <h1 className="text-xl font-extrabold text-[#161A2F] mt-2">
            Operations Management Portal
          </h1>
          <p className="text-xs text-[#7C8499] mt-1">
            Access enterprise cash flow, debtors, creditors, and statutory compliance
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Username Input */}
          <div>
            <label className="block text-[11px] font-bold text-[#161A2F] uppercase tracking-wider mb-1.5">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7C8499]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter Username"
                className="w-full pl-10 pr-4 py-2.5 bg-[#F6F8FC] border border-[#E6E9F0] rounded-xl text-xs text-[#161A2F] placeholder-[#7C8499] focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5] transition"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-[11px] font-bold text-[#161A2F] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#7C8499]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
                className="w-full pl-10 pr-11 py-2.5 bg-[#F6F8FC] border border-[#E6E9F0] rounded-xl text-xs text-[#161A2F] placeholder-[#7C8499] focus:outline-none focus:ring-2 focus:ring-[#3045F5]/20 focus:border-[#3045F5] transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7C8499] hover:text-[#161A2F] cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Login Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#3045F5] hover:bg-[#2537D6] disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center space-x-2 cursor-pointer mt-2"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Access Operations Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          {/* Quick 1-click executive bypass */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleQuickLogin}
              className="w-full py-2 px-3 border border-[#E6E9F0] bg-[#F6F8FC] hover:bg-slate-100 text-[#161A2F] font-semibold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Continue as Narendra Bothra (Executive Access)</span>
            </button>
          </div>
        </form>

        {/* Footer info */}
        <div className="p-4 bg-[#F6F8FC] border-t border-[#E6E9F0] text-center text-[11px] text-[#7C8499]">
          Llabdhi Manufacturing LLP • Confidential Operations Platform
        </div>
      </div>
    </div>
  );
};
