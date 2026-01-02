from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
import qrcode
from io import BytesIO
from datetime import datetime
import os

class BordereauGenerator:
    """Générateur de bordereaux d'expédition et de retour pour World Auto"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self._setup_custom_styles()
    
    def _setup_custom_styles(self):
        """Configure les styles personnalisés"""
        self.styles.add(ParagraphStyle(
            name='Title_Custom',
            parent=self.styles['Title'],
            fontSize=20,
            textColor=colors.HexColor('#0F172A'),
            spaceAfter=20,
            alignment=TA_CENTER
        ))
        self.styles.add(ParagraphStyle(
            name='Subtitle',
            parent=self.styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#64748B'),
            alignment=TA_CENTER,
            spaceAfter=30
        ))
        self.styles.add(ParagraphStyle(
            name='SectionTitle',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#F97316'),
            spaceBefore=20,
            spaceAfter=10
        ))
        self.styles.add(ParagraphStyle(
            name='Info',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#334155'),
            spaceAfter=5
        ))
        self.styles.add(ParagraphStyle(
            name='Important',
            parent=self.styles['Normal'],
            fontSize=11,
            textColor=colors.HexColor('#DC2626'),
            spaceBefore=10,
            spaceAfter=10,
            alignment=TA_CENTER
        ))

    def _generate_qr_code(self, data: str) -> BytesIO:
        """Génère un QR code"""
        qr = qrcode.QRCode(version=1, box_size=10, border=2)
        qr.add_data(data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#0F172A", back_color="white")
        buffer = BytesIO()
        img.save(buffer, format='PNG')
        buffer.seek(0)
        return buffer

    def generate_shipping_slip(
        self,
        order_id: str,
        listing_title: str,
        listing_id: str,
        price: float,
        seller_name: str,
        seller_address: str,
        seller_city: str,
        seller_postal: str,
        seller_phone: str,
        buyer_name: str,
        buyer_address: str,
        buyer_city: str,
        buyer_postal: str,
        buyer_phone: str,
        oem_reference: str = None,
        weight: str = None,
        notes: str = None
    ) -> BytesIO:
        """Génère un bordereau d'expédition PDF"""
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=1.5*cm,
            bottomMargin=1.5*cm
        )
        
        story = []
        
        # En-tête
        story.append(Paragraph("WORLD AUTO", self.styles['Title_Custom']))
        story.append(Paragraph("BORDEREAU D'EXPÉDITION", self.styles['Subtitle']))
        
        # Numéro de commande et date
        date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
        header_data = [
            [f"N° Bordereau: WA-{order_id[:8].upper()}", f"Date: {date_str}"]
        ]
        header_table = Table(header_data, colWidths=[9*cm, 9*cm])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F1F5F9')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#0F172A')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 20))
        
        # Adresses (Expéditeur / Destinataire)
        story.append(Paragraph("ADRESSES", self.styles['SectionTitle']))
        
        address_data = [
            ["EXPÉDITEUR (Vendeur)", "DESTINATAIRE (Acheteur)"],
            [
                f"{seller_name}\n{seller_address}\n{seller_postal} {seller_city}\nTél: {seller_phone or 'Non renseigné'}",
                f"{buyer_name}\n{buyer_address}\n{buyer_postal} {buyer_city}\nTél: {buyer_phone or 'Non renseigné'}"
            ]
        ]
        address_table = Table(address_data, colWidths=[9*cm, 9*cm])
        address_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFFFFF')),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#334155')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 12),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('LINEBEFORE', (1, 0), (1, -1), 1, colors.HexColor('#E2E8F0')),
        ]))
        story.append(address_table)
        story.append(Spacer(1, 20))
        
        # Détails de l'article
        story.append(Paragraph("ARTICLE EXPÉDIÉ", self.styles['SectionTitle']))
        
        article_info = [
            ["Désignation", listing_title],
            ["Référence annonce", listing_id[:8].upper()],
            ["Prix", f"{price:.2f} €"],
        ]
        if oem_reference:
            article_info.append(["Réf. OEM", oem_reference])
        if weight:
            article_info.append(["Poids estimé", weight])
            
        article_table = Table(article_info, colWidths=[5*cm, 13*cm])
        article_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8FAFC')),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748B')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#0F172A')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('LINEBELOW', (0, 0), (-1, -2), 0.5, colors.HexColor('#E2E8F0')),
        ]))
        story.append(article_table)
        story.append(Spacer(1, 20))
        
        # QR Code et instructions
        qr_data = f"WORLDAUTO|{order_id}|{listing_id}"
        qr_buffer = self._generate_qr_code(qr_data)
        
        # Instructions d'emballage
        story.append(Paragraph("INSTRUCTIONS D'EMBALLAGE", self.styles['SectionTitle']))
        
        instructions = """
        <b>1.</b> Emballez soigneusement l'article dans un carton adapté<br/>
        <b>2.</b> Utilisez du papier bulle ou du calage pour les pièces fragiles<br/>
        <b>3.</b> Collez ce bordereau sur le colis (visible)<br/>
        <b>4.</b> Conservez une copie du bordereau<br/>
        <b>5.</b> Déposez le colis chez votre transporteur<br/>
        """
        story.append(Paragraph(instructions, self.styles['Info']))
        story.append(Spacer(1, 15))
        
        # Zone de découpe pour coller sur le colis
        story.append(Paragraph("✂ ─ ─ ─ ─ DÉCOUPER ICI ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ✂", self.styles['Important']))
        
        # Étiquette à coller
        label_data = [
            ["WORLD AUTO - ÉTIQUETTE COLIS"],
            [f"N° WA-{order_id[:8].upper()}"],
            [f"\nDESTINATAIRE:\n{buyer_name}\n{buyer_address}\n{buyer_postal} {buyer_city}\n"],
        ]
        label_table = Table(label_data, colWidths=[18*cm])
        label_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F97316')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#0F172A')),
            ('TEXTCOLOR', (0, 1), (-1, 1), colors.white),
            ('BACKGROUND', (0, 2), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 2), (-1, -1), colors.HexColor('#0F172A')),
            ('FONTNAME', (0, 0), (-1, 1), 'Helvetica-Bold'),
            ('FONTNAME', (0, 2), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('FONTSIZE', (0, 1), (-1, 1), 12),
            ('FONTSIZE', (0, 2), (-1, -1), 11),
            ('PADDING', (0, 0), (-1, -1), 15),
            ('ALIGN', (0, 0), (-1, 1), 'CENTER'),
            ('ALIGN', (0, 2), (-1, -1), 'LEFT'),
            ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#0F172A')),
        ]))
        story.append(label_table)
        
        # Footer
        story.append(Spacer(1, 30))
        footer_text = f"Document généré par World Auto le {date_str} - www.worldauto.fr"
        story.append(Paragraph(footer_text, ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#94A3B8'),
            alignment=TA_CENTER
        )))
        
        doc.build(story)
        buffer.seek(0)
        return buffer

    def generate_return_slip(
        self,
        return_id: str,
        order_id: str,
        listing_title: str,
        listing_id: str,
        reason: str,
        buyer_name: str,
        buyer_address: str,
        buyer_city: str,
        buyer_postal: str,
        buyer_phone: str,
        seller_name: str,
        seller_address: str,
        seller_city: str,
        seller_postal: str,
        seller_phone: str,
        notes: str = None
    ) -> BytesIO:
        """Génère un bordereau de retour PDF"""
        
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=1.5*cm,
            leftMargin=1.5*cm,
            topMargin=1.5*cm,
            bottomMargin=1.5*cm
        )
        
        story = []
        
        # En-tête
        story.append(Paragraph("WORLD AUTO", self.styles['Title_Custom']))
        story.append(Paragraph("BORDEREAU DE RETOUR", self.styles['Subtitle']))
        
        # Alerte retour
        story.append(Paragraph("⚠️ RETOUR MARCHANDISE", self.styles['Important']))
        
        # Numéros et date
        date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
        header_data = [
            [f"N° Retour: RET-{return_id[:8].upper()}", f"Commande: WA-{order_id[:8].upper()}", f"Date: {date_str}"]
        ]
        header_table = Table(header_data, colWidths=[6*cm, 6*cm, 6*cm])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF2F2')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#DC2626')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#FECACA')),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 20))
        
        # Motif du retour
        story.append(Paragraph("MOTIF DU RETOUR", self.styles['SectionTitle']))
        reason_table = Table([[reason]], colWidths=[18*cm])
        reason_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#FEF2F2')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#991B1B')),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('PADDING', (0, 0), (-1, -1), 15),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#FECACA')),
        ]))
        story.append(reason_table)
        story.append(Spacer(1, 20))
        
        # Adresses (inversées pour le retour)
        story.append(Paragraph("ADRESSES", self.styles['SectionTitle']))
        
        address_data = [
            ["EXPÉDITEUR (Acheteur)", "DESTINATAIRE (Vendeur)"],
            [
                f"{buyer_name}\n{buyer_address}\n{buyer_postal} {buyer_city}\nTél: {buyer_phone or 'Non renseigné'}",
                f"{seller_name}\n{seller_address}\n{seller_postal} {seller_city}\nTél: {seller_phone or 'Non renseigné'}"
            ]
        ]
        address_table = Table(address_data, colWidths=[9*cm, 9*cm])
        address_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#DC2626')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#FFFFFF')),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#334155')),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 12),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#FECACA')),
            ('LINEBEFORE', (1, 0), (1, -1), 1, colors.HexColor('#FECACA')),
        ]))
        story.append(address_table)
        story.append(Spacer(1, 20))
        
        # Article retourné
        story.append(Paragraph("ARTICLE RETOURNÉ", self.styles['SectionTitle']))
        article_info = [
            ["Désignation", listing_title],
            ["Référence annonce", listing_id[:8].upper()],
        ]
        article_table = Table(article_info, colWidths=[5*cm, 13*cm])
        article_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#F8FAFC')),
            ('TEXTCOLOR', (0, 0), (0, -1), colors.HexColor('#64748B')),
            ('TEXTCOLOR', (1, 0), (1, -1), colors.HexColor('#0F172A')),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('PADDING', (0, 0), (-1, -1), 10),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
        ]))
        story.append(article_table)
        story.append(Spacer(1, 20))
        
        # Instructions de retour
        story.append(Paragraph("INSTRUCTIONS DE RETOUR", self.styles['SectionTitle']))
        instructions = """
        <b>1.</b> Emballez l'article dans son emballage d'origine si possible<br/>
        <b>2.</b> Incluez tous les accessoires et documents reçus<br/>
        <b>3.</b> Collez ce bordereau sur le colis (visible)<br/>
        <b>4.</b> Conservez le reçu de dépôt du transporteur<br/>
        <b>5.</b> Le remboursement sera effectué après réception et vérification<br/>
        """
        story.append(Paragraph(instructions, self.styles['Info']))
        story.append(Spacer(1, 15))
        
        # Zone découpe
        story.append(Paragraph("✂ ─ ─ ─ ─ DÉCOUPER ICI ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ✂", self.styles['Important']))
        
        # Étiquette retour
        label_data = [
            ["⚠️ WORLD AUTO - RETOUR"],
            [f"N° RET-{return_id[:8].upper()}"],
            [f"\nRETOUR À:\n{seller_name}\n{seller_address}\n{seller_postal} {seller_city}\n"],
        ]
        label_table = Table(label_data, colWidths=[18*cm])
        label_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#DC2626')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#991B1B')),
            ('TEXTCOLOR', (0, 1), (-1, 1), colors.white),
            ('BACKGROUND', (0, 2), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 2), (-1, -1), colors.HexColor('#0F172A')),
            ('FONTNAME', (0, 0), (-1, 1), 'Helvetica-Bold'),
            ('FONTNAME', (0, 2), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, 0), 14),
            ('FONTSIZE', (0, 1), (-1, 1), 12),
            ('FONTSIZE', (0, 2), (-1, -1), 11),
            ('PADDING', (0, 0), (-1, -1), 15),
            ('ALIGN', (0, 0), (-1, 1), 'CENTER'),
            ('ALIGN', (0, 2), (-1, -1), 'LEFT'),
            ('BOX', (0, 0), (-1, -1), 2, colors.HexColor('#DC2626')),
        ]))
        story.append(label_table)
        
        # Footer
        story.append(Spacer(1, 30))
        footer_text = f"Document généré par World Auto le {date_str} - www.worldauto.fr"
        story.append(Paragraph(footer_text, ParagraphStyle(
            name='Footer',
            parent=self.styles['Normal'],
            fontSize=8,
            textColor=colors.HexColor('#94A3B8'),
            alignment=TA_CENTER
        )))
        
        doc.build(story)
        buffer.seek(0)
        return buffer
