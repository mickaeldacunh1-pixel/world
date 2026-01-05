import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Rocket, Wrench, Bug, Sparkles, ArrowLeft, Calendar } from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UPDATE_TYPES = {
  new: { label: 'Nouveau', icon: Rocket, color: 'bg-green-500' },
  improvement: { label: 'Amélioration', icon: Sparkles, color: 'bg-blue-500' },
  fix: { label: 'Correction', icon: Bug, color: 'bg-orange-500' },
  maintenance: { label: 'Maintenance', icon: Wrench, color: 'bg-gray-500' },
};

// Mises à jour statiques (peut être remplacé par des données dynamiques)
const UPDATES = [
  {
    id: 1,
    date: '2026-01-05',
    version: '2.5.0',
    title: 'Nouvelles fonctionnalités majeures',
    items: [
      { type: 'new', text: 'Restriction des inscriptions aux pays européens fiables' },
      { type: 'new', text: 'Nouveaux packs Pro : 3 mois (99€) et 6 mois (179€)' },
      { type: 'new', text: 'Pack 50 crédits à 39€' },
      { type: 'new', text: 'Page "Toutes les marques" avec logos par pays' },
      { type: 'improvement', text: 'Logos des marques mis à jour' },
    ]
  },
  {
    id: 2,
    date: '2026-01-04',
    version: '2.4.0',
    title: 'Factures et emails',
    items: [
      { type: 'new', text: 'Téléchargement de factures PDF pour vendeurs et acheteurs' },
      { type: 'new', text: 'Email de confirmation automatique à chaque nouvelle annonce' },
      { type: 'new', text: 'Frais de port configurables dans les annonces' },
      { type: 'new', text: 'Page de modification des annonces' },
      { type: 'improvement', text: 'Nom du site mis à jour : World Auto France 🇫🇷' },
    ]
  },
  {
    id: 3,
    date: '2026-01-03',
    version: '2.3.0',
    title: 'Administration et personnalisation',
    items: [
      { type: 'new', text: 'Panel d\'administration complet (couleurs, polices, bannières, sections)' },
      { type: 'new', text: 'Logo personnalisé avec "France" en bleu-blanc-rouge' },
      { type: 'improvement', text: 'Interface d\'administration repensée' },
    ]
  },
  {
    id: 4,
    date: '2026-01-02',
    version: '2.2.0',
    title: 'Système de commandes',
    items: [
      { type: 'new', text: 'Checkout groupé depuis le panier' },
      { type: 'new', text: 'Page de confirmation de commande' },
      { type: 'new', text: 'Notifications email pour vendeurs et acheteurs' },
      { type: 'improvement', text: 'Amélioration du flux de commande' },
    ]
  },
  {
    id: 5,
    date: '2026-01-01',
    version: '2.1.0',
    title: 'Vérification SIRET',
    items: [
      { type: 'new', text: 'Vérification automatique des numéros SIRET pour les professionnels' },
      { type: 'new', text: 'Auto-remplissage du nom d\'entreprise depuis l\'API gouvernementale' },
      { type: 'improvement', text: 'Formulaire d\'inscription professionnel amélioré' },
    ]
  },
  {
    id: 6,
    date: '2025-12-15',
    version: '2.0.0',
    title: 'Lancement World Auto France',
    items: [
      { type: 'new', text: 'Marketplace de pièces détachées automobiles' },
      { type: 'new', text: 'Système de crédits et paiement Stripe' },
      { type: 'new', text: 'Messagerie entre acheteurs et vendeurs' },
      { type: 'new', text: 'Système de favoris' },
      { type: 'new', text: 'Alertes personnalisées' },
      { type: 'new', text: 'Évaluations vendeurs' },
      { type: 'new', text: 'SEO optimisé' },
    ]
  },
];

export default function Updates() {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title="Nouveautés et mises à jour"
        description="Découvrez les dernières fonctionnalités et améliorations de World Auto France. Nous améliorons constamment notre plateforme pour vous offrir la meilleure expérience."
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-accent" />
            Nouveautés
          </h1>
          <p className="text-muted-foreground mt-2">
            Découvrez les dernières fonctionnalités et améliorations de World Auto France
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-8">
          {Object.entries(UPDATE_TYPES).map(([key, { label, icon: Icon, color }]) => (
            <div key={key} className="flex items-center gap-2 text-sm">
              <span className={`w-3 h-3 rounded-full ${color}`}></span>
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* Updates Timeline */}
        <div className="space-y-6">
          {UPDATES.map((update, index) => (
            <Card key={update.id} className="relative overflow-hidden">
              {index === 0 && (
                <div className="absolute top-0 right-0">
                  <Badge className="rounded-none rounded-bl-lg bg-accent">
                    Dernière version
                  </Badge>
                </div>
              )}
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-heading text-xl font-bold">{update.title}</h2>
                    <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(update.date)}
                      </span>
                      <Badge variant="outline">v{update.version}</Badge>
                    </div>
                  </div>
                </div>
                
                <ul className="space-y-2">
                  {update.items.map((item, i) => {
                    const typeInfo = UPDATE_TYPES[item.type];
                    const Icon = typeInfo.icon;
                    return (
                      <li key={i} className="flex items-start gap-3">
                        <span className={`mt-0.5 p-1 rounded ${typeInfo.color}`}>
                          <Icon className="w-3 h-3 text-white" />
                        </span>
                        <span className="text-sm">{item.text}</span>
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Newsletter CTA */}
        <Card className="mt-8 bg-primary text-primary-foreground">
          <CardContent className="p-6 text-center">
            <h3 className="font-heading text-xl font-bold mb-2">
              Restez informé des nouveautés !
            </h3>
            <p className="text-primary-foreground/70 mb-4">
              Inscrivez-vous à notre newsletter pour recevoir les dernières actualités.
            </p>
            <Link 
              to="/newsletter" 
              className="inline-block bg-accent hover:bg-accent/90 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              S'inscrire à la newsletter
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
