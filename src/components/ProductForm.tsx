
import React, { useState, useEffect } from 'react';
import { X, Save, Package, Tag, Info } from 'lucide-react';
import { Language, Product } from '../types';
import { translations } from '../translations';
import { db, auth, collection, addDoc, updateDoc, doc } from '../firebase';
import { motion, AnimatePresence } from 'motion/react';

interface ProductFormProps {
  lang: Language;
  onClose: () => void;
  product?: Product;
}

export const ProductForm: React.FC<ProductFormProps> = ({ lang, onClose, product }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';

  const [formData, setFormData] = useState({
    name: product?.name || '',
    type: product?.type || 'product',
    price: product?.price || 0,
    taxRate: product?.taxRate || 20,
    unit: product?.unit || 'U',
    description: product?.description || '',
    status: product?.status || 'active'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    try {
      if (product) {
        await updateDoc(doc(db, 'products', product.id), {
          ...formData,
          updatedAt: new Date().toISOString()
        });
      } else {
        await addDoc(collection(db, 'products'), {
          ...formData,
          uid: auth.currentUser.uid,
          createdAt: new Date().toISOString()
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-amber-200">
              <Package className="w-6 h-6" />
            </div>
            <div className={isRtl ? 'text-right' : 'text-left'}>
              <h2 className="text-xl font-bold text-gray-800">
                {product ? t.newItem : t.newItem}
              </h2>
              <p className="text-xs text-gray-500">{t.catalogSubtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <label className={`block text-sm font-bold text-gray-700 ${isRtl ? 'text-right' : ''}`}>
                {t.title}
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none ${isRtl ? 'text-right' : ''}`}
                placeholder={t.productNamePlaceholder}
              />
            </div>

            {/* Type Toggle */}
            <div className="flex p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'product' })}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'product' ? 'bg-white text-amber-500 shadow-sm' : 'text-gray-500'}`}
              >
                {t.products}
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, type: 'service' })}
                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${formData.type === 'service' ? 'bg-white text-amber-500 shadow-sm' : 'text-gray-500'}`}
              >
                {t.services}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Price */}
              <div className="space-y-2">
                <label className={`block text-sm font-bold text-gray-700 ${isRtl ? 'text-right' : ''}`}>
                  {t.price} (MAD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none ${isRtl ? 'text-right' : ''}`}
                />
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <label className={`block text-sm font-bold text-gray-700 ${isRtl ? 'text-right' : ''}`}>
                  {t.unit}
                </label>
                <input
                  type="text"
                  required
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none ${isRtl ? 'text-right' : ''}`}
                  placeholder="U, Kg, m, etc."
                />
              </div>
            </div>

            {/* Tax Rate */}
            <div className="space-y-2">
              <label className={`block text-sm font-bold text-gray-700 ${isRtl ? 'text-right' : ''}`}>
                {t.taxRate} (%)
              </label>
              <select
                value={formData.taxRate}
                onChange={(e) => setFormData({ ...formData, taxRate: parseInt(e.target.value) })}
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none ${isRtl ? 'text-right' : ''}`}
              >
                <option value={20}>20%</option>
                <option value={14}>14%</option>
                <option value={10}>10%</option>
                <option value={7}>7%</option>
                <option value={0}>0%</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className={`block text-sm font-bold text-gray-700 ${isRtl ? 'text-right' : ''}`}>
                {t.description} ({t.optional})
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all outline-none min-h-[100px] resize-none ${isRtl ? 'text-right' : ''}`}
                placeholder={t.descriptionPlaceholder}
              />
            </div>
          </div>


          <div className={`flex gap-3 pt-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-xl border border-gray-200 font-bold text-gray-600 hover:bg-gray-50 transition-all"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-xl bg-amber-500 text-white font-bold hover:bg-amber-600 shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {t.save}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
