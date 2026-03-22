
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Receipt, 
  ShoppingCart, 
  Truck, 
  CheckSquare, 
  StickyNote,
  Plus
} from 'lucide-react';
import { Language, View } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';
import { formatDate } from '../utils/dateUtils';
import { db, auth, collection, query, where, onSnapshot } from '../firebase';

interface DashboardProps {
  lang: Language;
  onNewInvoice: () => void;
  onViewChange: (view: View) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ lang, onNewInvoice, onViewChange }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [statsData, setStatsData] = useState({
    totalInvoices: 0,
    unpaidInvoices: 0,
    pendingDevis: 0,
    openTasks: 0,
    totalRevenue: 0
  });

  const [recentDocs, setRecentDocs] = useState<{
    quotes: any[],
    orders: any[],
    deliveries: any[]
  }>({
    quotes: [],
    orders: [],
    deliveries: []
  });

  useEffect(() => {
    if (!auth.currentUser) return;

    const uid = auth.currentUser.uid;

    // Invoices stats
    const invoicesQuery = query(collection(db, 'invoices'), where('uid', '==', uid));
    const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      const docs = snapshot.docs.map(d => d.data());
      const totalRev = docs.reduce((acc, d) => acc + (d.total || 0), 0);
      setStatsData(prev => ({
        ...prev,
        totalInvoices: docs.length,
        unpaidInvoices: docs.filter(d => d.status !== 'paid').length,
        totalRevenue: totalRev
      }));
    });

    // Tasks stats
    const tasksQuery = query(collection(db, 'tasks'), where('uid', '==', uid), where('status', '==', 'open'));
    const unsubscribeTasks = onSnapshot(tasksQuery, (snapshot) => {
      setStatsData(prev => ({
        ...prev,
        openTasks: snapshot.docs.length
      }));
    });

    // Recent Devis
    const devisQuery = query(collection(db, 'devis'), where('uid', '==', uid));
    const unsubscribeDevis = onSnapshot(devisQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentDocs(prev => ({ ...prev, quotes: data.slice(0, 3) }));
      setStatsData(prev => ({
        ...prev,
        pendingDevis: data.filter((d: any) => d.status === 'pending').length
      }));
    });

    // Recent Orders
    const ordersQuery = query(collection(db, 'purchase_orders'), where('uid', '==', uid));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentDocs(prev => ({ ...prev, orders: data.slice(0, 3) }));
    });

    // Recent Deliveries
    const deliveriesQuery = query(collection(db, 'delivery_notes'), where('uid', '==', uid));
    const unsubscribeDeliveries = onSnapshot(deliveriesQuery, (snapshot) => {
      const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setRecentDocs(prev => ({ ...prev, deliveries: data.slice(0, 3) }));
    });

    return () => {
      unsubscribeInvoices();
      unsubscribeTasks();
      unsubscribeDevis();
      unsubscribeOrders();
      unsubscribeDeliveries();
    };
  }, []);

  const quickActions = [
    { id: 'devis', label: t.newDevis, icon: FileSpreadsheet, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-100' },
    { id: 'reçus', label: t.newReçu, icon: Receipt, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100' },
    { id: 'bons_commande', label: t.newBonCommande, icon: ShoppingCart, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100' },
    { id: 'bons_livraison', label: t.newBonLivraison, icon: Truck, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-100' },
    { id: 'tasks', label: t.newTask, icon: CheckSquare, color: 'text-cyan-500', bg: 'bg-cyan-50', border: 'border-cyan-100' },
    { id: 'notes', label: t.newNote, icon: StickyNote, color: 'text-pink-500', bg: 'bg-pink-50', border: 'border-pink-100' },
  ];

  const stats = [
    { label: t.totalInvoices, value: statsData.totalInvoices.toString(), icon: FileText, color: 'text-amber-500', subtitle: '' },
    { label: t.unpaidInvoices, value: statsData.unpaidInvoices.toString(), icon: FileText, color: 'text-amber-500', subtitle: '' },
    { label: t.pendingDevis, value: statsData.pendingDevis.toString(), icon: FileSpreadsheet, color: 'text-amber-500', subtitle: '' },
    { label: t.openTasks, value: statsData.openTasks.toString(), icon: CheckSquare, color: 'text-amber-500', subtitle: statsData.openTasks === 0 ? t.noOpenTasks : '' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24">
      <header className={`mb-8 flex flex-col md:flex-row md:items-start justify-between gap-4 ${isRtl ? 'text-right' : 'text-left'}`}>
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex flex-wrap gap-x-2">
            <span>{t.welcome_to}</span>
            <span className="text-gray-900">Ma</span>
            <span className="text-amber-500">Factora</span>
          </h2>
          <p className="text-gray-500 mt-2 max-w-md leading-relaxed">
            {t.dashboardSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-xs font-bold border border-emerald-100 self-start">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <CheckSquare className="w-3 h-3" />
          <span>{t.lifetime_access}</span>
        </div>
      </header>

      {/* Quick Actions */}
      <section className="mb-10">
        <h3 className={`text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 ${isRtl ? 'text-right' : 'text-left'}`}>
          {t.quickActions}
        </h3>
        
        <div className="flex flex-col gap-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={onNewInvoice}
            className={`w-full flex items-center p-5 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-100 font-bold text-lg ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center mr-4 rtl:mr-0 rtl:ml-4">
              <FileText className="w-6 h-6" />
            </div>
            <span>{t.newInvoice}</span>
          </motion.button>

          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <motion.button
                key={index}
                whileTap={{ scale: 0.98 }}
                onClick={() => onViewChange(action.id as View)}
                className={`flex items-center p-3 bg-white border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div className={`w-8 h-8 ${action.bg} rounded-lg flex items-center justify-center mr-3 rtl:mr-0 rtl:ml-3 shrink-0`}>
                  <action.icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <span className="font-bold text-gray-700 text-xs truncate">{action.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm ${isRtl ? 'text-right' : 'text-left'}`}
          >
            <div className={`flex items-center gap-2 mb-4 ${isRtl ? 'flex-row-reverse' : 'flex-row'}`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-xs font-medium text-gray-500">{stat.label}</span>
            </div>
            <p className="text-4xl font-bold text-gray-900">{stat.value}</p>
            {stat.subtitle && <p className="text-[10px] text-gray-400 mt-1">{stat.subtitle}</p>}
          </motion.div>
        ))}
      </section>
    </div>
  );
};
