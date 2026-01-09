import { useState } from 'react';
import { Card } from '../components/ui/card';
import { ChevronDown, HelpCircle, CreditCard, Package, MessageSquare, Shield, Truck, AlertTriangle, Video } from 'lucide-react';
import SEO, { createFAQSchema } from '../components/SEO';

const faqs = [
  {
    category: "Annonces",
    icon: Package,
    questions: [
      {
        q: "Comment créer une annonce ?",
        a: "Pour créer une annonce, connectez-vous à votre compte, cliquez sur \"Déposer une annonce\" et remplissez le formulaire avec les détails de votre pièce ou véhicule. Ajoutez des photos de qualité pour attirer plus d'acheteurs. Vous devez avoir des crédits pour publier une annonce."
      },
      {
        q: "Combien coûte la publication d'une annonce ?",
        a: "La publication d'une annonce coûte 1 crédit. Vous pouvez acheter des packs de crédits sur notre page Tarifs : Pack Starter (5 crédits), Pack Pro (15 crédits), Pack Business (30 crédits) ou Pack Premium (50 crédits). Plus le pack est grand, plus le prix par crédit est avantageux."
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
        q: "Quelle est la commission prélevée par World Auto Pro Pro ?",
        a: "World Auto Pro Pro prélève une commission de 5% sur chaque vente effectuée via le paiement sécurisé. Cette commission est uniquement à la charge du vendeur. L'acheteur paie le prix affiché + les frais de livraison."
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
        a: "Rendez-vous sur la page Tarifs, choisissez le pack qui vous convient et procédez au paiement. Les crédits sont ajoutés instantanément à votre compte après confirmation du paiement. Les crédits n'ont pas de date d'expiration."
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
        a: "La livraison est organisée entre l'acheteur et le vendeur. Vous pouvez convenir d'une remise en main propre ou d'un envoi par transporteur (Colissimo, Mondial Relay, Chronopost, etc.). Le vendeur peut générer un bordereau d'expédition depuis son espace."
      },
      {
        q: "Qui paie les frais de livraison ?",
        a: "Les frais de livraison sont généralement à la charge de l'acheteur, sauf accord contraire avec le vendeur. Discutez-en avant de finaliser l'achat."
      },
      {
        q: "Comment suivre ma commande ?",
        a: "Une fois l'article expédié, le vendeur doit mettre à jour le statut de la commande. Vous recevrez une notification par email avec les informations de suivi si disponibles."
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
        q: "World Auto Pro Pro peut-il bloquer un vendeur ?",
        a: "Oui, en cas de litiges répétés, de comportement frauduleux ou de non-respect de nos conditions, nous pouvons suspendre ou supprimer définitivement un compte vendeur. Les fonds en attente peuvent être gelés le temps de l'enquête."
      }
    ]
  }
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState({});

  const toggleItem = (categoryIndex, questionIndex) => {
    const key = `${categoryIndex}-${questionIndex}`;
    setOpenItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Prepare FAQ data for schema
  const allFaqs = faqs.flatMap(cat => 
    cat.questions.map(q => ({ question: q.q, answer: q.a }))
  );

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <SEO
        title="FAQ - Foire Aux Questions"
        description="Trouvez les réponses à vos questions sur World Auto Pro Pro : annonces, paiements, livraison, messagerie et sécurité."
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
          <h1 className="font-heading text-4xl font-bold mb-4">Foire Aux Questions</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Trouvez rapidement des réponses à vos questions. Si vous ne trouvez pas ce que vous cherchez, 
            n'hésitez pas à nous contacter.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <Card key={category.category} className="overflow-hidden animate-fade-in-up" style={{ animationDelay: `${categoryIndex * 0.1}s` }}>
              {/* Category Header */}
              <div className="bg-primary/5 px-6 py-4 border-b">
                <h2 className="font-heading text-xl font-bold flex items-center gap-3">
                  <category.icon className="w-6 h-6 text-accent" />
                  {category.category}
                </h2>
              </div>

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
        <Card className="mt-12 p-8 text-center bg-gradient-to-r from-primary to-slate-800 text-white animate-fade-in-up">
          <h2 className="font-heading text-2xl font-bold mb-3">
            Vous n'avez pas trouvé votre réponse ?
          </h2>
          <p className="text-white/70 mb-6">
            Notre équipe est là pour vous aider. Contactez-nous et nous vous répondrons dans les plus brefs délais.
          </p>
          <a 
            href="/contact" 
            className="inline-flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            Nous contacter
          </a>
        </Card>
      </div>
    </div>
  );
}
