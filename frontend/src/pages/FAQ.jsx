import { useState } from 'react';
import { Card } from '../components/ui/card';
import { ChevronDown, HelpCircle, CreditCard, Package, MessageSquare, Shield, Truck, AlertTriangle } from 'lucide-react';

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
        q: "Comment fonctionne le paiement ?",
        a: "Nous utilisons Stripe pour sécuriser tous les paiements. Vos informations bancaires ne sont jamais stockées sur nos serveurs. Vous pouvez payer par carte bancaire (Visa, Mastercard, etc.)."
      },
      {
        q: "Comment acheter des crédits ?",
        a: "Rendez-vous sur la page Tarifs, choisissez le pack qui vous convient et procédez au paiement. Les crédits sont ajoutés instantanément à votre compte après confirmation du paiement."
      },
      {
        q: "Les crédits sont-ils remboursables ?",
        a: "Les crédits achetés ne sont pas remboursables une fois la transaction effectuée. Cependant, ils n'ont pas de date d'expiration et restent sur votre compte indéfiniment."
      },
      {
        q: "Comment payer un vendeur pour un article ?",
        a: "Contactez le vendeur via la messagerie intégrée pour convenir des modalités de paiement et de livraison. World Auto facilite la mise en relation mais n'intervient pas directement dans les transactions entre acheteurs et vendeurs."
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
        a: "Consultez les avis et notes laissés par d'autres acheteurs sur le profil du vendeur. Les vendeurs PRO sont des professionnels vérifiés. Méfiez-vous des prix anormalement bas."
      },
      {
        q: "Que faire en cas d'arnaque ?",
        a: "Si vous pensez être victime d'une arnaque, contactez-nous immédiatement à contact@worldautofrance.com avec tous les détails (messages, preuves de paiement). Nous prendrons les mesures nécessaires."
      },
      {
        q: "Mes données personnelles sont-elles protégées ?",
        a: "Oui, nous respectons le RGPD et protégeons vos données personnelles. Consultez nos Mentions Légales pour plus d'informations sur notre politique de confidentialité."
      }
    ]
  },
  {
    category: "Litiges",
    icon: AlertTriangle,
    questions: [
      {
        q: "L'article reçu ne correspond pas à l'annonce, que faire ?",
        a: "Contactez d'abord le vendeur via la messagerie pour trouver une solution amiable. Si aucun accord n'est trouvé, vous pouvez faire une demande de retour depuis votre espace Commandes."
      },
      {
        q: "Comment faire une demande de retour ?",
        a: "Rendez-vous dans votre espace Commandes, sélectionnez la commande concernée et cliquez sur \"Demander un retour\". Expliquez le motif de votre demande. Le vendeur sera notifié."
      },
      {
        q: "World Auto intervient-il en cas de litige ?",
        a: "World Auto peut intervenir en tant que médiateur si les deux parties n'arrivent pas à trouver un accord. Cependant, nous vous encourageons à privilégier le dialogue direct avec le vendeur."
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

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
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
