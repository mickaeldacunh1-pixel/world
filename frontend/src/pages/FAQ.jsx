import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { ChevronDown, HelpCircle, CreditCard, Package, MessageSquare, Shield, Truck, AlertTriangle, Video, Bell, Camera, FileText, TrendingUp, Search, Sparkles } from 'lucide-react';
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
  {
    category: "Inscription & Pays autorisés",
    icon: Shield,
    questions: [
      {
        q: "Quels pays sont autorisés pour créer un compte ?",
        a: "Les comptes acheteurs peuvent être créés depuis n'importe quel pays du monde. Vous pouvez parcourir les annonces, contacter les vendeurs et acheter des pièces où que vous soyez."
      },
      {
        q: "Quels pays sont autorisés pour vendre ?",
        a: "Pour créer des annonces et vendre sur World Auto Pro, vous devez être situé dans l'un des pays suivants : France, Belgique, Suisse, Allemagne, Pays-Bas, Italie, Espagne, Portugal, Suède. Cette restriction garantit la qualité des transactions et la protection des acheteurs."
      },
      {
        q: "Pourquoi cette restriction pour les vendeurs ?",
        a: "Cette restriction permet d'assurer un service de qualité avec des délais de livraison raisonnables, une protection juridique claire, et de réduire les risques de fraude. Les acheteurs peuvent cependant commander depuis le monde entier."
      },
      {
        q: "Je suis dans un pays non autorisé, puis-je quand même acheter ?",
        a: "Oui ! Les acheteurs peuvent créer un compte et acheter des pièces depuis n'importe quel pays. Seule la création d'annonces (vente) est limitée aux pays autorisés."
      },
      {
        q: "Les frais de livraison sont-ils plus élevés pour les pays hors Europe ?",
        a: "Les frais de livraison dépendent de la distance et du transporteur choisi. Pour les destinations hors Europe, les frais peuvent être plus élevés. Nous vous recommandons de demander un devis au vendeur avant l'achat."
      }
    ]
  },
  {
    category: "Offre de Lancement",
    icon: Package,
    questions: [
      {
        q: "Qu'est-ce que l'offre de lancement ?",
        a: "Pour célébrer notre lancement, nous offrons les 1000 premières annonces gratuitement ! Chaque nouvel inscrit via notre lien spécial reçoit jusqu'à 20 annonces gratuites. C'est notre façon de vous remercier de faire partie des premiers utilisateurs de World Auto Pro."
      },
      {
        q: "Comment profiter des 20 annonces gratuites ?",
        a: "Inscrivez-vous en utilisant notre lien spécial avec le code promo LANCEMENT. Vos 20 annonces gratuites seront automatiquement créditées sur votre compte dès l'inscription. Aucun code à entrer, c'est automatique !"
      },
      {
        q: "L'offre est-elle limitée ?",
        a: "Oui, l'offre est limitée aux 1000 premières annonces gratuites distribuées au total. Chaque utilisateur peut recevoir jusqu'à 20 annonces gratuites. Une fois ce quota atteint, l'offre prendra fin automatiquement. Ne tardez pas !"
      },
      {
        q: "Mes annonces gratuites ont-elles une date d'expiration ?",
        a: "Oui, les annonces gratuites offertes à l'inscription (offre de lancement) expirent 30 jours après votre inscription. Utilisez-les rapidement ! Passé ce délai, les crédits non utilisés seront perdus. Les crédits achetés, eux, n'expirent pas."
      },
      {
        q: "Puis-je cumuler les annonces gratuites avec d'autres offres ?",
        a: "Oui, vos annonces gratuites de l'offre de lancement peuvent être utilisées en plus de tout crédit acheté. Le système utilise d'abord vos annonces gratuites, puis vos crédits payants."
      }
    ]
  },
  {
    category: "Tobi - Assistant IA",
    icon: Sparkles,
    questions: [
      {
        q: "Qu'est-ce que Tobi ?",
        a: "Tobi est notre assistant IA automobile intelligent. Il peut vous aider à trouver des pièces, diagnostiquer des problèmes sur votre véhicule, estimer des prix et répondre à vos questions techniques."
      },
      {
        q: "Comment utiliser Tobi ?",
        a: "Cliquez sur le bouton 'Tobi' sur la page d'accueil ou accédez directement à /tobi-chat. Posez votre question en langage naturel et Tobi vous répondra instantanément."
      },
      {
        q: "Tobi est-il gratuit ?",
        a: "Oui, Tobi est entièrement gratuit pour tous les utilisateurs de World Auto Pro. Utilisez-le autant que vous le souhaitez !"
      }
    ]
  },
  {
    category: "Comptes Professionnels",
    icon: Shield,
    questions: [
      {
        q: "Quels sont les avantages d'un compte professionnel ?",
        a: "Les professionnels bénéficient de : 10 crédits offerts automatiquement à l'inscription (essai PRO 14 jours), 50 photos par annonce (contre 6 pour les particuliers), un badge PRO vérifié sur toutes leurs annonces, des statistiques avancées, et un support VIP prioritaire."
      },
      {
        q: "Comment créer un compte professionnel ?",
        a: "Lors de l'inscription, cochez la case 'Je suis un professionnel' et entrez votre numéro SIRET. Le SIRET est vérifié automatiquement via l'API officielle du gouvernement français. Une fois validé, votre essai PRO de 14 jours démarre immédiatement avec 10 crédits offerts."
      },
      {
        q: "L'essai PRO est-il vraiment gratuit ?",
        a: "Oui ! Dès votre inscription en tant que professionnel, vous recevez automatiquement 10 crédits gratuits et accédez à toutes les fonctionnalités PRO pendant 14 jours. Aucune carte bancaire requise, aucun engagement."
      },
      {
        q: "Que se passe-t-il après les 14 jours d'essai ?",
        a: "Après l'essai, vous conservez vos crédits restants et pouvez continuer à publier des annonces. Pour conserver les avantages PRO (50 photos, badge, stats avancées), vous pouvez souscrire à un abonnement Pro à partir de 29€/mois."
      },
      {
        q: "J'ai un abonnement Pro Annuel avec 500 crédits. Que se passe-t-il si je les utilise tous ?",
        a: "Avec l'abonnement Pro Annuel, vous recevez 500 crédits pour l'année. Si vous les épuisez avant la fin de l'année, vous pouvez acheter des crédits supplémentaires via nos packs (de 1 à 100 crédits). Vous conservez tous vos avantages PRO (50 photos, badge, stats) jusqu'à la fin de votre abonnement. À la prochaine échéance, vos 500 crédits seront de nouveau crédités."
      },
      {
        q: "Puis-je cumuler l'essai PRO avec le code LANCEMENT ?",
        a: "Oui ! Si vous êtes professionnel et utilisez le code LANCEMENT, vous cumulez : 10 crédits (essai PRO) + 20 annonces gratuites (offre lancement) + 50 points fidélité. C'est l'offre la plus avantageuse ! Note : les crédits offerts expirent 30 jours après l'inscription."
      }
    ]
  },
  {
    category: "Annonces",
    icon: Package,
    questions: [
      {
        q: "Comment créer une annonce ?",
        a: "Pour créer une annonce, connectez-vous à votre compte, cliquez sur \"Déposer une annonce\" et remplissez le formulaire avec les détails de votre pièce ou véhicule. Ajoutez des photos de qualité pour attirer plus d'acheteurs. Vous devez avoir des crédits ou des annonces gratuites pour publier."
      },
      {
        q: "Combien coûte la publication d'une annonce ?",
        a: "La publication d'une annonce coûte 1 crédit. Vous pouvez acheter des packs de crédits sur notre page Tarifs : de 2€ l'unité jusqu'à 0,69€/annonce avec le Pack 100. Les professionnels reçoivent 10 crédits gratuits à l'inscription. Si vous avez des annonces gratuites (offre de lancement), elles seront utilisées en priorité."
      },
      {
        q: "Combien de photos puis-je ajouter ?",
        a: "Les particuliers peuvent ajouter jusqu'à 6 photos par annonce (jusqu'à 25 avec le Pack 100). Les professionnels bénéficient de 50 photos par annonce, idéal pour montrer tous les détails de vos pièces."
      },
      {
        q: "Combien de temps reste visible mon annonce ?",
        a: "Votre annonce reste visible pendant 30 jours. À l'expiration, vous pouvez la renouveler en utilisant un nouveau crédit."
      },
      {
        q: "Comment modifier ou supprimer mon annonce ?",
        a: "Rendez-vous dans votre tableau de bord, section \"Mes annonces\". Cliquez sur l'annonce que vous souhaitez modifier ou supprimer, puis utilisez les boutons correspondants."
      },
      {
        q: "Pourquoi mon annonce a été refusée ?",
        a: "Une annonce peut être refusée si elle ne respecte pas nos conditions : contenu inapproprié, informations incomplètes, photos de mauvaise qualité, ou produit interdit à la vente. Contactez-nous pour plus de détails."
      }
    ]
  },
  {
    category: "Paiements",
    icon: CreditCard,
    questions: [
      {
        q: "Comment fonctionne le paiement sécurisé ?",
        a: "Notre système de paiement sécurisé (escrow) protège acheteurs et vendeurs. Quand vous cliquez sur \"Acheter maintenant\", l'argent est bloqué sur un compte sécurisé Stripe. Le vendeur n'est payé que lorsque vous confirmez avoir reçu l'article en bon état. En cas de problème, nous intervenons pour trouver une solution."
      },
      {
        q: "Quelle est la commission prélevée par World Auto Pro ?",
        a: "World Auto Pro prélève une commission de 5% sur chaque vente (minimum 1,50€, maximum 15€). Par exemple : pour une pièce à 20€, la commission est de 1,50€ ; pour 100€, elle est de 5€ ; pour 500€, elle est plafonnée à 15€. Cette commission est uniquement à la charge du vendeur."
      },
      {
        q: "Comment un vendeur peut-il recevoir des paiements ?",
        a: "Pour recevoir des paiements via notre plateforme, les vendeurs doivent connecter leur compte Stripe depuis leur profil (section \"Paiements\"). C'est gratuit et ne prend que quelques minutes. Une fois connecté, le bouton \"Acheter maintenant\" apparaît sur leurs annonces."
      },
      {
        q: "Que se passe-t-il si l'article n'est pas conforme ?",
        a: "Avec le paiement sécurisé, vous êtes protégé. Avant de confirmer la réception, signalez tout problème via votre espace Commandes. L'argent reste bloqué pendant la médiation. Si le retour est justifié, vous serez remboursé intégralement."
      },
      {
        q: "Puis-je payer directement le vendeur sans passer par la plateforme ?",
        a: "Oui, les transactions directes entre acheteurs et vendeurs restent possibles via la messagerie. Cependant, nous recommandons fortement d'utiliser le paiement sécurisé pour bénéficier de la protection acheteur et éviter les arnaques."
      },
      {
        q: "Comment acheter des crédits pour mes annonces ?",
        a: "Rendez-vous sur la page Tarifs, choisissez le pack qui vous convient et procédez au paiement. Les crédits sont ajoutés instantanément à votre compte après confirmation du paiement. Les crédits achetés n'ont pas de date d'expiration, contrairement aux crédits offerts à l'inscription qui expirent après 30 jours."
      },
      {
        q: "Quels moyens de paiement sont acceptés ?",
        a: "Nous acceptons les cartes bancaires (Visa, Mastercard, American Express) via notre partenaire Stripe. Le paiement est 100% sécurisé et vos informations bancaires ne sont jamais stockées sur nos serveurs."
      }
    ]
  },
  {
    category: "Communication",
    icon: MessageSquare,
    questions: [
      {
        q: "Comment contacter un vendeur ?",
        a: "Sur la page de l'annonce, cliquez sur \"Contacter le vendeur\" pour accéder à la messagerie sécurisée. Vous devez être connecté pour envoyer un message."
      },
      {
        q: "Le vendeur ne répond pas, que faire ?",
        a: "Si un vendeur ne répond pas sous 48-72h, il est possible qu'il ne soit plus actif. Nous vous conseillons de rechercher des annonces similaires ou de nous contacter si le problème persiste."
      },
      {
        q: "Mes messages sont-ils privés ?",
        a: "Oui, vos conversations sont privées et sécurisées. Seuls vous et votre interlocuteur pouvez les lire. Évitez de partager des informations sensibles (coordonnées bancaires) via la messagerie."
      }
    ]
  },
  {
    category: "Livraison",
    icon: Truck,
    questions: [
      {
        q: "Comment fonctionne la livraison ?",
        a: "La livraison est organisée entre l'acheteur et le vendeur. Vous pouvez convenir d'une remise en main propre ou d'un envoi par transporteur. World Auto Pro est intégré avec Boxtal, qui vous donne accès à Colissimo, Mondial Relay, Chronopost, DPD et plus encore, directement depuis la plateforme."
      },
      {
        q: "Quels transporteurs sont disponibles ?",
        a: "Grâce à notre partenaire Boxtal, vous avez accès à : Colissimo (La Poste), Mondial Relay, Chronopost, DPD, et d'autres transporteurs. Les tarifs sont calculés automatiquement selon le poids et les dimensions du colis."
      },
      {
        q: "Comment obtenir un devis de livraison ?",
        a: "Lors de l'achat, les frais de port sont calculés automatiquement en fonction du poids, des dimensions et de l'adresse de livraison. Vous pouvez choisir le transporteur qui vous convient parmi les options proposées."
      },
      {
        q: "Qui paie les frais de livraison ?",
        a: "Les frais de livraison sont généralement à la charge de l'acheteur, sauf accord contraire avec le vendeur. Le vendeur peut aussi proposer la livraison gratuite en l'incluant dans son prix."
      },
      {
        q: "Comment sont calculés les frais de port ?",
        a: "Les frais de port sont calculés en temps réel via notre partenaire Boxtal, en fonction du poids, des dimensions et de la destination. Une petite commission de service est incluse dans les frais affichés pour couvrir les coûts de gestion de la plateforme (emballage, support, etc.)."
      },
      {
        q: "Comment suivre ma commande ?",
        a: "Une fois l'article expédié, vous recevez un numéro de suivi par email et dans votre espace Commandes. Vous pouvez suivre votre colis en temps réel sur le site du transporteur ou directement sur World Auto Pro."
      },
      {
        q: "Comment générer une étiquette d'expédition ?",
        a: "Après une vente, rendez-vous dans votre tableau de bord > Commandes. Cliquez sur la commande puis \"Générer étiquette\". Sélectionnez le transporteur et téléchargez l'étiquette à coller sur votre colis."
      }
    ]
  },
  {
    category: "Sécurité",
    icon: Shield,
    questions: [
      {
        q: "Comment savoir si un vendeur est fiable ?",
        a: "Consultez les avis et notes laissés par d'autres acheteurs sur le profil du vendeur. Les vendeurs avec le badge \"Vérifié\" ont réalisé 5+ ventes avec de bonnes évaluations. Les vendeurs PRO sont des professionnels. Privilégiez le paiement sécurisé pour être protégé."
      },
      {
        q: "Comment fonctionne la protection acheteur ?",
        a: "Avec le paiement sécurisé, votre argent est protégé. Il est bloqué jusqu'à ce que vous confirmiez la bonne réception de l'article. Si l'article n'est pas conforme, vous pouvez ouvrir un litige et nous interviendrons pour vous rembourser si nécessaire."
      },
      {
        q: "Que faire en cas d'arnaque ?",
        a: "Si vous avez utilisé le paiement sécurisé, signalez le problème avant de confirmer la réception - vous serez remboursé. Pour les transactions directes, contactez-nous à contact@worldautofrance.com avec tous les détails (messages, preuves de paiement). Nous prendrons les mesures nécessaires."
      },
      {
        q: "Comment signaler une annonce frauduleuse ?",
        a: "Sur chaque annonce, un bouton \"Signaler cette annonce\" vous permet de nous alerter. Choisissez le motif (arnaque, spam, contrefaçon, etc.) et nous examinerons le signalement rapidement. Les annonces frauduleuses sont supprimées et les comptes peuvent être suspendus."
      },
      {
        q: "Mes données personnelles sont-elles protégées ?",
        a: "Oui, nous respectons le RGPD et protégeons vos données personnelles. Les paiements sont gérés par Stripe, vos coordonnées bancaires ne sont jamais stockées chez nous. Consultez nos Mentions Légales pour plus d'informations."
      },
      {
        q: "Qu'est-ce que la double authentification (2FA) ?",
        a: "La double authentification ajoute une couche de sécurité à votre compte. En plus de votre mot de passe, vous devez entrer un code temporaire généré par une application (Google Authenticator) ou reçu par email. Même si quelqu'un vole votre mot de passe, il ne pourra pas accéder à votre compte sans ce code."
      },
      {
        q: "Comment activer la double authentification ?",
        a: "Rendez-vous dans votre Profil > onglet 'Mot de passe'. Vous y trouverez la section 'Double Authentification (2FA)'. Choisissez votre méthode préférée : Google Authenticator (recommandé, plus sécurisé) ou Code par Email (plus simple). Suivez les instructions à l'écran pour l'activer."
      },
      {
        q: "Que sont les codes de secours ?",
        a: "Quand vous activez la 2FA avec Google Authenticator, 8 codes de secours vous sont fournis. Conservez-les précieusement ! Si vous perdez accès à votre application d'authentification (téléphone perdu, changé...), ces codes vous permettront de vous connecter et de désactiver/réactiver la 2FA."
      },
      {
        q: "Pourquoi mon compte est-il bloqué temporairement ?",
        a: "Pour protéger votre compte, nous bloquons automatiquement les connexions après 5 tentatives échouées. Le blocage dure 15 minutes. Si c'est vous, attendez simplement. Si vous n'avez pas essayé de vous connecter, cela signifie que quelqu'un tente d'accéder à votre compte - pensez à changer votre mot de passe et activer la 2FA."
      }
    ]
  },
  {
    category: "Vidéos",
    icon: Video,
    questions: [
      {
        q: "Comment ajouter une vidéo à mon annonce ?",
        a: "Lors de la création de votre annonce, vous pouvez ajouter une vidéo de présentation. La vidéo standard (30 secondes) est incluse gratuitement. Pour des vidéos plus longues, vous pouvez acheter un forfait : Étendue (2 min, 1€), Intermédiaire (3 min, 2,99€) ou PRO (10 min, 9,99€)."
      },
      {
        q: "Quels sont les forfaits vidéo disponibles ?",
        a: "Nous proposons 4 options : Vidéo Standard (30 sec, gratuit), Vidéo Étendue (2 min, 1€), Vidéo Intermédiaire (3 min, 2,99€) et Vidéo PRO Présentation (10 min, 9,99€). Le forfait PRO est idéal pour les professionnels qui souhaitent faire des présentations détaillées."
      },
      {
        q: "Comment mettre ma vidéo en avant sur la page d'accueil ?",
        a: "Depuis votre annonce avec vidéo, vous pouvez activer le Boost Vidéo. Deux options : 1 heure (0,50€) ou 24 heures (5€). Votre vidéo sera diffusée dans le lecteur principal sur la page d'accueil, offrant une visibilité maximale."
      },
      {
        q: "Où puis-je voir toutes les annonces avec vidéo ?",
        a: "Rendez-vous sur la page Vidéos accessible depuis le menu principal. Vous y trouverez une galerie de toutes les annonces avec vidéo, avec des filtres par catégorie, tri et recherche."
      },
      {
        q: "Quel format de vidéo est accepté ?",
        a: "Nous acceptons les formats vidéo courants (MP4, MOV, AVI). La vidéo est automatiquement convertie en MP4 optimisé pour le web. La taille maximale dépend de votre forfait : 30 Mo (standard), 100 Mo (étendue), 150 Mo (intermédiaire) ou 500 Mo (PRO)."
      }
    ]
  },
  {
    category: "Litiges",
    icon: AlertTriangle,
    questions: [
      {
        q: "L'article reçu ne correspond pas à l'annonce, que faire ?",
        a: "Avec le paiement sécurisé : NE CONFIRMEZ PAS la réception et signalez le problème dans votre espace Commandes. L'argent reste bloqué pendant la médiation. Sans paiement sécurisé : contactez d'abord le vendeur via la messagerie pour trouver une solution amiable."
      },
      {
        q: "Comment ouvrir un litige ?",
        a: "Rendez-vous dans votre espace Commandes, sélectionnez la commande concernée et cliquez sur \"Signaler un problème\". Décrivez le problème avec photos si possible. Notre équipe intervient généralement sous 24-48h."
      },
      {
        q: "Combien de temps dure la résolution d'un litige ?",
        a: "La plupart des litiges sont résolus en 3-7 jours ouvrés. Pour les paiements sécurisés, le remboursement est effectué sous 5-7 jours après validation. Nous vous tenons informé par email à chaque étape."
      },
      {
        q: "World Auto Pro peut-il bloquer un vendeur ?",
        a: "Oui, en cas de litiges répétés, de comportement frauduleux ou de non-respect de nos conditions, nous pouvons suspendre ou supprimer définitivement un compte vendeur. Les fonds en attente peuvent être gelés le temps de l'enquête."
      }
    ]
  },
  {
    category: "Notifications Push",
    icon: Bell,
    questions: [
      {
        q: "Comment activer les notifications push ?",
        a: "Rendez-vous dans votre profil, onglet \"Notifications\". Activez les notifications push et autorisez-les dans votre navigateur. Vous recevrez des alertes pour les nouveaux messages, commandes et alertes de prix."
      },
      {
        q: "Quels types de notifications puis-je recevoir ?",
        a: "Vous pouvez recevoir : des notifications de nouveaux messages, des alertes quand quelqu'un achète votre article, des alertes de prix sur vos favoris, et des informations sur les promotions. Vous pouvez personnaliser chaque type dans vos paramètres."
      },
      {
        q: "Comment désactiver les notifications ?",
        a: "Allez dans votre profil > Notifications et désactivez les types de notifications que vous ne souhaitez plus recevoir. Vous pouvez aussi les désactiver complètement depuis les paramètres de votre navigateur."
      }
    ]
  },
  {
    category: "Stories Vendeurs",
    icon: Camera,
    questions: [
      {
        q: "Que sont les Stories vendeurs ?",
        a: "Les Stories sont des contenus éphémères (photos ou vidéos) que les vendeurs peuvent publier pour promouvoir leurs pièces. Elles restent visibles pendant 24 heures et apparaissent sur la page d'accueil et la page /stories."
      },
      {
        q: "Comment publier une Story ?",
        a: "Cliquez sur l'icône appareil photo dans la barre de navigation, puis sur \"Nouvelle story\". Sélectionnez une photo ou vidéo de vos pièces, ajoutez une légende optionnelle et publiez. C'est gratuit et illimité !"
      },
      {
        q: "Combien de temps reste visible ma Story ?",
        a: "Les Stories restent visibles pendant 24 heures après leur publication, puis elles sont automatiquement supprimées. Vous pouvez les supprimer manuellement avant si nécessaire."
      },
      {
        q: "Où puis-je voir toutes les Stories ?",
        a: "Cliquez sur l'icône appareil photo dans la barre de navigation pour accéder à la page Stories complète. Vous y trouverez toutes les Stories actives des vendeurs avec des statistiques."
      }
    ]
  },
  {
    category: "Vérification d'identité",
    icon: Shield,
    questions: [
      {
        q: "Pourquoi faire vérifier mon identité ?",
        a: "La vérification d'identité ajoute un badge \"Vérifié\" sur votre profil, ce qui augmente la confiance des acheteurs. Les vendeurs vérifiés ont généralement plus de ventes et de meilleurs avis."
      },
      {
        q: "Comment faire vérifier mon identité ?",
        a: "Allez dans votre profil > Vérification d'identité. Téléchargez une photo recto/verso de votre pièce d'identité et un selfie avec le document. Notre équipe vérifie votre demande sous 24-48h."
      },
      {
        q: "Quels documents sont acceptés ?",
        a: "Nous acceptons : carte nationale d'identité, passeport, ou permis de conduire. Le document doit être valide et les informations lisibles."
      },
      {
        q: "Mes documents sont-ils en sécurité ?",
        a: "Oui, vos documents sont stockés de manière sécurisée et ne sont utilisés que pour la vérification. Ils sont supprimés après validation. Nous respectons le RGPD et ne partageons jamais vos données."
      }
    ]
  },
  {
    category: "Tableau de bord Ventes",
    icon: TrendingUp,
    questions: [
      {
        q: "Où voir mes statistiques de ventes ?",
        a: "Dans votre tableau de bord, cliquez sur l'onglet \"💰 Ventes\". Vous y trouverez vos revenus du mois, les commissions, un graphique d'évolution et l'historique complet de vos ventes."
      },
      {
        q: "Comment télécharger un relevé pour ma comptabilité ?",
        a: "Dans l'onglet Ventes de votre tableau de bord, cliquez sur \"Télécharger PDF\". Un document récapitulatif avec toutes vos ventes et commissions sera généré pour votre comptabilité."
      },
      {
        q: "Quelle est la formule de commission ?",
        a: "La commission est de 5% sur chaque vente, avec un minimum de 1,50€ et un maximum de 15€. Exemples : vente à 20€ → 1,50€ de commission ; vente à 100€ → 5€ ; vente à 500€ → 15€ (plafond)."
      },
      {
        q: "Le simulateur de commission, comment ça marche ?",
        a: "Lors de la création ou modification d'une annonce, un simulateur s'affiche automatiquement dès que vous entrez un prix. Il vous montre en temps réel la commission et le montant net que vous recevrez."
      }
    ]
  },
  {
    category: "Catégories spéciales",
    icon: Package,
    questions: [
      {
        q: "Qu'est-ce que la catégorie \"Recherche\" ?",
        a: "La catégorie \"Recherche\" permet aux acheteurs de publier une annonce pour une pièce qu'ils recherchent. Si vous ne trouvez pas la pièce qu'il vous faut, créez une annonce \"Recherche\" et les vendeurs pourront vous contacter directement avec des offres."
      },
      {
        q: "Qu'est-ce que \"Rare & Collection\" ?",
        a: "Cette catégorie est dédiée aux pièces rares, vintage, de collection ou introuvables. Parfait pour les voitures anciennes, les pièces de prestige, les éditions limitées ou les véhicules historiques. Les collectionneurs y trouvent des pièces exceptionnelles."
      },
      {
        q: "Comment publier une annonce \"Recherche\" ?",
        a: "Créez une annonce normalement, mais choisissez la catégorie \"Recherche\". Décrivez précisément la pièce recherchée (marque, modèle, année, état souhaité) et votre budget maximum. Les vendeurs pourront vous contacter avec leurs offres."
      },
      {
        q: "Comment certifier une pièce rare ou de collection ?",
        a: "Pour les pièces de collection, nous vous conseillons d'ajouter un maximum de preuves : photos détaillées, documents d'origine, certificats d'authenticité si disponibles. La vérification d'identité vendeur est fortement recommandée pour ce type de pièces."
      }
    ]
  },
  {
    category: "Mon Entrepôt Pro",
    icon: Package,
    questions: [
      {
        q: "Qu'est-ce que Mon Entrepôt Pro ?",
        a: "Mon Entrepôt Pro est un outil de gestion de stock professionnel intégré à World Auto Pro. Il vous permet de gérer votre inventaire de pièces détachées, de suivre les quantités, d'organiser par sections et de publier directement vos articles en annonces."
      },
      {
        q: "Comment accéder à Mon Entrepôt Pro ?",
        a: "Connectez-vous à votre compte et rendez-vous sur la page /entrepot ou cliquez sur l'icône Entrepôt dans votre tableau de bord. L'outil est disponible pour tous les utilisateurs connectés."
      },
      {
        q: "Comment organiser mon stock ?",
        a: "Vous pouvez créer des sections personnalisées (ex: Moteur, Carrosserie, Freinage...) pour organiser vos pièces. Chaque article peut être assigné à une section avec une localisation précise (ex: Étagère A3, Bac 12...)."
      },
      {
        q: "Comment ajouter un article à mon entrepôt ?",
        a: "Cliquez sur 'Nouvel article', remplissez les informations (nom, référence OEM, catégorie, marque, état, quantité, prix d'achat/vente) et ajoutez des photos. L'article sera ajouté à votre inventaire."
      },
      {
        q: "Comment publier un article de mon entrepôt en annonce ?",
        a: "Depuis la fiche d'un article, cliquez sur 'Publier en annonce'. Les informations seront pré-remplies. Ajustez le prix de vente et validez. Un crédit d'annonce sera utilisé et le stock sera automatiquement décrémenté."
      },
      {
        q: "Comment fonctionne l'alerte de stock bas ?",
        a: "Définissez un seuil minimum pour chaque article. Quand la quantité passe en dessous de ce seuil, l'article apparaît dans les 'Alertes stock' pour vous rappeler de réapprovisionner."
      },
      {
        q: "Puis-je exporter mon inventaire ?",
        a: "Oui, cliquez sur le bouton 'Exporter' pour télécharger votre inventaire au format CSV. Vous pourrez l'ouvrir dans Excel ou Google Sheets pour une analyse ou sauvegarde."
      }
    ]
  },
  {
    category: "Modes de livraison",
    icon: Truck,
    questions: [
      {
        q: "Quels modes de livraison puis-je proposer ?",
        a: "Vous pouvez proposer jusqu'à 6 modes de livraison : Remise en main propre, Colissimo (La Poste), Mondial Relay, Chronopost, Boxtal Multi-Transporteurs, ou un autre transporteur personnalisé."
      },
      {
        q: "Comment sélectionner les modes de livraison pour mon annonce ?",
        a: "Lors de la création de votre annonce, dans la section 'Livraison', cliquez sur les options que vous souhaitez proposer. Vous pouvez en sélectionner plusieurs. Au moins un mode de livraison est obligatoire."
      },
      {
        q: "Qu'est-ce que Boxtal Multi-Transporteurs ?",
        a: "Boxtal est notre partenaire qui vous permet de comparer et choisir parmi plusieurs transporteurs (Colissimo, Mondial Relay, Chronopost, DPD...) en un seul endroit. Les tarifs sont calculés automatiquement selon le poids et les dimensions."
      },
      {
        q: "Qu'est-ce que 'Remise en main propre' ?",
        a: "C'est une option où l'acheteur vient chercher l'article directement chez vous. Idéal pour les pièces volumineuses ou fragiles, ou pour les acheteurs locaux. Aucun frais de port dans ce cas."
      },
      {
        q: "Puis-je proposer uniquement la remise en main propre ?",
        a: "Oui, si votre pièce est trop volumineuse ou fragile pour être expédiée, vous pouvez ne proposer que la remise en main propre. Précisez votre localisation pour que les acheteurs sachent où venir."
      },
      {
        q: "Comment choisir 'Autre transporteur' ?",
        a: "Si vous utilisez un transporteur non listé (TNT, GLS, transporteur local...), sélectionnez 'Autre transporteur' et précisez les détails dans le champ 'Infos livraison'."
      }
    ]
  },
  {
    category: "Paiements & Reversements",
    icon: CreditCard,
    questions: [
      {
        q: "Comment fonctionne le paiement Stripe Direct ?",
        a: "Avec Stripe Direct, l'acheteur paie par carte bancaire et l'argent arrive sur le compte de la plateforme World Auto France. Nous nous occupons ensuite de reverser le montant au vendeur (moins la commission). C'est la méthode la plus simple : le vendeur n'a qu'à entrer son IBAN pour recevoir ses fonds."
      },
      {
        q: "Comment recevoir l'argent de mes ventes ?",
        a: "Vous avez deux options : 1) Entrer votre IBAN directement dans votre profil (simple, comme sur eBay) - vous recevrez vos reversements par virement bancaire. 2) Créer un compte Stripe Connect (dashboard complet avec transferts automatiques)."
      },
      {
        q: "À quelle fréquence sont effectués les reversements ?",
        a: "Pour les particuliers, les reversements sont effectués 2 fois par mois (le 1er et le 15). Pour les vendeurs PRO, les reversements sont automatiques chaque semaine (tous les lundis). Vous recevez une notification par email à chaque reversement effectué."
      },
      {
        q: "Comment configurer mon IBAN ?",
        a: "Allez dans Profil > Paiements, puis cliquez sur 'Entrer mon IBAN'. Saisissez votre IBAN (ex: FR76...), le nom du titulaire et validez. C'est tout ! Vos reversements seront envoyés sur ce compte."
      },
      {
        q: "Quelle est la commission prélevée ?",
        a: "World Auto France prélève une commission de 5% sur chaque vente (minimum 0,50€, maximum 15€). Exemple : pour une pièce à 80€, la commission est de 4€, vous recevez 76€. Pour une pièce à 500€, la commission est plafonnée à 15€, vous recevez 485€."
      },
      {
        q: "Suis-je notifié quand je reçois un reversement ?",
        a: "Oui ! Vous recevez un email de notification à chaque reversement effectué sur votre compte bancaire. L'email contient le détail des ventes concernées et le montant total reversé."
      },
      {
        q: "L'IBAN est-il vérifié ?",
        a: "Oui, le système vérifie automatiquement la validité de votre IBAN (checksum mod-97). Si vous faites une erreur de frappe, un message vous préviendra."
      },
      {
        q: "Quelle est la différence entre IBAN simple et Stripe Connect ?",
        a: "L'IBAN simple : vous entrez vos coordonnées bancaires et recevez les virements 2 fois par mois. Stripe Connect : l'argent est transféré automatiquement sur votre compte Stripe sous 2-7 jours, avec un dashboard complet pour suivre vos transactions."
      },
      {
        q: "Mes coordonnées bancaires sont-elles sécurisées ?",
        a: "Oui, vos coordonnées bancaires sont stockées de manière sécurisée et ne sont jamais affichées en clair. Seuls les 4 derniers caractères de votre IBAN sont visibles dans votre profil."
      },
      {
        q: "Puis-je modifier mon IBAN ?",
        a: "Oui, vous pouvez modifier votre IBAN à tout moment dans Profil > Paiements en cliquant sur 'Modifier mon IBAN'. Le nouvel IBAN sera utilisé pour les prochains reversements."
      }
    ]
  },
  {
    category: "Photos & Images",
    icon: Package,
    questions: [
      {
        q: "Quels formats de photos sont acceptés ?",
        a: "Vous pouvez utiliser les formats JPG, PNG, WebP, GIF et HEIC/HEIF. Le format HEIC est celui utilisé par défaut sur les iPhone et iPad."
      },
      {
        q: "Je peux prendre des photos directement depuis mon téléphone ?",
        a: "Oui ! Vous pouvez prendre des photos directement avec l'appareil photo de votre smartphone ou tablette lors de la création de l'annonce."
      },
      {
        q: "Mes photos apparaissent à l'envers ou de côté ?",
        a: "Le système corrige automatiquement l'orientation des photos grâce aux données EXIF. Si une photo apparaît mal orientée, elle sera corrigée lors de l'upload."
      },
      {
        q: "Quelle est la taille maximum des photos ?",
        a: "Chaque photo peut faire jusqu'à 10 Mo. Les photos sont automatiquement optimisées pour un affichage rapide tout en conservant une bonne qualité."
      },
      {
        q: "Combien de photos puis-je ajouter ?",
        a: "Les utilisateurs standard peuvent ajouter jusqu'à 10 photos par annonce. Les utilisateurs PRO peuvent en ajouter jusqu'à 50."
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
        console.log('Using default FAQ settings');
      }
    };
    fetchSettings();
  }, []);

  const s = settings;

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Filter FAQs based on search
  const filteredFaqs = searchQuery 
    ? faqs.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q => 
          q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.questions.length > 0)
    : faqs;

  // Prepare FAQ data for schema
  const allFaqs = faqs.flatMap(cat => 
    cat.questions.map(q => ({ question: q.q, answer: q.a }))
  );

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <SEO
        title="FAQ - Foire Aux Questions"
        description="Trouvez les réponses à vos questions sur World Auto Pro : annonces, paiements, livraison, messagerie et sécurité."
        keywords="FAQ world auto, questions fréquentes, aide marketplace auto, support world auto"
        url="/faq"
        structuredData={createFAQSchema(allFaqs)}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-8 h-8 text-accent" />
          </div>
          <h1 className="font-heading text-4xl font-bold mb-4">{s.faq_title}</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {s.faq_subtitle}
          </p>
        </div>

        {/* Search Bar */}
        {s.faq_search_enabled !== false && (
          <div className="mb-8 animate-fade-in-up">
            <div className="relative max-w-xl mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={s.faq_search_placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 py-6 text-lg"
              />
            </div>
          </div>
        )}

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredFaqs.map((category, categoryIndex) => (
            <Card key={category.category} className="overflow-hidden animate-fade-in-up" style={{ animationDelay: `${categoryIndex * 0.1}s` }}>
              {/* Category Header */}
              {s.faq_categories_enabled !== false && (
                <div className="bg-primary/5 px-6 py-4 border-b">
                  <h2 className="font-heading text-xl font-bold flex items-center gap-3">
                    <category.icon className="w-6 h-6 text-accent" />
                    {category.category}
                  </h2>
                </div>
              )}

              {/* Questions */}
              <div className="divide-y">
                {category.questions.map((item, questionIndex) => {
                  const isOpen = openItems[`${categoryIndex}-${questionIndex}`];
                  return (
                    <div key={questionIndex} className="transition-colors hover:bg-secondary/30">
                      <button
                        onClick={() => toggleItem(categoryIndex, questionIndex)}
                        className="w-full px-6 py-4 text-left flex items-center justify-between gap-4"
                      >
                        <span className="font-medium text-foreground">{item.q}</span>
                        <ChevronDown 
                          className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform duration-300 ${
                            isOpen ? 'rotate-180' : ''
                          }`} 
                        />
                      </button>
                      <div 
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                      >
                        <p className="px-6 pb-4 text-muted-foreground leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>

        {/* Contact CTA */}
        {s.faq_contact_enabled !== false && (
          <Card className="mt-12 p-8 text-center bg-gradient-to-r from-primary to-slate-800 text-white animate-fade-in-up">
            <h2 className="font-heading text-2xl font-bold mb-3">
              Vous n&apos;avez pas trouvé votre réponse ?
            </h2>
            <p className="text-white/70 mb-6">
              Notre équipe est là pour vous aider. Contactez-nous et nous vous répondrons dans les plus brefs délais.
            </p>
            <a 
              href="/contact" 
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
              {s.faq_contact_button}
            </a>
          </Card>
        )}

        {/* No results message */}
        {searchQuery && filteredFaqs.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              Aucune question ne correspond à votre recherche. Essayez d&apos;autres mots-clés ou contactez-nous.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
