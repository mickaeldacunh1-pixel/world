import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { 
  Gavel, Clock, Users, TrendingUp, Plus, Eye, Timer, 
  AlertCircle, CheckCircle, XCircle, ArrowUp, History
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const AUCTION_DURATIONS = [
  { value: '24h', label: '24 heures', hours: 24 },
  { value: '48h', label: '48 heures', hours: 48 },
  { value: '7d', label: '7 jours', hours: 168 },
];

export default function Auctions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAuctions();
  }, []);

  const fetchAuctions = async () => {
    try {
      const [allRes, myRes, bidsRes] = await Promise.all([
        axios.get(`${API}/auctions`),
        user ? axios.get(`${API}/auctions/my`) : Promise.resolve({ data: [] }),
        user ? axios.get(`${API}/auctions/my-bids`) : Promise.resolve({ data: [] })
      ]);
      setAuctions(allRes.data);
      setMyAuctions(myRes.data);
      setMyBids(bidsRes.data);
    } catch (error) {
      console.error('Error fetching auctions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;

    if (diff <= 0) return { text: 'Terminée', expired: true };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return { text: `${days}j ${hours}h`, expired: false };
    if (hours > 0) return { text: `${hours}h ${minutes}min`, expired: false, urgent: hours < 2 };
    return { text: `${minutes}min`, expired: false, urgent: true };
  };

  const handleBid = async () => {
    if (!user) {
      toast.error('Connectez-vous pour enchérir');
      navigate('/auth');
      return;
    }

    const amount = parseFloat(bidAmount);
    if (!amount || amount <= selectedAuction.current_price) {
      toast.error(`L'enchère doit être supérieure à ${selectedAuction.current_price}€`);
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/auctions/${selectedAuction.id}/bid`, {
        amount
      });
      toast.success('Enchère placée avec succès !');
      fetchAuctions();
      setSelectedAuction(null);
      setBidAmount('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'enchère');
    } finally {
      setSubmitting(false);
    }
  };

  const AuctionCard = ({ auction, showBidButton = true }) => {
    const timeRemaining = getTimeRemaining(auction.end_time);
    const isMyAuction = auction.seller_id === user?.id;
    const isWinning = auction.highest_bidder_id === user?.id;

    return (
      <Card className={`overflow-hidden transition-all hover:shadow-lg ${timeRemaining.urgent ? 'border-red-500' : ''}`}>
        <div className="relative">
          <img
            src={auction.image || 'https://via.placeholder.com/300x200?text=Pièce+Auto'}
            alt={auction.title}
            className="w-full h-48 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            {timeRemaining.expired ? (
              <Badge variant="secondary">Terminée</Badge>
            ) : timeRemaining.urgent ? (
              <Badge className="bg-red-500 animate-pulse">
                <Timer className="w-3 h-3 mr-1" />
                {timeRemaining.text}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-background">
                <Clock className="w-3 h-3 mr-1" />
                {timeRemaining.text}
              </Badge>
            )}
          </div>
          {isWinning && !timeRemaining.expired && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-green-500">
                <TrendingUp className="w-3 h-3 mr-1" />
                Meilleure offre
              </Badge>
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-1 line-clamp-1">{auction.title}</h3>
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{auction.description}</p>
          
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Prix actuel</p>
              <p className="text-2xl font-bold text-accent">{auction.current_price}€</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Enchères</p>
              <p className="font-semibold flex items-center gap-1">
                <Users className="w-4 h-4" />
                {auction.bid_count || 0}
              </p>
            </div>
          </div>

          {auction.vehicle_info && (
            <p className="text-xs text-muted-foreground mb-3">
              🚗 {auction.vehicle_info}
            </p>
          )}

          {showBidButton && !timeRemaining.expired && !isMyAuction && (
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={() => {
                    setSelectedAuction(auction);
                    setBidAmount((auction.current_price + 5).toString());
                  }}
                >
                  <Gavel className="w-4 h-4 mr-2" />
                  Enchérir
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Placer une enchère</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="bg-secondary p-4 rounded-lg">
                    <p className="font-medium">{auction.title}</p>
                    <p className="text-2xl font-bold text-accent mt-2">
                      Prix actuel : {auction.current_price}€
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Minimum : {auction.current_price + 1}€
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Votre enchère (€)</label>
                    <Input
                      type="number"
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      min={auction.current_price + 1}
                      step="1"
                      className="text-xl font-bold"
                    />
                  </div>

                  <div className="flex gap-2">
                    {[5, 10, 20, 50].map((increment) => (
                      <Button
                        key={increment}
                        variant="outline"
                        size="sm"
                        onClick={() => setBidAmount((auction.current_price + increment).toString())}
                      >
                        +{increment}€
                      </Button>
                    ))}
                  </div>

                  <Button
                    className="w-full bg-accent hover:bg-accent/90"
                    onClick={handleBid}
                    disabled={submitting || parseFloat(bidAmount) <= auction.current_price}
                  >
                    {submitting ? (
                      <>Envoi en cours...</>
                    ) : (
                      <>
                        <Gavel className="w-4 h-4 mr-2" />
                        Confirmer {bidAmount}€
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    Commission de 5% prélevée en cas de victoire
                  </p>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {timeRemaining.expired && (
            <div className="text-center py-2">
              {auction.winner_id === user?.id ? (
                <Badge className="bg-green-500">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Vous avez gagné !
                </Badge>
              ) : auction.winner_id ? (
                <Badge variant="secondary">Vendu à {auction.final_price}€</Badge>
              ) : (
                <Badge variant="outline">Aucune enchère</Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold flex items-center gap-2">
              <Gavel className="w-8 h-8 text-accent" />
              Enchères en direct
            </h1>
            <p className="text-muted-foreground mt-1">
              Pièces rares aux enchères - Faites votre offre !
            </p>
          </div>
          {user && (
            <Button 
              onClick={() => navigate('/deposer?type=auction')}
              className="mt-4 md:mt-0 bg-accent hover:bg-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer une enchère
            </Button>
          )}
        </div>

        <Tabs defaultValue="active" className="space-y-6">
          <TabsList>
            <TabsTrigger value="active" className="gap-2">
              <Gavel className="w-4 h-4" />
              En cours ({auctions.filter(a => !getTimeRemaining(a.end_time).expired).length})
            </TabsTrigger>
            {user && (
              <>
                <TabsTrigger value="my-bids" className="gap-2">
                  <ArrowUp className="w-4 h-4" />
                  Mes enchères ({myBids.length})
                </TabsTrigger>
                <TabsTrigger value="my-auctions" className="gap-2">
                  <History className="w-4 h-4" />
                  Mes ventes ({myAuctions.length})
                </TabsTrigger>
              </>
            )}
            <TabsTrigger value="ended" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Terminées
            </TabsTrigger>
          </TabsList>

          {/* Active auctions */}
          <TabsContent value="active">
            {auctions.filter(a => !getTimeRemaining(a.end_time).expired).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {auctions
                  .filter(a => !getTimeRemaining(a.end_time).expired)
                  .sort((a, b) => new Date(a.end_time) - new Date(b.end_time))
                  .map(auction => (
                    <AuctionCard key={auction.id} auction={auction} />
                  ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Gavel className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Aucune enchère en cours</h3>
                <p className="text-muted-foreground mb-4">
                  Soyez le premier à créer une enchère !
                </p>
                {user && (
                  <Button onClick={() => navigate('/deposer?type=auction')} className="bg-accent hover:bg-accent/90">
                    Créer une enchère
                  </Button>
                )}
              </Card>
            )}
          </TabsContent>

          {/* My bids */}
          <TabsContent value="my-bids">
            {myBids.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myBids.map(auction => (
                  <AuctionCard key={auction.id} auction={auction} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <ArrowUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Aucune enchère placée</h3>
                <p className="text-muted-foreground">
                  Parcourez les enchères actives et faites votre première offre !
                </p>
              </Card>
            )}
          </TabsContent>

          {/* My auctions */}
          <TabsContent value="my-auctions">
            {myAuctions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myAuctions.map(auction => (
                  <AuctionCard key={auction.id} auction={auction} showBidButton={false} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Aucune enchère créée</h3>
                <p className="text-muted-foreground mb-4">
                  Vous avez une pièce rare ? Mettez-la aux enchères !
                </p>
                <Button onClick={() => navigate('/deposer?type=auction')} className="bg-accent hover:bg-accent/90">
                  Créer ma première enchère
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Ended auctions */}
          <TabsContent value="ended">
            {auctions.filter(a => getTimeRemaining(a.end_time).expired).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {auctions
                  .filter(a => getTimeRemaining(a.end_time).expired)
                  .sort((a, b) => new Date(b.end_time) - new Date(a.end_time))
                  .map(auction => (
                    <AuctionCard key={auction.id} auction={auction} showBidButton={false} />
                  ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Aucune enchère terminée</h3>
                <p className="text-muted-foreground">
                  Les enchères terminées apparaîtront ici.
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
