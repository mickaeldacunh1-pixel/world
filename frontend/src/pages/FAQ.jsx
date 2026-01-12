import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { ChevronDown, HelpCircle, CreditCard, Package, MessageSquare, Shield, Truck, AlertTriangle, Video, Bell, Camera, FileText, TrendingUp, Search, Sparkles, Users, Star, Gift, Globe, Settings, Smartphone, Heart, Scale, Clock, Award, Zap } from 'lucide-react';
import { Input } from '../components/ui/input';
import SEO, { createFAQSchema } from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Default settings
const DEFAULTS = {
  faq_title: 'Foire Aux Questions',
  faq_subtitle: "Trouvez rapidement des réponses à vos questions. Si vous ne trouvez pas ce que vous cherchez, n'hésitez pas à nous contacter.",
  faq_search_enabled: true,
  faq_search_placeholder: 'Rechercher une question...',
  faq_categories_enabled: true,
  faq_contact_enabled: true,
  faq_contact_button: 'Nous contacter',
};

const faqs = [
  // ==================== INSCRIPTION & COMPTE ====================
  {
    category: "Inscription & Compte",
    icon: Users,
    questions: [
      {
        q: "Comment créer un compte sur World Auto Pro ?",
        a: "Cliquez sur \"Connexion\" puis \"Créer un compte\". Remplissez vos informations (nom, email, mot de passe). Pour les professionnels, cochez la case correspondante et entrez votre SIRET. La validation est instantanée !"
      },
      {
        q: "Quels pays sont autorisés pour créer un compte acheteur ?",
        a: "Les comptes acheteurs peuvent être créés depuis n'importe quel pays du monde. Vous pouvez parcourir les annonces, contacter les vendeurs et acheter des pièces où que vous soyez."
      },
      {
        q: "Quels pays sont autorisés pour vendre ?",
        a: "Pour créer des annonces et vendre sur World Auto Pro, vous devez être situé dans l'un des 9 pays suivants : 🇫🇷 France, 🇧🇪 Belgique, 🇨🇭 Suisse, 🇩🇪 Allemagne, 🇳🇱 Pays-Bas, 🇮🇹 Italie, 🇪🇸 Espagne, 🇵🇹 Portugal, 🇸🇪 Suède. Cette restriction garantit la qualité des transactions."
      },
      {
        q: "Pourquoi cette restriction géographique pour les vendeurs ?",
        a: "Cette restriction permet d'assurer : des délais de livraison raisonnables, une protection juridique claire dans l'UE, une réduction des risques de fraude, et un service client de qualité. Les acheteurs peuvent commander depuis le monde entier."
      },
      {
        q: "J'ai oublié mon mot de passe, comment le réinitialiser ?",
        a: "Sur la page de connexion, cliquez sur \"Mot de passe oublié\". Entrez votre email et vous recevrez un lien de réinitialisation valable 1 heure. Vérifiez vos spams si vous ne recevez rien."
      },
      {
        q: "Comment modifier mes informations personnelles ?",
        a: "Connectez-vous et accédez à votre Profil via l'icône en haut à droite. Vous pouvez modifier : nom, email, téléphone, adresse, photo de profil. Cliquez sur \"Enregistrer\" après vos modifications."
      },
      {
        q: "Comment supprimer mon compte ?",
        a: "Contactez-nous à contact@worldautofrance.com avec l'objet \"Suppression de compte\". Nous supprimerons votre compte et vos données sous 30 jours conformément au RGPD. Attention : les annonces actives seront supprimées."
      },
      {
        q: "Puis-je avoir plusieurs comptes ?",
        a: "Non, chaque personne ne peut avoir qu'un seul compte. Les comptes multiples sont interdits et peuvent entraîner une suspension. Si vous êtes un professionnel, utilisez plutôt un compte PRO avec plusieurs collaborateurs (fonctionnalité à venir)."
      }
    ]
  },

  // ==================== COMPTES PROFESSIONNELS ====================
  {
    category: "Comptes Professionnels",
    icon: Award,
    questions: [
      {
        q: "Quels sont les avantages d'un compte professionnel ?",
        a: "Les professionnels bénéficient de : ✅ 10 crédits offerts à l'inscription, ✅ 14 jours d'essai PRO gratuit, ✅ 50 photos par annonce (vs 6), ✅ Badge PRO vérifié, ✅ Statistiques avancées, ✅ Support VIP prioritaire, ✅ Visibilité accrue dans les recherches."
      },
      {
        q: "Comment créer un compte professionnel ?",
        a: "Lors de l'inscription, cochez \"Je suis un professionnel\" et entrez votre numéro SIRET (14 chiffres). Le SIRET est vérifié automatiquement via l'API officielle INSEE. Une fois validé, votre essai PRO démarre immédiatement avec 10 crédits offerts."
      },
      {
        q: "L'essai PRO de 14 jours est-il vraiment gratuit ?",
        a: "Oui, 100% gratuit ! Dès votre inscription en tant que professionnel vérifié, vous recevez automatiquement 10 crédits et accédez à TOUTES les fonctionnalités PRO pendant 14 jours. Aucune carte bancaire requise, aucun engagement, aucune reconduction automatique."
      },
      {
        q: "Que se passe-t-il après les 14 jours d'essai ?",
        a: "Après l'essai : 1) Vous conservez vos crédits restants, 2) Vous pouvez toujours publier des annonces, 3) Vous perdez les avantages PRO (50 photos → 6, pas de stats avancées). Pour conserver les avantages, souscrivez à un abonnement Pro à partir de 29€/mois."
      },
      {
        q: "Puis-je cumuler l'essai PRO avec le code LANCEMENT ?",
        a: "Oui ! C'est l'offre la plus avantageuse. Vous cumulez : 10 crédits (essai PRO) + 20 annonces gratuites (code LANCEMENT) + 50 points fidélité. Soit 30 annonces gratuites au total pour démarrer !"
      },
      {
        q: "Comment vérifier que mon SIRET est valide ?",
        a: "Votre SIRET est automatiquement vérifié lors de l'inscription via l'API officielle de l'INSEE. Si votre entreprise est active et le SIRET correct, la validation est instantanée. En cas d'erreur, vérifiez votre numéro sur societe.com ou contactez-nous."
      },
      {
        q: "Quels sont les tarifs des abonnements PRO ?",
        a: "Après l'essai gratuit : Pro Starter à 29€/mois (50 photos, badge PRO), Pro Business à 79€/mois (tout Starter + stats avancées, 100 crédits/mois), Pro Unlimited à 149€/mois (tout Business + crédits illimités, support VIP). Engagement mensuel, résiliable à tout moment."
      },
      {
        q: "Comment résilier mon abonnement PRO ?",
        a: "Dans votre Profil > Abonnement, cliquez sur \"Gérer l'abonnement\" puis \"Annuler\". L'abonnement reste actif jusqu'à la fin de la période payée, puis passe automatiquement en compte gratuit. Vos annonces restent actives."
      }
    ]
  },

  // ==================== OFFRE DE LANCEMENT ====================
  {
    category: "Offre de Lancement",
    icon: Gift,
    questions: [
      {
        q: "Qu'est-ce que l'offre de lancement ?",
        a: "Pour célébrer notre lancement, nous offrons les 1000 premières annonces gratuitement ! Chaque nouvel inscrit avec le code LANCEMENT reçoit jusqu'à 20 annonces gratuites + 50 points de fidélité. C'est notre façon de vous remercier d'être parmi les premiers utilisateurs."
      },
      {
        q: "Comment profiter des 20 annonces gratuites ?",
        a: "1) Créez votre compte sur World Auto Pro, 2) Le code LANCEMENT est appliqué automatiquement pour les nouveaux inscrits, 3) Vos 20 annonces gratuites sont créditées instantanément. Vérifiez votre solde dans votre tableau de bord !"
      },
      {
        q: "L'offre est-elle limitée dans le temps ?",
        a: "L'offre est limitée aux 1000 premières annonces gratuites distribuées au total (50 utilisateurs × 20 annonces). Une fois ce quota atteint, l'offre prendra fin. Ne tardez pas, les places partent vite !"
      },
      {
        q: "Mes annonces gratuites ont-elles une date d'expiration ?",
        a: "Non ! Une fois créditées sur votre compte, vos annonces gratuites n'expirent JAMAIS. Utilisez-les quand vous le souhaitez, même dans 1 an."
      },
      {
        q: "Puis-je cumuler les annonces gratuites avec des crédits achetés ?",
        a: "Oui ! Le système utilise automatiquement vos annonces gratuites en PRIORITÉ, puis vos crédits payants. Vous optimisez ainsi vos coûts."
      },
      {
        q: "Les 50 points de fidélité, à quoi servent-ils ?",
        a: "Les points de fidélité s'accumulent et peuvent être convertis en crédits d'annonces. 100 points = 1 crédit gratuit. Vous gagnez aussi des points en parrainant des amis, en laissant des avis, et en vendant."
      }
    ]
  },

  // ==================== ANNONCES ====================
  {
    category: "Annonces",
    icon: Package,
    questions: [
      {
        q: "Comment créer une annonce ?",
        a: "1) Connectez-vous à votre compte, 2) Cliquez sur \"Déposer une annonce\", 3) Choisissez la catégorie, 4) Remplissez le formulaire (titre, description, prix, photos), 5) Sélectionnez vos modes de livraison, 6) Publiez ! Vous devez avoir au moins 1 crédit ou annonce gratuite."
      },
      {
        q: "Combien coûte la publication d'une annonce ?",
        a: "1 crédit = 1 annonce. Les packs de crédits : Pack 5 (10€ = 2€/annonce), Pack 20 (25€ = 1,25€/annonce), Pack 50 (45€ = 0,90€/annonce), Pack 100 (69€ = 0,69€/annonce). Les professionnels reçoivent 10 crédits gratuits à l'inscription."
      },
      {
        q: "Combien de photos puis-je ajouter par annonce ?",
        a: "Particuliers : 6 photos (jusqu'à 25 avec le Pack 100). Professionnels : 50 photos par annonce. Conseil : ajoutez un maximum de photos sous différents angles pour augmenter vos chances de vente !"
      },
      {
        q: "Quels formats de photos sont acceptés ?",
        a: "Formats acceptés : JPG, JPEG, PNG, WebP. Taille max : 10 Mo par photo. Résolution recommandée : minimum 800x600 pixels. Les photos sont automatiquement optimisées pour le web."
      },
      {
        q: "Combien de temps reste visible mon annonce ?",
        a: "Votre annonce reste visible pendant 30 jours. À l'expiration, elle passe en \"Expirée\" et n'est plus visible dans les recherches. Vous pouvez la renouveler en utilisant 1 crédit."
      },
      {
        q: "Comment modifier ou supprimer mon annonce ?",
        a: "Tableau de bord > Mes annonces > Cliquez sur l'annonce > Boutons \"Modifier\" ou \"Supprimer\". La modification est gratuite et illimitée. La suppression est définitive."
      },
      {
        q: "Pourquoi mon annonce a été refusée ou supprimée ?",
        a: "Raisons possibles : contenu inapproprié, informations incomplètes, photos de mauvaise qualité, produit interdit, suspicion de fraude, prix irréaliste. Consultez vos emails ou contactez-nous pour plus de détails."
      },
      {
        q: "Comment booster la visibilité de mon annonce ?",
        a: "Plusieurs options : 1) Ajoutez une vidéo (+50% de vues), 2) Utilisez le Boost Vidéo pour apparaître en page d'accueil, 3) Publiez une Story, 4) Complétez au maximum votre annonce (photos, description détaillée), 5) Répondez rapidement aux messages."
      },
      {
        q: "Qu'est-ce que la catégorie \"Recherche\" ?",
        a: "La catégorie \"Recherche\" permet aux ACHETEURS de publier une annonce pour une pièce qu'ils recherchent. Décrivez la pièce, votre budget, et les vendeurs vous contacteront avec leurs offres. Idéal pour les pièces rares !"
      },
      {
        q: "Qu'est-ce que \"Rare & Collection\" ?",
        a: "Catégorie dédiée aux pièces vintage, de collection ou introuvables : voitures anciennes, pièces de prestige, éditions limitées, véhicules historiques. Les collectionneurs y trouvent des pièces exceptionnelles à prix premium."
      }
    ]
  },

  // ==================== LIVRAISON (COMPLET) ====================
  {
    category: "Livraison",
    icon: Truck,
    questions: [
      {
        q: "Comment fonctionne la livraison sur World Auto Pro ?",
        a: "La livraison est gérée directement par le vendeur, PAS par World Auto Pro. Lors de la création d'une annonce, le vendeur choisit ses modes de livraison acceptés. L'acheteur sélectionne ensuite son mode préféré lors de l'achat. La plateforme facilite la mise en relation mais n'expédie pas les colis."
      },
      {
        q: "Quels modes de livraison puis-je proposer en tant que vendeur ?",
        a: "6 options disponibles : 🤝 Remise en main propre, 📦 Colissimo (La Poste, 2-4j), 🏪 Mondial Relay (points relais, économique), ⚡ Chronopost (express 24h), 🚚 Boxtal (comparateur multi-transporteurs), 📋 Autre transporteur. Sélectionnez-en plusieurs pour plus de flexibilité !"
      },
      {
        q: "Qu'est-ce que Boxtal et comment ça marche ?",
        a: "Boxtal est un comparateur de transporteurs GRATUIT intégré à World Auto Pro. Il compare les tarifs de Colissimo, Mondial Relay, Chronopost, DPD, FedEx, etc. en temps réel. AUCUN abonnement requis : le vendeur paie uniquement à l'envoi. World Auto Pro ne prend aucune commission sur Boxtal."
      },
      {
        q: "Dois-je créer un compte Boxtal ?",
        a: "Oui, le vendeur doit créer son propre compte Boxtal (gratuit) sur boxtal.com pour générer ses étiquettes et expédier. World Auto Pro intègre le calculateur pour estimer les tarifs, mais l'expédition reste gérée par le vendeur via son compte Boxtal."
      },
      {
        q: "Comment utiliser le calculateur de frais de port ?",
        a: "Le calculateur apparaît sur chaque annonce proposant Boxtal. Cliquez sur \"Calculer les frais de livraison\", entrez le code postal de destination et le poids estimé. Vous verrez instantanément les tarifs de tous les transporteurs avec leurs délais."
      },
      {
        q: "Qui paie les frais de livraison ?",
        a: "Par défaut, l'acheteur paie les frais. Le vendeur peut : 1) Proposer la livraison gratuite (incluse dans le prix), 2) Offrir la livraison à partir d'un certain montant, 3) Négocier via la messagerie. Les frais sont clairement affichés AVANT l'achat."
      },
      {
        q: "Comment sont calculés les frais de port ?",
        a: "Les frais dépendent de : 1) Poids du colis, 2) Dimensions (L×l×h), 3) Distance (code postal départ → arrivée), 4) Transporteur choisi, 5) Type de livraison (domicile, relais, express). Une marge de service est incluse pour la plateforme."
      },
      {
        q: "Puis-je proposer uniquement la remise en main propre ?",
        a: "Oui ! Sélectionnez uniquement \"Remise en main propre\" lors de la création. L'acheteur devra se déplacer. Idéal pour les pièces volumineuses (moteurs, carrosserie) ou fragiles. Précisez votre ville dans l'annonce."
      },
      {
        q: "Comment générer une étiquette d'expédition ?",
        a: "Après une vente : 1) Allez dans Tableau de bord > Commandes, 2) Cliquez sur la commande, 3) Sélectionnez \"Générer étiquette\", 4) Choisissez le transporteur et entrez les dimensions, 5) Payez via votre compte Boxtal, 6) Téléchargez et imprimez l'étiquette PDF, 7) Collez-la et déposez le colis."
      },
      {
        q: "Comment suivre mon colis ?",
        a: "Dès l'expédition, vous recevez un email avec le numéro de suivi. Retrouvez-le aussi dans Mes commandes. Cliquez sur le numéro pour être redirigé vers le site du transporteur et suivre en temps réel."
      },
      {
        q: "Que faire si mon colis est perdu ou endommagé ?",
        a: "1) Contactez le transporteur avec votre numéro de suivi pour ouvrir une réclamation, 2) Prévenez le vendeur via la messagerie, 3) Si paiement sécurisé : N'ACCEPTEZ PAS la réception, 4) Contactez contact@worldautofrance.com avec photos et preuves. Nous vous accompagnerons."
      },
      {
        q: "Quels sont les délais de livraison ?",
        a: "Délais indicatifs France : 🏪 Mondial Relay : 3-5 jours, 📦 Colissimo : 2-4 jours, ⚡ Chronopost : 24h, 🚚 DPD : 2-3 jours. International Europe : 5-10 jours selon destination. Ces délais peuvent varier en période de forte activité."
      },
      {
        q: "Puis-je expédier à l'international ?",
        a: "Oui ! Grâce à Boxtal, expédiez dans toute l'Europe et au-delà : France, Belgique, Suisse, Allemagne, Espagne, Italie, Pays-Bas, Portugal, Royaume-Uni... Les tarifs internationaux sont calculés automatiquement. Attention aux restrictions douanières hors UE."
      },
      {
        q: "Comment bien emballer une pièce auto ?",
        a: "Conseils essentiels : 1) Nettoyez la pièce et videz les fluides (huile, liquide frein), 2) Protégez avec papier bulle/carton ondulé, 3) Utilisez un carton solide adapté au poids, 4) Comblez les vides avec papier froissé, 5) Fermez avec ruban adhésif solide, 6) Indiquez \"FRAGILE\" si nécessaire. Un bon emballage = moins de litiges !"
      }
    ]
  },

  // ==================== PAIEMENTS ====================
  {
    category: "Paiements",
    icon: CreditCard,
    questions: [
      {
        q: "Comment fonctionne le paiement sécurisé ?",
        a: "Notre système escrow protège acheteurs ET vendeurs : 1) L'acheteur clique sur \"Acheter maintenant\", 2) L'argent est bloqué sur un compte sécurisé Stripe, 3) Le vendeur expédie, 4) L'acheteur confirme la réception, 5) Le vendeur est payé. En cas de problème, nous intervenons."
      },
      {
        q: "Quelle est la commission de World Auto Pro ?",
        a: "Commission de 5% sur chaque vente via paiement sécurisé. Minimum : 1,50€. Maximum : 15€ (plafonné). Exemples : vente 20€ → 1,50€ ; vente 100€ → 5€ ; vente 500€ → 15€. La commission est prélevée uniquement sur le vendeur."
      },
      {
        q: "Comment un vendeur peut-il recevoir des paiements ?",
        a: "1) Allez dans Profil > Paiements, 2) Cliquez sur \"Connecter Stripe\", 3) Créez ou connectez votre compte Stripe (gratuit), 4) Complétez la vérification d'identité. Une fois connecté, le bouton \"Acheter maintenant\" apparaît sur vos annonces."
      },
      {
        q: "Combien de temps pour recevoir mon argent ?",
        a: "Après confirmation de réception par l'acheteur : 2-3 jours ouvrés pour le virement sur votre compte bancaire via Stripe. Les week-ends et jours fériés peuvent allonger ce délai."
      },
      {
        q: "Que se passe-t-il si l'article n'est pas conforme ?",
        a: "Avec paiement sécurisé : NE CONFIRMEZ PAS la réception et signalez le problème via Mes commandes. L'argent reste bloqué pendant la médiation. Si le retour est justifié, remboursement intégral garanti."
      },
      {
        q: "Puis-je payer directement le vendeur ?",
        a: "Oui, les transactions directes restent possibles via la messagerie (espèces, virement, PayPal...). ATTENTION : sans paiement sécurisé, vous n'êtes PAS protégé en cas de litige. Nous recommandons fortement le paiement sécurisé."
      },
      {
        q: "Comment acheter des crédits pour mes annonces ?",
        a: "Page Tarifs > Choisissez votre pack > Paiement par carte. Les crédits sont ajoutés INSTANTANÉMENT après confirmation. Les crédits n'expirent JAMAIS."
      },
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "Cartes bancaires : Visa, Mastercard, American Express, CB. Paiement 100% sécurisé via Stripe. Vos informations bancaires ne sont JAMAIS stockées sur nos serveurs."
      },
      {
        q: "Comment obtenir une facture ?",
        a: "Pour les achats de crédits : Profil > Historique des paiements > Télécharger la facture. Pour les ventes : Tableau de bord > Ventes > Télécharger PDF récapitulatif pour votre comptabilité."
      },
      {
        q: "Y a-t-il des frais cachés ?",
        a: "NON. Les seuls frais sont : 1) Le prix des crédits (annonces), 2) La commission de 5% sur les ventes (vendeur), 3) Les frais Stripe standards (inclus). Pas de frais d'inscription, pas de frais mensuels pour les particuliers."
      }
    ]
  },

  // ==================== COMMUNICATION ====================
  {
    category: "Messagerie",
    icon: MessageSquare,
    questions: [
      {
        q: "Comment contacter un vendeur ?",
        a: "Sur la page de l'annonce, cliquez sur \"Contacter le vendeur\". Vous accédez à une messagerie sécurisée. Vous devez être connecté pour envoyer un message. Le vendeur est notifié par email et push."
      },
      {
        q: "Comment voir mes conversations ?",
        a: "Cliquez sur l'icône Messages dans la barre de navigation. Vous y trouverez toutes vos conversations avec les acheteurs/vendeurs, triées par date. Les messages non lus sont mis en évidence."
      },
      {
        q: "Le vendeur ne répond pas, que faire ?",
        a: "Attendez 48-72h, le vendeur peut être occupé. Si pas de réponse : 1) Vérifiez que votre message est bien envoyé, 2) Cherchez des annonces similaires, 3) Signalez le vendeur si son compte semble inactif depuis longtemps."
      },
      {
        q: "Mes messages sont-ils privés ?",
        a: "Oui, vos conversations sont privées et sécurisées. Seuls vous et votre interlocuteur pouvez les lire. IMPORTANT : ne partagez JAMAIS vos coordonnées bancaires ou mots de passe via la messagerie."
      },
      {
        q: "Puis-je envoyer des photos dans la messagerie ?",
        a: "Oui ! Cliquez sur l'icône photo dans la zone de message pour joindre une image. Utile pour demander des détails supplémentaires sur une pièce ou montrer l'état actuel de votre véhicule."
      },
      {
        q: "Comment bloquer un utilisateur ?",
        a: "Dans la conversation, cliquez sur les 3 points > \"Bloquer cet utilisateur\". Il ne pourra plus vous contacter. Pour débloquer : Profil > Paramètres > Utilisateurs bloqués."
      }
    ]
  },

  // ==================== TOBI - ASSISTANT IA ====================
  {
    category: "Tobi - Assistant IA",
    icon: Sparkles,
    questions: [
      {
        q: "Qu'est-ce que Tobi ?",
        a: "Tobi est notre assistant IA automobile intelligent. Il peut : trouver des pièces compatibles avec votre véhicule, diagnostiquer des problèmes mécaniques, estimer des prix, expliquer des termes techniques, et répondre à toutes vos questions auto."
      },
      {
        q: "Comment utiliser Tobi ?",
        a: "Cliquez sur \"Tobi\" sur la page d'accueil ou accédez à /tobi-chat. Posez votre question en langage naturel, comme si vous parliez à un mécanicien. Exemples : \"Je cherche un phare pour Clio 3\", \"Ma voiture fait un bruit bizarre au freinage\"."
      },
      {
        q: "Tobi est-il gratuit ?",
        a: "Oui, 100% gratuit et illimité pour tous les utilisateurs de World Auto Pro. Utilisez Tobi autant que vous le souhaitez, sans limite de questions !"
      },
      {
        q: "Tobi peut-il trouver des pièces pour mon véhicule ?",
        a: "Oui ! Dites à Tobi votre véhicule (marque, modèle, année) et la pièce recherchée. Il cherchera dans notre base d'annonces et vous proposera les pièces compatibles avec des liens directs."
      },
      {
        q: "Tobi peut-il diagnostiquer une panne ?",
        a: "Tobi peut vous aider à identifier des problèmes courants à partir de vos symptômes (bruits, voyants, comportements anormaux). Attention : Tobi est un assistant, pas un mécanicien. Pour les pannes graves, consultez un professionnel."
      },
      {
        q: "Tobi peut-il estimer le prix d'une pièce ?",
        a: "Oui ! Décrivez la pièce (type, marque, modèle, état) et Tobi vous donnera une estimation basée sur les prix du marché. Utile pour fixer un prix de vente juste ou évaluer une offre."
      }
    ]
  },

  // ==================== SÉCURITÉ ====================
  {
    category: "Sécurité",
    icon: Shield,
    questions: [
      {
        q: "Comment savoir si un vendeur est fiable ?",
        a: "Vérifiez : 1) Les avis et notes sur son profil, 2) Le badge \"Vérifié\" (identité confirmée), 3) Le badge \"PRO\" (professionnel SIRET), 4) L'ancienneté du compte, 5) Le nombre de ventes. Privilégiez TOUJOURS le paiement sécurisé."
      },
      {
        q: "Comment fonctionne la protection acheteur ?",
        a: "Avec le paiement sécurisé : votre argent est bloqué jusqu'à confirmation de réception. Si l'article n'est pas conforme, ouvrez un litige AVANT de confirmer. Nous intervenons et vous remboursons si nécessaire. Sans paiement sécurisé = pas de protection."
      },
      {
        q: "Que faire en cas d'arnaque ?",
        a: "1) Si paiement sécurisé : signalez immédiatement dans Mes commandes, l'argent est protégé. 2) Si paiement direct : contactez-nous à contact@worldautofrance.com avec toutes les preuves (messages, paiement, photos). Nous suspendrons le compte frauduleux."
      },
      {
        q: "Comment signaler une annonce frauduleuse ?",
        a: "Sur chaque annonce, cliquez sur \"Signaler cette annonce\" (icône drapeau). Choisissez le motif : arnaque, spam, contrefaçon, prix suspect, etc. Notre équipe examine chaque signalement sous 24h. Les annonces frauduleuses sont supprimées."
      },
      {
        q: "Mes données personnelles sont-elles protégées ?",
        a: "Oui, nous respectons le RGPD. Vos données sont : stockées en Europe, chiffrées, jamais vendues à des tiers. Les paiements sont gérés par Stripe (certifié PCI-DSS), vos coordonnées bancaires ne sont JAMAIS stockées chez nous."
      },
      {
        q: "Comment activer l'authentification à deux facteurs (2FA) ?",
        a: "Profil > Sécurité > Activer 2FA. Scannez le QR code avec une app d'authentification (Google Authenticator, Authy). À chaque connexion, vous devrez entrer un code temporaire en plus de votre mot de passe."
      }
    ]
  },

  // ==================== VIDÉOS ====================
  {
    category: "Vidéos",
    icon: Video,
    questions: [
      {
        q: "Comment ajouter une vidéo à mon annonce ?",
        a: "Lors de la création/modification de l'annonce, cliquez sur \"Ajouter une vidéo\". Téléchargez votre fichier vidéo. La vidéo standard (30 sec, 30 Mo) est GRATUITE. Pour des vidéos plus longues, des forfaits payants sont disponibles."
      },
      {
        q: "Quels sont les forfaits vidéo disponibles ?",
        a: "4 options : 🎬 Standard (30 sec, gratuit), 🎬 Étendue (2 min, 1€), 🎬 Intermédiaire (3 min, 2,99€), 🎬 PRO (10 min, 9,99€). Le forfait PRO est idéal pour les présentations détaillées de véhicules complets."
      },
      {
        q: "Comment mettre ma vidéo en avant sur la page d'accueil ?",
        a: "Depuis votre annonce avec vidéo, activez le \"Boost Vidéo\" : 1h (0,50€) ou 24h (5€). Votre vidéo sera diffusée dans le lecteur principal sur la page d'accueil = visibilité maximale !"
      },
      {
        q: "Quels formats vidéo sont acceptés ?",
        a: "Formats : MP4, MOV, AVI, WebM. Taille max : 30 Mo (standard) à 500 Mo (PRO). La vidéo est automatiquement convertie en MP4 optimisé pour le web. Résolution recommandée : 720p ou 1080p."
      },
      {
        q: "Pourquoi ajouter une vidéo à mon annonce ?",
        a: "Les annonces avec vidéo ont +50% de vues et se vendent 2x plus vite ! La vidéo permet de montrer la pièce en mouvement, prouver son bon fonctionnement, et rassurer l'acheteur sur son état réel."
      }
    ]
  },

  // ==================== LITIGES ====================
  {
    category: "Litiges & Réclamations",
    icon: AlertTriangle,
    questions: [
      {
        q: "L'article reçu ne correspond pas à l'annonce, que faire ?",
        a: "Avec paiement sécurisé : 1) NE CONFIRMEZ PAS la réception, 2) Allez dans Mes commandes > Signaler un problème, 3) Décrivez le problème avec photos, 4) L'argent reste bloqué pendant la médiation. Sans paiement sécurisé : contactez d'abord le vendeur pour une solution amiable."
      },
      {
        q: "Comment ouvrir un litige ?",
        a: "Mes commandes > Sélectionnez la commande > \"Signaler un problème\". Décrivez le problème en détail, ajoutez des photos comparatives (annonce vs réalité). Notre équipe intervient sous 24-48h."
      },
      {
        q: "Combien de temps dure la résolution d'un litige ?",
        a: "La plupart des litiges sont résolus en 3-7 jours ouvrés. Remboursement sous 5-7 jours après validation. Vous êtes informé par email à chaque étape. Les cas complexes peuvent nécessiter jusqu'à 14 jours."
      },
      {
        q: "Que se passe-t-il si le vendeur ne répond pas au litige ?",
        a: "Si le vendeur ne répond pas sous 48h, nous tranchons en faveur de l'acheteur. L'argent bloqué vous est remboursé intégralement. Le compte vendeur peut être suspendu."
      },
      {
        q: "Puis-je demander un remboursement partiel ?",
        a: "Oui ! Lors de l'ouverture du litige, vous pouvez proposer un remboursement partiel si l'article est utilisable mais pas conforme à 100%. Le vendeur peut accepter ou refuser. Nous arbitrons si désaccord."
      },
      {
        q: "World Auto Pro peut-il bloquer un vendeur ?",
        a: "Oui. En cas de litiges répétés, fraude avérée, ou non-respect des CGV, nous suspendons ou supprimons définitivement le compte. Les fonds en attente peuvent être gelés le temps de l'enquête."
      }
    ]
  },

  // ==================== NOTIFICATIONS ====================
  {
    category: "Notifications",
    icon: Bell,
    questions: [
      {
        q: "Comment activer les notifications push ?",
        a: "Profil > Notifications > Activez \"Notifications push\". Autorisez-les dans votre navigateur quand demandé. Vous recevrez des alertes pour : nouveaux messages, ventes, alertes de prix, nouveautés."
      },
      {
        q: "Quels types de notifications puis-je recevoir ?",
        a: "📩 Nouveaux messages, 💰 Ventes/achats, 💸 Alertes de prix sur favoris, 📢 Promotions, 🔔 Nouvelles annonces correspondant à vos alertes. Personnalisez chaque type dans vos paramètres."
      },
      {
        q: "Comment créer une alerte pour une pièce recherchée ?",
        a: "Page Recherche > Effectuez votre recherche > Cliquez sur \"Créer une alerte\". Vous serez notifié dès qu'une nouvelle annonce correspondant à vos critères est publiée."
      },
      {
        q: "Comment désactiver les notifications ?",
        a: "Profil > Notifications > Désactivez les types non souhaités. Vous pouvez aussi tout désactiver depuis les paramètres de votre navigateur."
      }
    ]
  },

  // ==================== STORIES ====================
  {
    category: "Stories",
    icon: Camera,
    questions: [
      {
        q: "Que sont les Stories vendeurs ?",
        a: "Les Stories sont des contenus éphémères (photos/vidéos) pour promouvoir vos pièces. Visibles 24h sur la page d'accueil et /stories. C'est GRATUIT et ILLIMITÉ ! Parfait pour montrer vos nouveautés."
      },
      {
        q: "Comment publier une Story ?",
        a: "Icône appareil photo (barre de navigation) > \"Nouvelle story\" > Sélectionnez photo/vidéo > Ajoutez une légende > Publiez. Votre Story apparaît instantanément !"
      },
      {
        q: "Combien de temps reste visible ma Story ?",
        a: "24 heures après publication, puis suppression automatique. Vous pouvez la supprimer manuellement avant si nécessaire."
      },
      {
        q: "Puis-je voir qui a vu ma Story ?",
        a: "Oui ! Cliquez sur votre Story pour voir le nombre de vues et la liste des personnes qui l'ont consultée."
      }
    ]
  },

  // ==================== PROGRAMME DE FIDÉLITÉ ====================
  {
    category: "Programme Fidélité",
    icon: Star,
    questions: [
      {
        q: "Comment fonctionne le programme de fidélité ?",
        a: "Gagnez des points à chaque action : inscription (50 pts), vente réalisée (10 pts), avis laissé (5 pts), parrainage (100 pts). 100 points = 1 crédit d'annonce gratuit. Les points s'accumulent sans limite de temps."
      },
      {
        q: "Comment parrainer un ami ?",
        a: "Profil > Parrainage > Copiez votre lien unique. Quand votre filleul s'inscrit et publie sa première annonce, vous recevez 100 points (= 1 crédit). Il n'y a pas de limite au nombre de parrainages !"
      },
      {
        q: "Comment convertir mes points en crédits ?",
        a: "Profil > Fidélité > \"Convertir en crédits\". 100 points = 1 crédit. La conversion est instantanée et les crédits sont ajoutés à votre solde."
      },
      {
        q: "Mes points ont-ils une date d'expiration ?",
        a: "Non ! Vos points n'expirent JAMAIS. Accumulez-les à votre rythme et convertissez-les quand vous le souhaitez."
      }
    ]
  },

  // ==================== VÉRIFICATION D'IDENTITÉ ====================
  {
    category: "Vérification d'identité",
    icon: Shield,
    questions: [
      {
        q: "Pourquoi faire vérifier mon identité ?",
        a: "La vérification ajoute un badge \"Vérifié\" sur votre profil, augmentant la confiance des acheteurs. Les vendeurs vérifiés ont +30% de ventes et de meilleurs avis. C'est GRATUIT et recommandé."
      },
      {
        q: "Comment faire vérifier mon identité ?",
        a: "Profil > Vérification d'identité > Téléchargez : 1) Photo recto/verso de votre pièce d'identité, 2) Un selfie avec le document visible. Vérification sous 24-48h."
      },
      {
        q: "Quels documents sont acceptés ?",
        a: "Carte nationale d'identité, passeport, ou permis de conduire. Le document doit être valide (non expiré) et les informations lisibles."
      },
      {
        q: "Mes documents sont-ils en sécurité ?",
        a: "Oui. Vos documents sont : stockés de manière chiffrée, utilisés UNIQUEMENT pour la vérification, supprimés après validation (max 30 jours). Nous respectons le RGPD et ne partageons jamais vos données."
      }
    ]
  },

  // ==================== TABLEAU DE BORD ====================
  {
    category: "Tableau de bord",
    icon: TrendingUp,
    questions: [
      {
        q: "Où voir mes statistiques de ventes ?",
        a: "Tableau de bord > Onglet \"Ventes\". Vous y trouverez : revenus du mois, commissions, graphique d'évolution, historique complet. Les PRO ont accès à des stats avancées (par annonce, par période)."
      },
      {
        q: "Comment télécharger un relevé pour ma comptabilité ?",
        a: "Tableau de bord > Ventes > \"Télécharger PDF\". Le document récapitule toutes vos ventes et commissions pour la période sélectionnée. Idéal pour votre comptabilité et déclarations fiscales."
      },
      {
        q: "Comment gérer mes annonces en masse ?",
        a: "Tableau de bord > Mes annonces. Cochez plusieurs annonces et utilisez les actions groupées : renouveler, mettre en pause, supprimer. Gain de temps pour les vendeurs avec beaucoup d'annonces !"
      },
      {
        q: "Le simulateur de commission, comment ça marche ?",
        a: "Lors de la création d'annonce, dès que vous entrez un prix, le simulateur affiche en temps réel : commission World Auto Pro (5%, min 1,50€, max 15€), frais de port estimés, et montant net que vous recevrez."
      }
    ]
  },

  // ==================== APPLICATION MOBILE ====================
  {
    category: "Application Mobile (PWA)",
    icon: Smartphone,
    questions: [
      {
        q: "Existe-t-il une application mobile World Auto Pro ?",
        a: "Oui ! World Auto Pro est une PWA (Progressive Web App). Pas besoin de télécharger sur App Store ou Play Store : ajoutez simplement le site à votre écran d'accueil pour une expérience app native."
      },
      {
        q: "Comment installer l'application sur iPhone ?",
        a: "Safari > worldautofrance.com > Icône partage (carré avec flèche) > \"Sur l'écran d'accueil\". L'icône World Auto Pro apparaît sur votre écran comme une app classique !"
      },
      {
        q: "Comment installer l'application sur Android ?",
        a: "Chrome > worldautofrance.com > Menu 3 points > \"Ajouter à l'écran d'accueil\". Vous pouvez aussi accepter la notification d'installation si elle apparaît."
      },
      {
        q: "L'application fonctionne-t-elle hors connexion ?",
        a: "Partiellement. Vous pouvez consulter les annonces déjà chargées et vos favoris. Pour publier, acheter ou envoyer des messages, une connexion internet est nécessaire."
      }
    ]
  },

  // ==================== CONTACT & SUPPORT ====================
  {
    category: "Contact & Support",
    icon: HelpCircle,
    questions: [
      {
        q: "Comment contacter le support World Auto Pro ?",
        a: "Email : contact@worldautofrance.com (réponse sous 24-48h). Les utilisateurs PRO bénéficient d'un support VIP prioritaire (réponse sous 12h). Décrivez votre problème avec un maximum de détails."
      },
      {
        q: "Où trouver les mentions légales et CGV ?",
        a: "En bas de chaque page, cliquez sur \"Mentions légales\" ou \"CGV\". Vous y trouverez toutes les informations juridiques : éditeur, hébergeur, conditions d'utilisation, politique de confidentialité."
      },
      {
        q: "Comment suggérer une amélioration ?",
        a: "Envoyez vos idées à contact@worldautofrance.com avec l'objet \"Suggestion\". Nous lisons TOUTES les suggestions et les meilleures sont intégrées aux futures mises à jour !"
      },
      {
        q: "World Auto Pro est-il présent sur les réseaux sociaux ?",
        a: "Oui ! Suivez-nous pour les actus, promos et nouveautés : Facebook (@WorldAutoPro), Instagram (@worldautopro), Twitter (@WorldAutoPro). Liens en bas de page."
      }
    ]
  }
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});
  const [settings, setSettings] = useState(DEFAULTS);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/settings`);
        setSettings({ ...DEFAULTS, ...res.data });
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter FAQs based on search
  const filteredFaqs = searchQuery.trim() === '' 
    ? faqs 
    : faqs.map(category => ({
        ...category,
        questions: category.questions.filter(
          q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
               q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(category => category.questions.length > 0);

  // Prepare FAQ schema for SEO
  const allQuestions = faqs.flatMap(cat => cat.questions);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <SEO 
        title="FAQ - Foire Aux Questions | World Auto Pro"
        description="Trouvez les réponses à vos questions sur World Auto Pro : annonces, paiements, livraison, Boxtal, messagerie, sécurité, Tobi et plus."
        keywords="FAQ, aide, questions, support, World Auto Pro, pièces auto, livraison, paiement, Boxtal"
        schema={createFAQSchema(allQuestions)}
      />
      
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {settings.faq_title}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {settings.faq_subtitle}
          </p>
        </div>

        {/* Search */}
        {settings.faq_search_enabled && (
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder={settings.faq_search_placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 py-6 text-lg rounded-xl border-2 border-gray-200 dark:border-gray-700 focus:border-orange-500"
            />
            {searchQuery && (
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">
                {filteredFaqs.reduce((acc, cat) => acc + cat.questions.length, 0)} résultat(s)
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
            <div className="text-2xl font-bold text-orange-600">{faqs.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Catégories</div>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{allQuestions.length}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Questions</div>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
            <div className="text-2xl font-bold text-green-600">24h</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Réponse support</div>
          </div>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-6">
          {filteredFaqs.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 px-6 py-4 border-b dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <category.icon className="w-5 h-5 text-orange-500" />
                  </div>
                  <h2 className="font-semibold text-lg text-gray-900 dark:text-white">
                    {category.category}
                  </h2>
                  <span className="ml-auto text-sm text-gray-500 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full">
                    {category.questions.length} questions
                  </span>
                </div>
              </div>
              
              <div className="divide-y dark:divide-gray-700">
                {category.questions.map((item, questionIndex) => {
                  const key = `${categoryIndex}-${questionIndex}`;
                  const isOpen = openItems[key];
                  
                  return (
                    <div key={questionIndex} className="group">
                      <button
                        onClick={() => toggleItem(categoryIndex, questionIndex)}
                        className="w-full px-6 py-4 text-left flex items-start gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        <ChevronDown 
                          className={`w-5 h-5 text-gray-400 mt-0.5 transition-transform flex-shrink-0 ${
                            isOpen ? 'rotate-180' : ''
                          }`} 
                        />
                        <span className="font-medium text-gray-900 dark:text-white group-hover:text-orange-600 transition-colors">
                          {item.q}
                        </span>
                      </button>
                      
                      {isOpen && (
                        <div className="px-6 pb-4 pl-16">
                          <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                            {item.a}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        {settings.faq_contact_enabled && (
          <div className="mt-12 text-center">
            <Card className="p-8 bg-gradient-to-r from-orange-500 to-orange-600 border-0">
              <h3 className="text-2xl font-bold text-white mb-2">
                Vous n'avez pas trouvé votre réponse ?
              </h3>
              <p className="text-orange-100 mb-6">
                Notre équipe est disponible pour vous aider. Réponse sous 24h garantie.
              </p>
              <a
                href="mailto:contact@worldautofrance.com"
                className="inline-flex items-center gap-2 bg-white text-orange-600 font-semibold px-8 py-3 rounded-full hover:bg-orange-50 transition-colors"
              >
                <MessageSquare className="w-5 h-5" />
                {settings.faq_contact_button}
              </a>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
