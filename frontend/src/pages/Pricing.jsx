import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Check, CreditCard, Zap } from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Pricing() {
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
      toast.error('Connectez-vous pour acheter un pack');
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
      'Photos illimitées',
      'Messagerie intégrée',
    ],
    pack5: [
      '5 crédits',
      'Valable 30 jours',
      'Photos illimitées',
      'Support par email',
      '🏷️ -20% par annonce',
    ],
    pack20: [
      '20 crédits',
      'Valable 30 jours',
      'Photos illimitées',
      'Support prioritaire',
      '🏷️ -38% par annonce',
    ],
    pack50: [
      '50 crédits',
      'Valable 30 jours',
      'Photos illimitées',
      'Support prioritaire',
      '🏷️ -61% par annonce',
      '⭐ Meilleur rapport qualité/prix',
    ],
    pro_monthly: [
      'Annonces illimitées',
      'Durée : 1 mois',
      'Badge PRO vérifié',
      'Statistiques avancées',
      'Support VIP',
    ],
    pro_3months: [
      'Annonces illimitées',
      'Durée : 3 mois',
      'Badge PRO vérifié',
      'Statistiques avancées',
      'Support VIP',
      '🏷️ -33% vs mensuel',
    ],
    pro_6months: [
      'Annonces illimitées',
      'Durée : 6 mois',
      'Badge PRO vérifié',
      'Statistiques avancées',
      'Support VIP',
      '🏷️ -39% vs mensuel',
      '⭐ Meilleure économie',
    ],
  };

  return (
    <div className="min-h-screen bg-secondary/30 py-12" data-testid="pricing-page">
      <SEO
        title="Tarifs"
        description="Découvrez nos packs de crédits pour publier vos annonces sur World Auto France. Des tarifs simples et transparents pour particuliers et professionnels."
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
            Tous les packs incluent la publication d'annonces pendant 30 jours.
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
            <span className="block text-sm font-normal text-muted-foreground mt-1">Pour les particuliers</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Single */}
            <Card className="relative card-hover" data-testid="package-single">
              <CardHeader>
                <CardTitle className="font-heading">1 Crédit</CardTitle>
                <CardDescription>Pour une vente ponctuelle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">2€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.single.map((feature, i) => (
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
                  onClick={() => handleBuyPackage('single')}
                  disabled={loading.single}
                  data-testid="buy-single"
                >
                  {loading.single ? 'Chargement...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pack 5 */}
            <Card className="relative card-hover" data-testid="package-pack5">
              <CardHeader>
                <CardTitle className="font-heading">Pack 5</CardTitle>
                <CardDescription>1,60€ par annonce</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">8€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.pack5.map((feature, i) => (
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
                  onClick={() => handleBuyPackage('pack5')}
                  disabled={loading.pack5}
                  data-testid="buy-pack5"
                >
                  {loading.pack5 ? 'Chargement...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pack 20 */}
            <Card className="relative card-hover" data-testid="package-pack20">
              <CardHeader>
                <CardTitle className="font-heading">Pack 20</CardTitle>
                <CardDescription>1,25€ par annonce</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">25€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.pack20.map((feature, i) => (
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
                  onClick={() => handleBuyPackage('pack20')}
                  disabled={loading.pack20}
                  data-testid="buy-pack20"
                >
                  {loading.pack20 ? 'Chargement...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>

            {/* Pack 50 - Popular */}
            <Card className="relative card-hover border-accent shadow-lg" data-testid="package-pack50">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-accent text-accent-foreground">
                  <Zap className="w-3 h-3 mr-1" />
                  Meilleur choix
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="font-heading">Pack 50</CardTitle>
                <CardDescription>0,78€ par annonce</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">39€</span>
                </div>
                <ul className="space-y-3">
                  {pricingFeatures.pack50.map((feature, i) => (
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
                  onClick={() => handleBuyPackage('pack50')}
                  disabled={loading.pack50}
                  data-testid="buy-pack50"
                >
                  {loading.pack50 ? 'Chargement...' : 'Acheter'}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* Pricing Cards - Professionnels */}
        <div className="mb-8">
          <h2 className="font-heading text-2xl font-bold mb-6 text-center">
            🏢 Abonnements Pro
            <span className="block text-sm font-normal text-muted-foreground mt-1">Pour les professionnels</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* Pro 1 mois */}
            <Card className="relative card-hover bg-primary text-primary-foreground" data-testid="package-pro-monthly">
              <CardHeader>
                <CardTitle className="font-heading text-primary-foreground">Pro 1 mois</CardTitle>
                <CardDescription className="text-primary-foreground/70">49€/mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">49€</span>
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
                <CardTitle className="font-heading text-primary-foreground">Pro 3 mois</CardTitle>
                <CardDescription className="text-primary-foreground/70">33€/mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">99€</span>
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
                  Meilleure économie
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="font-heading text-primary-foreground">Pro 6 mois</CardTitle>
                <CardDescription className="text-primary-foreground/70">~40€/mois</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-4xl font-heading font-black">239€</span>
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
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 text-center">
          <h2 className="font-heading text-2xl font-bold mb-4">Questions fréquentes</h2>
          <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
            <Card className="p-6">
              <h3 className="font-heading font-bold mb-2">Comment ça marche ?</h3>
              <p className="text-muted-foreground text-sm">
                Chaque crédit vous permet de publier une annonce qui restera visible pendant 30 jours. 
                Vous pouvez acheter des crédits à l'unité ou en pack pour économiser.
              </p>
            </Card>
            <Card className="p-6">
              <h3 className="font-heading font-bold mb-2">Les crédits expirent-ils ?</h3>
              <p className="text-muted-foreground text-sm">
                Non, vos crédits n'expirent jamais. Vous pouvez les utiliser quand vous le souhaitez 
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
