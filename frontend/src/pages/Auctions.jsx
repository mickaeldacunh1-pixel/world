import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '../components/ui/dialog';
import { Switch } from '../components/ui/switch';
import { ScrollArea } from '../components/ui/scroll-area';
import { 
  Gavel, Clock, Users, TrendingUp, Plus, Timer, 
  AlertCircle, CheckCircle, History,
  Heart, ShoppingCart, Zap, Shield, Loader2
} from 'lucide-react';
import { toast } from 'sonner';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Auctions() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [auctions, setAuctions] = useState([]);
  const [myAuctions, setMyAuctions] = useState([]);
  const [myBids, setMyBids] = useState([]);
  const [watchedAuctions, setWatchedAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAuction, setSelectedAuction] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [maxBidAmount, setMaxBidAmount] = useState('');
  const [useAutoBid, setUseAutoBid] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(null);
  const [bidHistory, setBidHistory] = useState([]);

  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const fetchAuctions = useCallback(async () => {
    try {
      const requests = [axios.get(`${API}/api/auctions`)];
      if (user && token) {
        requests.push(
          axios.get(`${API}/api/auctions/my`, { headers }),
          axios.get(`${API}/api/auctions/my-bids`, { headers }),
          axios.get(`${API}/api/auctions/watching`, { headers })
        );
      }
      const responses = await Promise.all(requests);
      setAuctions(responses[0].data);
      if (user && token) {
        setMyAuctions(responses[1]?.data || []);
        setMyBids(responses[2]?.data || []);
        setWatchedAuctions(responses[3]?.data || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }, [user, token]);

  useEffect(() => {
    fetchAuctions();
    const interval = setInterval(fetchAuctions, 30000);
    return () => clearInterval(interval);
  }, [fetchAuctions]);

  const getTimeRemaining = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const diff = end - now;
    if (diff <= 0) return { text: 'Terminée', expired: true };
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    if (days > 0) return { text: `${days}j ${hours}h`, expired: false };
    if (hours > 0) return { text: `${hours}h ${minutes}min`, expired: false, urgent: hours < 2 };
    if (minutes > 5) return { text: `${minutes}min`, expired: false, urgent: true };
    return { text: `${minutes}:${seconds.toString().padStart(2, '0')}`, expired: false, urgent: true, critical: true };
  };

  const handleBid = async () => {
    if (!user) { toast.error('Connectez-vous'); navigate('/auth'); return; }
    const amount = parseFloat(bidAmount);
    const maxAmount = useAutoBid ? parseFloat(maxBidAmount) : null;
    if (!amount || amount <= selectedAuction.current_price) {
      toast.error(`Minimum ${selectedAuction.current_price + 1}€`);
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/auctions/${selectedAuction.id}/bid`, { amount, max_amount: maxAmount }, { headers });
      toast.success('Enchère placée !');
      fetchAuctions();
      setSelectedAuction(null);
      setBidAmount('');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBuyNow = async (auction) => {
    if (!user) { toast.error('Connectez-vous'); navigate('/auth'); return; }
    if (!window.confirm(`Acheter pour ${auction.buy_now_price}€ ?`)) return;
    setSubmitting(true);
    try {
      await axios.post(`${API}/api/auctions/${auction.id}/buy-now`, {}, { headers });
      toast.success('Achat effectué !');
      fetchAuctions();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWatch = async (auction) => {
    if (!user) { toast.error('Connectez-vous'); return; }
    try {
      const res = await axios.post(`${API}/api/auctions/${auction.id}/watch`, {}, { headers });
      toast.success(res.data.message);
      fetchAuctions();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const fetchBidHistory = async (auctionId) => {
    try {
      const res = await axios.get(`${API}/api/auctions/${auctionId}/history`);
      setBidHistory(res.data.bids || []);
      setShowHistory(auctionId);
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const isWatching = (auctionId) => watchedAuctions.some(a => a.id === auctionId);

  const AuctionCard = ({ auction, showBidButton = true }) => {
    const timeRemaining = getTimeRemaining(auction.end_time);
    const isMyAuction = auction.seller_id === user?.id;
    const isWinning = auction.highest_bidder_id === user?.id;

    return (
      <Card className={`overflow-hidden hover:shadow-lg ${timeRemaining.critical ? 'border-red-500' : timeRemaining.urgent ? 'border-orange-500' : ''}`}>
        <div className="relative">
          <img src={auction.image || 'https://via.placeholder.com/300x200'} alt={auction.title} className="w-full h-48 object-cover" />
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <Badge className={timeRemaining.critical ? 'bg-red-500' : timeRemaining.urgent ? 'bg-orange-500' : ''}>
              <Timer className="w-3 h-3 mr-1" />{timeRemaining.text}
            </Badge>
            {auction.snipe_extensions > 0 && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500 text-xs">
                <Shield className="w-3 h-3 mr-1" />+{auction.snipe_extensions}
              </Badge>
            )}
          </div>
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isWinning && !timeRemaining.expired && <Badge className="bg-green-500"><TrendingUp className="w-3 h-3 mr-1" />Leader</Badge>}
            {auction.reserve_price && !auction.reserve_met && <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600"><AlertCircle className="w-3 h-3 mr-1" />Réserve</Badge>}
            {auction.buy_now_price && auction.status === 'active' && <Badge className="bg-purple-500"><Zap className="w-3 h-3 mr-1" />Achat immédiat</Badge>}
          </div>
          {user && !isMyAuction && (
            <button onClick={(e) => { e.stopPropagation(); handleWatch(auction); }} className="absolute bottom-2 right-2 p-2 bg-background/80 rounded-full">
              <Heart className={`w-5 h-5 ${isWatching(auction.id) ? 'text-red-500 fill-red-500' : ''}`} />
            </button>
          )}
        </div>
        <CardContent className="p-4">
          <h3 className="font-bold text-lg mb-1 line-clamp-1">{auction.title}</h3>
          <div className="flex justify-between mb-3">
            <div><p className="text-xs text-muted-foreground">Prix actuel</p><p className="text-2xl font-bold text-accent">{auction.current_price}€</p></div>
            <div className="text-right"><p className="text-xs text-muted-foreground">Enchères</p><p className="font-semibold"><Users className="w-4 h-4 inline" /> {auction.bid_count || 0}</p></div>
          </div>
          {auction.buy_now_price && auction.status === 'active' && (
            <div className="mb-3 p-2 bg-purple-500/10 rounded-lg">
              <p className="text-xs text-purple-600">Achat immédiat : <span className="font-bold">{auction.buy_now_price}€</span></p>
            </div>
          )}
          <div className="flex gap-2">
            {showBidButton && !timeRemaining.expired && !isMyAuction && (
              <>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="flex-1 bg-accent" onClick={() => { setSelectedAuction(auction); setBidAmount((auction.current_price + 5).toString()); }}>
                      <Gavel className="w-4 h-4 mr-2" />Enchérir
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Placer une enchère</DialogTitle><DialogDescription>{auction.title}</DialogDescription></DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div className="bg-secondary p-4 rounded-lg">
                        <p className="text-2xl font-bold text-accent">Prix actuel : {auction.current_price}€</p>
                        <p className="text-sm text-muted-foreground">Minimum : {auction.current_price + 1}€</p>
                      </div>
                      <div><Label>Votre enchère (€)</Label><Input type="number" value={bidAmount} onChange={(e) => setBidAmount(e.target.value)} min={auction.current_price + 1} className="text-xl font-bold" /></div>
                      <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Zap className="w-4 h-4 text-yellow-500" /><Label>Enchère automatique</Label></div><Switch checked={useAutoBid} onCheckedChange={setUseAutoBid} /></div>
                        {useAutoBid && <div><Label className="text-sm text-muted-foreground">Montant maximum</Label><Input type="number" value={maxBidAmount} onChange={(e) => setMaxBidAmount(e.target.value)} placeholder="Ex: 500" /></div>}
                      </div>
                      {auction.anti_snipe && <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-500/10 p-2 rounded"><Shield className="w-4 h-4 text-blue-500" />Protection anti-snipe active</div>}
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setBidAmount((parseFloat(bidAmount) + 5).toString())}>+5€</Button>
                        <Button variant="outline" size="sm" onClick={() => setBidAmount((parseFloat(bidAmount) + 10).toString())}>+10€</Button>
                        <Button variant="outline" size="sm" onClick={() => setBidAmount((parseFloat(bidAmount) + 50).toString())}>+50€</Button>
                      </div>
                      <Button onClick={handleBid} disabled={submitting} className="w-full bg-accent">
                        {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Gavel className="w-4 h-4 mr-2" />}
                        Confirmer {bidAmount}€
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
                {auction.buy_now_price && <Button variant="outline" className="border-purple-500 text-purple-500" onClick={() => handleBuyNow(auction)}><ShoppingCart className="w-4 h-4 mr-1" />{auction.buy_now_price}€</Button>}
              </>
            )}
            <Button variant="ghost" size="icon" onClick={() => fetchBidHistory(auction.id)}><History className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) return <div className="container mx-auto px-4 py-8"><div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-accent" /></div></div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-bold flex items-center gap-2"><Gavel className="w-8 h-8 text-accent" />Enchères</h1><p className="text-muted-foreground mt-1">Trouvez des pièces à prix réduit</p></div>
        {user && <Button onClick={() => navigate('/mes-annonces')} className="bg-accent"><Plus className="w-4 h-4 mr-2" />Créer une enchère</Button>}
      </div>
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 w-full">
          <TabsTrigger value="active"><Gavel className="w-4 h-4 mr-1" />Actives ({auctions.filter(a => a.status === 'active').length})</TabsTrigger>
          {user && <>
            <TabsTrigger value="watching"><Heart className="w-4 h-4 mr-1" />Suivies ({watchedAuctions.length})</TabsTrigger>
            <TabsTrigger value="my-bids"><TrendingUp className="w-4 h-4 mr-1" />Mes enchères ({myBids.length})</TabsTrigger>
            <TabsTrigger value="my-auctions"><Users className="w-4 h-4 mr-1" />Mes ventes ({myAuctions.length})</TabsTrigger>
          </>}
          <TabsTrigger value="ended"><CheckCircle className="w-4 h-4 mr-1" />Terminées</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          {auctions.filter(a => a.status === 'active').length === 0 ? (
            <Card className="p-8 text-center"><Gavel className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p>Aucune enchère active</p></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{auctions.filter(a => a.status === 'active').map(auction => <AuctionCard key={auction.id} auction={auction} />)}</div>
          )}
        </TabsContent>
        <TabsContent value="watching">
          {watchedAuctions.length === 0 ? <Card className="p-8 text-center"><Heart className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p>Aucune enchère suivie</p></Card> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{watchedAuctions.map(a => <AuctionCard key={a.id} auction={a} />)}</div>
          )}
        </TabsContent>
        <TabsContent value="my-bids">
          {myBids.length === 0 ? <Card className="p-8 text-center"><TrendingUp className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p>Vous n'avez pas encore enchéri</p></Card> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{myBids.map(a => <AuctionCard key={a.id} auction={a} />)}</div>
          )}
        </TabsContent>
        <TabsContent value="my-auctions">
          {myAuctions.length === 0 ? <Card className="p-8 text-center"><Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p>Aucune enchère créée</p></Card> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{myAuctions.map(a => <AuctionCard key={a.id} auction={a} showBidButton={false} />)}</div>
          )}
        </TabsContent>
        <TabsContent value="ended">
          {auctions.filter(a => a.status !== 'active').length === 0 ? <Card className="p-8 text-center"><CheckCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" /><p>Aucune enchère terminée</p></Card> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{auctions.filter(a => a.status !== 'active').map(a => <AuctionCard key={a.id} auction={a} showBidButton={false} />)}</div>
          )}
        </TabsContent>
      </Tabs>
      <Dialog open={showHistory !== null} onOpenChange={() => setShowHistory(null)}>
        <DialogContent><DialogHeader><DialogTitle><History className="w-5 h-5 inline mr-2" />Historique</DialogTitle></DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {bidHistory.length === 0 ? <p className="text-center py-8 text-muted-foreground">Aucune enchère</p> : (
              <div className="space-y-2">{bidHistory.map((bid, i) => (
                <div key={bid.id} className={`p-3 rounded-lg ${i === 0 ? 'bg-accent/10 border border-accent' : 'bg-secondary'}`}>
                  <div className="flex justify-between"><div><p className="font-medium">{bid.bidder_name}</p><p className="text-xs text-muted-foreground">{new Date(bid.created_at).toLocaleString('fr-FR')}</p></div>
                    <div className="text-right"><p className={`font-bold ${i === 0 ? 'text-accent' : ''}`}>{bid.amount}€</p>{bid.is_auto && <Badge variant="outline" className="text-xs"><Zap className="w-3 h-3 mr-1" />Auto</Badge>}</div>
                  </div>
                </div>
              ))}</div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
