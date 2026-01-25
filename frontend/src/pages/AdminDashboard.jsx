import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { 
  Settings, Users, ShoppingCart, Flag, CreditCard, 
  Newspaper, BookOpen, Shield, Package, TrendingUp, Wrench, Loader2, CheckCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { user, token } = useAuth();
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);

  const isAdmin = user?.email === 'contact@worldautofrance.com' || 
                  user?.email === 'admin@worldautofrance.com' || 
                  user?.is_admin;

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Accès réservé</h2>
          <p className="text-muted-foreground mb-4">Cette page est réservée aux administrateurs.</p>
          <Link to="/">
            <button className="bg-accent text-white px-4 py-2 rounded hover:bg-accent/90">
              Retour à l'accueil
            </button>
          </Link>
        </Card>
      </div>
    );
  }

  const adminSections = [
    {
      title: 'Paramètres du site',
      description: 'Personnalisation, couleurs, textes, hero',
      icon: Settings,
      link: '/admin/parametres',
      color: 'bg-blue-500'
    },
    {
      title: 'Utilisateurs',
      description: 'Gérer les comptes, bloquer/débloquer',
      icon: Users,
      link: '/admin/utilisateurs',
      color: 'bg-green-500'
    },
    {
      title: 'Ventes & Reversements',
      description: 'Suivi des ventes, paiements vendeurs',
      icon: ShoppingCart,
      link: '/admin/ventes',
      color: 'bg-orange-500'
    },
    {
      title: 'Signalements',
      description: 'Modérer les contenus signalés',
      icon: Flag,
      link: '/admin/signalements',
      color: 'bg-red-500'
    },
    {
      title: 'Paiements',
      description: 'Historique des transactions Stripe',
      icon: CreditCard,
      link: '/admin/paiements',
      color: 'bg-purple-500'
    },
    {
      title: 'Actualités & Newsletter',
      description: 'Publier des mises à jour, envoyer des emails',
      icon: Newspaper,
      link: '/admin/actualites',
      color: 'bg-teal-500'
    },
    {
      title: 'Guide des ventes',
      description: 'Documentation pour les vendeurs',
      icon: BookOpen,
      link: '/admin/guide-ventes',
      color: 'bg-indigo-500'
    }
  ];

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
            <Shield className="w-8 h-8 text-accent" />
            Administration
          </h1>
          <p className="text-muted-foreground mt-2">
            Bienvenue {user?.name || user?.email}
          </p>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="w-6 h-6 mx-auto mb-2 text-green-500" />
              <p className="text-sm text-muted-foreground">Tableau de bord</p>
            </CardContent>
          </Card>
        </div>

        {/* Grid des sections */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminSections.map((section) => (
            <Link key={section.link} to={section.link}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${section.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <section.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-heading text-lg font-semibold mb-2 group-hover:text-accent transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {section.description}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
