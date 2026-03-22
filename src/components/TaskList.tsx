
import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Clock, Trash2, Pencil } from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';
import { TaskForm } from './TaskForm';
import { db, auth, collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from '../firebase';
import { formatDate } from '../utils/dateUtils';

interface TaskListProps {
  lang: Language;
}

export const TaskList: React.FC<TaskListProps> = ({ lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<any | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'tasks'), where('uid', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      setTasks(data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleStatus = async (task: any) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), {
        status: task.status === 'open' ? 'closed' : 'open'
      });
    } catch (error) {
      console.error("Error toggling task status:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.deleteTaskConfirm)) {
      try {
        await deleteDoc(doc(db, 'tasks', id));
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-500 bg-red-50';
      case 'medium': return 'text-amber-500 bg-amber-50';
      case 'low': return 'text-emerald-500 bg-emerald-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <div className="p-8">
      {showForm && <TaskForm lang={lang} onClose={() => setShowForm(false)} />}
      {editingTask && <TaskForm lang={lang} task={editingTask} onClose={() => setEditingTask(null)} />}

      <header className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
          <h2 className="text-2xl font-bold text-gray-800">{t.tasks}</h2>
          <p className="text-gray-500">{tasks.filter(t => t.status === 'open').length} {t.openTasks}</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className={`flex items-center px-6 py-3 bg-amber-500 text-white rounded-xl font-bold shadow-lg shadow-amber-200 hover:bg-amber-600 transition-all ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <Plus className={`w-5 h-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          <span>{t.newTask}</span>
        </button>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t.noOpenTasks}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={task.id}
              className={`bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button 
                  onClick={() => toggleStatus(task)}
                  className={`transition-colors ${task.status === 'closed' ? 'text-emerald-500' : 'text-gray-300 hover:text-amber-500'}`}
                >
                  {task.status === 'closed' ? <CheckCircle2 className="w-6 h-6" /> : <Circle className="w-6 h-6" />}
                </button>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <h3 className={`font-bold ${task.status === 'closed' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                    {task.title}
                  </h3>
                  <div className={`flex items-center gap-3 mt-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                      {t[task.priority as keyof typeof t] || task.priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${isRtl ? 'flex-row-reverse' : ''}`}>
                <button 
                  onClick={() => setEditingTask(task)}
                  className="p-2 text-gray-400 hover:text-amber-500 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(task.id)}
                  className="p-2 text-gray-400 hover:text-amber-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
