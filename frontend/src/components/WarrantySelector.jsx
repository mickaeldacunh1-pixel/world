import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Shield, ShieldCheck, Check, Loader2, Award } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export function WarrantySelector({ listingId, currentWarranty, onPurchase }) {
  const [options, setOptions] = useState([]);
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    fetchOptions();
  }, []);

  const fetchOptions = async () => {
    try {
      const response = await axios.get(`${API}/warranty/options`);
      setOptions(response.data.options);
      setBenefits(response.data.benefits);
    } catch (error) {
      console.error('Error fetching warranty options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (duration) => {
    setPurchasing(duration);
    try {
      const response = await axios.post(`${API}/warranty/create-checkout`, {
        listing_id: listingId,
        duration: duration
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création du paiement');
      setPurchasing(null);
    }
  };

  if (currentWarranty) {
    return (
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-green-700 dark:text-green-400">
                Garantie World Auto Pro Active
              </p>
              <p className="text-sm text-green-600 dark:text-green-500">
                {currentWarranty.duration} mois • Expire le {new Date(currentWarranty.expires).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="w-5 h-5 text-accent" />
          Garantie World Auto Pro
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Protégez votre acheteur avec notre garantie officielle
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Benefits */}
        <div className="grid grid-cols-2 gap-2">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* Options */}
        <div className="grid grid-cols-3 gap-3">
          {options.map((option) => (
            <div 
              key={option.duration}
              className={`relative p-3 border rounded-lg text-center transition-all ${
                option.duration === 6 
                  ? 'border-accent bg-accent/5 ring-1 ring-accent' 
                  : 'hover:border-accent/50'
              }`}
            >
              {option.duration === 6 && (
                <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 bg-accent text-xs">
                  Populaire
                </Badge>
              )}
              <p className="font-bold text-lg">{option.label}</p>
              <p className="text-2xl font-bold text-accent my-2">{option.price}€</p>
              <p className="text-xs text-muted-foreground mb-3">{option.description}</p>
              <Button
                size="sm"
                variant={option.duration === 6 ? 'default' : 'outline'}
                className={option.duration === 6 ? 'bg-accent hover:bg-accent/90 w-full' : 'w-full'}
                onClick={() => handlePurchase(option.duration)}
                disabled={purchasing !== null}
              >
                {purchasing === option.duration ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Choisir'
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function VerificationRequest({ listingId, isVerified, verificationLevel, onVerified }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleRequestVerification = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${API}/listings/${listingId}/verify`);
      setResult(response.data);
      if (response.data.is_verified && onVerified) {
        onVerified(response.data);
      }
      toast.success(response.data.message);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la vérification');
    } finally {
      setLoading(false);
    }
  };

  if (isVerified) {
    return (
      <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              verificationLevel === 'gold' ? 'bg-amber-500' : 'bg-slate-400'
            }`}>
              <Award className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-medium">
                {verificationLevel === 'gold' ? 'Certification Or' : 'Certification Argent'}
              </p>
              <p className="text-sm text-muted-foreground">
                Cette pièce est vérifiée et certifiée
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Certification pièce</p>
              <p className="text-sm text-muted-foreground">
                Obtenez le badge "Pièce Vérifiée"
              </p>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRequestVerification}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Vérifier ma pièce'
            )}
          </Button>
        </div>

        {result && !result.is_verified && (
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-2">
              Score actuel: {result.verification_score}/100 (minimum 60 requis)
            </p>
            <p className="text-xs text-muted-foreground">
              Complétez les informations de votre annonce pour améliorer votre score:
              référence OEM, photos supplémentaires, origine de la pièce, etc.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default { WarrantySelector, VerificationRequest };
