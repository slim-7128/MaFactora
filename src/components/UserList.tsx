
import React, { useState, useEffect } from 'react';
import { Plus, Search, MoreHorizontal, Pencil, Trash2, X, User as UserIcon, Shield, ShieldCheck } from 'lucide-react';
import { Language, User } from '../types';
import { translations } from '../translations';
import { db, auth, collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from '../firebase';

interface UserListProps {
  lang: Language;
}

export const UserList: React.FC<UserListProps> = ({ lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'user'>('user');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;
    const q = query(collection(db, 'platform_users'), where('uid', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      const userData = {
        name,
        email,
        role,
        status,
        uid: auth.currentUser.uid,
        createdAt: editingUser?.createdAt || new Date().toISOString()
      };

      if (editingUser) {
        await updateDoc(doc(db, 'platform_users', editingUser.id), userData);
      } else {
        await addDoc(collection(db, 'platform_users'), userData);
      }
      resetForm();
    } catch (error) {
      console.error("Error saving user:", error);
      alert(t.save_error);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('user');
    setStatus('active');
    setEditingUser(null);
    setShowForm(false);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setName(user.name);
    setEmail(user.email);
    setRole(user.role);
    setStatus(user.status);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.deleteUserConfirm)) {
      try {
        await deleteDoc(doc(db, 'platform_users', id));
      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <header className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h2 className="text-2xl font-bold text-gray-800">{t.users}</h2>
          <p className="text-gray-500">{t.manageUsers}</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className={`flex items-center justify-center px-6 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <Plus className={`w-5 h-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          <span>{t.newUser}</span>
        </button>
      </header>

      <div className="mb-6 relative group">
        <Search className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-amber-500 transition-colors ${isRtl ? 'right-4' : 'left-4'}`} />
        <input
          type="text"
          placeholder={t.search}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full py-4 rounded-2xl border border-gray-100 bg-white shadow-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'}`}
        />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-50">
          {loading ? (
            <div className="p-12 text-center text-gray-400">{t.loading}</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-12 text-center text-gray-400">{t.noUsers}</div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className={`p-5 flex items-center justify-between hover:bg-gray-50 transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <div className={isRtl ? 'text-right' : 'text-left'}>
                    <p className="font-bold text-gray-800">{user.name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                
                <div className={`flex items-center gap-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                    {user.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    {user.role === 'admin' ? t.admin : t.user}
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${user.status === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                    {user.status === 'active' ? t.active : t.archived}
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleEdit(user)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button onClick={() => handleDelete(user.id)} className="p-2 text-gray-400 hover:text-amber-500 transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
            <header className={`p-6 border-b border-gray-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
              <h2 className="text-xl font-bold text-gray-800">{editingUser ? t.edit : t.addUser}</h2>
              <button onClick={resetForm} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </header>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className={`block text-sm font-bold text-gray-700 ${isRtl ? 'text-right' : ''}`}>{t.fullName}</label>
                <input
                  required
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`}
                />
              </div>
              <div className="space-y-1">
                <label className={`block text-sm font-bold text-gray-700 ${isRtl ? 'text-right' : ''}`}>{t.email}</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={`block text-sm font-bold text-gray-700 ${isRtl ? 'text-right' : ''}`}>{t.role}</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
                    className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`}
                  >
                    <option value="user">{t.user}</option>
                    <option value="admin">{t.admin}</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className={`block text-sm font-bold text-gray-700 ${isRtl ? 'text-right' : ''}`}>{t.status}</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'inactive')}
                    className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`}
                  >
                    <option value="active">{t.active}</option>
                    <option value="inactive">{t.archived}</option>
                  </select>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all disabled:opacity-50"
                >
                  {saving ? t.saving : t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
