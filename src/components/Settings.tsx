
import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Building2, 
  ShieldCheck, 
  Landmark, 
  Save,
  ChevronDown,
  MapPin,
  Phone,
  Mail,
  Hash,
  Coins,
  FileText,
  Palette,
  Package,
  Upload,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { Language } from '../types';
import { translations } from '../translations';
import { motion } from 'motion/react';
import { db, auth, doc, getDoc, setDoc } from '../firebase';

interface SettingsProps {
  lang: Language;
  setLang: (lang: Language) => void;
}

type SettingsTab = 'general' | 'company' | 'legal' | 'bank' | 'documents' | 'branding' | 'stock';

interface CompanySettings {
  commercialName: string;
  legalName: string;
  address: string;
  city: string;
  phone: string;
  email: string;
}

interface LegalSettings {
  ice: string;
  if: string;
  rc: string;
  professionalTax: string;
  socialCapital: string;
}

interface BankSettings {
  bankName: string;
  rib: string;
  defaultTerms: string;
}

interface DocumentSettings {
  amountInWords: boolean;
  showStamp: boolean;
  showPricesOnDN: boolean;
  footerMentions: string;
  prefixes: {
    invoice: string;
    devis: string;
    receipt: string;
    po: string;
    dn: string;
    creditNote: string;
  };
}

interface BrandingSettings {
  logo: string | null;
  stamp: string | null;
  color: string;
}

interface StockSettings {
  allowNegative: boolean;
  decrementOn: 'invoice' | 'dn';
  reserveOnPO: boolean;
  movementPrefix: string;
}

export const Settings: React.FC<SettingsProps> = ({ lang, setLang }) => {
  const t = translations[lang];
  const isRtl = lang === 'ar';
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [saving, setSaving] = useState(false);
  
  const [company, setCompany] = useState<CompanySettings>({
    commercialName: '',
    legalName: '',
    address: '',
    city: '',
    phone: '',
    email: ''
  });

  const [legal, setLegal] = useState<LegalSettings>({
    ice: '',
    if: '',
    rc: '',
    professionalTax: '',
    socialCapital: ''
  });

  const [bank, setBank] = useState<BankSettings>({
    bankName: '',
    rib: '',
    defaultTerms: ''
  });

  const [docs, setDocs] = useState<DocumentSettings>({
    amountInWords: true,
    showStamp: true,
    showPricesOnDN: true,
    footerMentions: t.defaultFooterMentions,
    prefixes: {
      invoice: 'FAC',
      devis: 'DEV',
      receipt: 'REC',
      po: 'BC',
      dn: 'BL',
      creditNote: 'AV'
    }
  });

  const [branding, setBranding] = useState<BrandingSettings>({
    logo: null,
    stamp: null,
    color: '#f59e0b'
  });

  const [stock, setStock] = useState<StockSettings>({
    allowNegative: false,
    decrementOn: 'dn',
    reserveOnPO: false,
    movementPrefix: 'MVT'
  });

  useEffect(() => {
    const loadSettings = async () => {
      if (!auth.currentUser) return;
      try {
        const docRef = doc(db, 'settings', auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.company) setCompany(data.company);
          if (data.legal) setLegal(data.legal);
          if (data.bank) setBank(data.bank);
          if (data.docs) setDocs(data.docs);
          if (data.branding) setBranding(data.branding);
          if (data.stock) setStock(data.stock);
        } else {
          // Set default footer mentions if no settings exist
          setDocs(prev => ({ ...prev, footerMentions: t.defaultFooterMentions }));
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      }
    };
    loadSettings();
  }, [t.defaultFooterMentions]);

  const handleSave = async () => {
    if (!auth.currentUser) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', auth.currentUser.uid), {
        company,
        legal,
        bank,
        docs,
        branding,
        stock,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert(t.settings_saved);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert(t.save_error);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: t.general, icon: Globe },
    { id: 'company', label: t.company, icon: Building2 },
    { id: 'legal', label: t.legal, icon: ShieldCheck },
    { id: 'bank', label: t.bank, icon: Landmark },
    { id: 'documents', label: t.documents, icon: FileText },
    { id: 'branding', label: t.branding, icon: Palette },
    { id: 'stock', label: t.stock, icon: Package },
  ];

  const InputField = ({ label, value, onChange, icon: Icon, required = false, placeholder = '' }: any) => (
    <div className="mb-6">
      <label className={`block text-sm font-bold text-gray-700 mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
        {label} {required && <span className="text-amber-500">*</span>}
      </label>
      <div className={`relative flex items-center ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} text-gray-400`}>
          <Icon className="w-5 h-5" />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full bg-gray-50/50 border border-gray-100 rounded-2xl py-4 ${isRtl ? 'pr-12 pl-4 text-right' : 'pl-12 pr-4 text-left'} outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-gray-700`}
        />
      </div>
    </div>
  );

  const ToggleField = ({ label, value, onChange, description }: any) => (
    <div className={`flex items-center justify-between p-4 rounded-2xl border border-gray-100 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
      <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
        <p className="font-bold text-gray-800">{label}</p>
        {description && <p className="text-xs text-gray-400 mt-1">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
          value ? 'bg-amber-500' : 'bg-gray-200'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? (isRtl ? '-translate-x-6' : 'translate-x-6') : (isRtl ? '-translate-x-1' : 'translate-x-1')
          }`}
        />
      </button>
    </div>
  );

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <header className={`flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
        <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
          <h2 className="text-2xl font-bold text-gray-800">{t.settings}</h2>
          <p className="text-gray-500">{t.settings_subtitle}</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center justify-center px-6 py-3 bg-amber-400/80 text-white rounded-xl font-bold shadow-lg shadow-amber-100 hover:bg-amber-500 transition-all disabled:opacity-50 ${isRtl ? 'flex-row-reverse' : ''}`}
        >
          <Save className={`w-5 h-5 ${isRtl ? 'ml-2' : 'mr-2'}`} />
          <span>{saving ? t.saving : t.save}</span>
        </button>
      </header>


      {/* Tabs */}
      <div className={`flex border-b border-gray-100 mb-8 overflow-x-auto no-scrollbar ${isRtl ? 'flex-row-reverse' : ''}`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as SettingsTab)}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-amber-500 text-amber-500' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            } ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8"
      >
        {activeTab === 'general' && (
          <div className="space-y-8">
            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-6">{t.general}</h3>
              
              <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-50 bg-gray-50/30 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
                <div>
                  <p className="font-bold text-gray-800">{t.interface_language}</p>
                  <p className="text-sm text-gray-400">{t.choose_interface_language}</p>
                </div>
                
                <div className="relative min-w-[200px]">
                  <select
                    value={lang}
                    onChange={(e) => setLang(e.target.value as Language)}
                    className={`w-full appearance-none bg-white border border-gray-200 rounded-xl px-4 py-3 pr-10 font-medium text-gray-700 outline-none focus:ring-2 focus:ring-amber-500 transition-all ${isRtl ? 'text-right pr-4 pl-10' : 'text-left'}`}
                  >
                    <option value="fr">Français</option>
                    <option value="ar">العربية</option>
                  </select>
                  <ChevronDown className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none ${isRtl ? 'left-3' : 'right-3'}`} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'company' && (
          <div className="space-y-6">
            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-6">{t.company_info}</h3>
              
              <div className="grid grid-cols-1 gap-2">
                <InputField 
                  label={t.commercial_name} 
                  value={company.commercialName} 
                  onChange={(v: string) => setCompany({...company, commercialName: v})}
                  icon={Building2}
                  required
                  placeholder={t.commercialNamePlaceholder}
                />
                <InputField 
                  label={t.legal_name} 
                  value={company.legalName} 
                  onChange={(v: string) => setCompany({...company, legalName: v})}
                  icon={Building2}
                  placeholder={t.legalNamePlaceholder}
                />
                <InputField 
                  label={t.address} 
                  value={company.address} 
                  onChange={(v: string) => setCompany({...company, address: v})}
                  icon={MapPin}
                  required
                  placeholder={t.addressPlaceholder}
                />
                <InputField 
                  label={t.city} 
                  value={company.city} 
                  onChange={(v: string) => setCompany({...company, city: v})}
                  icon={MapPin}
                  placeholder={t.cityPlaceholder}
                />
                <InputField 
                  label={t.phone} 
                  value={company.phone} 
                  onChange={(v: string) => setCompany({...company, phone: v})}
                  icon={Phone}
                  placeholder={t.phonePlaceholder}
                />
                <InputField 
                  label={t.email} 
                  value={company.email} 
                  onChange={(v: string) => setCompany({...company, email: v})}
                  icon={Mail}
                  placeholder={t.emailPlaceholder}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'legal' && (
          <div className="space-y-6">
            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-6">{t.legal_info}</h3>
              
              <div className="grid grid-cols-1 gap-2">
                <InputField 
                  label={t.ice} 
                  value={legal.ice} 
                  onChange={(v: string) => setLegal({...legal, ice: v})}
                  icon={Hash}
                  required
                  placeholder={t.icePlaceholder}
                />
                <InputField 
                  label={t.if} 
                  value={legal.if} 
                  onChange={(v: string) => setLegal({...legal, if: v})}
                  icon={Hash}
                  required
                  placeholder={t.ifPlaceholder}
                />
                <InputField 
                  label={t.rc} 
                  value={legal.rc} 
                  onChange={(v: string) => setLegal({...legal, rc: v})}
                  icon={Hash}
                  placeholder={t.rcPlaceholder}
                />
                <InputField 
                  label={t.professional_tax} 
                  value={legal.professionalTax} 
                  onChange={(v: string) => setLegal({...legal, professionalTax: v})}
                  icon={Hash}
                  placeholder={t.professionalTaxPlaceholder}
                />
                <InputField 
                  label={t.social_capital} 
                  value={legal.socialCapital} 
                  onChange={(v: string) => setLegal({...legal, socialCapital: v})}
                  icon={Coins}
                  placeholder={t.socialCapitalPlaceholder}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bank' && (
          <div className="space-y-6">
            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-6">{t.bank_and_payment}</h3>
              
              <InputField 
                label={t.bank_name} 
                value={bank.bankName} 
                onChange={(v: string) => setBank({...bank, bankName: v})}
                icon={Landmark}
                placeholder={t.bankNamePlaceholder}
              />
              <InputField 
                label={t.rib} 
                value={bank.rib} 
                onChange={(v: string) => setBank({...bank, rib: v})}
                icon={Hash}
                placeholder={t.ribPlaceholder}
              />
              <InputField 
                label={t.default_payment_terms} 
                value={bank.defaultTerms} 
                onChange={(v: string) => setBank({...bank, defaultTerms: v})}
                icon={Clock}
                placeholder={t.paymentTermsPlaceholder}
              />
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-6">{t.document_settings}</h3>
              
              <ToggleField 
                label={t.amount_in_words} 
                value={docs.amountInWords} 
                onChange={(v: boolean) => setDocs({...docs, amountInWords: v})}
              />
              <ToggleField 
                label={t.show_stamp_on_pdf} 
                value={docs.showStamp} 
                onChange={(v: boolean) => setDocs({...docs, showStamp: v})}
              />
              <ToggleField 
                label={t.show_prices_on_dn} 
                value={docs.showPricesOnDN} 
                onChange={(v: boolean) => setDocs({...docs, showPricesOnDN: v})}
              />

              <div className="mb-6">
                <label className={`block text-sm font-bold text-gray-700 mb-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                  {t.footer_legal_mentions}
                </label>
                <textarea
                  value={docs.footerMentions}
                  onChange={(e) => setDocs({...docs, footerMentions: e.target.value})}
                  rows={3}
                  className={`w-full bg-gray-50/50 border border-gray-100 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-medium text-gray-700 ${isRtl ? 'text-right' : 'text-left'}`}
                />
              </div>

              <h4 className="text-md font-bold text-gray-800 mb-4">{t.numbering_prefixes}</h4>
              <div className="grid grid-cols-2 gap-4">
                <InputField 
                  label={t.prefix_invoice} 
                  value={docs.prefixes.invoice} 
                  onChange={(v: string) => setDocs({...docs, prefixes: {...docs.prefixes, invoice: v}})}
                  icon={Hash}
                />
                <InputField 
                  label={t.prefix_devis} 
                  value={docs.prefixes.devis} 
                  onChange={(v: string) => setDocs({...docs, prefixes: {...docs.prefixes, devis: v}})}
                  icon={Hash}
                />
                <InputField 
                  label={t.prefix_receipt} 
                  value={docs.prefixes.receipt} 
                  onChange={(v: string) => setDocs({...docs, prefixes: {...docs.prefixes, receipt: v}})}
                  icon={Hash}
                />
                <InputField 
                  label={t.prefix_po} 
                  value={docs.prefixes.po} 
                  onChange={(v: string) => setDocs({...docs, prefixes: {...docs.prefixes, po: v}})}
                  icon={Hash}
                />
                <InputField 
                  label={t.prefix_dn} 
                  value={docs.prefixes.dn} 
                  onChange={(v: string) => setDocs({...docs, prefixes: {...docs.prefixes, dn: v}})}
                  icon={Hash}
                />
                <InputField 
                  label={t.prefix_credit_note} 
                  value={docs.prefixes.creditNote} 
                  onChange={(v: string) => setDocs({...docs, prefixes: {...docs.prefixes, creditNote: v}})}
                  icon={Hash}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'branding' && (
          <div className="space-y-6">
            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-6">{t.brand_image}</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Upload */}
                <div className="p-6 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center hover:border-amber-200 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-amber-50 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-amber-500" />
                  </div>
                  <p className="font-bold text-gray-800 mb-1">{t.logo}</p>
                  <p className="text-xs text-gray-400 mb-4">{t.noFileSelected}</p>
                  <div className="flex items-center gap-2 text-emerald-500 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{t.logo_uploaded}</span>
                  </div>
                </div>

                {/* Stamp Upload */}
                <div className="p-6 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-center hover:border-amber-200 transition-colors cursor-pointer group">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-amber-50 transition-colors">
                    <Upload className="w-6 h-6 text-gray-400 group-hover:text-amber-500" />
                  </div>
                  <p className="font-bold text-gray-800 mb-1">{t.stamp}</p>
                  <p className="text-xs text-gray-400">{t.noFileSelected}</p>
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-800 mb-2">{t.document_color}</h3>
                <p className="text-sm text-gray-400 mb-6">{t.document_color_desc}</p>
                
                <div className="flex flex-wrap gap-3 mb-6">
                  {[
                    '#ef4444', // Red
                    '#3b82f6', // Blue
                    '#10b981', // Emerald
                    '#f59e0b', // Amber
                    '#6366f1', // Indigo
                    '#8b5cf6', // Violet
                    '#ec4899', // Pink
                    '#1f2937', // Gray-800
                    '#000000', // Black
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => setBranding({...branding, color: c})}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        branding.color === c ? 'border-gray-800 scale-110 shadow-md' : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className={`flex items-center gap-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="relative">
                    <input 
                      type="color" 
                      value={branding.color}
                      onChange={(e) => setBranding({...branding, color: e.target.value})}
                      className="w-12 h-12 rounded-xl border-none cursor-pointer opacity-0 absolute inset-0"
                    />
                    <div 
                      className="w-12 h-12 rounded-xl border border-gray-100 shadow-sm"
                      style={{ backgroundColor: branding.color }}
                    />
                  </div>
                  <span className="font-mono text-gray-600 uppercase font-bold">{branding.color}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'stock' && (
          <div className="space-y-6">
            <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
              <h3 className="text-lg font-bold text-gray-800 mb-2">{t.stock_settings}</h3>
              <p className="text-sm text-gray-400 mb-8">{t.stock_module_config}</p>
              
              <ToggleField 
                label={t.allow_negative_stock} 
                value={stock.allowNegative} 
                onChange={(v: boolean) => setStock({...stock, allowNegative: v})}
              />

              <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-gray-100 mb-4 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
                  <p className="font-bold text-gray-800">{t.decrement_stock_on}</p>
                  <p className="text-xs text-gray-400 mt-1">{t.decrement_stock_desc}</p>
                </div>
                
                <div className="relative min-w-[200px]">
                  <select
                    value={stock.decrementOn}
                    onChange={(e) => setStock({...stock, decrementOn: e.target.value as any})}
                    className={`w-full appearance-none bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 pr-10 font-medium text-gray-700 outline-none focus:ring-2 focus:ring-amber-500 transition-all ${isRtl ? 'text-right pr-4 pl-10' : 'text-left'}`}
                  >
                    <option value="dn">{t.delivery_note}</option>
                    <option value="invoice">{t.invoice}</option>
                  </select>
                  <ChevronDown className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none ${isRtl ? 'left-3' : 'right-3'}`} />
                </div>
              </div>

              <ToggleField 
                label={t.reserve_stock_on_po} 
                value={stock.reserveOnPO} 
                onChange={(v: boolean) => setStock({...stock, reserveOnPO: v})}
              />

              <InputField 
                label={t.movement_prefix} 
                value={stock.movementPrefix} 
                onChange={(v: string) => setStock({...stock, movementPrefix: v})}
                icon={Hash}
              />
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
