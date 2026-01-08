"""Service d'envoi d'emails"""
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SITE_URL, ADMIN_EMAIL

logger = logging.getLogger(__name__)

def send_email(to_email: str, subject: str, html_content: str):
    """Envoie un email via SMTP"""
    if not SMTP_PASSWORD:
        logger.warning("SMTP_PASSWORD not configured, email not sent")
        return False
    
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f"World Auto France <{SMTP_USER}>"
        msg['To'] = to_email
        
        html_part = MIMEText(html_content, 'html', 'utf-8')
        msg.attach(html_part)
        
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_USER, to_email, msg.as_string())
        
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False

def send_welcome_email(user_email: str, user_name: str):
    """Envoie un email de bienvenue"""
    subject = "🎉 Bienvenue sur World Auto France !"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; font-size: 28px; }}
            .content {{ padding: 40px; }}
            .content h2 {{ color: #1f2937; margin-top: 0; }}
            .content p {{ color: #6b7280; line-height: 1.6; }}
            .btn {{ display: inline-block; background: #f97316; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }}
            .features {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .feature {{ display: flex; align-items: center; margin: 10px 0; }}
            .feature-icon {{ font-size: 20px; margin-right: 12px; }}
            .footer {{ background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; font-size: 14px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🚗 World Auto France</h1>
            </div>
            <div class="content">
                <h2>Bienvenue {user_name} ! 🎉</h2>
                <p>Merci de rejoindre la communauté World Auto France, la marketplace de référence pour les pièces auto d'occasion en France.</p>
                
                <div class="features">
                    <div class="feature"><span class="feature-icon">✅</span> Publiez vos annonces facilement</div>
                    <div class="feature"><span class="feature-icon">🔒</span> Transactions sécurisées</div>
                    <div class="feature"><span class="feature-icon">📦</span> Livraison facilitée</div>
                    <div class="feature"><span class="feature-icon">💬</span> Messagerie intégrée</div>
                </div>
                
                <a href="{SITE_URL}/deposer" class="btn">Déposer ma première annonce</a>
                
                <p>Une question ? N'hésitez pas à nous contacter à {ADMIN_EMAIL}</p>
            </div>
            <div class="footer">
                <p>© 2024 World Auto France - Tous droits réservés</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(user_email, subject, html)

def send_password_reset_email(user_email: str, reset_token: str):
    """Envoie un email de réinitialisation de mot de passe"""
    reset_link = f"{SITE_URL}/reset-password?token={reset_token}"
    subject = "🔐 Réinitialisation de votre mot de passe"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; }}
            .content {{ padding: 40px; }}
            .btn {{ display: inline-block; background: #f97316; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; }}
            .footer {{ background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Réinitialisation</h1>
            </div>
            <div class="content">
                <h2>Réinitialisation de mot de passe</h2>
                <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en créer un nouveau :</p>
                <p style="text-align: center;">
                    <a href="{reset_link}" class="btn">Réinitialiser mon mot de passe</a>
                </p>
                <p><small>Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</small></p>
            </div>
            <div class="footer">
                <p>© 2024 World Auto France</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(user_email, subject, html)

def send_order_confirmation_email(buyer_email: str, order_data: dict):
    """Envoie un email de confirmation de commande"""
    subject = f"✅ Commande confirmée #{order_data.get('id', '')[:8]}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; }}
            .content {{ padding: 40px; }}
            .order-details {{ background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .btn {{ display: inline-block; background: #f97316; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; }}
            .footer {{ background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Commande confirmée</h1>
            </div>
            <div class="content">
                <h2>Merci pour votre commande !</h2>
                <div class="order-details">
                    <p><strong>N° Commande :</strong> {order_data.get('id', '')[:8].upper()}</p>
                    <p><strong>Article :</strong> {order_data.get('listing_title', 'N/A')}</p>
                    <p><strong>Total :</strong> {order_data.get('total', 0):.2f} €</p>
                </div>
                <p>Le vendeur a été notifié et préparera votre commande dans les plus brefs délais.</p>
                <p style="text-align: center;">
                    <a href="{SITE_URL}/commandes" class="btn">Suivre ma commande</a>
                </p>
            </div>
            <div class="footer">
                <p>© 2024 World Auto France</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(buyer_email, subject, html)

def send_new_message_notification(recipient_email: str, sender_name: str, listing_title: str):
    """Notifie d'un nouveau message"""
    subject = f"💬 Nouveau message de {sender_name}"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; }}
            .content {{ padding: 40px; }}
            .btn {{ display: inline-block; background: #f97316; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; }}
            .footer {{ background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>💬 Nouveau message</h1>
            </div>
            <div class="content">
                <h2>Vous avez un nouveau message !</h2>
                <p><strong>{sender_name}</strong> vous a envoyé un message concernant :</p>
                <p style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-style: italic;">"{listing_title}"</p>
                <p style="text-align: center;">
                    <a href="{SITE_URL}/messages" class="btn">Voir mes messages</a>
                </p>
            </div>
            <div class="footer">
                <p>© 2024 World Auto France</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(recipient_email, subject, html)

def send_listing_sold_notification(seller_email: str, listing_title: str, buyer_name: str, amount: float):
    """Notifie le vendeur d'une vente"""
    subject = f"🎉 Votre article a été vendu !"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; }}
            .content {{ padding: 40px; }}
            .sale-details {{ background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }}
            .btn {{ display: inline-block; background: #f97316; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; }}
            .footer {{ background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Félicitations !</h1>
            </div>
            <div class="content">
                <h2>Votre article a été vendu !</h2>
                <div class="sale-details">
                    <p><strong>Article :</strong> {listing_title}</p>
                    <p><strong>Acheteur :</strong> {buyer_name}</p>
                    <p><strong>Montant :</strong> {amount:.2f} €</p>
                </div>
                <p>Préparez l'article pour l'expédition et ajoutez le numéro de suivi dans votre tableau de bord.</p>
                <p style="text-align: center;">
                    <a href="{SITE_URL}/commandes" class="btn">Gérer mes commandes</a>
                </p>
            </div>
            <div class="footer">
                <p>© 2024 World Auto France</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(seller_email, subject, html)

def send_shipping_update_email(buyer_email: str, order_id: str, tracking_number: str, carrier: str):
    """Notifie l'acheteur de l'expédition"""
    subject = f"📦 Votre commande a été expédiée !"
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; }}
            .header {{ background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px; text-align: center; }}
            .header h1 {{ color: white; margin: 0; }}
            .content {{ padding: 40px; }}
            .tracking {{ background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .btn {{ display: inline-block; background: #f97316; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; }}
            .footer {{ background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📦 Colis expédié</h1>
            </div>
            <div class="content">
                <h2>Votre commande est en route !</h2>
                <div class="tracking">
                    <p><strong>Transporteur :</strong> {carrier}</p>
                    <p><strong>N° de suivi :</strong> {tracking_number}</p>
                </div>
                <p style="text-align: center;">
                    <a href="{SITE_URL}/commandes" class="btn">Suivre ma commande</a>
                </p>
            </div>
            <div class="footer">
                <p>© 2024 World Auto France</p>
            </div>
        </div>
    </body>
    </html>
    """
    return send_email(buyer_email, subject, html)
