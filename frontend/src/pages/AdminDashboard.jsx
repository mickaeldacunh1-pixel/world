import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  ShoppingCart, Users, Package, Euro, TrendingUp, Clock, 
  AlertTriangle, ArrowRight, Loader2
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDashboard() {
  const { token } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [salesRes, usersRes, listingsRes] = await Promise.all([
        axios.get(`${API}/admin/sales/stats`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} })),
        axios.get(`${API}/admin/stats/users`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} })),
        axios.get(`${API}/admin/stats/listings`, { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: {} }))
      ]);
      
      setStats({
        sales: salesRes.data,
        users: usersRes.data,
        listings: listingsRes.data
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const quickStats = [
    {
      title: "Ventes du mois",
      value: `${stats?.sales?.month_revenue?.toFixed(2) || '0.00'} €`,
      subtitle: `${stats?.sales?.month_count || 0} transactions`,
      icon: Euro,
      color: "text-green-600",
      bgColor: "bg-green-100"
    },
    {
      title: "Reversements en attente",
      value: `${stats?.sales?.pending_payouts_amount?.toFixed(2) || '0.00'} €`,
      subtitle: `${stats?.sales?.pending_payouts_count || 0} vendeurs`,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Utilisateurs",
      value: stats?.users?.total || '0',
      subtitle: `${stats?.users?.new_this_month || 0} ce mois`,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Annonces actives",
      value: stats?.listings?.active || '0',
      subtitle: `${stats?.listings?.pending || 0} en attente`,
      icon: Package,
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    }
  ];

  const quickLinks = [
    { label: "Gérer les ventes", path: "/admin/ventes", icon: ShoppingCart },
    { label: "Voir les paiements", path: "/admin/paiements", icon: Euro },
    { label: "Modérer annonces", path: "/admin/annonces", icon: Package },
    { label: "Signalements", path: "/admin/signalements", icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <p className="text-muted-foreground">Vue d'ensemble de WorldAutoFrance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, idx) => (
          <Card key={idx}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Actions rapides</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {quickLinks.map((link, idx) => (
              <Link key={idx} to={link.path}>
                <Button variant="outline" className="w-full justify-between h-auto py-4">
                  <div className="flex items-center gap-3">
                    <link.icon className="w-5 h-5 text-accent" />
                    <span>{link.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {(stats?.sales?.pending_payouts_count > 0 || stats?.listings?.pending > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <div>
                <p className="font-medium text-orange-800">Actions requises</p>
                <ul className="text-sm text-orange-700 mt-1 space-y-1">
                  {stats?.sales?.pending_payouts_count > 0 && (
                    <li>• {stats.sales.pending_payouts_count} reversement(s) en attente ({stats.sales.pending_payouts_amount?.toFixed(2)} €)</li>
                  )}
                  {stats?.listings?.pending > 0 && (
                    <li>• {stats.listings.pending} annonce(s) en attente de modération</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
