import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, DollarSign, TrendingUp, Calendar, RefreshCw,
  CheckCircle, Clock, XCircle, AlertCircle, ArrowUpRight,
  Download, Filter, Search, ChevronLeft, ChevronRight, Eye, Shield
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

const statusConfig = {
  paid: { label: 'Payé', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  failed: { label: 'Échoué', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'Remboursé', color: 'bg-gray-100 text-gray-800', icon: RefreshCw },
};

export default function AdminPayments() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  const isAdmin = user?.email === 'contact@worldautofrance.com' || 
                  user?.email === 'admin@worldautofrance.com' || 
                  user?.is_admin;

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    if (!isAdmin) {
      return;
    }
    fetchStats();
  }, [user, isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      fetchTransactions();
    }
  }, [page, statusFilter, isAdmin]);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/admin/payments/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.append('status', statusFilter);
      
      const response = await axios.get(`${API}/api/admin/payments?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data.transactions);
      setTotalPages(response.data.pages);
      setTotal(response.data.total);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  const viewTransactionDetail = async (transactionId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/api/admin/payments/${transactionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedTransaction(response.data);
      setDetailOpen(true);
    } catch (error) {
      console.error('Error fetching transaction detail:', error);
      toast.error('Erreur lors du chargement des détails');
    }
  };

  const handleRefund = async () => {
    if (!selectedTransaction) return;
    
    setRefundLoading(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/admin/payments/${selectedTransaction.id}/refund`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Remboursement effectué avec succès');
      setDetailOpen(false);
      fetchTransactions();
      fetchStats();
    } catch (error) {
      console.error('Error refunding:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors du remboursement');
    } finally {
      setRefundLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background py-8" data-testid="admin-payments-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Gestion des Paiements</h1>
          <p className="text-muted-foreground">Suivez les transactions et revenus de la plateforme</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600 font-medium">Revenus du jour</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">
                    {statsLoading ? '...' : formatCurrency(stats?.today_revenue)}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    {stats?.today_transactions || 0} transactions
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">Revenus semaine</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">
                    {statsLoading ? '...' : formatCurrency(stats?.week_revenue)}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {stats?.week_transactions || 0} transactions
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600 font-medium">Revenus mois</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">
                    {statsLoading ? '...' : formatCurrency(stats?.month_revenue)}
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    {stats?.month_transactions || 0} transactions
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-600 font-medium">Total revenus</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">
                    {statsLoading ? '...' : formatCurrency(stats?.total_revenue)}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    {stats?.total_transactions || 0} transactions
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Alert */}
        {stats?.pending_count > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <span className="text-yellow-800">
              <strong>{stats.pending_count}</strong> paiement(s) en attente de confirmation
            </span>
          </div>
        )}

        {/* Transactions Table */}
        <Card>
          <CardHeader className="border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-xl">Historique des transactions</CardTitle>
              <div className="flex items-center gap-3">
                <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="paid">Payés</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="failed">Échoués</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => { fetchTransactions(); fetchStats(); }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualiser
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">
                Chargement...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                Aucune transaction trouvée
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Pack</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Montant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Statut</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {transactions.map((tx) => {
                      const status = tx.refunded ? statusConfig.refunded : statusConfig[tx.payment_status] || statusConfig.pending;
                      const StatusIcon = status.icon;
                      
                      return (
                        <tr key={tx.id} className="hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-4 text-sm">
                            {formatDate(tx.created_at)}
                          </td>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-sm">{tx.user?.name || 'Utilisateur inconnu'}</p>
                              <p className="text-xs text-muted-foreground">{tx.user?.email}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm">
                            <span className="font-medium">{tx.package_id}</span>
                            {tx.credits_count && (
                              <span className="text-xs text-muted-foreground ml-2">
                                ({tx.credits_count} crédits)
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4">
                            <span className="font-bold text-lg">{formatCurrency(tx.amount)}</span>
                          </td>
                          <td className="px-4 py-4">
                            <Badge className={`${status.color} gap-1`}>
                              <StatusIcon className="w-3 h-3" />
                              {status.label}
                            </Badge>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => viewTransactionDetail(tx.id)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Détails
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  {total} transaction(s) au total
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm px-3">
                    Page {page} sur {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Détails de la transaction</DialogTitle>
              <DialogDescription>
                Informations complètes sur le paiement
              </DialogDescription>
            </DialogHeader>
            
            {selectedTransaction && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">ID Transaction</p>
                    <p className="font-mono text-sm">{selectedTransaction.id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm">{formatDate(selectedTransaction.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="font-medium">{selectedTransaction.user?.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedTransaction.user?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Montant</p>
                    <p className="font-bold text-xl text-green-600">{formatCurrency(selectedTransaction.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pack</p>
                    <p className="font-medium">{selectedTransaction.package_id}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Crédits</p>
                    <p className="font-medium">{selectedTransaction.credits_count || 0}</p>
                  </div>
                </div>

                {selectedTransaction.stripe_info && (
                  <div className="p-3 bg-secondary/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Informations Stripe</p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Statut:</span>
                        <span className="ml-2 font-medium">{selectedTransaction.stripe_info.payment_status}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Email:</span>
                        <span className="ml-2">{selectedTransaction.stripe_info.customer_email}</span>
                      </div>
                    </div>
                  </div>
                )}

                {selectedTransaction.refunded && (
                  <div className="p-3 bg-gray-100 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">
                      ✓ Remboursé le {formatDate(selectedTransaction.refunded_at)}
                    </p>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDetailOpen(false)}>
                Fermer
              </Button>
              {selectedTransaction && selectedTransaction.payment_status === 'paid' && !selectedTransaction.refunded && (
                <Button
                  variant="destructive"
                  onClick={handleRefund}
                  disabled={refundLoading}
                >
                  {refundLoading ? 'Remboursement...' : 'Rembourser'}
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
