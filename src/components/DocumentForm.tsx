
import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, X, Palette } from 'lucide-react';
import { Language, InvoiceItem, Client, Invoice, View } from '../types';
import { translations } from '../translations';
import { db, auth, collection, addDoc, query, where, onSnapshot, updateDoc, doc, getDoc, deleteDoc, setDoc } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface DocumentFormProps {
  lang: Language;
  onClose: () => void;
  type: View;
  document?: Invoice;
}

export const DocumentForm: React.FC<DocumentFormProps> = ({ lang, onClose, type, document: existingDoc }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(existingDoc?.clientId || '');
  const [date, setDate] = useState(existingDoc?.date || new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(existingDoc?.dueDate || '');
  const [validityDate, setValidityDate] = useState(existingDoc?.validityDate || '');
  const [deliveryDate, setDeliveryDate] = useState(existingDoc?.deliveryDate || '');
  const [deliveryAddress, setDeliveryAddress] = useState(existingDoc?.deliveryAddress || '');
  const [deliveryContact, setDeliveryContact] = useState(existingDoc?.deliveryContact || '');
  const [reference, setReference] = useState(existingDoc?.number || '');
  
  const [items, setItems] = useState<InvoiceItem[]>(
    existingDoc?.items.map(item => ({ ...item, id: Math.random().toString() })) || 
    [{ id: '1', description: '', quantity: 1, unitPrice: 0 }]
  );
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'clients'), where('uid', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
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

  // Auto-fill delivery info when client changes
  useEffect(() => {
    if (selectedClientId && (type === 'bons_commande' || type === 'bons_livraison')) {
      const client = clients.find(c => c.name === selectedClientId);
      if (client) {
        if (!deliveryAddress) setDeliveryAddress(client.address);
        if (!deliveryContact) setDeliveryContact(client.phone);
      }
    }
  }, [selectedClientId, clients, type]);

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

  const addItem = () => {
    setItems([...items, { id: Math.random().toString(), description: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const total = items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const subtotal = total / 1.2;
  const tax = total - subtotal;

  const getCollectionName = (viewType: View) => {
    switch (viewType) {
      case 'invoices': return 'invoices';
      case 'devis': return 'devis';
      case 'bons_commande': return 'purchase_orders';
      case 'bons_livraison': return 'delivery_notes';
      case 'reçus': return 'receipts';
      case 'credit_notes': return 'credit_notes';
      default: return 'documents';
    }
  };

  const getPrefix = (viewType: View) => {
    const customPrefixes = settings?.docs?.prefixes;
    switch (viewType) {
      case 'invoices': return customPrefixes?.invoice || 'FAC';
      case 'devis': return customPrefixes?.devis || 'DEV';
      case 'bons_commande': return customPrefixes?.po || 'BC';
      case 'bons_livraison': return customPrefixes?.dn || 'BL';
      case 'reçus': return customPrefixes?.receipt || 'REC';
      case 'credit_notes': return customPrefixes?.creditNote || 'AV';
      default: return 'DOC';
    }
  };

  const handleSave = async () => {
    if (!auth.currentUser) return;
    if (!selectedClientId) {
      alert(lang === 'ar' ? 'يرجى اختيار عميل' : 'Veuillez sélectionner un client');
      return;
    }

    setSaving(true);
    try {
      const collectionName = getCollectionName(type);
      const client = clients.find(c => c.name === selectedClientId);
      const docData = {
        clientId: selectedClientId,
        clientIce: client?.ice || '',
        date,
        dueDate,
        validityDate,
        deliveryDate,
        deliveryAddress,
        deliveryContact,
        items: items.map(({ id, ...rest }) => rest),
        taxRate: 20,
        discount: 0,
        total: total,
        uid: auth.currentUser.uid
      };

      if (existingDoc?.id) {
        await updateDoc(doc(db, collectionName, existingDoc.id), docData);
      } else {
        const prefix = getPrefix(type);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        
        let docNumber = reference;
        if (!docNumber) {
          if (type === 'invoices') {
            const randomNum = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
            docNumber = `${prefix}-${year}-${randomNum}`;
          } else {
            const randomNum = String(Math.floor(Math.random() * 100)).padStart(2, '0');
            docNumber = `${prefix}-${year}-${month}-${randomNum}`;
          }
        }
        
        await addDoc(collection(db, collectionName), {
          ...docData,
          number: docNumber,
          status: 'sent',
        });
      }
      onClose();
    } catch (error) {
      console.error("Error saving document:", error);
      alert(t.save_error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingDoc?.id) return;
    if (window.confirm(isRtl ? 'هل أنت متأكد من حذف هذا المستند؟' : 'Êtes-vous sûr de vouloir supprimer ce document ?')) {
      try {
        const collectionName = getCollectionName(type);
        await deleteDoc(doc(db, collectionName, existingDoc.id));
        onClose();
      } catch (error) {
        console.error("Error deleting document:", error);
        alert(lang === 'ar' ? 'خطأ أثناء الحذف' : 'Erreur lors de la suppression');
      }
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'invoices': return t.factures;
      case 'devis': return t.devis;
      case 'bons_commande': return t.bons_commande;
      case 'bons_livraison': return t.bons_livraison;
      case 'reçus': return t.reçus;
      case 'credit_notes': return t.credit_notes;
      default: return 'Document';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <header className={`p-6 border-b border-gray-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h2 className="text-xl font-bold text-gray-800">{getTitle()}</h2>
            {type === 'devis' && <p className="text-xs text-gray-400">{t.nonContractual}</p>}
          </div>
          <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="relative">
              <button
                onClick={() => setShowColorPicker(!showColorPicker)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-amber-500"
                title={isRtl ? 'تغيير لون المستندات' : 'Changer la couleur des documents'}
              >
                <Palette className="w-6 h-6" />
              </button>
              
              <AnimatePresence>
                {showColorPicker && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      className={`absolute z-20 mt-2 p-3 bg-white rounded-2xl shadow-2xl border border-gray-100 w-48 ${isRtl ? 'left-0' : 'right-0'}`}
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
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-6 h-6 text-gray-400" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className={`space-y-8 ${isRtl ? 'text-right' : 'text-left'}`}>
            {/* Client Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">{t.customer}</label>
              <select 
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`}
              >
                <option value="">{t.selectClient}</option>
                {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>

            {/* Dates and Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t.issueDate} *</label>
                <input 
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
                />
              </div>

              {type === 'invoices' && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">{t.dueDate} *</label>
                  <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
                  />
                </div>
              )}

              {type === 'devis' && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">{t.validityDate} *</label>
                  <input 
                    type="date" 
                    value={validityDate}
                    onChange={(e) => setValidityDate(e.target.value)}
                    className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
                  />
                </div>
              )}

              {type === 'bons_livraison' && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">{t.deliveryDate} *</label>
                  <input 
                    type="date" 
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t.reference}</label>
                <input 
                  type="text" 
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder={`${getPrefix(type)}-2026-000`}
                  className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
                />
              </div>
            </div>

            {/* Delivery Info for PO and Delivery Note */}
            {(type === 'bons_commande' || type === 'bons_livraison') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">{t.deliveryAddress} ({t.optional})</label>
                  <input 
                    type="text" 
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder={t.autoFilled}
                    className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700">{t.deliveryContact} ({t.optional})</label>
                  <input 
                    type="text" 
                    value={deliveryContact}
                    onChange={(e) => setDeliveryContact(e.target.value)}
                    placeholder={t.autoFilled}
                    className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
                  />
                </div>
              </div>
            )}

            {/* Items Section */}
            <div className="space-y-4">
              <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div>
                  <h3 className="font-bold text-gray-800">{t.items} ({items.length})</h3>
                  <p className="text-xs text-gray-400">{t.addItemsDesc}</p>
                </div>
                <button 
                  onClick={addItem}
                  className={`flex items-center px-4 py-2 border-2 border-dashed border-amber-200 text-amber-500 rounded-xl hover:bg-amber-50 transition-colors font-bold text-sm ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <Plus className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                  {t.addItem}
                </button>
              </div>


              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-4">
                    <div className="grid grid-cols-12 gap-4">
                      <div className="col-span-12 md:col-span-6 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.description}</label>
                        <input 
                          type="text" 
                          value={item.description}
                          onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                          className={`w-full p-2 bg-white border border-gray-100 rounded-lg focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
                        />
                      </div>
                      <div className="col-span-4 md:col-span-2 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.quantity}</label>
                        <input 
                          type="number" 
                          value={item.quantity}
                          onChange={(e) => updateItem(item.id, 'quantity', Number(e.target.value))}
                          className={`w-full p-2 bg-white border border-gray-100 rounded-lg focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
                        />
                      </div>
                      <div className="col-span-4 md:col-span-3 space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t.price}</label>
                        <input 
                          type="number" 
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', Number(e.target.value))}
                          className={`w-full p-2 bg-white border border-gray-100 rounded-lg focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
                        />
                      </div>
                      <div className="col-span-4 md:col-span-1 flex items-end justify-center pb-1">
                        <button 
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-300 hover:text-amber-500 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className={`flex flex-col items-end space-y-2 border-t border-gray-100 pt-6 ${isRtl ? 'items-start' : 'items-end'}`}>
              <div className={`flex justify-between w-full max-w-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-500">{t.subtotal}</span>
                <span className="font-bold">{subtotal.toFixed(2)} DH</span>
              </div>
              <div className={`flex justify-between w-full max-w-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-gray-500">{t.tax} (20%)</span>
                <span className="font-bold">{tax.toFixed(2)} DH</span>
              </div>
              <div className={`flex justify-between w-full max-w-xs pt-2 border-t border-gray-100 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-lg font-bold text-gray-800">{t.grandTotal}</span>
                <span className="text-lg font-bold text-amber-600">{total.toFixed(2)} DH</span>
              </div>
            </div>
          </div>
        </div>

        <footer className={`p-6 border-t border-gray-100 bg-gray-50 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div>
            {existingDoc?.id && (
              <button 
                onClick={handleDelete}
                disabled={saving}
                className="flex items-center px-4 py-2.5 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors font-bold text-sm"
              >
                <Trash2 className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
                {t.delete}
              </button>
            )}
          </div>
          <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button 
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              {t.cancel}
            </button>
            <button 
              onClick={handleSave}
              disabled={saving}
              className={`flex items-center px-8 py-2.5 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all disabled:opacity-50 ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <Save className={`w-4 h-4 ${isRtl ? 'ml-2' : 'mr-2'}`} />
              <span>{saving ? 'Enregistrement...' : t.save}</span>
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
