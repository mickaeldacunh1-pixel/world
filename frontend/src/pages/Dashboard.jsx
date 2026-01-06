import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Eye, MessageSquare, CreditCard, Package, Trash2, Edit, TrendingUp, Rocket, Zap, Star, AlertTriangle, Target, Award, ShoppingBag } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusLabels = {
  active: { label: 'Active', variant: 'default' },
  inactive: { label: 'Inactive', variant: 'secondary' },
  sold: { label: 'Vendue', variant: 'outline' },
};

export default function Dashboard() {
  const { user, refreshUser, lastRefresh } = useAuth();
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [lastRefresh]); // Refresh data when lastRefresh changes (after login)

  const fetchData = async () => {
    try {
      // Add cache-busting parameter
      const cacheBuster = `?_t=${Date.now()}`;
      const [statsRes, listingsRes] = await Promise.all([
        axios.get(`${API}/stats/dashboard${cacheBuster}`),
        axios.get(`${API}/my-listings${cacheBuster}`),
      ]);
      setStats(statsRes.data);
      setListings(listingsRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette annonce ?')) return;

    try {
      await axios.delete(`${API}/listings/${listingId}`);
      setListings(listings.filter(l => l.id !== listingId));
      toast.success('Annonce supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const chartData = listings.slice(0, 5).map(l => ({
    name: l.title.slice(0, 15) + '...',
    vues: l.views || 0,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 py-8 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground">Bienvenue, {user?.name}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/tarifs">
              <Button variant="outline" data-testid="buy-credits-btn">
                <CreditCard className="w-4 h-4 mr-2" />
                Acheter des crédits
              </Button>
            </Link>
            <Link to="/deposer">
              <Button className="bg-accent hover:bg-accent/90" data-testid="create-listing-btn">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle annonce
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Annonces actives</p>
                  <p className="text-3xl font-heading font-bold" data-testid="active-listings-count">
                    {stats?.active_listings || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vues totales</p>
                  <p className="text-3xl font-heading font-bold" data-testid="total-views-count">
                    {stats?.total_views || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Eye className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Messages non lus</p>
                  <p className="text-3xl font-heading font-bold" data-testid="unread-messages-count">
                    {stats?.unread_messages || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Crédits restants</p>
                  <p className="text-3xl font-heading font-bold text-accent" data-testid="credits-count">
                    {stats?.credits || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="listings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="listings">Mes annonces</TabsTrigger>
            <TabsTrigger value="stats">Statistiques</TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Mes annonces ({listings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {listings.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Vous n'avez pas encore d'annonces</p>
                    <Link to="/deposer">
                      <Button className="bg-accent hover:bg-accent/90">
                        <Plus className="w-4 h-4 mr-2" />
                        Créer ma première annonce
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Annonce</TableHead>
                          <TableHead>Prix</TableHead>
                          <TableHead>Vues</TableHead>
                          <TableHead>Statut</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {listings.map((listing) => (
                          <TableRow key={listing.id} data-testid={`listing-row-${listing.id}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img
                                  src={listing.images?.[0] || 'https://images.unsplash.com/photo-1767339736233-f4b02c41ee4a?w=100&h=100&fit=crop'}
                                  alt=""
                                  className="w-12 h-12 rounded-lg object-cover"
                                />
                                <div>
                                  <Link 
                                    to={`/annonce/${listing.id}`}
                                    className="font-medium hover:text-accent line-clamp-1"
                                  >
                                    {listing.title}
                                  </Link>
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {listing.category}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {listing.price?.toLocaleString('fr-FR')} €
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4 text-muted-foreground" />
                                {listing.views || 0}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={statusLabels[listing.status]?.variant || 'default'}>
                                {statusLabels[listing.status]?.label || listing.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                {listing.status === 'active' && (
                                  <Link to={`/promouvoir?listing=${listing.id}`}>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className={listing.is_boosted ? 'text-purple-500' : 'text-accent'}
                                      title={listing.is_boosted ? 'Déjà boosté' : 'Booster cette annonce'}
                                    >
                                      <Rocket className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                )}
                                <Link to={`/annonce/edit/${listing.id}`}>
                                  <Button variant="ghost" size="icon">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </Link>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteListing(listing.id)}
                                  data-testid={`delete-listing-${listing.id}`}
                                >
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Stats Tab - PRO Dashboard */}
          <TabsContent value="stats">
            <div className="space-y-6">
              {/* PRO Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-l-4 border-l-green-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Target className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Taux de conversion</p>
                        <p className="text-2xl font-bold">{stats?.conversion_rate || 0}%</p>
                        <p className="text-xs text-muted-foreground">messages / vues</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Eye className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Vues moyennes</p>
                        <p className="text-2xl font-bold">{stats?.avg_views_per_listing || 0}</p>
                        <p className="text-xs text-muted-foreground">par annonce</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Rocket className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Annonces boostées</p>
                        <p className="text-2xl font-bold">{stats?.boosted_count || 0}</p>
                        <p className="text-xs text-muted-foreground">en promotion</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-8 h-8 text-amber-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ventes réalisées</p>
                        <p className="text-2xl font-bold">{stats?.sold_listings || 0}</p>
                        <p className="text-xs text-muted-foreground">annonces vendues</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts and Top Listings */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Vues par annonce */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Vues par annonce
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {chartData.length > 0 ? (
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--card))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px',
                              }}
                            />
                            <Bar dataKey="vues" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-12">
                        Pas encore de données
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Top Annonces */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      Top 5 Annonces
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.top_listings?.length > 0 ? (
                      <div className="space-y-3">
                        {stats.top_listings.map((listing, index) => (
                          <Link 
                            key={listing.id} 
                            to={`/annonce/${listing.id}`}
                            className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                                index === 0 ? 'bg-amber-500 text-white' :
                                index === 1 ? 'bg-gray-400 text-white' :
                                index === 2 ? 'bg-amber-700 text-white' :
                                'bg-secondary text-muted-foreground'
                              }`}>
                                {index + 1}
                              </span>
                              <span className="font-medium text-sm line-clamp-1">{listing.title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="w-4 h-4 text-muted-foreground" />
                              <span className="font-semibold">{listing.views}</span>
                            </div>
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Publiez des annonces pour voir vos performances
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Annonces nécessitant attention */}
              {stats?.listings_needing_attention?.length > 0 && (
                <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="w-5 h-5" />
                      Annonces à optimiser
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Ces annonces ont peu de vues - pensez à les booster ou modifier leur titre/photos
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stats.listings_needing_attention.map((listing) => (
                        <div 
                          key={listing.id}
                          className="p-3 rounded-lg bg-white dark:bg-card border flex items-center justify-between"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{listing.title}</p>
                            <p className="text-xs text-muted-foreground">{listing.views} vues</p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Link to={`/annonce/edit/${listing.id}`}>
                              <Button variant="ghost" size="sm">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link to={`/promouvoir?listing=${listing.id}`}>
                              <Button variant="ghost" size="sm" className="text-purple-500">
                                <Rocket className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Points fidélité */}
              {stats?.loyalty_points > 0 && (
                <Card className="border-accent/50 bg-accent/5">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                          <Star className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Points fidélité</p>
                          <p className="text-2xl font-bold text-accent">{stats.loyalty_points} pts</p>
                        </div>
                      </div>
                      <Link to="/fidelite">
                        <Button variant="outline">
                          Utiliser mes points
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
