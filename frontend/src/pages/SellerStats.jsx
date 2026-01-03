import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Eye, ShoppingCart, Euro, Star, TrendingUp, Package, 
  CheckCircle, Clock, ArrowRight 
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SellerStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/seller/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Connectez-vous</h2>
          <p className="text-muted-foreground mb-4">Pour voir vos statistiques vendeur.</p>
          <Link to="/auth">
            <Button className="bg-accent hover:bg-accent/90">Se connecter</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Mes statistiques</h1>
            <p className="text-muted-foreground">Tableau de bord vendeur</p>
          </div>
          <Link to="/deposer">
            <Button className="bg-accent hover:bg-accent/90">
              Déposer une annonce
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Annonces actives</p>
                  <p className="text-3xl font-heading font-bold">{stats?.active_listings || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ventes réalisées</p>
                  <p className="text-3xl font-heading font-bold">{stats?.sold_listings || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Revenus totaux</p>
                  <p className="text-3xl font-heading font-bold">{stats?.total_revenue?.toLocaleString('fr-FR') || 0} €</p>
                </div>
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                  <Euro className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vues totales</p>
                  <p className="text-3xl font-heading font-bold">{stats?.total_views?.toLocaleString('fr-FR') || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Commandes totales</p>
                  <p className="text-3xl font-heading font-bold">{stats?.total_orders || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats?.completed_orders || 0} livrées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Note moyenne</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-heading font-bold">{stats?.average_rating || '-'}</p>
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  </div>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {stats?.total_reviews || 0} avis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Annonces totales</p>
                  <p className="text-3xl font-heading font-bold">{stats?.total_listings || 0}</p>
                </div>
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Links */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link to="/dashboard">
            <Card className="hover:border-accent transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium">Mes annonces</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/commandes">
            <Card className="hover:border-accent transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium">Mes commandes</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/messages">
            <Card className="hover:border-accent transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium">Messages</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
          <Link to="/tarifs">
            <Card className="hover:border-accent transition-colors cursor-pointer">
              <CardContent className="p-4 flex items-center justify-between">
                <span className="font-medium">Acheter des crédits</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
