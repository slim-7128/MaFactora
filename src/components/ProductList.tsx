
import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit2, 
  Trash2, 
  Archive,
  Filter,
  Tag,
  Box,
  Zap
} from 'lucide-react';
import { Language, Product } from '../types';
import { translations } from '../translations';
import { db, auth, collection, query, where, onSnapshot, deleteDoc, doc, updateDoc } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';
import { ProductForm } from './ProductForm';

interface ProductListProps {
  lang: Language;
}

export const ProductList: React.FC<ProductListProps> = ({ lang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'product' | 'service' | 'active' | 'archived'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>(undefined);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, 'products'), where('uid', '==', auth.currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      setProducts(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm(t.deleteTaskConfirm)) {
      try {
        await deleteDoc(doc(db, 'products', id));
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const toggleArchive = async (product: Product) => {
    try {
      await updateDoc(doc(db, 'products', product.id), {
        status: product.status === 'active' ? 'archived' : 'active'
      });
    } catch (error) {
      console.error('Error archiving product:', error);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'product' || filter === 'service') return matchesSearch && p.type === filter;
    if (filter === 'active' || filter === 'archived') return matchesSearch && p.status === filter;
    return matchesSearch;
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto pb-24 lg:pb-6">
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div className={isRtl ? 'text-right' : 'text-left'}>
          <h1 className="text-3xl font-bold text-gray-800">{t.catalog}</h1>
          <p className="text-gray-500 mt-1">{t.catalogSubtitle}</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(undefined);
            setShowForm(true);
          }}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all"
        >
          <Plus className="w-5 h-5" />
          {t.newItem}
        </button>
      </header>

      {/* Search and Filters */}
      <div className="space-y-4 mb-8">
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

        <div className={`flex flex-wrap gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
          {[
            { id: 'all', label: t.all },
            { id: 'product', label: t.products },
            { id: 'service', label: t.services },
            { id: 'active', label: t.active },
            { id: 'archived', label: t.archived }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                filter === tab.id 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-100' 
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 text-gray-400">{t.loading}</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-gray-200">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">{t.noItemsFound}</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={product.id}
              className={`bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group relative ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  product.type === 'service' ? 'bg-blue-50 text-blue-500' : 'bg-gray-50 text-gray-500'
                }`}>
                  {product.type === 'service' ? <Zap className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                </div>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <h3 className="font-bold text-gray-800 text-lg">{product.name}</h3>
                  <div className={`flex items-center gap-2 mt-1 text-sm text-gray-500 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <span className="font-bold text-gray-700">{formatPrice(product.price)} MAD</span>
                    <span className="text-gray-300">•</span>
                    <span>TVA {product.taxRate}%</span>
                    <span className="text-gray-300">•</span>
                    <span className="uppercase">{product.unit}</span>
                    {product.status === 'archived' && (
                      <>
                        <span className="text-gray-300">•</span>
                        <span className="text-amber-500 font-bold text-[10px] uppercase tracking-wider">{t.archived}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative">
                <button 
                  onClick={() => setActiveMenu(activeMenu === product.id ? null : product.id)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                <AnimatePresence>
                  {activeMenu === product.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setActiveMenu(null)}
                      />
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        className={`absolute z-20 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 top-full mt-2 ${isRtl ? 'left-0' : 'right-0'}`}
                      >
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setShowForm(true);
                            setActiveMenu(null);
                          }}
                          className={`w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                        >
                          <Edit2 className="w-4 h-4" />
                          {t.edit}
                        </button>
                        <button
                          onClick={() => {
                            toggleArchive(product);
                            setActiveMenu(null);
                          }}
                          className={`w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                        >
                          <Archive className="w-4 h-4" />
                          {product.status === 'active' ? t.archive : t.unarchive}
                        </button>
                        <div className="h-px bg-gray-100 my-1 mx-2" />
                        <button
                          onClick={() => {
                            handleDelete(product.id);
                            setActiveMenu(null);
                          }}
                          className={`w-full px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 flex items-center gap-3 ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                          {t.delete}
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ))
        )}
      </div>


      <AnimatePresence>
        {showForm && (
          <ProductForm
            lang={lang}
            onClose={() => setShowForm(false)}
            product={editingProduct}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
