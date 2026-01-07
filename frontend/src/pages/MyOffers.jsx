import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { 
  Tag, Inbox, Send, Clock, CheckCircle, XCircle, 
  ArrowLeftRight, Loader2, Eye, MessageSquare 
} from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  accepted: { label: 'Acceptée', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Refusée', color: 'bg-red-100 text-red-700', icon: XCircle },
  countered: { label: 'Contre-offre', color: 'bg-blue-100 text-blue-700', icon: ArrowLeftRight },
  expired: { label: 'Expirée', color: 'bg-gray-100 text-gray-700', icon: Clock },
};

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function OfferCard({ offer, type, onRespond, onAcceptCounter, processing }) {
  const status = STATUS_CONFIG[offer.status] || STATUS_CONFIG.pending;
  const StatusIcon = status.icon;
  const listing = offer.listing || {};
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col sm:flex-row">
          {/* Image */}
          <div className="sm:w-32 h-24 sm:h-auto flex-shrink-0">
            <img
              src={listing.images?.[0] || '/placeholder.jpg'}
              alt={listing.title}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <Link 
                to={`/annonce/${offer.listing_id}`}
                className="font-semibold hover:text-accent line-clamp-1"
              >
                {listing.title || 'Annonce'}
              </Link>
              <Badge className={`${status.color} flex items-center gap-1 flex-shrink-0`}>
                <StatusIcon className="w-3 h-3" />
                {status.label}
              </Badge>
            </div>
            
            {/* Prix */}
            <div className="flex items-center gap-4 text-sm mb-2">
              <span className="text-muted-foreground">
                Prix : <span className="line-through">{offer.original_price?.toFixed(2)} €</span>
              </span>
              <span className="font-bold text-accent">
                Offre : {offer.offered_amount?.toFixed(2)} €
              </span>
              {offer.counter_amount && (
                <span className="font-bold text-blue-600">
                  Contre : {offer.counter_amount?.toFixed(2)} €
                </span>
              )}
            </div>
            
            {/* Message */}
            {offer.message && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                <MessageSquare className="w-3 h-3" />
                {offer.message}
              </p>
            )}
            
            {/* Date et acheteur/vendeur */}
            <div className="text-xs text-muted-foreground">
              {type === 'received' ? `De ${offer.buyer_name}` : `À ${offer.seller_name || 'Vendeur'}`}
              {' • '}
              {formatDate(offer.created_at)}
            </div>
            
            {/* Actions pour les offres reçues */}
            {type === 'received' && offer.status === 'pending' && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onRespond(offer.id, true)}
                  disabled={processing}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accepter
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onRespond(offer.id, 'counter')}
                  disabled={processing}
                >
                  <ArrowLeftRight className="w-4 h-4 mr-1" />
                  Contre-offre
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => onRespond(offer.id, false)}
                  disabled={processing}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Refuser
                </Button>
              </div>
            )}
            
            {/* Actions pour les contre-offres reçues */}
            {type === 'sent' && offer.status === 'countered' && (
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onAcceptCounter(offer.id)}
                  disabled={processing}
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Accepter {offer.counter_amount?.toFixed(2)} €
                </Button>
                <Link to={`/annonce/${offer.listing_id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4 mr-1" />
                    Voir
                  </Button>
                </Link>
              </div>
            )}
            
            {/* Lien pour finaliser si acceptée */}
            {offer.status === 'accepted' && (
              <div className="mt-3">
                <Link to={`/annonce/${offer.listing_id}`}>
                  <Button size="sm" className="bg-accent hover:bg-accent/90">
                    Finaliser
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyOffers() {
  const { token } = useAuth();
  const [receivedOffers, setReceivedOffers] = useState([]);
  const [sentOffers, setSentOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [counterAmount, setCounterAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchOffers = useCallback(async () => {
    try {
      const [received, sent] = await Promise.all([
        axios.get(`${API}/offers/received`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API}/offers/sent`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setReceivedOffers(received.data);
      setSentOffers(sent.data);
    } catch (error) {
      console.error('Error fetching offers:', error);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const handleRespond = async (offerId, action) => {
    if (action === 'counter') {
      const offer = receivedOffers.find(o => o.id === offerId);
      setRespondingTo(offer);
      return;
    }
    
    setProcessing(true);
    try {
      await axios.post(
        `${API}/offers/${offerId}/respond`,
        { accept: action === true, counter_amount: null },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(action === true ? 'Offre acceptée !' : 'Offre refusée');
      fetchOffers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setProcessing(false);
    }
  };

  const handleSendCounter = async () => {
    if (!respondingTo || !counterAmount) return;
    
    setProcessing(true);
    try {
      await axios.post(
        `${API}/offers/${respondingTo.id}/respond`,
        { accept: false, counter_amount: parseFloat(counterAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Contre-offre envoyée !');
      setRespondingTo(null);
      setCounterAmount('');
      fetchOffers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setProcessing(false);
    }
  };

  const handleAcceptCounter = async (offerId) => {
    setProcessing(true);
    try {
      await axios.post(
        `${API}/offers/${offerId}/accept-counter`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Contre-offre acceptée !');
      fetchOffers();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title="Mes Offres"
        description="Gérez vos offres sur World Auto France"
        url="/mes-offres"
        noindex={true}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
            <Tag className="w-8 h-8" />
            Mes Offres
          </h1>
          <p className="text-muted-foreground">Gérez vos négociations</p>
        </div>

        <Tabs defaultValue="received" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Reçues ({receivedOffers.length})
            </TabsTrigger>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Envoyées ({sentOffers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {receivedOffers.length === 0 ? (
              <Card className="p-8 text-center">
                <Inbox className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune offre reçue</p>
              </Card>
            ) : (
              receivedOffers.map(offer => (
                <OfferCard 
                  key={offer.id} 
                  offer={offer} 
                  type="received" 
                  onRespond={handleRespond}
                  onAcceptCounter={handleAcceptCounter}
                  processing={processing}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="sent" className="space-y-4">
            {sentOffers.length === 0 ? (
              <Card className="p-8 text-center">
                <Send className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune offre envoyée</p>
                <Link to="/annonces">
                  <Button className="mt-4 bg-accent hover:bg-accent/90">
                    Parcourir les annonces
                  </Button>
                </Link>
              </Card>
            ) : (
              sentOffers.map(offer => (
                <OfferCard 
                  key={offer.id} 
                  offer={offer} 
                  type="sent"
                  onRespond={handleRespond}
                  onAcceptCounter={handleAcceptCounter}
                  processing={processing}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog Contre-offre */}
      <Dialog open={!!respondingTo} onOpenChange={() => setRespondingTo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Faire une contre-offre</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Offre reçue : {respondingTo?.offered_amount?.toFixed(2)} €
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Votre contre-offre (€)</label>
              <Input
                type="number"
                step="0.01"
                min={respondingTo?.offered_amount || 0}
                value={counterAmount}
                onChange={(e) => setCounterAmount(e.target.value)}
                placeholder={`Min: ${respondingTo?.offered_amount?.toFixed(2)} €`}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondingTo(null)}>
              Annuler
            </Button>
            <Button
              onClick={handleSendCounter}
              disabled={!counterAmount || parseFloat(counterAmount) <= (respondingTo?.offered_amount || 0) || processing}
              className="bg-accent hover:bg-accent/90"
            >
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
