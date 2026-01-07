import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateInvoicePDF = (order, seller, buyer) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Colors
  const primaryColor = [30, 58, 95]; // #1E3A5F
  const accentColor = [249, 115, 22]; // #F97316
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('World Auto France', pageWidth - 20, 15, { align: 'right' });
  doc.text('Marketplace Pièces Auto', pageWidth - 20, 22, { align: 'right' });
  doc.text('contact@worldautofrance.com', pageWidth - 20, 29, { align: 'right' });
  
  // Invoice info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  const invoiceNumber = `WA-${order.id?.substring(0, 8).toUpperCase() || 'XXXX'}`;
  const invoiceDate = new Date(order.created_at).toLocaleDateString('fr-FR');
  
  doc.text(`Facture N° : ${invoiceNumber}`, 20, 55);
  doc.text(`Date : ${invoiceDate}`, 20, 62);
  doc.text(`Commande : ${order.id?.substring(0, 8) || 'N/A'}`, 20, 69);
  
  // Seller info
  doc.setFillColor(245, 245, 245);
  doc.rect(20, 80, 80, 40, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('VENDEUR', 25, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(seller?.name || 'Vendeur', 25, 96);
  if (seller?.company_name) {
    doc.text(seller.company_name, 25, 103);
  }
  if (seller?.siret) {
    doc.text(`SIRET: ${seller.siret}`, 25, 110);
  }
  doc.text(seller?.email || '', 25, 117);
  
  // Buyer info
  doc.rect(110, 80, 80, 40, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('ACHETEUR', 115, 88);
  doc.setFont('helvetica', 'normal');
  doc.text(buyer?.name || order.shipping_name || 'Acheteur', 115, 96);
  doc.text(order.shipping_address || '', 115, 103);
  doc.text(`${order.shipping_postal_code || ''} ${order.shipping_city || ''}`, 115, 110);
  doc.text(buyer?.email || '', 115, 117);
  
  // Items table
  const tableData = [[
    order.listing_title || 'Article',
    '1',
    `${(order.item_price || 0).toFixed(2)} €`,
    `${(order.item_price || 0).toFixed(2)} €`
  ]];
  
  doc.autoTable({
    startY: 130,
    head: [['Description', 'Qté', 'Prix unitaire', 'Total']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 10,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 90 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'right' },
      3: { cellWidth: 35, halign: 'right' }
    }
  });
  
  // Totals
  const finalY = doc.lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.text('Sous-total HT :', 130, finalY);
  doc.text(`${(order.item_price || 0).toFixed(2)} €`, 180, finalY, { align: 'right' });
  
  doc.text('Frais de port :', 130, finalY + 7);
  doc.text(`${(order.shipping_cost || 0).toFixed(2)} €`, 180, finalY + 7, { align: 'right' });
  
  if (order.service_fee) {
    doc.text('Frais de service :', 130, finalY + 14);
    doc.text(`${order.service_fee.toFixed(2)} €`, 180, finalY + 14, { align: 'right' });
  }
  
  doc.setDrawColor(...accentColor);
  doc.setLineWidth(0.5);
  doc.line(130, finalY + 20, 190, finalY + 20);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...accentColor);
  doc.text('TOTAL TTC :', 130, finalY + 28);
  doc.text(`${(order.total_price || 0).toFixed(2)} €`, 180, finalY + 28, { align: 'right' });
  
  // Payment status
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const statusText = order.status === 'delivered' ? 'PAYÉE' : 
                     order.status === 'shipped' ? 'EN COURS' : 
                     order.status === 'pending' ? 'EN ATTENTE' : order.status?.toUpperCase();
  
  doc.setFillColor(order.status === 'delivered' ? 34 : 249, order.status === 'delivered' ? 197 : 115, order.status === 'delivered' ? 94 : 22);
  doc.roundedRect(20, finalY + 20, 40, 10, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(statusText || 'N/A', 40, finalY + 27, { align: 'center' });
  
  // Footer
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(8);
  doc.text('World Auto France - Marketplace de pièces automobiles', pageWidth / 2, 280, { align: 'center' });
  doc.text('Cette facture est générée automatiquement et fait foi de transaction.', pageWidth / 2, 285, { align: 'center' });
  
  // Save
  const fileName = `facture_${invoiceNumber}_${invoiceDate.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
  
  return fileName;
};

export const generateSalesReportPDF = (orders, seller, period) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  const primaryColor = [30, 58, 95];
  
  // Header
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('RAPPORT DE VENTES', 20, 25);
  
  doc.setFontSize(10);
  doc.text(`Période : ${period || 'Toutes les ventes'}`, pageWidth - 20, 25, { align: 'right' });
  
  // Seller info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.text(`Vendeur : ${seller?.name || 'N/A'}`, 20, 55);
  if (seller?.company_name) {
    doc.text(`Entreprise : ${seller.company_name}`, 20, 62);
  }
  doc.text(`Généré le : ${new Date().toLocaleDateString('fr-FR')}`, 20, 69);
  
  // Summary
  const totalSales = orders.reduce((sum, o) => sum + (o.item_price || 0), 0);
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;
  
  doc.setFillColor(245, 245, 245);
  doc.rect(20, 80, pageWidth - 40, 25, 'F');
  
  doc.setFontSize(10);
  doc.text(`Total commandes : ${totalOrders}`, 30, 90);
  doc.text(`Commandes livrées : ${deliveredOrders}`, 80, 90);
  doc.setFont('helvetica', 'bold');
  doc.text(`Chiffre d'affaires : ${totalSales.toFixed(2)} €`, 140, 90);
  
  // Orders table
  const tableData = orders.map(order => [
    new Date(order.created_at).toLocaleDateString('fr-FR'),
    order.listing_title?.substring(0, 30) || 'Article',
    order.shipping_name || 'Acheteur',
    `${(order.item_price || 0).toFixed(2)} €`,
    order.status === 'delivered' ? 'Livré' : 
    order.status === 'shipped' ? 'Expédié' : 
    order.status === 'pending' ? 'En attente' : order.status
  ]);
  
  doc.autoTable({
    startY: 115,
    head: [['Date', 'Article', 'Acheteur', 'Montant', 'Statut']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255]
    },
    styles: {
      fontSize: 9,
      cellPadding: 4
    }
  });
  
  // Footer
  doc.setTextColor(128, 128, 128);
  doc.setFontSize(8);
  doc.text('World Auto France - Rapport généré automatiquement', pageWidth / 2, 285, { align: 'center' });
  
  const fileName = `rapport_ventes_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  return fileName;
};
