import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, CreditCard, Zap, Video, Flame } from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Pricing() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [packages, setPackages] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    fetchPricing();
  }, []);

  const fetchPricing = async () => {
    try {
      const response = await axios.get(`${API}/pricing`);
      setPackages(response.data);
    } catch (error) {
      console.error('Error fetching pricing:', error);
    }
  };

  const handleBuyPackage = async (packageId) => {
    if (!user) {
      toast.error(t('common.login_required', 'Connectez-vous pour acheter un pack'));
      return;
    }

    setLoading(prev => ({ ...prev, [packageId]: true }));
    try {
      const response = await axios.post(`${API}/payments/checkout?package_id=${packageId}`);
      window.location.href = response.data.url;
    } catch (error) {
      toast.error('Erreur lors de l\'initialisation du paiement');
    } finally {
      setLoading(prev => ({ ...prev, [packageId]: false }));
    }
  };

  const pricingFeatures = {
    single: [
      '1 crédit = 1 annonce',
      'Valable 30 jours',
      '6 photos par annonce',
      'Messagerie intégrée',
    ],
    pack3: [
      '3 crédits',
      'Valable 30 jours',
      '8 photos par annonce',
      'Messagerie intégrée',
      '🎯 Idéal pour débuter',
    ],
    pack5: [
      '5 crédits',
      'Valable 30 jours',
      '10 photos par annonce',
      'Support par email',
      '🏷️ -20% par annonce',
    ],
    pack20: [
      '20 crédits',
      'Valable 30 jours',
      '15 photos par annonce',
      'Support prioritaire',
      '🎁 +50 points fidélité',
      '🏷️ -38% par annonce',
    ],
    pack50: [
      '50 crédits',
      'Valable 30 jours',
      '20 photos par annonce',
      'Support prioritaire',
      '🎁 +150 points fidélité',
      '🏷️ -61% par annonce',
      '⭐ Populaire',
    ],
    pack100: [
      '100 crédits',
      'Valable 60 jours',
      '25 photos par annonce',
      'Support VIP',
      '🎁 +400 points fidélité',
      '🏷️ -66% par annonce',
      '⭐ Meilleur rapport qualité/prix',
    ],
    pro_monthly: [
      '30 crédits/mois',
      '50 photos par annonce',
      'Badge PRO vérifié',
      'Statistiques avancées',
      'Support VIP',
    ],
    pro_3months: [
      '100 crédits (3 mois)',
      '50 photos par annonce',
      'Badge PRO vérifié',
      'Statistiques avancées',
      'Support VIP',
      '🏷️ -20% vs mensuel',
    ],
    pro_6months: [
      '200 crédits (6 mois)',
      '50 photos par annonce',
      'Badge PRO vérifié',
      'Statistiques avancées',
      'Support VIP',
      '🏷️ -32% vs mensuel',
    ],
    pro_annual: [
      '500 crédits (1 an)',
      '50 photos par annonce',
      'Badge PRO vérifié',
      'Statistiques avancées',
      'Support VIP dédié',
      '🏷️ -45% vs mensuel',
      '⭐ Meilleure économie',
    ],
    pro_trial: [
      '10 crédits offerts',
      '14 jours d\'essai',
      '50 photos par annonce',
      'Badge PRO vérifié',
      'Toutes les fonctionnalités Pro',
      '🎁 GRATUIT - Sans engagement',
    ],
    // Video packages
    video_extended: [
      'Durée max : 2 minutes',
      'Taille max : 100 Mo',
      'Format MP4 optimisé',
      '1 crédit utilisable',
    ],
    video_intermediate: [
      'Durée max : 3 minutes',
      'Taille max : 150 Mo',
      'Format MP4 HD',
      '1 crédit utilisable',
      '🎬 Idéal pour présentation',
    ],
    video_pro: [
      'Durée max : 10 minutes',
      'Taille max : 500 Mo',
      'Format MP4 Full HD',
      '1 crédit utilisable',
      '🎬 Présentation complète',
      '⭐ Pour professionnels',
    ],
    // Video boost
    video_boost_1h: [
      'Diffusion : 1 heure',
      'Page d\'accueil',
      'Lecteur vidéo principal',
      'Visibilité maximale',
    ],
    video_boost_24h: [
      'Diffusion : 24 heures',
      'Page d\'accueil',
      'Lecteur vidéo principal',
      'Priorité d\'affichage',
      '🏷️ -58% vs tarif horaire',
      '⭐ Meilleur rapport',
    ],
  };

  const handleBuyVideoPackage = async (packageType) => {
    if (!user) {
      toast.error('Connectez-vous pour acheter un forfait vidéo');
      return;
    }

    setLoading(prev => ({ ...prev, [packageType]: true }));
    try {
      const response = await axios.post(`${API}/video/package/checkout?package=${packageType}`);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error('Erreur lors de l\'initialisation du paiement');
    } finally {
      setLoading(prev => ({ ...prev, [packageType]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 py-12" data-testid="pricing-page">
      <SEO
        title="Tarifs"
        description="Découvrez nos packs de crédits pour publier vos annonces sur World Auto Pro. Des tarifs simples et transparents pour particuliers et professionnels."
        keywords="tarifs annonces auto, prix publication annonce, crédits world auto, pack annonces"
        url="/tarifs"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">Tarifs</Badge>
          <h1 className="font-heading text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Des tarifs simples et transparents
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Choisissez le pack qui correspond à vos besoins. 
            Tous les packs incluent la publication d&apos;annonces pendant 30 jours.
          </p>
        </div>

        {/* Current credits */}
        {user && (
          <Card className="mb-8 bg-accent/10 border-accent/20">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-accent-foreground" />
                </div>
                <div>
                  <p className="font-medium">Vos crédits actuels</p>
                  <p className="text-3xl font-heading font-bold text-accent">{user.credits || 0}</p>
                </div>
              </div>
              <Link to="/deposer">
                <Button className="bg-accent hover:bg-accent/90">
                  Déposer une annonce
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Pricing Cards - Particuliers */}
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold mb-6 text-center">
            📦 Packs Crédits
            <span className="block text-sm font-normal text-muted-foreground mt-1">Pour les particuliers - Paiement unique</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Single */}
            <Card className="relative card-hover" data-testid="package-single">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg">1 Crédit</CardTitle>
                <CardDescription className="text-xs">Ponctuel</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-4">
                  <span className="text-3xl font-heading font-black">2€</span>
                </div>
                <ul className="space-y-1.5">
                  {pricingFeatures.single.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-accent flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  className="w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => handleBuyPackage('single')}
                  disabled={loading.single}
                  data-testid="buy-single"
                >
                  {loading.single ? '...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pack 3 - Starter */}
            <Card className="relative card-hover border-blue-200" data-testid="package-pack3">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <Badge variant="secondary" className="text-xs">Débutant</Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg">Pack 3</CardTitle>
                <CardDescription className="text-xs">1,67€/annonce</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-4">
                  <span className="text-3xl font-heading font-black">5€</span>
                </div>
                <ul className="space-y-1.5">
                  {pricingFeatures.pack3.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-accent flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  className="w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => handleBuyPackage('pack3')}
                  disabled={loading.pack3}
                  data-testid="buy-pack3"
                >
                  {loading.pack3 ? '...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pack 5 */}
            <Card className="relative card-hover" data-testid="package-pack5">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg">Pack 5</CardTitle>
                <CardDescription className="text-xs">1,60€/annonce</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-4">
                  <span className="text-3xl font-heading font-black">8€</span>
                </div>
                <ul className="space-y-1.5">
                  {pricingFeatures.pack5.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-accent flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  className="w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => handleBuyPackage('pack5')}
                  disabled={loading.pack5}
                  data-testid="buy-pack5"
                >
                  {loading.pack5 ? '...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pack 20 */}
            <Card className="relative card-hover" data-testid="package-pack20">
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg">Pack 20</CardTitle>
                <CardDescription className="text-xs">1,25€/annonce</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-4">
                  <span className="text-3xl font-heading font-black">25€</span>
                </div>
                <ul className="space-y-1.5">
                  {pricingFeatures.pack20.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-accent flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  className="w-full"
                  variant="outline"
                  size="sm"
                  onClick={() => handleBuyPackage('pack20')}
                  disabled={loading.pack20}
                  data-testid="buy-pack20"
                >
                  {loading.pack20 ? '...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pack 50 - Popular */}
            <Card className="relative card-hover border-accent shadow-md" data-testid="package-pack50">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <Badge className="bg-accent text-accent-foreground text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Populaire
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg">Pack 50</CardTitle>
                <CardDescription className="text-xs">0,78€/annonce</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-4">
                  <span className="text-3xl font-heading font-black">39€</span>
                </div>
                <ul className="space-y-1.5">
                  {pricingFeatures.pack50.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-accent flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  className="w-full bg-accent hover:bg-accent/90"
                  size="sm"
                  onClick={() => handleBuyPackage('pack50')}
                  disabled={loading.pack50}
                  data-testid="buy-pack50"
                >
                  {loading.pack50 ? '...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pack 100 - Best Value */}
            <Card className="relative card-hover border-green-500 shadow-lg" data-testid="package-pack100">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                <Badge className="bg-green-500 text-white text-xs">
                  ⭐ Meilleur rapport
                </Badge>
              </div>
              <CardHeader className="pb-2">
                <CardTitle className="font-heading text-lg">Pack 100</CardTitle>
                <CardDescription className="text-xs">0,69€/annonce</CardDescription>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="mb-4">
                  <span className="text-3xl font-heading font-black">69€</span>
                </div>
                <ul className="space-y-1.5">
                  {pricingFeatures.pack100.map((feature, i) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                      <span className="text-xs">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  size="sm"
                  onClick={() => handleBuyPackage('pack100')}
                  disabled={loading.pack100}
                  data-testid="buy-pack100"
                >
                  {loading.pack100 ? '...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Essai Gratuit PRO */}
        <Card className="mb-8 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-300">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                  <Flame className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl">🎁 Essai PRO Gratuit - 14 jours</h3>
                  <p className="text-muted-foreground">10 crédits offerts + toutes les fonctionnalités PRO. Sans engagement.</p>
                </div>
              </div>
              <Button
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                onClick={() => handleBuyPackage('pro_trial')}
                disabled={loading.pro_trial}
                data-testid="buy-pro-trial"
              >
                {loading.pro_trial ? 'Chargement...' : 'Commencer l\'essai gratuit'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Abonnements PRO */}
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold mb-6 text-center">
            🏢 Abonnements Pro
            <span className="block text-sm font-normal text-muted-foreground mt-1">Pour les professionnels - Crédits renouvelés automatiquement</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* Pro 1 mois */}
            <Card className="relative card-hover bg-primary text-primary-foreground" data-testid="package-pro-monthly">
              <CardHeader>
                <CardTitle className="font-heading text-primary-foreground">Pro Mensuel</CardTitle>
                <CardDescription className="text-primary-foreground/70">30 crédits/mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">29€</span>
                  <span className="text-primary-foreground/70">/mois</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.pro_monthly.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => handleBuyPackage('pro_monthly')}
                  disabled={loading.pro_monthly}
                  data-testid="buy-pro-monthly"
                >
                  {loading.pro_monthly ? 'Chargement...' : 'Souscrire'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro 3 mois - Popular */}
            <Card className="relative card-hover bg-primary text-primary-foreground border-2 border-accent" data-testid="package-pro-3months">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-accent text-accent-foreground">
                  <Zap className="w-3 h-3 mr-1" />
                  Populaire
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="font-heading text-primary-foreground">Pro Trimestriel</CardTitle>
                <CardDescription className="text-primary-foreground/70">100 crédits (3 mois)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">69€</span>
                  <span className="text-primary-foreground/70 ml-2 line-through">87€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.pro_3months.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => handleBuyPackage('pro_3months')}
                  disabled={loading.pro_3months}
                  data-testid="buy-pro-3months"
                >
                  {loading.pro_3months ? 'Chargement...' : 'Souscrire'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro 6 mois */}
            <Card className="relative card-hover bg-primary text-primary-foreground" data-testid="package-pro-6months">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-green-500 text-white">
                  🏷️ -32%
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="font-heading text-primary-foreground">Pro Semestriel</CardTitle>
                <CardDescription className="text-primary-foreground/70">200 crédits (6 mois)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">119€</span>
                  <span className="text-primary-foreground/70 ml-2 line-through">174€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.pro_6months.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
                  onClick={() => handleBuyPackage('pro_6months')}
                  disabled={loading.pro_6months}
                  data-testid="buy-pro-6months"
                >
                  {loading.pro_6months ? 'Chargement...' : 'Souscrire'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pro Annuel - Best Value */}
            <Card className="relative card-hover bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500" data-testid="package-pro-annual">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-yellow-500 text-yellow-900">
                  ⭐ Meilleure économie
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="font-heading">Pro Annuel</CardTitle>
                <CardDescription>500 crédits (1 an)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">199€</span>
                  <span className="text-muted-foreground ml-2 line-through">348€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.pro_annual.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-yellow-500 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-yellow-500 hover:bg-yellow-600 text-yellow-900"
                  onClick={() => handleBuyPackage('pro_annual')}
                  disabled={loading.pro_annual}
                  data-testid="buy-pro-annual"
                >
                  {loading.pro_annual ? 'Chargement...' : 'Souscrire'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Forfaits Vidéo */}
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold mb-6 text-center">
            🎬 Forfaits Vidéo
            <span className="block text-sm font-normal text-muted-foreground mt-1">Ajoutez une vidéo à votre annonce</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Vidéo Étendue */}
            <Card className="relative card-hover" data-testid="package-video-extended">
              <CardHeader>
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                  <Video className="w-5 h-5 text-blue-600" />
                </div>
                <CardTitle className="font-heading">Vidéo Étendue</CardTitle>
                <CardDescription>2 minutes max</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">1€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.video_extended.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => handleBuyVideoPackage('extended')}
                  disabled={loading.extended}
                  data-testid="buy-video-extended"
                >
                  {loading.extended ? 'Chargement...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>

            {/* Vidéo Intermédiaire - Populaire */}
            <Card className="relative card-hover border-2 border-accent" data-testid="package-video-intermediate">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-accent text-accent-foreground">
                  <Zap className="w-3 h-3 mr-1" />
                  Populaire
                </Badge>
              </div>
              <CardHeader>
                <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center mb-2">
                  <Video className="w-5 h-5 text-accent" />
                </div>
                <CardTitle className="font-heading">Vidéo Intermédiaire</CardTitle>
                <CardDescription>3 minutes max</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">2,99€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.video_intermediate.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={() => handleBuyVideoPackage('intermediate')}
                  disabled={loading.intermediate}
                  data-testid="buy-video-intermediate"
                >
                  {loading.intermediate ? 'Chargement...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>

            {/* Vidéo PRO */}
            <Card className="relative card-hover bg-gradient-to-br from-purple-600 to-purple-800 text-white" data-testid="package-video-pro">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-yellow-500 text-yellow-900">
                  ⭐ PRO
                </Badge>
              </div>
              <CardHeader>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <Video className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="font-heading text-white">Vidéo PRO</CardTitle>
                <CardDescription className="text-white/70">10 minutes max</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">9,99€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.video_pro.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-white text-purple-700 hover:bg-white/90"
                  onClick={() => handleBuyVideoPackage('pro')}
                  disabled={loading.pro}
                  data-testid="buy-video-pro"
                >
                  {loading.pro ? 'Chargement...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Boost Vidéo Homepage */}
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold mb-6 text-center">
            🔥 Boost Vidéo Homepage
            <span className="block text-sm font-normal text-muted-foreground mt-1">Diffusez votre vidéo sur la page d&apos;accueil</span>
          </h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Boost 1h */}
            <Card className="relative card-hover bg-gradient-to-br from-orange-500 to-red-500 text-white" data-testid="package-boost-1h">
              <CardHeader>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="font-heading text-white">Boost 1 heure</CardTitle>
                <CardDescription className="text-white/70">Visibilité express</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">0,50€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.video_boost_1h.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-white flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-white text-orange-600 hover:bg-white/90"
                  disabled
                >
                  Depuis votre annonce
                </Button>
              </CardFooter>
            </Card>

            {/* Boost 24h */}
            <Card className="relative card-hover bg-gradient-to-br from-orange-600 to-red-600 text-white border-2 border-yellow-400" data-testid="package-boost-24h">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-yellow-400 text-yellow-900">
                  ⭐ Meilleur choix
                </Badge>
              </div>
              <CardHeader>
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mb-2">
                  <Flame className="w-5 h-5 text-white" />
                </div>
                <CardTitle className="font-heading text-white">Boost 24 heures</CardTitle>
                <CardDescription className="text-white/70">Visibilité maximale</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">5€</span>
                  <span className="text-sm text-white/70 ml-2 line-through">12€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.video_boost_24h.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-white text-orange-600 hover:bg-white/90"
                  disabled
                >
                  Depuis votre annonce
                </Button>
              </CardFooter>
            </Card>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">
            💡 Le boost vidéo est disponible depuis la page de votre annonce avec vidéo
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h2 className="font-heading text-2xl font-bold mb-4">Questions fréquentes</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <Card className="p-6">
              <h3 className="font-heading font-bold mb-2">Comment ça marche ?</h3>
              <p className="text-muted-foreground text-sm">
                Chaque crédit vous permet de publier une annonce qui restera visible pendant 30 jours. 
                Vous pouvez acheter des crédits à l&apos;unité ou en pack pour économiser.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-heading font-bold mb-2">Les crédits expirent-ils ?</h3>
              <p className="text-muted-foreground text-sm">
                Non, vos crédits n&apos;expirent jamais. Vous pouvez les utiliser quand vous le souhaitez 
                pour publier vos annonces.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-heading font-bold mb-2">Puis-je modifier mon annonce ?</h3>
              <p className="text-muted-foreground text-sm">
                Oui, vous pouvez modifier votre annonce à tout moment depuis votre tableau de bord, 
                sans frais supplémentaires.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-heading font-bold mb-2">Quels moyens de paiement ?</h3>
              <p className="text-muted-foreground text-sm">
                Nous acceptons les cartes bancaires (Visa, Mastercard, American Express). 
                Tous les paiements sont sécurisés via Stripe.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
