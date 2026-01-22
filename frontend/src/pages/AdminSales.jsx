import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { Checkbox } from '../components/ui/checkbox';
import {
  Euro, TrendingUp, Clock, CheckCircle, Download, Search,
  Wallet, Users, ArrowRight, AlertCircle, RefreshCw, CreditCard,
  Building, User, FileText
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminSales() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState(null);
  const [sellerPayouts, setSellerPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSales, setSelectedSales] = useState([]);
  const [filters, setFilters] = useState({
    status: '',
    payout_status: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [activeTab, setActiveTab] = useState('sales'); // 'sales' or 'payouts'

  useEffect(() => {
    if (!user?.is_admin) {
      navigate('/');
      return;
    }
    fetchData();
  }, [user, page, filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchSales(),
        fetchStats(),
        fetchSellerPayouts()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchSales = async () => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', 20);
    if (filters.status) params.append('status', filters.status);
    if (filters.payout_status) params.append('payout_status', filters.payout_status);

    const response = await axios.get(`${API}/admin/sales?${params}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setSales(response.data.orders);
    setTotalPages(response.data.pages);
  };

  const fetchStats = async () => {
    const response = await axios.get(`${API}/admin/sales/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setStats(response.data);
  };

  const fetchSellerPayouts = async () => {
    try {
      const response = await axios.get(`${API}/payouts/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSellerPayouts(response.data.sellers || []);
    } catch (error) {
      console.error('Error fetching payouts:', error);
      toast.error('Erreur lors du chargement des reversements');
    }
  };

  const handleMarkPayout = async (orderId) => {
    try {
      // Trouver le vendeur associé à cette commande
      const order = sales.find(s => s.id === orderId);
      if (!order) {
        toast.error('Commande non trouvée');
        return;
      }
      
      const response = await axios.post(`${API}/payouts/process`, {
        seller_id: order.seller_id,
        order_ids: [orderId]
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.method === 'stripe_connect') {
        toast.success(`Reversement Stripe effectué: ${response.data.amount}€`);
      } else if (response.data.method === 'bank_transfer') {
        toast.success(`Demande de virement créée: ${response.data.amount}€`);
      } else {
        toast.success('Reversement traité');
      }
      
      fetchData();
      fetchSellerPayouts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du reversement');
    }
  };

  const handleProcessSellerPayout = async (sellerId) => {
    try {
      const response = await axios.post(`${API}/payouts/process`, {
        seller_id: sellerId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.method === 'stripe_connect') {
        toast.success(`✅ Reversement Stripe Connect: ${response.data.amount?.toFixed(2)}€`);
      } else if (response.data.method === 'bank_transfer') {
        toast.success(`📋 Demande de virement bancaire créée: ${response.data.amount?.toFixed(2)}€`, {
          description: 'À effectuer manuellement via votre banque'
        });
      }
      
      fetchData();
      fetchSellerPayouts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du reversement');
    }
  };

  const handleBatchPayout = async () => {
    if (selectedSales.length === 0) {
      toast.error('Sélectionnez au moins une vente');
      return;
    }
    try {
      // Grouper par vendeur
      const sellerOrders = {};
      selectedSales.forEach(orderId => {
        const order = sales.find(s => s.id === orderId);
        if (order) {
          if (!sellerOrders[order.seller_id]) {
            sellerOrders[order.seller_id] = [];
          }
          sellerOrders[order.seller_id].push(orderId);
        }
      });
      
      const sellerIds = Object.keys(sellerOrders);
      const response = await axios.post(`${API}/payouts/process-batch`, {
        seller_ids: sellerIds
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success(response.data.message || `Traitement de ${sellerIds.length} vendeur(s) lancé`);
      setSelectedSales([]);
      
      // Rafraîchir après un délai pour laisser le temps au traitement
      setTimeout(() => {
        fetchData();
        fetchSellerPayouts();
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const pendingIds = sales
        .filter(s => s.status === 'paid' && s.payout_status === 'pending')
        .map(s => s.id);
      setSelectedSales(pendingIds);
    } else {
      setSelectedSales([]);
    }
  };

  const handleSelectOne = (orderId, checked) => {
    if (checked) {
      setSelectedSales([...selectedSales, orderId]);
    } else {
      setSelectedSales(selectedSales.filter(id => id !== orderId));
    }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Article', 'Acheteur', 'Vendeur', 'Prix', 'Commission', 'À reverser', 'Statut paiement', 'Statut reversement'];
    const rows = sales.map(s => [
      new Date(s.created_at).toLocaleDateString('fr-FR'),
      s.listing_title,
      s.buyer?.name || s.buyer_email,
      s.seller?.name || s.seller?.company_name || s.seller_email,
      `${s.listing_price}€`,
      `${s.commission?.toFixed(2)}€`,
      `${s.seller_amount?.toFixed(2)}€`,
      s.status,
      s.payout_status
    ]);
    
    const csv = [headers, ...rows].map(row => row.join(';')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ventes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending_payment: { variant: 'outline', label: 'En attente paiement', className: 'border-yellow-500 text-yellow-600' },
      paid: { variant: 'default', label: 'Payé', className: 'bg-green-600' },
      reserved: { variant: 'outline', label: 'Réservé', className: 'border-blue-500 text-blue-600' },
      shipped: { variant: 'default', label: 'Expédié', className: 'bg-blue-600' },
      delivered: { variant: 'default', label: 'Livré', className: 'bg-green-700' },
      cancelled: { variant: 'destructive', label: 'Annulé', className: '' },
    };
    const style = styles[status] || { variant: 'outline', label: status, className: '' };
    return <Badge variant={style.variant} className={style.className}>{style.label}</Badge>;
  };

  const getPayoutBadge = (status) => {
    if (status === 'completed') {
      return <Badge className="bg-green-600"><CheckCircle className="w-3 h-3 mr-1" /> Versé</Badge>;
    }
    return <Badge variant="outline" className="border-orange-500 text-orange-600"><Clock className="w-3 h-3 mr-1" /> En attente</Badge>;
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Gestion des Ventes</h1>
            <p className="text-muted-foreground">Ventes par CB et reversements aux vendeurs</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={() => navigate('/admin/guide-ventes')}>
              <FileText className="w-4 h-4 mr-2" />
              Guide PDF
            </Button>
            <Button variant="outline" onClick={fetchData}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Ventes totales</p>
                    <p className="text-2xl font-bold">{stats.total_sales?.toFixed(2)} €</p>
                    <p className="text-xs text-muted-foreground">{stats.sales_count} ventes</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <Euro className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Commissions (5%)</p>
                    <p className="text-2xl font-bold text-accent">{stats.total_commission?.toFixed(2)} €</p>
                    <p className="text-xs text-muted-foreground">Votre revenu</p>
                  </div>
                  <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-accent" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">À reverser</p>
                    <p className="text-2xl font-bold text-orange-600">{stats.pending_payouts_amount?.toFixed(2)} €</p>
                    <p className="text-xs text-muted-foreground">{stats.pending_payouts_count} reversements</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Déjà reversé</p>
                    <p className="text-2xl font-bold text-green-600">{stats.completed_payouts_amount?.toFixed(2)} €</p>
                    <p className="text-xs text-muted-foreground">{stats.completed_payouts_count} virements</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button 
            variant={activeTab === 'sales' ? 'default' : 'outline'}
            onClick={() => setActiveTab('sales')}
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Toutes les ventes
          </Button>
          <Button 
            variant={activeTab === 'payouts' ? 'default' : 'outline'}
            onClick={() => setActiveTab('payouts')}
          >
            <Wallet className="w-4 h-4 mr-2" />
            Reversements par vendeur
            {stats?.pending_payouts_count > 0 && (
              <Badge className="ml-2 bg-orange-500">{stats.pending_payouts_count}</Badge>
            )}
          </Button>
        </div>

        {activeTab === 'sales' && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-4 items-center">
                  <Select value={filters.status} onValueChange={(v) => setFilters({...filters, status: v})}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Statut paiement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="pending_payment">En attente</SelectItem>
                      <SelectItem value="paid">Payé</SelectItem>
                      <SelectItem value="shipped">Expédié</SelectItem>
                      <SelectItem value="delivered">Livré</SelectItem>
                      <SelectItem value="cancelled">Annulé</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filters.payout_status} onValueChange={(v) => setFilters({...filters, payout_status: v})}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Statut reversement" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tous</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="completed">Effectué</SelectItem>
                    </SelectContent>
                  </Select>

                  {selectedSales.length > 0 && (
                    <Button onClick={handleBatchPayout} className="ml-auto bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marquer {selectedSales.length} reversement(s) effectué(s)
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Sales Table */}
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox 
                          onCheckedChange={handleSelectAll}
                          checked={selectedSales.length > 0 && selectedSales.length === sales.filter(s => s.status === 'paid' && s.payout_status === 'pending').length}
                        />
                      </TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Article</TableHead>
                      <TableHead>Acheteur</TableHead>
                      <TableHead>Vendeur</TableHead>
                      <TableHead className="text-right">Prix</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                      <TableHead className="text-right">À reverser</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Reversement</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sales.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {sale.status === 'paid' && sale.payout_status === 'pending' && (
                            <Checkbox 
                              checked={selectedSales.includes(sale.id)}
                              onCheckedChange={(checked) => handleSelectOne(sale.id, checked)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(sale.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">
                          {sale.listing_title}
                        </TableCell>
                        <TableCell className="text-sm">
                          {sale.buyer?.name || sale.buyer_email}
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            {sale.seller?.is_pro ? (
                              <Building className="w-3 h-3 text-blue-500" />
                            ) : (
                              <User className="w-3 h-3 text-gray-400" />
                            )}
                            {sale.seller?.company_name || sale.seller?.name || sale.seller_email}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">{sale.listing_price?.toFixed(2)} €</TableCell>
                        <TableCell className="text-right text-accent">{sale.commission?.toFixed(2)} €</TableCell>
                        <TableCell className="text-right font-medium">{sale.seller_amount?.toFixed(2)} €</TableCell>
                        <TableCell>{getStatusBadge(sale.status)}</TableCell>
                        <TableCell>{getPayoutBadge(sale.payout_status)}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => { setSelectedOrder(sale); setShowDetail(true); }}
                          >
                            Détails
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {sales.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                          Aucune vente trouvée
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Précédent
                </Button>
                <span className="flex items-center px-4">Page {page} / {totalPages}</span>
                <Button 
                  variant="outline" 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}

        {activeTab === 'payouts' && (
          <div className="space-y-4">
            {sellerPayouts.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>Aucun reversement en attente</p>
                </CardContent>
              </Card>
            ) : (
              sellerPayouts.map((seller) => (
                <Card key={seller._id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${seller.seller?.is_pro ? 'bg-blue-100' : 'bg-gray-100'}`}>
                          {seller.seller?.is_pro ? (
                            <Building className="w-5 h-5 text-blue-600" />
                          ) : (
                            <User className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold">{seller.seller?.company_name || seller.seller?.name || 'Vendeur inconnu'}</h3>
                          <p className="text-sm text-muted-foreground">{seller.seller?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">{seller.total_pending?.toFixed(2)} €</p>
                        <p className="text-sm text-muted-foreground">{seller.orders_count} vente(s)</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {seller.seller?.iban ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-green-800">
                          <strong>IBAN:</strong> {seller.seller.iban}<br/>
                          {seller.seller.bic && <><strong>BIC:</strong> {seller.seller.bic}<br/></>}
                          {seller.seller.account_holder && <><strong>Titulaire:</strong> {seller.seller.account_holder}</>}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-amber-800 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          IBAN non renseigné - Contactez le vendeur
                        </p>
                      </div>
                    )}
                    
                    {/* Badge Stripe Connect */}
                    {seller.has_stripe_connect && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-purple-800 flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <strong>Stripe Connect activé</strong> - Reversement automatique disponible
                        </p>
                      </div>
                    )}

                    <div className="space-y-2">
                      {seller.orders.map((order) => (
                        <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{order.listing_title}</p>
                            <p className="text-xs text-muted-foreground">
                              {order.paid_at && new Date(order.paid_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{order.seller_amount?.toFixed(2)} €</p>
                            <p className="text-xs text-muted-foreground">
                              (comm: {order.commission?.toFixed(2)} €)
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button 
                      className="w-full mt-4 bg-green-600 hover:bg-green-700"
                      onClick={() => handleProcessSellerPayout(seller.seller_id)}
                    >
                      {seller.has_stripe_connect ? (
                        <>
                          <CreditCard className="w-4 h-4 mr-2" />
                          Payer via Stripe ({seller.total_pending?.toFixed(2)} €)
                        </>
                      ) : seller.has_bank_details ? (
                        <>
                          <Building className="w-4 h-4 mr-2" />
                          Créer demande virement ({seller.total_pending?.toFixed(2)} €)
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Traiter reversement ({seller.total_pending?.toFixed(2)} €)
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Detail Modal */}
        <Dialog open={showDetail} onOpenChange={setShowDetail}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Détails de la vente</DialogTitle>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Article</h4>
                  <p>{selectedOrder.listing_title}</p>
                  <p className="text-2xl font-bold">{selectedOrder.listing_price?.toFixed(2)} €</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Acheteur</h4>
                    <p>{selectedOrder.buyer?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.buyer?.email}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Vendeur</h4>
                    <p>{selectedOrder.seller?.company_name || selectedOrder.seller?.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedOrder.seller?.email}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Livraison</h4>
                  <p>{selectedOrder.buyer_address}</p>
                  <p>{selectedOrder.buyer_postal} {selectedOrder.buyer_city}</p>
                </div>

                <div className="bg-secondary rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span>Prix de vente</span>
                    <span className="font-medium">{selectedOrder.listing_price?.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between mb-2 text-accent">
                    <span>Commission ({selectedOrder.commission_percent || 5}%)</span>
                    <span>-{selectedOrder.commission?.toFixed(2)} €</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t font-bold">
                    <span>À reverser au vendeur</span>
                    <span>{selectedOrder.seller_amount?.toFixed(2)} €</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Statut paiement</p>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Statut reversement</p>
                    {getPayoutBadge(selectedOrder.payout_status)}
                  </div>
                </div>

                {selectedOrder.status === 'paid' && selectedOrder.payout_status === 'pending' && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      handleMarkPayout(selectedOrder.id);
                      setShowDetail(false);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Marquer le reversement comme effectué
                  </Button>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
