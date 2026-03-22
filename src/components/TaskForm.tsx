
import React, { useState } from 'react';
import { Save, X } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { db, auth, collection, addDoc, updateDoc, doc } from '../firebase';

interface TaskFormProps {
  lang: Language;
  onClose: () => void;
  task?: any;
}

export const TaskForm: React.FC<TaskFormProps> = ({ lang, onClose, task: existingTask }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [title, setTitle] = useState(existingTask?.title || '');
  const [description, setDescription] = useState(existingTask?.description || '');
  const [priority, setPriority] = useState(existingTask?.priority || 'medium');
  const [dueDate, setDueDate] = useState(existingTask?.dueDate || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    if (!title) {
      alert(lang === 'ar' ? 'يرجى إدخال عنوان' : 'Veuillez entrer un titre');
      return;
    }

    setSaving(true);
    try {
      const taskData = {
        title,
        description,
        priority,
        dueDate,
        status: existingTask?.status || 'open',
        uid: auth.currentUser.uid,
        createdAt: existingTask?.createdAt || new Date().toISOString()
      };

      if (existingTask?.id) {
        await updateDoc(doc(db, 'tasks', existingTask.id), taskData);
      } else {
        await addDoc(collection(db, 'tasks'), taskData);
      }
      onClose();
    } catch (error) {
      console.error("Error saving task:", error);
      alert(lang === 'ar' ? 'خطأ أثناء الحفظ' : "Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <header className={`p-6 border-b border-gray-100 flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
          <div className={isRtl ? 'text-right' : 'text-left'}>
            <h2 className="text-xl font-bold text-gray-800">Nouvelle tâche</h2>
            <p className="text-xs text-gray-400">Créer une nouvelle tâche</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </header>

        <div className="p-6 space-y-6">
          <div className={`space-y-4 ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">{t.title} *</label>
              <input 
                type="text" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`w-full p-3 bg-gray-50 border border-amber-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">{t.description}</label>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t.priority}</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`}
                >
                  <option value="low">{t.low}</option>
                  <option value="medium">{t.medium}</option>
                  <option value="high">{t.high}</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t.dueDate}</label>
                <input 
                  type="date" 
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className={`w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-amber-500/20 ${isRtl ? 'text-right' : ''}`} 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : t.save}
          </button>
        </div>
      </div>
    </div>
  );
};
