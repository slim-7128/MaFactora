
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  CheckSquare, 
  FileText, 
  FileSpreadsheet, 
  ShoppingCart, 
  Truck, 
  Receipt, 
  LogOut, 
  Settings,
  Globe,
  RotateCcw,
  BookOpen
} from 'lucide-react';
import { motion } from 'motion/react';
import { Language, View } from '../types';
import { translations } from '../translations';
import { auth } from '../firebase';

interface SidebarProps {
  lang: Language;
  setLang: (lang: Language) => void;
  currentView: View;
  setView: (view: View) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ lang, setLang, currentView, setView, onLogout }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const menuItems = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard, section: 'organization' },
    { id: 'clients', label: t.clients, icon: Users, section: 'organization' },
    { id: 'users', label: t.users, icon: Users, section: 'organization' },
    { id: 'tasks', label: t.tasks, icon: CheckSquare, section: 'organization' },
    { id: 'notes', label: t.notes, icon: FileText, section: 'organization' },
    
    { id: 'devis', label: t.devis, icon: FileSpreadsheet, section: 'documents' },
    { id: 'bons_commande', label: t.bons_commande, icon: ShoppingCart, section: 'documents' },
    { id: 'bons_livraison', label: t.bons_livraison, icon: Truck, section: 'documents' },
    { id: 'invoices', label: t.factures, icon: FileText, section: 'documents' },
    { id: 'reçus', label: t.reçus, icon: Receipt, section: 'documents' },
    { id: 'credit_notes', label: t.credit_notes, icon: RotateCcw, section: 'documents' },

    { id: 'catalog', label: t.catalog, icon: BookOpen, section: 'catalogue' },

    { id: 'settings', label: t.settings, icon: Settings, section: 'system' },
  ];

  const renderSection = (section: string, title: string) => (
    <div className="mb-6">
      <h3 className={`px-4 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider ${isRtl ? 'text-right' : 'text-left'}`}>
        {title}
      </h3>
      <div className="space-y-1">
        {menuItems.filter(item => item.section === section).map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id as View)}
            className={`w-full flex items-center px-4 py-2.5 text-sm font-medium transition-colors rounded-lg group
              ${currentView === item.id 
                ? 'bg-amber-50 text-amber-600 border-l-4 border-amber-600' 
                : 'text-gray-600 hover:bg-gray-100'
              } ${isRtl ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
          >
            <item.icon className={`w-5 h-5 ${isRtl ? 'ml-3' : 'mr-3'} ${currentView === item.id ? 'text-amber-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <aside className={`w-64 h-screen bg-white border-r border-gray-200 flex flex-col fixed top-0 ${isRtl ? 'right-0 border-l border-r-0' : 'left-0'}`}>
      <div className={`p-6 flex items-center ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
          <Receipt className="w-6 h-6" />
        </div>
        <div className={`mx-3 ${isRtl ? 'text-right' : 'text-left'}`}>
          <div className="flex items-center text-lg font-bold">
            <span className="text-gray-800">Ma</span>
            <span className="text-amber-500">Factora</span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {renderSection('organization', t.organization)}
        {renderSection('documents', t.documents_section)}
        {renderSection('catalogue', t.catalogue_section)}
        {renderSection('system', t.system_section)}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className={`flex items-center justify-between mb-4 p-3 bg-amber-50 rounded-xl border border-amber-100 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex items-center ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Settings className="w-4 h-4 text-amber-500" />
            </div>
            <div className={`mx-2 ${isRtl ? 'text-right' : 'text-left'}`}>
              <p className="text-sm font-bold text-gray-800">{t.advancedMode}</p>
              <p className="text-[10px] text-gray-500">{t.stockAndPayroll}</p>
            </div>
          </div>
          <div className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
          </div>
        </div>

        <div className="space-y-2">
          <button 
            onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
            className={`w-full flex items-center px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ${isRtl ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
          >
            <Globe className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <span>{lang === 'fr' ? 'العربية' : 'Français'}</span>
          </button>
          
          <div className={`px-4 py-2 text-xs text-gray-400 truncate ${isRtl ? 'text-right' : 'text-left'}`}>
            {auth.currentUser?.email || 'demo@facture.profacture.com'}
          </div>
          
          <button 
            onClick={onLogout}
            className={`w-full flex items-center px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 rounded-lg transition-colors font-medium ${isRtl ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}
          >
            <LogOut className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
