import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { InvoiceList } from './components/InvoiceList';
import { ClientList } from './components/ClientList';
import { DocumentList } from './components/DocumentList';
import { TaskList } from './components/TaskList';
import { ProductList } from './components/ProductList';
import { Settings } from './components/Settings';
import { NoteList } from './components/NoteList';
import { UserList } from './components/UserList';
import { DocumentForm } from './components/DocumentForm';
import { Login } from './components/Login';
import { Language, View } from './types';
import { Menu, Globe, Receipt, LayoutGrid, Users, CheckSquare, FileText, FileSpreadsheet, X, LogIn, StickyNote, Clock, AlertCircle, BookOpen } from 'lucide-react';
import { translations } from './translations';
import { auth, googleProvider, signInWithPopup, onAuthStateChanged, User, signOut, db, doc, getDoc, setDoc, serverTimestamp, signInWithEmailAndPassword, createUserWithEmailAndPassword } from './firebase';

export default function App() {
  const [lang, setLang] = useState<Language>('fr');
  const [currentView, setView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [trialData, setTrialData] = useState<{ startedAt: any; isExpired: boolean; remaining: string } | null>(null);

  const t = translations[lang];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch or create user profile for trial tracking
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        let startedAt;
        if (!userSnap.exists()) {
          startedAt = new Date();
          await setDoc(userRef, {
            email: user.email,
            trialStartedAt: serverTimestamp(),
            isTrialActive: true
          });
        } else {
          const data = userSnap.data();
          if (data.trialStartedAt) {
            startedAt = data.trialStartedAt.toDate();
          } else {
            startedAt = new Date();
            await setDoc(userRef, { trialStartedAt: serverTimestamp() }, { merge: true });
          }
        }

        // Calculate trial status
        const now = new Date();
        const expiry = new Date(startedAt.getTime() + 48 * 60 * 60 * 1000);
        const isExpired = now > expiry;
        
        const diff = expiry.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        
        setTrialData({
          startedAt,
          isExpired,
          remaining: isExpired ? '0' : `${hours}h ${minutes}m`
        });
      }
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!trialData || trialData.isExpired) return;

    const interval = setInterval(() => {
      const now = new Date();
      const expiry = new Date(trialData.startedAt.getTime() + 48 * 60 * 60 * 1000);
      const isExpired = now > expiry;
      
      if (isExpired) {
        setTrialData(prev => prev ? { ...prev, isExpired: true, remaining: '0' } : null);
        clearInterval(interval);
        return;
      }

      const diff = expiry.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTrialData(prev => prev ? { ...prev, remaining: `${hours}h ${minutes}m` } : null);
    }, 60000);

    return () => clearInterval(interval);
  }, [trialData?.startedAt, trialData?.isExpired]);

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleEmailLogin = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const handleSignUp = async (email: string, password: string) => {
    await createUserWithEmailAndPassword(auth, email, password);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setView('dashboard');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Login 
        lang={lang} 
        setLang={setLang} 
        onLogin={handleLogin} 
        onEmailLogin={handleEmailLogin}
        onSignUp={handleSignUp}
      />
    );
  }

  const renderView = () => {
    if (trialData?.isExpired) {
      return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-amber-100">
            <div className="w-20 h-20 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-500 mx-auto mb-6">
              <Clock className="w-12 h-12" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.trial_expired}</h2>
            <p className="text-gray-500 mb-8">{t.contact_support}</p>
            <button
              onClick={handleLogout}
              className="w-full py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
            >
              {t.logout}
            </button>
          </div>
        </div>
      );
    }

    switch (currentView) {
      case 'dashboard':
        return <Dashboard lang={lang} onNewInvoice={() => setShowInvoiceForm(true)} onViewChange={setView} />;
      case 'invoices':
        return <InvoiceList lang={lang} />;
      case 'clients':
        return <ClientList lang={lang} />;
      case 'tasks':
        return <TaskList lang={lang} />;
      case 'notes':
        return <NoteList lang={lang} />;
      case 'catalog':
        return <ProductList lang={lang} />;
      case 'users':
        return <UserList lang={lang} />;
      case 'settings':
        return <Settings lang={lang} setLang={setLang} />;
      case 'devis':
      case 'bons_commande':
      case 'bons_livraison':
      case 'reçus':
      case 'credit_notes':
        return <DocumentList lang={lang} type={currentView} />;
      default:
        return (
          <div className="flex items-center justify-center min-h-[60vh] text-gray-400 p-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">{t.dev_section}</h2>
              <p>{t.dev_subtitle}</p>
              <button 
                onClick={() => setView('dashboard')}
                className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-xl font-bold"
              >
                {t.back_to_dashboard}
              </button>
            </div>
          </div>
        );
    }
  };

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutGrid },
    { id: 'clients', label: t.clients, icon: Users },
    { id: 'tasks', label: t.tasks, icon: CheckSquare },
    { id: 'notes', label: t.notes, icon: FileText },
    { id: 'catalog', label: t.catalog, icon: BookOpen },
  ];

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col lg:flex-row ${lang === 'ar' ? 'lg:flex-row-reverse' : ''}`}>
      {/* Mobile Top Bar */}
      <header className="lg:hidden bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-white shadow-sm">
            <Receipt className="w-5 h-5" />
          </div>
          <div className="flex items-center text-lg font-bold">
            <span className="text-gray-800">Ma</span>
            <span className="text-amber-500">Factora</span>
          </div>
        </div>
        <button 
          onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
          className="flex items-center gap-1 text-sm font-bold text-gray-600"
        >
          <Globe className="w-4 h-4" />
          <span>{lang === 'fr' ? 'العربية' : 'Français'}</span>
        </button>
      </header>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div 
            className={`absolute top-0 bottom-0 w-64 bg-white shadow-xl transition-transform duration-300 ${lang === 'ar' ? 'right-0' : 'left-0'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-bold text-gray-800">Menu</span>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            <Sidebar 
              lang={lang} 
              setLang={setLang} 
              currentView={currentView} 
              setView={(v) => { setView(v); setIsSidebarOpen(false); }} 
              onLogout={handleLogout}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          lang={lang} 
          setLang={setLang} 
          currentView={currentView} 
          setView={setView} 
          onLogout={handleLogout}
        />
      </div>
      
      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 pb-20 lg:pb-0 ${lang === 'ar' ? 'lg:mr-64' : 'lg:ml-64'}`}>
        {trialData && !trialData.isExpired && (
          <div className="bg-amber-50 border-b border-amber-100 px-6 py-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-600 text-xs font-bold">
              <AlertCircle className="w-4 h-4" />
              <span>{t.trial_period} - {t.trial_remaining}: {trialData.remaining}</span>
            </div>
          </div>
        )}
        {renderView()}
      </main>

      {/* Bottom Navigation for Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-1 flex items-center justify-around z-40">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`flex flex-col items-center p-2 min-w-[64px] transition-colors ${currentView === item.id ? 'text-amber-500' : 'text-gray-400'}`}
          >
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold truncate w-full text-center">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Global Invoice Form */}
      {showInvoiceForm && (
        <DocumentForm lang={lang} type="invoices" onClose={() => setShowInvoiceForm(false)} />
      )}
    </div>
  );
}
