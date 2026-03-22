import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, Language, View } from '../types';
import { translations } from '../translations';
import { formatDate } from './dateUtils';

const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
};

export const generateInvoicePDF = (invoice: Invoice, lang: Language, type: View = 'invoices', branding?: any) => {
  const t = translations[lang];
  const doc = new jsPDF();
  const isRtl = lang === 'ar';
  const primaryColor: [number, number, number] = branding?.color ? hexToRgb(branding.color) : [239, 68, 68];

  // Add Logo/Header
  doc.setFontSize(22);
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(t.appName, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Facturation Professionnelle', 14, 28);

  // Document Info
  const docTitle = type === 'invoices' ? t.factures : 
                  type === 'devis' ? t.devis : 
                  type === 'bons_commande' ? t.bons_commande : 
                  type === 'bons_livraison' ? t.bons_livraison : 
                  type === 'reçus' ? t.reçus : t.credit_notes;

  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`${docTitle} #: ${invoice.number}`, 14, 45);
  doc.text(`${t.date}: ${formatDate(invoice.date)}`, 14, 52);
  doc.text(`${t.status}: ${invoice.status.toUpperCase()}`, 14, 59);

  // Client Info
  doc.setFontSize(14);
  doc.text('Client:', 14, 75);
  doc.setFontSize(12);
  doc.text(invoice.clientId, 14, 82);
  if (invoice.clientIce) {
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`ICE: ${invoice.clientIce}`, 14, 88);
    doc.setTextColor(0);
  }

  // Table
  const tableData = invoice.items.map((item, index) => [
    index + 1,
    item.description,
    item.quantity,
    `${item.unitPrice.toFixed(2)} DH`,
    `${(item.quantity * item.unitPrice).toFixed(2)} DH`
  ]);

  autoTable(doc, {
    startY: 95,
    head: [[ '#', t.description, t.quantity, t.price, t.total]],
    body: tableData,
    headStyles: { fillColor: primaryColor },
    alternateRowStyles: { fillColor: [250, 250, 250] },
    margin: { top: 95 },
  });

  // Totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  const total = invoice.items.reduce((acc, item) => acc + (item.quantity * item.unitPrice), 0);
  const subtotal = total / (1 + (invoice.taxRate / 100));
  const tax = total - subtotal;

  doc.setFontSize(10);
  doc.text(`${t.subtotal}: ${subtotal.toFixed(2)} DH`, 140, finalY);
  doc.text(`${t.tax} (${invoice.taxRate}%): ${tax.toFixed(2)} DH`, 140, finalY + 7);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`${t.grandTotal}: ${total.toFixed(2)} DH`, 140, finalY + 15);

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150);
  doc.text(`Généré par ${t.appName} - Votre partenaire de gestion`, 105, 285, { align: 'center' });

  doc.save(`${type}-${invoice.number}.pdf`);
};
