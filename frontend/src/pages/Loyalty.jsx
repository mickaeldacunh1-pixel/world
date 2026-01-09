import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { 
  Gift, Star, Trophy, Crown, Zap, TrendingUp, 
  ShoppingBag, Users, ArrowRight, Sparkles, 
  History, Award, Target, Percent, Copy, Check,
  Share2, UserPlus, Link as LinkIcon, Medal
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Niveaux de fidélité
const LOYALTY_TIERS = [
  { 
    id: 'bronze', 
    name: 'Bronze', 
    minPoints: 0, 
    icon: Award, 
    color: 'from-amber-600 to-amber-800',
    bgColor: 'bg-amber-100',
    textColor: 'text-amber-700',
    benefits: ['1 point par € dépensé', 'Accès aux ventes flash'],
    multiplier: 1
  },
  { 
    id: 'silver', 
    name: 'Argent', 
    minPoints: 500, 
    icon: Star, 
    color: 'from-gray-400 to-gray-600',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    benefits: ['1.5 points par € dépensé', 'Livraison offerte dès 50€', '-5% sur les frais'],
    multiplier: 1.5
  },
  { 
    id: 'gold', 
    name: 'Or', 
    minPoints: 2000, 
    icon: Trophy, 
    color: 'from-yellow-400 to-yellow-600',
    bgColor: 'bg-yellow-100',
    textColor: 'text-yellow-700',
    benefits: ['2 points par € dépensé', 'Livraison offerte', '-10% sur les frais', 'Support prioritaire'],
    multiplier: 2
  },
  { 
    id: 'platinum', 
    name: 'Platine', 
    minPoints: 5000, 
    icon: Crown, 
    color: 'from-purple-400 to-purple-600',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-700',
    benefits: ['3 points par € dépensé', 'Livraison express offerte', '-15% sur les frais', 'Accès VIP', 'Conseiller dédié'],
    multiplier: 3
  }
];

// Récompenses disponibles
const REWARDS = [
  { id: 'discount_5', name: '5€ de réduction', points: 100, type: 'discount', value: 5 },
  { id: 'discount_10', name: '10€ de réduction', points: 180, type: 'discount', value: 10 },
  { id: 'discount_25', name: '25€ de réduction', points: 400, type: 'discount', value: 25 },
  { id: 'discount_50', name: '50€ de réduction', points: 750, type: 'discount', value: 50 },
  { id: 'free_shipping', name: 'Livraison gratuite', points: 150, type: 'shipping', value: 0 },
  { id: 'boost_listing', name: 'Boost annonce 7 jours', points: 200, type: 'boost', value: 7 },
];

export default function Loyalty() {
  const { user } = useAuth();
  const [loyaltyData, setLoyaltyData] = useState(null);
  const [history, setHistory] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  
  // Referral states
  const [referralData, setReferralData] = useState(null);
  const [myReferrals, setMyReferrals] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [copiedReferral, setCopiedReferral] = useState(false);

  useEffect(() => {
    if (user) {
      fetchLoyaltyData();
      fetchReferralData();
    }
  }, [user]);

  const fetchLoyaltyData = async () => {
    try {
      const [dataRes, historyRes, rewardsRes] = await Promise.all([
        axios.get(`${API}/loyalty/me`),
        axios.get(`${API}/loyalty/history`),
        axios.get(`${API}/loyalty/rewards`)
      ]);
      setLoyaltyData(dataRes.data);
      setHistory(historyRes.data);
      setRewards(rewardsRes.data);
    } catch (error) {
      console.error('Error fetching loyalty data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralData = async () => {
    try {
      const [referralRes, myReferralsRes, leaderboardRes] = await Promise.all([
        axios.get(`${API}/referral/me`),
        axios.get(`${API}/referral/my-referrals`),
        axios.get(`${API}/referral/leaderboard`)
      ]);
      setReferralData(referralRes.data);
      setMyReferrals(myReferralsRes.data.referrals || []);
      setLeaderboard(leaderboardRes.data.leaderboard || []);
    } catch (error) {
      console.error('Error fetching referral data:', error);
    }
  };

  const getCurrentTier = () => {
    if (!loyaltyData) return LOYALTY_TIERS[0];
    const points = loyaltyData.lifetime_points || 0;
    return [...LOYALTY_TIERS].reverse().find(t => points >= t.minPoints) || LOYALTY_TIERS[0];
  };

  const getNextTier = () => {
    const currentIndex = LOYALTY_TIERS.findIndex(t => t.id === getCurrentTier().id);
    return LOYALTY_TIERS[currentIndex + 1] || null;
  };

  const getProgressToNextTier = () => {
    const nextTier = getNextTier();
    if (!nextTier || !loyaltyData) return 100;
    const currentTier = getCurrentTier();
    const progress = ((loyaltyData.lifetime_points - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100;
    return Math.min(progress, 100);
  };

  const handleRedeem = async (rewardId) => {
    setRedeemingId(rewardId);
    try {
      const response = await axios.post(`${API}/loyalty/redeem`, { reward_id: rewardId });
      toast.success('Récompense obtenue !');
      setRewards([...rewards, response.data.reward]);
      fetchLoyaltyData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'échange');
    } finally {
      setRedeemingId(null);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success('Code copié !');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const copyReferralCode = () => {
    if (referralData?.referral_code) {
      navigator.clipboard.writeText(referralData.referral_code);
      setCopiedReferral(true);
      toast.success('Code de parrainage copié !');
      setTimeout(() => setCopiedReferral(false), 2000);
    }
  };

  const copyReferralLink = () => {
    if (referralData?.referral_link) {
      navigator.clipboard.writeText(referralData.referral_link);
      toast.success('Lien de parrainage copié !');
    }
  };

  const shareReferral = async () => {
    if (navigator.share && referralData) {
      try {
        await navigator.share({
          title: 'Rejoins World Auto Pro Pro !',
          text: `Utilise mon code ${referralData.referral_code} et reçois ${referralData.rewards_config?.referee_points || 50} points de bienvenue !`,
          url: referralData.referral_link
        });
      } catch (error) {
        copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <Gift className="w-16 h-16 text-accent mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Programme Fidélité</h2>
          <p className="text-muted-foreground mb-6">
            Connectez-vous pour accéder à votre programme fidélité et gagner des récompenses !
          </p>
          <Link to="/auth">
            <Button className="bg-accent hover:bg-accent/90">
              Se connecter
            </Button>
          </Link>
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

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const TierIcon = currentTier.icon;

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header avec niveau actuel */}
        <div className={`rounded-2xl bg-gradient-to-r ${currentTier.color} p-6 md:p-8 text-white mb-8`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 rounded-full p-4">
                <TierIcon className="w-10 h-10" />
              </div>
              <div>
                <p className="text-white/80 text-sm">Votre niveau</p>
                <h1 className="text-3xl font-bold">{currentTier.name}</h1>
                <p className="text-white/80">x{currentTier.multiplier} points sur chaque achat</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-white/80 text-sm">Vos points</p>
              <p className="text-4xl font-bold">{loyaltyData?.points || 0}</p>
              <p className="text-white/80 text-sm">disponibles</p>
            </div>
          </div>

          {/* Progress vers niveau suivant */}
          {nextTier && (
            <div className="mt-6">
              <div className="flex justify-between text-sm mb-2">
                <span>{currentTier.name}</span>
                <span>{nextTier.name} ({nextTier.minPoints} pts)</span>
              </div>
              <Progress value={getProgressToNextTier()} className="h-3 bg-white/20" />
              <p className="text-white/80 text-sm mt-2">
                Plus que {nextTier.minPoints - (loyaltyData?.lifetime_points || 0)} points pour atteindre {nextTier.name} !
              </p>
            </div>
          )}
        </div>

        <Tabs defaultValue="rewards" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="rewards" className="gap-2">
              <Gift className="w-4 h-4" />
              <span className="hidden sm:inline">Récompenses</span>
            </TabsTrigger>
            <TabsTrigger value="referral" className="gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Parrainage</span>
            </TabsTrigger>
            <TabsTrigger value="my-rewards" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Mes codes</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Historique</span>
            </TabsTrigger>
            <TabsTrigger value="tiers" className="gap-2">
              <Trophy className="w-4 h-4" />
              <span className="hidden sm:inline">Niveaux</span>
            </TabsTrigger>
          </TabsList>

          {/* Récompenses disponibles */}
          <TabsContent value="rewards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {REWARDS.map((reward) => (
                <Card key={reward.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 rounded-lg ${reward.type === 'discount' ? 'bg-green-100' : reward.type === 'shipping' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                        {reward.type === 'discount' && <Percent className="w-6 h-6 text-green-600" />}
                        {reward.type === 'shipping' && <ShoppingBag className="w-6 h-6 text-blue-600" />}
                        {reward.type === 'boost' && <Zap className="w-6 h-6 text-purple-600" />}
                      </div>
                      <Badge variant="outline" className="font-bold">
                        {reward.points} pts
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg mb-4">{reward.name}</h3>
                    <Button
                      className="w-full bg-accent hover:bg-accent/90"
                      disabled={(loyaltyData?.points || 0) < reward.points || redeemingId === reward.id}
                      onClick={() => handleRedeem(reward.id)}
                    >
                      {redeemingId === reward.id ? (
                        'Échange en cours...'
                      ) : (loyaltyData?.points || 0) < reward.points ? (
                        `Il vous manque ${reward.points - (loyaltyData?.points || 0)} pts`
                      ) : (
                        'Échanger'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Onglet Parrainage */}
          <TabsContent value="referral">
            <div className="space-y-6">
              {/* Carte principale - Mon code de parrainage */}
              <Card className="overflow-hidden">
                <div className="bg-gradient-to-r from-accent to-orange-500 p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white/20 rounded-full p-3">
                      <UserPlus className="w-8 h-8" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">Parrainez vos amis</h2>
                      <p className="text-white/80">
                        Gagnez {referralData?.rewards_config?.referrer_points || 100} points par filleul !
                      </p>
                    </div>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2">
                        Votre code de parrainage
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 bg-secondary/50 rounded-lg px-4 py-3 font-mono text-xl font-bold text-center">
                          {referralData?.referral_code || '...'}
                        </div>
                        <Button 
                          variant="outline" 
                          onClick={copyReferralCode}
                          className="px-4"
                        >
                          {copiedReferral ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground block mb-2">
                        Ou partagez votre lien
                      </label>
                      <div className="flex gap-2">
                        <Input 
                          readOnly 
                          value={referralData?.referral_link || ''} 
                          className="font-mono text-sm"
                        />
                        <Button 
                          variant="outline" 
                          onClick={copyReferralLink}
                          className="px-4"
                        >
                          <LinkIcon className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button 
                        onClick={shareReferral}
                        className="flex-1 bg-accent hover:bg-accent/90 gap-2"
                      >
                        <Share2 className="w-5 h-5" />
                        Partager
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Statistiques */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 text-center">
                  <div className="bg-accent/10 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Users className="w-7 h-7 text-accent" />
                  </div>
                  <p className="text-3xl font-bold">{referralData?.referral_count || 0}</p>
                  <p className="text-muted-foreground">Filleuls</p>
                </Card>
                <Card className="p-6 text-center">
                  <div className="bg-green-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Sparkles className="w-7 h-7 text-green-600" />
                  </div>
                  <p className="text-3xl font-bold">{referralData?.total_points_earned || 0}</p>
                  <p className="text-muted-foreground">Points gagnés</p>
                </Card>
                <Card className="p-6 text-center">
                  <div className="bg-purple-100 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-7 h-7 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold">+{referralData?.rewards_config?.referrer_points || 100}</p>
                  <p className="text-muted-foreground">Points/filleul</p>
                </Card>
              </div>

              {/* Comment ça marche */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-accent" />
                    Comment ça marche ?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="bg-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-accent">1</span>
                      </div>
                      <h4 className="font-bold mb-1">Partagez votre code</h4>
                      <p className="text-sm text-muted-foreground">
                        Envoyez votre code ou lien à vos amis
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-accent">2</span>
                      </div>
                      <h4 className="font-bold mb-1">Ils s'inscrivent</h4>
                      <p className="text-sm text-muted-foreground">
                        Vos amis créent leur compte avec votre code
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="bg-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-xl font-bold text-accent">3</span>
                      </div>
                      <h4 className="font-bold mb-1">Gagnez des points</h4>
                      <p className="text-sm text-muted-foreground">
                        Vous recevez {referralData?.rewards_config?.referrer_points || 100} points, eux {referralData?.rewards_config?.referee_points || 50} !
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mes filleuls */}
              {myReferrals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-accent" />
                      Mes filleuls ({myReferrals.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {myReferrals.map((referral) => (
                        <div key={referral.id} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-accent/10 rounded-full p-2">
                              <UserPlus className="w-4 h-4 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium">{referral.referee_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(referral.created_at).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge variant="outline" className="bg-green-50 text-green-700">
                              +{referral.points_awarded} pts
                            </Badge>
                            {referral.orders_count > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {referral.orders_count} commande{referral.orders_count > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Leaderboard */}
              {leaderboard.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Medal className="w-5 h-5 text-yellow-500" />
                      Top Parrains
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {leaderboard.map((entry) => (
                        <div key={entry.rank} className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                              entry.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                              entry.rank === 2 ? 'bg-gray-100 text-gray-700' :
                              entry.rank === 3 ? 'bg-orange-100 text-orange-700' :
                              'bg-secondary text-muted-foreground'
                            }`}>
                              {entry.rank}
                            </div>
                            <p className="font-medium">{entry.name}</p>
                          </div>
                          <Badge variant="outline">
                            {entry.referral_count} filleuls
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Si parrainé par quelqu'un */}
              {referralData?.referred_by && (
                <Card className="bg-accent/5 border-accent/20">
                  <CardContent className="p-4 flex items-center gap-3">
                    <Gift className="w-6 h-6 text-accent" />
                    <p>
                      Vous avez été parrainé par <strong>{referralData.referred_by}</strong> et avez reçu{' '}
                      <strong>{referralData.rewards_config?.referee_points || 50} points</strong> de bienvenue !
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Mes récompenses obtenues */}
          <TabsContent value="my-rewards">
            {rewards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rewards.map((reward) => (
                  <Card key={reward.id} className={`${reward.used ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold">{reward.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {reward.used ? 'Utilisé' : `Expire le ${new Date(reward.expires_at).toLocaleDateString('fr-FR')}`}
                        </p>
                      </div>
                      {!reward.used && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyCode(reward.code)}
                          className="gap-2"
                        >
                          {copiedCode === reward.code ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copié !
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              {reward.code}
                            </>
                          )}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Aucune récompense</h3>
                <p className="text-muted-foreground">
                  Échangez vos points contre des récompenses exclusives !
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Historique des points */}
          <TabsContent value="history">
            {history.length > 0 ? (
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {history.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${item.points > 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                            {item.points > 0 ? (
                              <TrendingUp className="w-4 h-4 text-green-600" />
                            ) : (
                              <Gift className="w-4 h-4 text-red-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{item.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                        <span className={`font-bold ${item.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {item.points > 0 ? '+' : ''}{item.points} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="p-12 text-center">
                <History className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Aucun historique</h3>
                <p className="text-muted-foreground">
                  Effectuez votre premier achat pour commencer à gagner des points !
                </p>
              </Card>
            )}
          </TabsContent>

          {/* Niveaux de fidélité */}
          <TabsContent value="tiers">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {LOYALTY_TIERS.map((tier) => {
                const TIcon = tier.icon;
                const isCurrent = tier.id === currentTier.id;
                const isUnlocked = (loyaltyData?.lifetime_points || 0) >= tier.minPoints;
                
                return (
                  <Card 
                    key={tier.id} 
                    className={`overflow-hidden ${isCurrent ? 'ring-2 ring-accent' : ''} ${!isUnlocked ? 'opacity-60' : ''}`}
                  >
                    <div className={`h-2 bg-gradient-to-r ${tier.color}`} />
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-full ${tier.bgColor}`}>
                            <TIcon className={`w-6 h-6 ${tier.textColor}`} />
                          </div>
                          <div>
                            <CardTitle className="flex items-center gap-2">
                              {tier.name}
                              {isCurrent && <Badge className="bg-accent">Actuel</Badge>}
                            </CardTitle>
                            <CardDescription>
                              À partir de {tier.minPoints} points
                            </CardDescription>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-lg font-bold">
                          x{tier.multiplier}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h4 className="font-medium mb-2">Avantages :</h4>
                      <ul className="space-y-2">
                        {tier.benefits.map((benefit, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <Check className="w-4 h-4 text-green-500" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* How it works */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-accent" />
              Comment ça marche ?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-bold mb-1">1. Achetez</h4>
                <p className="text-sm text-muted-foreground">
                  Gagnez des points sur chaque achat. Plus votre niveau est élevé, plus vous gagnez !
                </p>
              </div>
              <div className="text-center">
                <div className="bg-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-bold mb-1">2. Progressez</h4>
                <p className="text-sm text-muted-foreground">
                  Montez de niveau pour débloquer des avantages exclusifs et multiplier vos gains.
                </p>
              </div>
              <div className="text-center">
                <div className="bg-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Gift className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-bold mb-1">3. Profitez</h4>
                <p className="text-sm text-muted-foreground">
                  Échangez vos points contre des réductions, livraisons gratuites et plus encore !
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
