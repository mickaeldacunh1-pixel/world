"""Service de modération de contenu"""
import re
import logging
from typing import Tuple, List

logger = logging.getLogger(__name__)

# Liste de mots interdits (insultes, spam, etc.)
FORBIDDEN_WORDS = [
    # Insultes françaises
    "connard", "connasse", "enculé", "enculer", "salaud", "salope",
    "pute", "putain", "merde", "bordel", "nique", "niquer", "batard",
    "fdp", "ntm", "tg", "ta gueule", "ferme ta gueule",
    # Spam et arnaques
    "arnaque", "arnaquer", "escroc", "escroquerie",
    "bitcoin", "crypto", "investissement garanti", "gains faciles",
    "cliquez ici", "click here", "whatsapp", "telegram",
    # Contact externe (pour éviter contournement)
    "06", "07", "contactez-moi sur", "envoyez moi",
]

# Patterns suspects
SUSPICIOUS_PATTERNS = [
    r'\b06\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}\b',  # Numéros de téléphone
    r'\b07\s*\d{2}\s*\d{2}\s*\d{2}\s*\d{2}\b',
    r'\+33\s*\d',  # Numéros internationaux
    r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}',  # Emails
    r'https?://(?!worldautofrance)',  # Liens externes (sauf site officiel)
    r'wa\.me',  # WhatsApp
    r't\.me',   # Telegram
]

# Prix suspects (trop bas ou trop hauts)
PRICE_LIMITS = {
    "pieces": {"min": 1, "max": 50000},
    "voitures": {"min": 100, "max": 500000},
    "motos": {"min": 50, "max": 100000},
    "utilitaires": {"min": 500, "max": 300000},
    "engins": {"min": 500, "max": 500000},
    "accessoires": {"min": 1, "max": 10000},
}

def check_forbidden_words(text: str) -> Tuple[bool, List[str]]:
    """Vérifie la présence de mots interdits"""
    text_lower = text.lower()
    found_words = []
    
    for word in FORBIDDEN_WORDS:
        if word.lower() in text_lower:
            found_words.append(word)
    
    return len(found_words) == 0, found_words

def check_suspicious_patterns(text: str) -> Tuple[bool, List[str]]:
    """Vérifie la présence de patterns suspects"""
    found_patterns = []
    
    for pattern in SUSPICIOUS_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            found_patterns.append(pattern)
    
    return len(found_patterns) == 0, found_patterns

def check_price_validity(price: float, category: str) -> Tuple[bool, str]:
    """Vérifie si le prix est dans une fourchette raisonnable"""
    limits = PRICE_LIMITS.get(category, {"min": 1, "max": 100000})
    
    if price < limits["min"]:
        return False, f"Prix trop bas pour cette catégorie (minimum {limits['min']}€)"
    
    if price > limits["max"]:
        return False, f"Prix trop élevé pour cette catégorie (maximum {limits['max']}€)"
    
    return True, ""

def moderate_listing(title: str, description: str, price: float, category: str) -> Tuple[bool, str, str]:
    """
    Modère une annonce complète.
    
    Returns:
        Tuple[bool, str, str]: (is_approved, status, reason)
        - is_approved: True si l'annonce peut être publiée
        - status: 'approved', 'pending_review', 'rejected'
        - reason: Message explicatif
    """
    combined_text = f"{title} {description}"
    
    # Vérification des mots interdits
    words_ok, forbidden = check_forbidden_words(combined_text)
    if not words_ok:
        logger.warning(f"Annonce rejetée - mots interdits: {forbidden}")
        return False, "rejected", f"Contenu inapproprié détecté: {', '.join(forbidden[:3])}"
    
    # Vérification des patterns suspects
    patterns_ok, suspicious = check_suspicious_patterns(combined_text)
    if not patterns_ok:
        logger.warning(f"Annonce en attente - patterns suspects détectés")
        return False, "pending_review", "Votre annonce nécessite une vérification manuelle"
    
    # Vérification du prix
    price_ok, price_msg = check_price_validity(price, category)
    if not price_ok:
        return False, "rejected", price_msg
    
    # Vérifications supplémentaires
    if len(title) < 5:
        return False, "rejected", "Le titre est trop court (minimum 5 caractères)"
    
    if len(title) > 150:
        return False, "rejected", "Le titre est trop long (maximum 150 caractères)"
    
    if len(description) < 20:
        return False, "rejected", "La description est trop courte (minimum 20 caractères)"
    
    # Détection de spam (répétition excessive)
    words = combined_text.lower().split()
    if len(words) > 10:
        unique_ratio = len(set(words)) / len(words)
        if unique_ratio < 0.3:
            return False, "pending_review", "Contenu répétitif détecté, vérification en cours"
    
    return True, "approved", ""

def moderate_message(content: str) -> Tuple[bool, str]:
    """
    Modère un message.
    
    Returns:
        Tuple[bool, str]: (is_ok, reason)
    """
    # Vérification des mots interdits
    words_ok, forbidden = check_forbidden_words(content)
    if not words_ok:
        return False, "Message contenant du contenu inapproprié"
    
    # Vérification des patterns suspects (moins strict pour les messages)
    if re.search(r'https?://(?!worldautofrance)', content, re.IGNORECASE):
        return False, "Les liens externes ne sont pas autorisés dans les messages"
    
    return True, ""

def moderate_review(content: str, rating: int) -> Tuple[bool, str]:
    """
    Modère un avis.
    
    Returns:
        Tuple[bool, str]: (is_ok, reason)
    """
    if rating < 1 or rating > 5:
        return False, "Note invalide (1-5)"
    
    if content:
        words_ok, forbidden = check_forbidden_words(content)
        if not words_ok:
            return False, "Avis contenant du contenu inapproprié"
    
    return True, ""

def sanitize_text(text: str) -> str:
    """Nettoie un texte des caractères dangereux"""
    if not text:
        return ""
    
    # Supprimer les balises HTML
    text = re.sub(r'<[^>]+>', '', text)
    
    # Supprimer les caractères de contrôle
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', '', text)
    
    # Normaliser les espaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    return text
