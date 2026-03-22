
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Download, 
  Eye, 
  Trash2, 
  Pencil,
  ChevronDown,
  Copy,
  Ban,
  CheckCircle,
  Printer,
  Palette
} from 'lucide-react';
import { Language, Invoice } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'motion/react';
import { DocumentForm } from './DocumentForm';
import { db, auth, collection, query, where, onSnapshot, deleteDoc, doc, addDoc, updateDoc, getDoc, setDoc } from '../firebase';
import { generateInvoicePDF } from '../utils/pdfGenerator';
import { formatDate } from '../utils/dateUtils';

interface InvoiceListProps {
  lang: Language;
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [showForm, setShowForm] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [settings, setSettings] = useState<any>(null);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colors = [
    '#f59e0b', // Amber (Light Gold)
    '#ef4444', // Red
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#1f2937', // Gray-800
    '#000000', // Black
  ];

  const handleColorChange = async (color: string) => {
    if (!auth.currentUser) return;
    try {
      const newSettings = {
        ...settings,
        branding: {
          ...settings?.branding,
          color: color
        }
      };
      await setDoc(doc(db, 'settings', auth.currentUser.uid), newSettings, { merge: true });
      setSettings(newSettings);
      setShowColorPicker(false);
    } catch (error) {
      console.error("Error updating color:", error);
    }
  };

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'invoices'), where('uid', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Invoice[];
      setInvoices(data.sort((a, b) => b.number.localeCompare(a.number)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!auth.currentUser) return;
    const loadSettings = async () => {
      const docRef = doc(db, 'settings', auth.currentUser!.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data());
      }
    };
    loadSettings();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(t.deleteInvoiceConfirm)) {
      try {
        await deleteDoc(doc(db, 'invoices', id));
      } catch (error) {
        console.error("Error deleting invoice:", error);
      }
    }
  };

  const handleDuplicate = async (invoice: any) => {
    if (!auth.currentUser) return;
    try {
      const { id, number, ...rest } = invoice;
      const newNumber = `${number}-COPY`;
      await addDoc(collection(db, 'invoices'), {
        ...rest,
        number: newNumber,
        createdAt: new Date().toISOString()
      });
      setActiveMenu(null);
    } catch (error) {
      console.error("Error duplicating invoice:", error);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'invoices', id), { status: newStatus });
      setActiveMenu(null);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-emerald-50 text-emerald-600';
      case 'sent': return 'bg-blue-50 text-blue-600';
      case 'overdue': return 'bg-amber-50 text-amber-600';
      case 'cancelled': return 'bg-gray-100 text-gray-400';
      default: return 'bg-gray-50 text-gray-600';
    }
  };

  const filteredInvoices = invoices.filter(inv => 
    inv.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (inv.clientId || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      {showForm && <DocumentForm lang={lang} type="invoices" onClose={() => setShowForm(false)} />}
      {editingInvoice && <DocumentForm lang={lang} type="invoices" document={editingInvoice} onClose={() => setEditingInvoice(null)} />}
      
      <header className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
          <h2 className="text-2xl font-bold text-gray-800">{t.factures}</h2>
          <p className="text-gray-500">{invoices.length} {t.documents}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-3 bg-white border border-gray-100 rounded-xl text-gray-500 hover:text-amber-500 hover:border-amber-200 transition-all shadow-sm"
              title={isRtl ? 'تغيير لون المستندات' : 'Changer la couleur des documents'}
            >
              <Palette className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showColorPicker && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className={`absolute z-20 mt-2 p-3 bg-white rounded-2xl shadow-2xl border border-gray-100 w-48 ${isRtl ? 'right-0' : 'left-0'}`}
                  >
                    <p className={`text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 ${isRtl ? 'text-right' : 'text-left'}`}>
                      {isRtl ? 'لون المستندات' : 'Couleur des documents'}
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {colors.map((c) => (
                        <button
                          key={c}
                          onClick={() => handleColorChange(c)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${
                            settings?.branding?.color === c ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                          }`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={() => setShowForm(true)}
            className={`flex items-center justify-center px-6 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <Plus className={`w-5 h-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
            <span>{t.newInvoice}</span>
          </button>
        </div>
      </header>

      <div className="space-y-4 mb-6">
        <div className="relative group">
          <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors ${isRtl ? 'right-4' : 'left-4'}`} />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full py-4 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className={`grid grid-cols-12 gap-4 p-4 bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-widest ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={`col-span-6 md:col-span-4 ${isRtl ? 'text-right' : 'text-left'}`}>N°</div>
          <div className={`col-span-4 md:col-span-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className={`flex items-center gap-1 ${isRtl ? 'justify-end' : ''}`}>
              {t.status} <ChevronDown className="w-3 h-3" />
            </div>
          </div>
          <div className="hidden md:block md:col-span-3 text-center">{t.amount}</div>
          <div className="col-span-2 md:col-span-1"></div>
        </div>

        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-12 text-center text-gray-400">{t.loading}</div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-12 text-center text-gray-400">{t.noInvoicesFound}</div>
          ) : (
            filteredInvoices.map((invoice) => (
              <div key={invoice.id} className={`grid grid-cols-12 gap-4 p-5 items-center hover:bg-gray-50/50 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`col-span-6 md:col-span-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="font-bold text-gray-800">{invoice.number}</p>
                  <div className={`flex items-center gap-2 mt-1 ${isRtl ? 'justify-end' : ''}`}>
                    <span className="text-xs text-gray-500">{invoice.clientId}</span>
                    <span className="text-[10px] text-gray-400">• {formatDate(invoice.date)}</span>
                    {invoice.clientIce && <span className="text-[10px] text-gray-300 font-mono">ICE: {invoice.clientIce}</span>}
                  </div>
                </div>
                
                <div className={`col-span-4 md:col-span-4 ${isRtl ? 'text-right' : 'text-left'}`}>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase ${getStatusColor(invoice.status)}`}>
                    {invoice.status}
                  </span>
                </div>

                <div className="hidden md:block md:col-span-3 text-center font-bold text-gray-800">
                  {(invoice.total || 0).toFixed(2)} DH
                </div>

                <div className="col-span-2 md:col-span-1 flex items-center justify-end gap-1 relative">
                  <div className="hidden lg:flex items-center gap-1">
                    <button 
                      onClick={() => generateInvoicePDF(invoice, lang, 'invoices', settings?.branding)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-amber-500"
                      title={t.print}
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEditingInvoice(invoice)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-amber-500"
                      title={t.edit}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => generateInvoicePDF(invoice, lang, 'invoices', settings?.branding)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-amber-500"
                      title={t.view}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(invoice.id)}
                      className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-amber-500"
                      title={t.delete}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button 
                    onClick={() => setActiveMenu(activeMenu === invoice.id ? null : invoice.id)}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {activeMenu === invoice.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setActiveMenu(null)} />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className={`absolute z-20 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 top-full mt-2 ${isRtl ? 'left-0' : 'right-0'}`}
                        >
                          <button
                            onClick={() => {
                              setEditingInvoice(invoice);
                              setActiveMenu(null);
                            }}
                            className={`w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                            {t.view_edit}
                          </button>

                          <button
                            onClick={() => {
                              handleDuplicate(invoice);
                              setActiveMenu(null);
                            }}
                            className={`w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                          >
                            <Copy className="w-4 h-4 text-gray-400" />
                            {t.duplicate}
                          </button>

                          <div className="h-px bg-gray-100 my-1" />

                          <button
                            onClick={() => {
                              generateInvoicePDF(invoice, lang, 'invoices', settings?.branding);
                              setActiveMenu(null);
                            }}
                            className={`w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                          >
                            <Printer className="w-4 h-4 text-gray-400" />
                            {t.generate_pdf}
                          </button>

                          <button
                            onClick={() => handleStatusChange(invoice.id, 'paid')}
                            className={`w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-500" />
                            {t.markAsPaid}
                          </button>

                          <div className="h-px bg-gray-100 my-1" />

                          <button
                            onClick={() => {
                              handleDelete(invoice.id);
                              setActiveMenu(null);
                            }}
                            className={`w-full px-4 py-3 text-sm text-amber-500 hover:bg-amber-50 flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            {t.delete}
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>

  );
};
