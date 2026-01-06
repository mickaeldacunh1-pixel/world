import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Zap, Star, Crown, Rocket, TrendingUp, Eye, Clock, 
  Check, CreditCard, Gift, Sparkles, Home, Users,
  BarChart3, Shield, HeadphonesIcon, Infinity
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Boost options
const BOOST_OPTIONS = [
  { 
    id: 'boost_24h', 
    name: 'Boost 24h', 
    duration: 1, 
    price: 2.99, 
    icon: Zap,
    color: 'from-blue-500 to-blue-600',
    features: ['En haut des résultats pendant 24h']
  },
  { 
    id: 'boost_7d', 
    name: 'Boost 7 jours', 
    duration: 7, 
    price: 6.99, 
    icon: Star,
    color: 'from-purple-500 to-purple-600',
    popular: true,
    features: ['En haut des résultats', 'Badge "⚡ Boosté"', 'Priorité dans les recherches']
  },
  { 
    id: 'boost_30d', 
    name: 'Boost 30 jours', 
    duration: 30, 
    price: 14.99, 
    icon: Crown,
    color: 'from-amber-500 to-amber-600',
    features: ['En haut des résultats', 'Badge "⚡ Boosté"', 'Mise en avant catégorie', 'Statistiques détaillées']
  },
];

// À la Une options
const FEATURED_OPTIONS = [
  { 
    id: 'featured_24h', 
    name: 'À la Une 24h', 
    duration: 1, 
    price: 4.99, 
    icon: Home,
    color: 'from-green-500 to-green-600',
    features: ['Affiché sur la page d\'accueil']
  },
  { 
    id: 'featured_7d', 
    name: 'À la Une 7 jours', 
    duration: 7, 
    price: 14.99, 
    icon: Rocket,
    color: 'from-pink-500 to-pink-600',
    popular: true,
    features: ['Page d\'accueil', 'Newsletter hebdomadaire', 'Badge "🌟 À la Une"']
  },
  { 
    id: 'featured_30d', 
    name: 'À la Une 30 jours', 
    duration: 30, 
    price: 39.99, 
    icon: Sparkles,
    color: 'from-orange-500 to-orange-600',
    features: ['Page d\'accueil permanente', 'Newsletter', 'Réseaux sociaux', 'Position premium']
  },
];

// Pro subscriptions
const PRO_PLANS = [
  { 
    id: 'pro_starter', 
    name: 'Starter', 
    price: 9.99, 
    period: 'mois',
    icon: Zap,
    color: 'border-blue-500',
    features: [
      { text: '3 boosts / mois', included: true },
      { text: 'Badge Pro vérifié', included: true },
      { text: 'Statistiques basiques', included: true },
      { text: 'À la Une', included: false },
      { text: 'Support prioritaire', included: false },
    ]
  },
  { 
    id: 'pro_business', 
    name: 'Business', 
    price: 24.99, 
    period: 'mois',
    icon: TrendingUp,
    color: 'border-purple-500',
    popular: true,
    features: [
      { text: '10 boosts / mois', included: true },
      { text: 'Badge Pro vérifié', included: true },
      { text: 'Statistiques avancées', included: true },
      { text: '1 À la Une / mois', included: true },
      { text: 'Support prioritaire', included: true },
    ]
  },
  { 
    id: 'pro_premium', 
    name: 'Premium', 
    price: 49.99, 
    period: 'mois',
    icon: Crown,
    color: 'border-amber-500',
    features: [
      { text: 'Boosts illimités', included: true },
      { text: 'Badge Pro vérifié', included: true },
      { text: 'Statistiques complètes', included: true },
      { text: '2 À la Une / semaine', included: true },
      { text: 'Support dédié 24/7', included: true },
      { text: '0% commission', included: true },
    ]
  },
];

export default function Promote() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const listingId = searchParams.get('listing');
  
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(listingId || '');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [userSubscription, setUserSubscription] = useState(null);
  const [userBoosts, setUserBoosts] = useState({ available: 0, featured: 0 });
  const [loyaltyPoints, setLoyaltyPoints] = useState(0);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [listingsRes, subRes, loyaltyRes] = await Promise.all([
        axios.get(`${API}/listings/my`),
        axios.get(`${API}/subscription/me`).catch(() => ({ data: null })),
        axios.get(`${API}/loyalty/me`).catch(() => ({ data: { points: 0 } }))
      ]);
      setListings(listingsRes.data.filter(l => l.status === 'active'));
      setUserSubscription(subRes.data);
      setLoyaltyPoints(loyaltyRes.data?.points || 0);
      
      if (subRes.data) {
        setUserBoosts({
          available: subRes.data.boosts_remaining || 0,
          featured: subRes.data.featured_remaining || 0
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (type, optionId, price) => {
    if (!user) {
      toast.error('Connectez-vous pour continuer');
      navigate('/auth');
      return;
    }

    if ((type === 'boost' || type === 'featured') && !selectedListing) {
      toast.error('Sélectionnez une annonce à promouvoir');
      return;
    }

    setProcessing(true);
    try {
      const response = await axios.post(`${API}/promote/checkout`, {
        type, // 'boost', 'featured', 'subscription'
        option_id: optionId,
        listing_id: selectedListing || null
      });

      // Redirect to Stripe checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du paiement');
      setProcessing(false);
    }
  };

  const handleUseFreeBoost = async (type) => {
    if (!selectedListing) {
      toast.error('Sélectionnez une annonce');
      return;
    }

    setProcessing(true);
    try {
      await axios.post(`${API}/promote/use-free`, {
        type, // 'boost' or 'featured'
        listing_id: selectedListing
      });
      toast.success('Boost appliqué avec succès !');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setProcessing(false);
    }
  };

  const handleUseLoyaltyBoost = async () => {
    if (!selectedListing) {
      toast.error('Sélectionnez une annonce');
      return;
    }

    if (loyaltyPoints < 200) {
      toast.error('Vous avez besoin de 200 points fidélité');
      return;
    }

    setProcessing(true);
    try {
      await axios.post(`${API}/promote/use-loyalty`, {
        listing_id: selectedListing
      });
      toast.success('Boost fidélité appliqué (7 jours) !');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Rocket className="w-16 h-16 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Boostez vos annonces</h2>
          <p className="text-muted-foreground mb-6">
            Connectez-vous pour mettre en avant vos annonces et vendre plus vite !
          </p>
          <Button onClick={() => navigate('/auth')} className="bg-accent hover:bg-accent/90">
            Se connecter
          </Button>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-heading text-3xl font-bold flex items-center justify-center gap-2">
            <Rocket className="w-8 h-8 text-accent" />
            Boostez vos ventes
          </h1>
          <p className="text-muted-foreground mt-2">
            Augmentez la visibilité de vos annonces et vendez plus rapidement
          </p>
        </div>

        {/* Listing selector */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="flex-1 w-full">
                <label className="text-sm font-medium mb-2 block">Sélectionnez une annonce à promouvoir</label>
                <Select value={selectedListing} onValueChange={setSelectedListing}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une annonce..." />
                  </SelectTrigger>
                  <SelectContent>
                    {listings.map((listing) => (
                      <SelectItem key={listing.id} value={listing.id}>
                        {listing.title} - {listing.price}€
                        {listing.is_boosted && ' ⚡'}
                        {listing.is_featured && ' 🌟'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Quick actions if user has free boosts */}
              {(userBoosts.available > 0 || userBoosts.featured > 0 || loyaltyPoints >= 200) && (
                <div className="flex gap-2">
                  {userBoosts.available > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => handleUseFreeBoost('boost')}
                      disabled={!selectedListing || processing}
                    >
                      <Gift className="w-4 h-4 mr-2" />
                      Boost gratuit ({userBoosts.available})
                    </Button>
                  )}
                  {loyaltyPoints >= 200 && (
                    <Button 
                      variant="outline" 
                      onClick={handleUseLoyaltyBoost}
                      disabled={!selectedListing || processing}
                      className="border-accent text-accent"
                    >
                      <Star className="w-4 h-4 mr-2" />
                      200 pts → Boost 7j
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="boost" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="boost" className="gap-2">
              <Zap className="w-4 h-4" />
              Boost
            </TabsTrigger>
            <TabsTrigger value="featured" className="gap-2">
              <Home className="w-4 h-4" />
              À la Une
            </TabsTrigger>
            <TabsTrigger value="pro" className="gap-2">
              <Crown className="w-4 h-4" />
              Packs Pro
            </TabsTrigger>
          </TabsList>

          {/* Boost options */}
          <TabsContent value="boost">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {BOOST_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <Card key={option.id} className={`relative overflow-hidden ${option.popular ? 'ring-2 ring-accent' : ''}`}>
                    {option.popular && (
                      <div className="absolute top-0 right-0 bg-accent text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                        Populaire
                      </div>
                    )}
                    <div className={`h-2 bg-gradient-to-r ${option.color}`} />
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${option.color} text-white`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle>{option.name}</CardTitle>
                          <CardDescription>{option.duration} jour{option.duration > 1 ? 's' : ''}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {option.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-3xl font-bold">{option.price}€</span>
                        </div>
                        <Button 
                          onClick={() => handlePurchase('boost', option.id, option.price)}
                          disabled={processing || !selectedListing}
                          className="bg-accent hover:bg-accent/90"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Acheter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* À la Une options */}
          <TabsContent value="featured">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {FEATURED_OPTIONS.map((option) => {
                const Icon = option.icon;
                return (
                  <Card key={option.id} className={`relative overflow-hidden ${option.popular ? 'ring-2 ring-accent' : ''}`}>
                    {option.popular && (
                      <div className="absolute top-0 right-0 bg-accent text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                        Populaire
                      </div>
                    )}
                    <div className={`h-2 bg-gradient-to-r ${option.color}`} />
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-lg bg-gradient-to-r ${option.color} text-white`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle>{option.name}</CardTitle>
                          <CardDescription>{option.duration} jour{option.duration > 1 ? 's' : ''}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {option.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <div className="flex items-end justify-between">
                        <div>
                          <span className="text-3xl font-bold">{option.price}€</span>
                        </div>
                        <Button 
                          onClick={() => handlePurchase('featured', option.id, option.price)}
                          disabled={processing || !selectedListing}
                          className="bg-accent hover:bg-accent/90"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Acheter
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Pro subscriptions */}
          <TabsContent value="pro">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PRO_PLANS.map((plan) => {
                const Icon = plan.icon;
                const isCurrentPlan = userSubscription?.plan_id === plan.id;
                return (
                  <Card key={plan.id} className={`relative overflow-hidden ${plan.popular ? 'ring-2 ring-accent' : ''} ${isCurrentPlan ? 'bg-accent/5' : ''}`}>
                    {plan.popular && (
                      <div className="absolute top-0 right-0 bg-accent text-white text-xs px-3 py-1 rounded-bl-lg font-medium">
                        Recommandé
                      </div>
                    )}
                    {isCurrentPlan && (
                      <div className="absolute top-0 left-0 bg-green-500 text-white text-xs px-3 py-1 rounded-br-lg font-medium">
                        Actuel
                      </div>
                    )}
                    <CardHeader className="text-center">
                      <div className={`w-16 h-16 mx-auto rounded-full border-4 ${plan.color} flex items-center justify-center mb-4`}>
                        <Icon className="w-8 h-8" />
                      </div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <div className="mt-2">
                        <span className="text-4xl font-bold">{plan.price}€</span>
                        <span className="text-muted-foreground">/{plan.period}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            {feature.included ? (
                              <Check className="w-5 h-5 text-green-500 shrink-0" />
                            ) : (
                              <span className="w-5 h-5 text-gray-300 shrink-0">—</span>
                            )}
                            <span className={!feature.included ? 'text-muted-foreground' : ''}>
                              {feature.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <Button 
                        onClick={() => handlePurchase('subscription', plan.id, plan.price)}
                        disabled={processing || isCurrentPlan}
                        className={`w-full ${isCurrentPlan ? 'bg-green-500' : 'bg-accent hover:bg-accent/90'}`}
                      >
                        {isCurrentPlan ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Plan actif
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4 mr-2" />
                            S'abonner
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* FAQ section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Questions fréquentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium">Quelle est la différence entre Boost et À la Une ?</h4>
              <p className="text-sm text-muted-foreground">
                Le Boost place votre annonce en haut des résultats de recherche. À la Une l'affiche directement sur la page d'accueil pour une visibilité maximale.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Les boosts sont-ils cumulables ?</h4>
              <p className="text-sm text-muted-foreground">
                Oui ! Vous pouvez combiner Boost + À la Une pour maximiser votre visibilité. Les durées s'additionnent.
              </p>
            </div>
            <div>
              <h4 className="font-medium">Comment fonctionne l'abonnement Pro ?</h4>
              <p className="text-sm text-muted-foreground">
                L'abonnement se renouvelle automatiquement chaque mois. Vous recevez vos boosts gratuits au début de chaque période. Annulable à tout moment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
