import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Package, Download, Truck, CheckCircle, RotateCcw, Clock, AlertCircle, Star } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const statusConfig = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  confirmed: { label: 'Confirmée', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  shipped: { label: 'Expédiée', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Livrée', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  return_requested: { label: 'Retour demandé', color: 'bg-red-100 text-red-800', icon: RotateCcw },
  returned: { label: 'Retournée', color: 'bg-gray-100 text-gray-800', icon: RotateCcw },
};

const returnReasons = [
  "Article non conforme à la description",
  "Article endommagé à la réception",
  "Pièce incompatible avec mon véhicule",
  "Erreur de commande",
  "Autre raison"
];

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [returnReason, setReturnReason] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewOrder, setReviewOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewedOrders, setReviewedOrders] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        axios.get(`${API}/orders`),
        axios.get(`${API}/returns`)
      ]);
      setOrders(ordersRes.data);
      setReturns(returnsRes.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadShippingSlip = async (orderId) => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}/shipping-slip`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bordereau_expedition_WA-${orderId.slice(0, 8).toUpperCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Bordereau téléchargé !');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const downloadInvoice = async (orderId) => {
    try {
      const response = await axios.get(`${API}/orders/${orderId}/invoice`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `facture_WA-${orderId.slice(0, 8).toUpperCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Facture téléchargée !');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const downloadReturnSlip = async (returnId) => {
    try {
      const response = await axios.get(`${API}/returns/${returnId}/slip`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bordereau_retour_RET-${returnId.slice(0, 8).toUpperCase()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Bordereau de retour téléchargé !');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API}/orders/${orderId}/status?status=${status}`);
      toast.success('Statut mis à jour !');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    }
  };

  const handleReturnRequest = async () => {
    if (!returnReason) {
      toast.error('Veuillez sélectionner un motif');
      return;
    }

    setSubmittingReturn(true);
    try {
      await axios.post(`${API}/orders/${selectedOrder.id}/return`, {
        order_id: selectedOrder.id,
        reason: returnReason,
        notes: returnNotes
      });
      toast.success('Demande de retour envoyée !');
      setReturnDialogOpen(false);
      setSelectedOrder(null);
      setReturnReason('');
      setReturnNotes('');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la demande');
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleSubmitReview = async () => {
    setSubmittingReview(true);
    try {
      await axios.post(`${API}/reviews`, {
        order_id: reviewOrder.id,
        rating: reviewRating,
        comment: reviewComment || null
      });
      toast.success('Avis publié ! Merci pour votre retour.');
      setReviewDialogOpen(false);
      setReviewOrder(null);
      setReviewRating(5);
      setReviewComment('');
      setReviewedOrders([...reviewedOrders, reviewOrder.id]);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la publication');
    } finally {
      setSubmittingReview(false);
    }
  };

  const openReviewDialog = (order) => {
    setReviewOrder(order);
    setReviewRating(5);
    setReviewComment('');
    setReviewDialogOpen(true);
  };

  const sellerOrders = orders.filter(o => o.role === 'seller');
  const buyerOrders = orders.filter(o => o.role === 'buyer');

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 py-8 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8" data-testid="orders-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Mes Commandes</h1>
            <p className="text-muted-foreground">Gérez vos ventes et achats</p>
          </div>
        </div>

        <Tabs defaultValue="sales" className="space-y-6">
          <TabsList>
            <TabsTrigger value="sales" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Mes Ventes ({sellerOrders.length})
            </TabsTrigger>
            <TabsTrigger value="purchases" className="flex items-center gap-2">
              <Truck className="w-4 h-4" />
              Mes Achats ({buyerOrders.length})
            </TabsTrigger>
            <TabsTrigger value="returns" className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4" />
              Retours ({returns.length})
            </TabsTrigger>
          </TabsList>

          {/* Ventes */}
          <TabsContent value="sales">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Mes Ventes</CardTitle>
              </CardHeader>
              <CardContent>
                {sellerOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucune vente pour le moment</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sellerOrders.map((order) => {
                      const StatusIcon = statusConfig[order.status]?.icon || Clock;
                      return (
                        <div
                          key={order.id}
                          className="border rounded-lg p-4 hover:border-accent/50 transition-colors"
                          data-testid={`order-${order.id}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={statusConfig[order.status]?.color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig[order.status]?.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  WA-{order.id.slice(0, 8).toUpperCase()}
                                </span>
                              </div>
                              <h3 className="font-medium">{order.listing_title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Acheteur: {order.buyer_name} • {order.buyer_city}
                              </p>
                              <p className="font-heading font-bold text-accent mt-1">
                                {order.price?.toLocaleString('fr-FR')} €
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {/* Télécharger bordereau */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => downloadShippingSlip(order.id)}
                                data-testid={`download-slip-${order.id}`}
                              >
                                <Download className="w-4 h-4 mr-1" />
                                Bordereau
                              </Button>
                              
                              {/* Marquer comme expédié */}
                              {order.status === 'confirmed' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, 'shipped')}
                                  className="bg-accent hover:bg-accent/90"
                                >
                                  <Truck className="w-4 h-4 mr-1" />
                                  Marquer expédié
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Commandé le {new Date(order.created_at).toLocaleDateString('fr-FR')}
                            {order.shipped_at && ` • Expédié le ${new Date(order.shipped_at).toLocaleDateString('fr-FR')}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Achats */}
          <TabsContent value="purchases">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Mes Achats</CardTitle>
              </CardHeader>
              <CardContent>
                {buyerOrders.length === 0 ? (
                  <div className="text-center py-12">
                    <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun achat pour le moment</p>
                    <Link to="/annonces">
                      <Button className="mt-4">Parcourir les annonces</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {buyerOrders.map((order) => {
                      const StatusIcon = statusConfig[order.status]?.icon || Clock;
                      return (
                        <div
                          key={order.id}
                          className="border rounded-lg p-4 hover:border-accent/50 transition-colors"
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={statusConfig[order.status]?.color}>
                                  <StatusIcon className="w-3 h-3 mr-1" />
                                  {statusConfig[order.status]?.label}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  WA-{order.id.slice(0, 8).toUpperCase()}
                                </span>
                              </div>
                              <h3 className="font-medium">{order.listing_title}</h3>
                              <p className="text-sm text-muted-foreground">
                                Vendeur: {order.seller_name}
                              </p>
                              <p className="font-heading font-bold text-accent mt-1">
                                {order.price?.toLocaleString('fr-FR')} €
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {/* Confirmer réception */}
                              {order.status === 'shipped' && (
                                <Button
                                  size="sm"
                                  onClick={() => updateOrderStatus(order.id, 'delivered')}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Confirmer réception
                                </Button>
                              )}
                              
                              {/* Demander retour */}
                              {(order.status === 'shipped' || order.status === 'delivered') && (
                                <Dialog open={returnDialogOpen && selectedOrder?.id === order.id} onOpenChange={(open) => {
                                  setReturnDialogOpen(open);
                                  if (open) setSelectedOrder(order);
                                }}>
                                  <DialogTrigger asChild>
                                    <Button variant="outline" size="sm">
                                      <RotateCcw className="w-4 h-4 mr-1" />
                                      Retourner
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Demande de retour</DialogTitle>
                                    </DialogHeader>
                                    <div className="space-y-4 mt-4">
                                      <div>
                                        <Label>Motif du retour *</Label>
                                        <Select value={returnReason} onValueChange={setReturnReason}>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un motif" />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {returnReasons.map((reason) => (
                                              <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label>Commentaire (optionnel)</Label>
                                        <Textarea
                                          placeholder="Décrivez le problème..."
                                          value={returnNotes}
                                          onChange={(e) => setReturnNotes(e.target.value)}
                                          rows={3}
                                        />
                                      </div>
                                      <Button
                                        onClick={handleReturnRequest}
                                        disabled={submittingReturn}
                                        className="w-full"
                                      >
                                        {submittingReturn ? 'Envoi...' : 'Envoyer la demande'}
                                      </Button>
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}

                              {/* Laisser un avis */}
                              {order.status === 'delivered' && !reviewedOrders.includes(order.id) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openReviewDialog(order)}
                                  className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                                >
                                  <Star className="w-4 h-4 mr-1" />
                                  Laisser un avis
                                </Button>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Commandé le {new Date(order.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Retours */}
          <TabsContent value="returns">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Retours
                </CardTitle>
              </CardHeader>
              <CardContent>
                {returns.length === 0 ? (
                  <div className="text-center py-12">
                    <RotateCcw className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Aucun retour</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {returns.map((ret) => (
                      <div
                        key={ret.id}
                        className="border border-red-200 bg-red-50/50 rounded-lg p-4"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className="bg-red-100 text-red-800">
                                Retour en cours
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                RET-{ret.id.slice(0, 8).toUpperCase()}
                              </span>
                            </div>
                            <h3 className="font-medium">{ret.listing_title}</h3>
                            <p className="text-sm text-red-600 mt-1">
                              Motif: {ret.reason}
                            </p>
                            {ret.notes && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {ret.notes}
                              </p>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReturnSlip(ret.id)}
                            className="border-red-300 text-red-700 hover:bg-red-100"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Bordereau retour
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Demandé le {new Date(ret.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Laisser un avis</DialogTitle>
            </DialogHeader>
            {reviewOrder && (
              <div className="space-y-4 mt-4">
                <div>
                  <p className="font-medium">{reviewOrder.listing_title}</p>
                  <p className="text-sm text-muted-foreground">Vendeur: {reviewOrder.seller_name}</p>
                </div>
                
                <div>
                  <Label>Note *</Label>
                  <div className="flex gap-2 mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none"
                      >
                        <Star
                          className={`w-8 h-8 transition-colors ${
                            star <= reviewRating
                              ? 'text-yellow-500 fill-yellow-500'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {reviewRating === 1 && 'Très mauvais'}
                    {reviewRating === 2 && 'Mauvais'}
                    {reviewRating === 3 && 'Moyen'}
                    {reviewRating === 4 && 'Bien'}
                    {reviewRating === 5 && 'Excellent'}
                  </p>
                </div>
                
                <div>
                  <Label>Commentaire (optionnel)</Label>
                  <Textarea
                    placeholder="Partagez votre expérience avec ce vendeur..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <Button
                  onClick={handleSubmitReview}
                  disabled={submittingReview}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  {submittingReview ? 'Publication...' : 'Publier l\'avis'}
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
