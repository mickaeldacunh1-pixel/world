import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus, Eye, MessageSquare, CreditCard, Package, Trash2, Edit, TrendingUp, Rocket, Zap, Star, AlertTriangle, Target, Award, ShoppingBag, DollarSign, Percent, Calendar, ArrowUpRight, ArrowDownRight, Wallet, FileDown, Loader2, Warehouse } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Dashboard() {
  const { t } = useTranslation();
  const { user, refreshUser, lastRefresh, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const conversionTracked = useRef(false);

  // Google Ads conversion tracking - exécuté une seule fois après inscription
  useEffect(() => {
    if (!conversionTracked.current && typeof window.gtag === 'function') {
      // Vérifier si c'est une nouvelle inscription (compte créé il y a moins de 5 minutes)
      if (user?.created_at) {
        const createdAt = new Date(user.created_at);
        const now = new Date();
        const diffMinutes = (now - createdAt) / (1000 * 60);
        
        if (diffMinutes < 5) {
          window.gtag('event', 'conversion', {
            'send_to': 'AW-17916289997/EoqVCLixlu8bEM3Hk99C'
          });
          conversionTracked.current = true;
        }
      }
    }
  }, [user]);

  // Dynamic status labels from translations
  const statusLabels = {
    active: { label: t('dashboard.status_active'), variant: 'default' },
    inactive: { label: t('dashboard.status_inactive'), variant: 'secondary' },
    sold: { label: t('dashboard.status_sold'), variant: 'outline' },
  };

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

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const response = await axios.get(`${API}/stats/export-pdf`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `worldautopro_releve_${new Date().toISOString().slice(0,10)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(t('dashboard.export_success'));
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error(t('dashboard.export_error'));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (!window.confirm(t('dashboard.delete_confirm'))) return;

    try {
      await axios.delete(`${API}/listings/${listingId}`);
      setListings(listings.filter(l => l.id !== listingId));
      toast.success(t('dashboard.delete_success'));
    } catch (error) {
      toast.error(t('dashboard.delete_error'));
    }
  };

  const chartData = listings.slice(0, 5).map(l => ({
    name: l.title.slice(0, 15) + '...',
    vues: l.views || 0,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 py-8 flex items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.welcome')}, {user?.name}</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to="/entrepot">
              <Button variant="outline" data-testid="warehouse-btn">
                <Warehouse className="w-4 h-4 mr-2" />
                {t('dashboard.warehouse_btn')}
              </Button>
            </Link>
            <Link to="/tarifs">
              <Button variant="outline" data-testid="buy-credits-btn">
                <CreditCard className="w-4 h-4 mr-2" />
                {t('dashboard.buy_credits_btn')}
              </Button>
            </Link>
            <Link to="/deposer">
              <Button className="bg-accent hover:bg-accent/90" data-testid="create-listing-btn">
                <Plus className="w-4 h-4 mr-2" />
                {t('dashboard.new_listing_btn')}
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
                  <p className="text-sm text-muted-foreground">{t('dashboard.stats_active_listings')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('dashboard.stats_total_views')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('dashboard.stats_unread_messages')}</p>
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
                  <p className="text-sm text-muted-foreground">{t('dashboard.stats_credits')}</p>
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
            <TabsTrigger value="listings">{t('dashboard.tab_listings')}</TabsTrigger>
            <TabsTrigger value="sales">💰 {t('dashboard.tab_sales')}</TabsTrigger>
            <TabsTrigger value="stats">{t('dashboard.tab_stats')}</TabsTrigger>
          </TabsList>

          {/* Listings Tab */}
          <TabsContent value="listings">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">{t('dashboard.listings_title')} ({listings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {listings.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">{t('dashboard.no_listings')}</p>
                    <Link to="/deposer">
                      <Button className="bg-accent hover:bg-accent/90">
                        <Plus className="w-4 h-4 mr-2" />
                        {t('dashboard.create_first_listing')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('dashboard.table_listing')}</TableHead>
                          <TableHead>{t('dashboard.table_price')}</TableHead>
                          <TableHead>{t('dashboard.table_views')}</TableHead>
                          <TableHead>{t('dashboard.table_status')}</TableHead>
                          <TableHead>{t('dashboard.table_date')}</TableHead>
                          <TableHead className="text-right">{t('dashboard.table_actions')}</TableHead>
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
                                    to={`/annonce/${listing.id}/modifier`}
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
                                      title={listing.is_boosted ? t('dashboard.already_boosted') : t('dashboard.boost_listing')}
                                    >
                                      <Rocket className="w-4 h-4" />
                                    </Button>
                                  </Link>
                                )}
                                <Link to={`/annonce/${listing.id}/modifier`}>
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

          {/* Sales Tab - Revenue & Commission Dashboard */}
          <TabsContent value="sales">
            <div className="space-y-6">
              {/* Monthly Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-700 dark:text-green-400">{t('dashboard.sales_monthly_count')}</p>
                        <p className="text-3xl font-heading font-bold text-green-800 dark:text-green-300">
                          {stats?.sales?.monthly_count || 0}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                          {stats?.sales?.monthly_revenue?.toFixed(2) || '0.00'} € {t('dashboard.sales_monthly_gross')}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center">
                        <ShoppingBag className="w-7 h-7 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-blue-200 dark:border-blue-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-700 dark:text-blue-400">{t('dashboard.sales_monthly_net')}</p>
                        <p className="text-3xl font-heading font-bold text-blue-800 dark:text-blue-300">
                          {stats?.sales?.monthly_net?.toFixed(2) || '0.00'} €
                        </p>
                        <p className="text-xs text-blue-600 dark:text-blue-500 mt-1 flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" />
                          {t('dashboard.sales_after_commission')}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                        <Wallet className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 border-orange-200 dark:border-orange-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-orange-700 dark:text-orange-400">{t('dashboard.sales_monthly_commission')}</p>
                        <p className="text-3xl font-heading font-bold text-orange-800 dark:text-orange-300">
                          {stats?.sales?.monthly_commissions?.toFixed(2) || '0.00'} €
                        </p>
                        <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                          {t('dashboard.sales_commission_rate')}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
                        <Percent className="w-7 h-7 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-700 dark:text-purple-400">{t('dashboard.sales_total_history')}</p>
                        <p className="text-3xl font-heading font-bold text-purple-800 dark:text-purple-300">
                          {stats?.sales?.net_revenue?.toFixed(2) || '0.00'} €
                        </p>
                        <p className="text-xs text-purple-600 dark:text-purple-500 mt-1">
                          {stats?.sales?.total_count || 0} {t('dashboard.sales_total_count')}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                        <TrendingUp className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Revenue Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-accent" />
                    {t('dashboard.chart_title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats?.sales?.revenue_chart && stats.sales.revenue_chart.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.sales.revenue_chart}>
                          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip 
                            formatter={(value, name) => {
                              const labels = { revenue: t('dashboard.chart_gross'), net: t('dashboard.chart_net'), commission: t('dashboard.chart_commission') };
                              return [`${value.toFixed(2)} €`, labels[name] || name];
                            }}
                            labelFormatter={(label) => `${t('dashboard.chart_month')} : ${label}`}
                          />
                          <Bar dataKey="revenue" name="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="net" name="net" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="commission" name="commission" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">{t('dashboard.no_sales')}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        {t('dashboard.no_sales_hint')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Commission Info */}
              <Card className="bg-gradient-to-r from-accent/5 to-orange-500/5 border-accent/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                      <Percent className="w-6 h-6 text-accent" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-heading font-semibold mb-2">{t('dashboard.commission_title')}</h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {t('dashboard.commission_desc')}
                      </p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="bg-background rounded-lg p-3 text-center">
                          <p className="text-muted-foreground text-xs">{t('dashboard.commission_example')} 20€</p>
                          <p className="font-bold text-orange-600">1,50€</p>
                          <p className="text-xs text-muted-foreground">({t('dashboard.commission_min')})</p>
                        </div>
                        <div className="bg-background rounded-lg p-3 text-center">
                          <p className="text-muted-foreground text-xs">{t('dashboard.commission_example')} 100€</p>
                          <p className="font-bold text-orange-600">5€</p>
                          <p className="text-xs text-muted-foreground">(5%)</p>
                        </div>
                        <div className="bg-background rounded-lg p-3 text-center">
                          <p className="text-muted-foreground text-xs">{t('dashboard.commission_example')} 500€</p>
                          <p className="font-bold text-orange-600">15€</p>
                          <p className="text-xs text-muted-foreground">({t('dashboard.commission_max')})</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Export PDF Button */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-heading font-semibold mb-1">📄 {t('dashboard.export_title')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('dashboard.export_desc')}
                      </p>
                    </div>
                    <Button 
                      onClick={handleExportPdf} 
                      disabled={exportingPdf}
                      className="bg-accent hover:bg-accent/90"
                    >
                      {exportingPdf ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          {t('dashboard.export_generating')}
                        </>
                      ) : (
                        <>
                          <FileDown className="w-4 h-4 mr-2" />
                          {t('dashboard.export_btn')}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
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
                        <p className="text-xs text-muted-foreground">{t('dashboard.stats_conversion_rate')}</p>
                        <p className="text-2xl font-bold">{stats?.conversion_rate || 0}%</p>
                        <p className="text-xs text-muted-foreground">{t('dashboard.stats_conversion_hint')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Eye className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.stats_avg_views')}</p>
                        <p className="text-2xl font-bold">{stats?.avg_views_per_listing || 0}</p>
                        <p className="text-xs text-muted-foreground">{t('dashboard.stats_avg_views_hint')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-purple-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Rocket className="w-8 h-8 text-purple-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.stats_boosted')}</p>
                        <p className="text-2xl font-bold">{stats?.boosted_count || 0}</p>
                        <p className="text-xs text-muted-foreground">{t('dashboard.stats_boosted_hint')}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-amber-500">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-8 h-8 text-amber-500" />
                      <div>
                        <p className="text-xs text-muted-foreground">{t('dashboard.stats_sold')}</p>
                        <p className="text-2xl font-bold">{stats?.sold_listings || 0}</p>
                        <p className="text-xs text-muted-foreground">{t('dashboard.stats_sold_hint')}</p>
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
                      {t('dashboard.views_per_listing')}
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
                        {t('dashboard.no_data')}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Top Annonces */}
                <Card>
                  <CardHeader>
                    <CardTitle className="font-heading flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" />
                      {t('dashboard.top_listings_title')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.top_listings?.length > 0 ? (
                      <div className="space-y-3">
                        {stats.top_listings.map((listing, index) => (
                          <Link 
                            key={listing.id} 
                            to={`/annonce/${listing.id}/modifier`}
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
                        {t('dashboard.publish_listings_hint')}
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
                      {t('dashboard.listings_needing_attention')}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {t('dashboard.listings_needing_attention_hint')}
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
                            <p className="text-xs text-muted-foreground">{listing.views} {t('dashboard.table_views').toLowerCase()}</p>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Link to={`/annonce/${listing.id}/modifier`}>
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
                          <p className="text-sm text-muted-foreground">{t('dashboard.loyalty_points')}</p>
                          <p className="text-2xl font-bold text-accent">{stats.loyalty_points} pts</p>
                        </div>
                      </div>
                      <Link to="/fidelite">
                        <Button variant="outline">
                          {t('dashboard.use_points')}
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
