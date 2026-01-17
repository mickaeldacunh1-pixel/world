import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Loader2, Truck, MapPin, Clock, ChevronDown, ChevronUp, Package, Info } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Logos des transporteurs
const CARRIER_LOGOS = {
  'Colissimo': 'https://upload.wikimedia.org/wikipedia/fr/thumb/4/4c/Colissimo_2011_logo.svg/220px-Colissimo_2011_logo.svg.png',
  'Chronopost': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Chronopost_logo.svg/220px-Chronopost_logo.svg.png',
  'Mondial Relay': 'https://upload.wikimedia.org/wikipedia/fr/thumb/9/9e/Logo_Mondial_Relay.svg/220px-Logo_Mondial_Relay.svg.png',
  'DPD': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/DPD_logo_%282015%29.svg/220px-DPD_logo_%282015%29.svg.png',
  'UPS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/United_Parcel_Service_logo_2014.svg/220px-United_Parcel_Service_logo_2014.svg.png',
  'GLS': 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Logo_GLS.svg/220px-Logo_GLS.svg.png',
};

// Icônes de secours si logo non disponible
const getCarrierIcon = (carrierName) => {
  const colors = {
    'Colissimo': 'bg-yellow-500',
    'Chronopost': 'bg-blue-600',
    'Mondial Relay': 'bg-red-500',
    'DPD': 'bg-red-600',
    'UPS': 'bg-amber-700',
    'GLS': 'bg-yellow-400',
  };
  return colors[carrierName] || 'bg-gray-500';
};

export default function ShippingEstimator({ listing, sellerPostalCode }) {
  const [postalCode, setPostalCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(null);

  // Essayer de récupérer le code postal depuis le localStorage
  useEffect(() => {
    const savedPostalCode = localStorage.getItem('user_postal_code');
    if (savedPostalCode) {
      setPostalCode(savedPostalCode);
    }
  }, []);

  const fetchShippingQuotes = async () => {
    if (!postalCode || postalCode.length !== 5) {
      toast.error('Veuillez entrer un code postal valide (5 chiffres)');
      return;
    }

    // Sauvegarder le code postal pour les prochaines fois
    localStorage.setItem('user_postal_code', postalCode);

    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API}/shipping/estimate`, {
        listing_id: listing.id,
        destination_postal_code: postalCode,
        // Utiliser les dimensions de l'annonce si disponibles, sinon valeurs par défaut
        weight: listing.weight || 1000, // grammes
        length: listing.length || 30,   // cm
        width: listing.width || 20,     // cm
        height: listing.height || 15    // cm
      });
      
      setQuotes(response.data.quotes);
      setExpanded(true);
    } catch (err) {
      console.error('Erreur estimation livraison:', err);
      setError(err.response?.data?.detail || 'Impossible d\'estimer les frais de livraison');
      toast.error('Erreur lors de l\'estimation');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      fetchShippingQuotes();
    }
  };

  // Ne pas afficher si le vendeur propose la livraison gratuite
  if (listing.shipping_cost === 0) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-blue-500 rounded-lg">
          <Truck className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">Estimer les frais de livraison</h3>
          <p className="text-xs text-muted-foreground">Comparez les transporteurs disponibles</p>
        </div>
      </div>

      {/* Formulaire de recherche */}
      <div className="flex gap-2 mb-3">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Votre code postal"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
            onKeyPress={handleKeyPress}
            className="pl-9 h-10"
            maxLength={5}
            data-testid="shipping-postal-input"
          />
        </div>
        <Button 
          onClick={fetchShippingQuotes} 
          disabled={loading || postalCode.length !== 5}
          className="h-10 px-4 bg-blue-600 hover:bg-blue-700"
          data-testid="shipping-estimate-btn"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Estimer'
          )}
        </Button>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm mb-3">
          {error}
        </div>
      )}

      {/* Résultats */}
      {quotes && quotes.length > 0 && (
        <div className="space-y-2">
          {/* Toggle pour voir plus/moins */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              {quotes.length} options de livraison disponibles
            </span>
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {expanded && (
            <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
              {quotes.map((quote, index) => (
                <div 
                  key={quote.service_id || index}
                  className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                    index === 0 
                      ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800' 
                      : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Logo ou icône du transporteur */}
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center overflow-hidden ${
                      CARRIER_LOGOS[quote.carrier_name] ? 'bg-white p-1' : getCarrierIcon(quote.carrier_name)
                    }`}>
                      {CARRIER_LOGOS[quote.carrier_name] ? (
                        <img 
                          src={CARRIER_LOGOS[quote.carrier_name]} 
                          alt={quote.carrier_name}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.classList.add(getCarrierIcon(quote.carrier_name));
                          }}
                        />
                      ) : (
                        <Truck className="w-5 h-5 text-white" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{quote.carrier_name}</span>
                        {index === 0 && (
                          <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-bold rounded">
                            MOINS CHER
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{quote.service_name}</p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                        <Clock className="w-3 h-3" />
                        {quote.delivery_time_min === quote.delivery_time_max 
                          ? `${quote.delivery_time_min} jour${quote.delivery_time_min > 1 ? 's' : ''}`
                          : `${quote.delivery_time_min}-${quote.delivery_time_max} jours`
                        }
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-lg">
                      {quote.price_ttc?.toFixed(2)} €
                    </div>
                    <p className="text-[10px] text-muted-foreground">TTC</p>
                  </div>
                </div>
              ))}

              {/* Info sur les prix */}
              <div className="flex items-start gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg text-xs text-muted-foreground">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>
                  Prix estimatifs basés sur un colis standard. Le prix final peut varier selon les dimensions exactes et le poids réel.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message si pas encore de recherche */}
      {!quotes && !loading && !error && (
        <p className="text-xs text-center text-muted-foreground">
          Entrez votre code postal pour voir les options de livraison
        </p>
      )}
    </Card>
  );
}
