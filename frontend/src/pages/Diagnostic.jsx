import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  Stethoscope, Car, AlertTriangle, Loader2, CheckCircle, 
  CreditCard, Gift, Sparkles, Lock, ArrowRight, Package,
  Star, Coins, History, X
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Diagnostic() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  
  // Access state
  const [accessInfo, setAccessInfo] = useState(null);
  const [loadingAccess, setLoadingAccess] = useState(true);
  
  // Form state
  const [vehicle, setVehicle] = useState('');
  const [problem, setProblem] = useState('');
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  
  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  // Check for success/canceled from Stripe redirect
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      const credits = searchParams.get('credits');
      toast.success(`🎉 ${credits} crédit(s) diagnostic ajouté(s) !`);
      fetchAccessInfo();
    } else if (searchParams.get('canceled') === 'true') {
      toast.error('Paiement annulé');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      fetchAccessInfo();
    } else {
      setLoadingAccess(false);
    }
  }, [user]);

  const fetchAccessInfo = async () => {
    try {
      const response = await axios.get(`${API}/ai/diagnostic/access`);
      setAccessInfo(response.data);
    } catch (error) {
      console.error('Error fetching access info:', error);
    } finally {
      setLoadingAccess(false);
    }
  };

  const handleDiagnose = async (useCredits = false, usePoints = false) => {
    if (!problem.trim()) {
      toast.error('Veuillez décrire votre problème');
      return;
    }

    setDiagnosing(true);
    setDiagnosticResult(null);

    try {
      const response = await axios.post(`${API}/ai/diagnostic`, {
        problem: problem.trim(),
        vehicle: vehicle.trim() || null,
        use_credits: useCredits,
        use_points: usePoints
      });

      setDiagnosticResult(response.data);
      toast.success('Diagnostic terminé !');
      setShowPaymentModal(false);
      
      // Refresh access info
      fetchAccessInfo();
    } catch (error) {
      if (error.response?.status === 402) {
        // Payment required
        setShowPaymentModal(true);
      } else {
        toast.error(error.response?.data?.detail || 'Erreur lors du diagnostic');
      }
    } finally {
      setDiagnosing(false);
    }
  };

  const handlePurchase = async (pack) => {
    setPurchasing(true);
    try {
      const response = await axios.post(`${API}/ai/diagnostic/purchase?pack=${pack}`);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error('Erreur lors de la création du paiement');
      setPurchasing(false);
    }
  };

  const handleUsePoints = async () => {
    await handleDiagnose(false, true);
  };

  const formatResult = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/⚠️/g, '<span class="text-red-500">⚠️</span>')
      .replace(/🟡/g, '<span class="text-yellow-500">🟡</span>')
      .replace(/🟢/g, '<span class="text-green-500">🟢</span>')
      .replace(/\n/g, '<br />');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-2xl mx-auto px-4">
          <Card className="text-center py-12">
            <CardContent>
              <Lock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Connexion requise</h2>
              <p className="text-muted-foreground mb-6">
                Connectez-vous pour accéder au diagnostic IA
              </p>
              <Link to="/auth">
                <Button className="bg-accent hover:bg-accent/90">
                  Se connecter
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-accent to-orange-500 rounded-2xl mb-4">
            <Stethoscope className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Diagnostic IA</h1>
          <p className="text-muted-foreground text-lg">
            Décrivez votre problème et Tobi vous aide à identifier les causes
          </p>
        </div>

        {/* Access Status Card */}
        {!loadingAccess && accessInfo && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  {accessInfo.has_free_access ? (
                    <Badge className="bg-green-100 text-green-700 gap-1 py-1 px-3">
                      <CheckCircle className="w-4 h-4" />
                      Accès gratuit illimité
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1 py-1 px-3">
                      <CreditCard className="w-4 h-4" />
                      {accessInfo.diagnostic_credits} crédit(s)
                    </Badge>
                  )}
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    {accessInfo.loyalty_points} points fidélité
                  </div>
                </div>

                {!accessInfo.has_free_access && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowPaymentModal(true)}
                  >
                    <Package className="w-4 h-4 mr-2" />
                    Acheter des crédits
                  </Button>
                )}
              </div>
              
              {!accessInfo.has_free_access && accessInfo.active_listings_count === 0 && (
                <p className="text-sm text-muted-foreground mt-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>
                    <strong>Astuce :</strong> Publiez une annonce pour bénéficier du diagnostic gratuit illimité !
                  </span>
                  <Link to="/deposer" className="text-accent hover:underline ml-1">
                    Déposer une annonce →
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Formulaire */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="w-5 h-5 text-accent" />
                Décrivez votre problème
              </CardTitle>
              <CardDescription>
                Plus vous êtes précis, meilleur sera le diagnostic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle">Véhicule (optionnel)</Label>
                <Input
                  id="vehicle"
                  placeholder="Ex: Peugeot 308 2.0 HDI 2018"
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="problem">Problème constaté *</Label>
                <Textarea
                  id="problem"
                  placeholder="Décrivez les symptômes : bruits, vibrations, voyants allumés, comportement anormal..."
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  rows={5}
                />
              </div>

              {/* Exemples */}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Exemples de problèmes :</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Bruit au freinage",
                    "Voyant moteur allumé",
                    "Vibrations au volant",
                    "Démarrage difficile"
                  ].map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setProblem(example)}
                      className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-full transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <Button 
                onClick={() => {
                  if (accessInfo?.has_free_access || accessInfo?.diagnostic_credits > 0) {
                    handleDiagnose(accessInfo?.diagnostic_credits > 0 && !accessInfo?.has_free_access);
                  } else {
                    setShowPaymentModal(true);
                  }
                }}
                disabled={diagnosing || !problem.trim()}
                className="w-full h-12 bg-accent hover:bg-accent/90 text-lg"
              >
                {diagnosing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Stethoscope className="w-5 h-5 mr-2" />
                    Lancer le diagnostic
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Résultat */}
          <Card className={diagnosticResult ? 'border-accent/50' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-accent" />
                Résultat du diagnostic
              </CardTitle>
            </CardHeader>
            <CardContent>
              {diagnosticResult ? (
                <div className="space-y-4">
                  {diagnosticResult.free_access && (
                    <Badge className="bg-green-100 text-green-700">
                      ✓ Diagnostic gratuit (annonce active)
                    </Badge>
                  )}
                  
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatResult(diagnosticResult.diagnostic) }}
                  />
                  
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Véhicule analysé :</p>
                    <p className="font-medium">{diagnosticResult.vehicle}</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Stethoscope className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Le résultat du diagnostic apparaîtra ici</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info tarifs */}
        {!accessInfo?.has_free_access && (
          <Card className="mt-6 bg-gradient-to-r from-accent/5 to-orange-500/5 border-accent/20">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6 text-center">
                <div>
                  <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <CreditCard className="w-6 h-6 text-accent" />
                  </div>
                  <p className="font-bold text-lg">{accessInfo?.pricing?.single || 0.99}€</p>
                  <p className="text-sm text-muted-foreground">par diagnostic</p>
                </div>
                <div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Package className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="font-bold text-lg">{accessInfo?.pricing?.pack_5 || 3.99}€</p>
                  <p className="text-sm text-muted-foreground">Pack 5 diagnostics</p>
                  <Badge variant="outline" className="mt-1 text-green-600 border-green-300">
                    Économisez 20%
                  </Badge>
                </div>
                <div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Coins className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="font-bold text-lg">{accessInfo?.pricing?.points_cost || 100} pts</p>
                  <p className="text-sm text-muted-foreground">Points fidélité</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payment Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-accent" />
              Accéder au Diagnostic IA
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 mt-4">
            <p className="text-muted-foreground">
              Choisissez votre mode de paiement pour effectuer ce diagnostic :
            </p>

            {/* Option Points fidélité */}
            {accessInfo?.can_use_points && (
              <Card 
                className="cursor-pointer hover:border-accent transition-colors"
                onClick={handleUsePoints}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Coins className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="font-medium">Utiliser mes points</p>
                      <p className="text-sm text-muted-foreground">
                        {accessInfo.pricing.points_cost} points (vous avez {accessInfo.loyalty_points})
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            )}

            {/* Option Crédits existants */}
            {accessInfo?.diagnostic_credits > 0 && (
              <Card 
                className="cursor-pointer hover:border-accent transition-colors"
                onClick={() => handleDiagnose(true, false)}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Utiliser un crédit</p>
                      <p className="text-sm text-muted-foreground">
                        Vous avez {accessInfo.diagnostic_credits} crédit(s)
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground" />
                </CardContent>
              </Card>
            )}

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Acheter des crédits :</p>
              
              {/* Single diagnostic */}
              <Card 
                className="cursor-pointer hover:border-accent transition-colors mb-3"
                onClick={() => handlePurchase('single')}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">1 Diagnostic</p>
                      <p className="text-sm text-muted-foreground">Usage unique</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{accessInfo?.pricing?.single || 0.99}€</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pack 5 */}
              <Card 
                className="cursor-pointer hover:border-green-500 border-green-200 bg-green-50/50 transition-colors"
                onClick={() => handlePurchase('pack_5')}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium">Pack 5 Diagnostics</p>
                      <p className="text-sm text-muted-foreground">
                        <span className="line-through">4.95€</span>
                        <Badge className="ml-2 bg-green-600">-20%</Badge>
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">{accessInfo?.pricing?.pack_5 || 3.99}€</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {purchasing && (
              <div className="flex items-center justify-center gap-2 py-4">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Redirection vers le paiement...</span>
              </div>
            )}

            <p className="text-xs text-center text-muted-foreground">
              💡 Publiez une annonce pour bénéficier du diagnostic gratuit illimité !
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
