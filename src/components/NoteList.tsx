import React, { useState, useEffect } from 'react';
import { Plus, Search, FileText, Trash2, X, Calendar } from 'lucide-react';
import { db, auth } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from 'firebase/firestore';
import { Language } from '../types';
import { translations } from '../translations';
import { motion, AnimatePresence } from 'framer-motion';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: any;
  uid: string;
}

interface NoteListProps {
  lang: Language;
}

export function NoteList({ lang }: NoteListProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newNote, setNewNote] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(true);

  const t = translations[lang];

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'notes'),
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Note[];
      setNotes(notesData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !newNote.title.trim()) return;

    try {
      await addDoc(collection(db, 'notes'), {
        ...newNote,
        uid: auth.currentUser.uid,
        createdAt: serverTimestamp()
      });
      setNewNote({ title: '', content: '' });
      setShowForm(false);
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t.confirmDelete || 'Supprimer cette note ?')) return;
    try {
      await deleteDoc(doc(db, 'notes', id));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800">{t.notes}</h1>
          <p className="text-gray-500">{t.notesSubtitle}</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-2xl font-bold hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
        >
          <Plus className="w-5 h-5" />
          <span>{t.newNote}</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder={t.search}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-amber-500 transition-all"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : filteredNotes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={note.id}
              className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group relative"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-amber-50 rounded-2xl text-amber-500">
                  <FileText className="w-6 h-6" />
                </div>
                <button
                  onClick={() => handleDelete(note.id)}
                  className="p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{note.title}</h3>
              <p className="text-gray-600 text-sm line-clamp-4 mb-4 whitespace-pre-wrap">
                {note.content}
              </p>
              {note.createdAt && (
                <div className="flex items-center gap-2 text-xs text-gray-400 mt-auto pt-4 border-t border-gray-50">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{new Date(note.createdAt.toDate()).toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'ar-SA')}</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">{searchTerm ? t.noResults : t.noNotes || 'Aucune note'}</h3>
          <p className="text-gray-500 mt-1">{searchTerm ? t.tryAnotherSearch : t.createFirstNote || 'Commencez par créer votre première note'}</p>
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2rem] w-full max-w-lg overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="text-center w-full relative">
                  <h2 className="text-2xl font-bold text-gray-800">{t.newNote}</h2>
                  <p className="text-gray-500 text-sm">{t.createNote}</p>
                  <button
                    onClick={() => setShowForm(false)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleSave} className="p-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t.title} *
                    </label>
                    <input
                      type="text"
                      required
                      value={newNote.title}
                      onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-amber-500 focus:bg-white focus:ring-0 transition-all text-lg"
                      placeholder={t.title}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {t.content}
                    </label>
                    <textarea
                      value={newNote.content}
                      onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                      rows={6}
                      className="w-full px-5 py-4 bg-gray-50 border-2 border-transparent rounded-2xl focus:border-amber-500 focus:bg-white focus:ring-0 transition-all resize-none"
                      placeholder={t.content}
                    />
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    type="submit"
                    className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold text-lg hover:bg-amber-600 transition-all shadow-lg shadow-amber-100"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
