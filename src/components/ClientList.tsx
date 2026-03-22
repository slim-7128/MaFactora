import React, { useState, useEffect } from 'react';
import { Plus, Search, Trash2, UserPlus, Mail, Phone, MapPin } from 'lucide-react';
import { Language, Client } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';
import { db, auth, collection, query, where, onSnapshot, addDoc, deleteDoc, doc } from '../firebase';

interface ClientListProps {
  lang: Language;
}

export const ClientList: React.FC<ClientListProps> = ({ lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', email: '', phone: '', address: '', ice: '' });
  const [filterName, setFilterName] = useState('');
  const [filterEmail, setFilterEmail] = useState('');
  const [filterPhone, setFilterPhone] = useState('');

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'clients'), where('uid', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setClients(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Client)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      await addDoc(collection(db, 'clients'), {
        ...newClient,
        uid: auth.currentUser.uid
      });
      setNewClient({ name: '', email: '', phone: '', address: '', ice: '' });
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding client:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.deleteClientConfirm)) {
      await deleteDoc(doc(db, 'clients', id));
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesName = client.name.toLowerCase().includes(filterName.toLowerCase());
    const matchesEmail = (client.email || '').toLowerCase().includes(filterEmail.toLowerCase());
    const matchesPhone = (client.phone || '').toLowerCase().includes(filterPhone.toLowerCase());
    return matchesName && matchesEmail && matchesPhone;
  });

  return (
    <div className="p-8">
      <header className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
          <h2 className="text-2xl font-bold text-gray-800">{t.clients}</h2>
          <p className="text-gray-500">{t.manageClients}</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className={`flex items-center px-6 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <UserPlus className={`w-5 h-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          <span>{t.newClient}</span>
        </button>
      </header>

      {/* Filters Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={t.fullName}
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className={`w-full py-2 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500/20 text-sm`}
            />
          </div>
          <div className="relative">
            <Mail className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={t.email}
              value={filterEmail}
              onChange={(e) => setFilterEmail(e.target.value)}
              className={`w-full py-2 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500/20 text-sm`}
            />
          </div>
          <div className="relative">
            <Phone className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 ${isRtl ? 'right-3' : 'left-3'}`} />
            <input
              type="text"
              placeholder={t.phone}
              value={filterPhone}
              onChange={(e) => setFilterPhone(e.target.value)}
              className={`w-full py-2 ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-amber-500/20 text-sm`}
            />
          </div>
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddClient} className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">
            <h3 className="text-xl font-bold mb-6">{t.addClient}</h3>
            <div className="space-y-4">
              <input 
                placeholder={t.fullName} 
                required
                value={newClient.name}
                onChange={e => setNewClient({...newClient, name: e.target.value})}
                className={`w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`}
              />
              <input 
                placeholder={t.email} 
                type="email"
                value={newClient.email}
                onChange={e => setNewClient({...newClient, email: e.target.value})}
                className={`w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`}
              />
              <input 
                placeholder={t.phone} 
                value={newClient.phone}
                onChange={e => setNewClient({...newClient, phone: e.target.value})}
                className={`w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`}
              />
              <input 
                placeholder={t.ice} 
                value={newClient.ice}
                onChange={e => setNewClient({...newClient, ice: e.target.value})}
                className={`w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`}
              />
              <textarea 
                placeholder={t.address} 
                value={newClient.address}
                onChange={e => setNewClient({...newClient, address: e.target.value})}
                className={`w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`}
              />
            </div>
            <div className={`flex gap-4 mt-8 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <button type="button" onClick={() => setShowAddForm(false)} className="flex-1 py-3 font-bold text-gray-500">{t.cancel}</button>
              <button type="submit" className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200">{t.save}</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-gray-400">{t.loading}</div>
        ) : filteredClients.map((client) => (
          <motion.div 
            key={client.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group"
          >
            <div className={`flex items-start justify-between mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 font-bold text-lg">
                {client.name.substring(0, 2).toUpperCase()}
              </div>
              <button onClick={() => handleDelete(client.id)} className="p-2 text-gray-300 hover:text-amber-500 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <h3 className={`font-bold text-gray-800 text-lg mb-4 ${isRtl ? 'text-right' : ''}`}>{client.name}</h3>
            <div className={`space-y-2 text-sm text-gray-500 ${isRtl ? 'text-right' : ''}`}>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Mail className="w-4 h-4" />
                <span>{client.email || (isRtl ? 'لا يوجد بريد إلكتروني' : 'Pas d\'email')}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Phone className="w-4 h-4" />
                <span>{client.phone || (isRtl ? 'لا يوجد هاتف' : 'Pas de téléphone')}</span>
              </div>
              <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <MapPin className="w-4 h-4" />
                <span className="truncate">{client.address || (isRtl ? 'لا يوجد عنوان' : 'Pas d\'adresse')}</span>
              </div>
              {client.ice && (
                <div className={`flex items-center gap-2 pt-2 border-t border-gray-50 mt-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.ice}:</span>
                  <span className="font-mono text-xs text-gray-700">{client.ice}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {!loading && filteredClients.length === 0 && (
          <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-gray-400">
            {clients.length === 0 ? t.noClients : (isRtl ? 'لم يتم العثور على عملاء يطابقون بحثك.' : 'Aucun client ne correspond à votre recherche.')}
          </div>
        )}
      </div>

    </div>
  );
};
