
export type Language = 'ar' | 'fr';

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  ice?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  number: string;
  clientId: string;
  clientIce?: string;
  date: string;
  dueDate?: string;
  validityDate?: string;
  deliveryDate?: string;
  deliveryAddress?: string;
  deliveryContact?: string;
  items: InvoiceItem[];
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  taxRate: number;
  discount: number;
  total: number;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  taxRate: number;
  unit: string;
  type: 'product' | 'service';
  status: 'active' | 'archived';
  description?: string;
  uid: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  uid: string;
}

export type View = 'dashboard' | 'clients' | 'invoices' | 'devis' | 'bons_commande' | 'bons_livraison' | 'reçus' | 'tasks' | 'notes' | 'credit_notes' | 'catalog' | 'settings' | 'users';
