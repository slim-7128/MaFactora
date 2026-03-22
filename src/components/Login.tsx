
import React, { useState } from 'react';
import { Receipt, Globe, LogIn, Mail } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';

interface LoginProps {
  lang: Language;
  setLang: (lang: Language) => void;
  onLogin: () => void;
  onEmailLogin: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<void>;
}

export const Login: React.FC<LoginProps> = ({ lang, setLang, onLogin, onEmailLogin, onSignUp }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        await onSignUp(email, password);
      } else {
        await onEmailLogin(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-white flex flex-col items-center pt-12 px-6 ${isRtl ? 'font-arabic' : ''}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header with Logo and Language Switcher */}
      <div className="w-full max-w-2xl flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg">
            <Receipt className="w-8 h-8" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-1">
              MaPilotage <span className="text-amber-500">Facture</span>
            </h1>
            <span className="text-sm text-gray-400 font-medium">facture.mafactora.ma</span>
          </div>
        </div>

        <button 
          onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-all"
        >
          <Globe className="w-5 h-5" />
          <span>{lang === 'fr' ? 'العربية' : 'Français'}</span>
        </button>
      </div>

      {/* Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl border border-gray-100 shadow-2xl shadow-gray-200/50 p-10"
      >
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-10">
          {isSignUp ? (isRtl ? 'إنشاء حساب جديد' : 'Créer un compte') : t.login_connexion}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              {t.login_email}
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              placeholder="example@email.com"
              required
            />
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              {t.login_password}
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
              required
            />
          </div>

          {!isSignUp && (
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="remember"
                className="w-5 h-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
              />
              <label htmlFor="remember" className="text-gray-500 font-medium">
                {t.login_remember_me}
              </label>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-amber-500 text-white rounded-xl font-bold text-lg hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 mt-4 flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                {isSignUp ? (isRtl ? 'إنشاء حساب' : 'Créer mon compte') : t.login_submit}
              </>
            )}
          </button>

          <div className="relative flex items-center justify-center py-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative px-4 bg-white text-sm text-gray-400 font-medium">
              {isRtl ? 'أو' : 'ou'}
            </span>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={onLogin}
            className="w-full py-4 px-6 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:border-amber-500 hover:bg-amber-50 transition-all flex items-center justify-center gap-3"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-6 h-6"
            />
            <span>{t.login_google}</span>
          </button>

          {/* Toggle Login/SignUp */}
          <div className="text-center mt-8">
            <p className="text-gray-500 font-medium">
              {isSignUp ? (isRtl ? 'لديك حساب بالفعل؟' : 'Vous avez déjà un compte ?') : t.login_no_account}{' '}
              <button 
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-amber-500 font-bold hover:underline"
              >
                {isSignUp ? (isRtl ? 'تسجيل الدخول' : 'Se connecter') : t.login_create_account}
              </button>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
