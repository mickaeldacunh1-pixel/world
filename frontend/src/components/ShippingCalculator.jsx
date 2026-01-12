import { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Package, Truck, Clock, Calculator, Loader2, Info, MapPin } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Pays européens supportés
const COUNTRIES = [
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'IT', name: 'Italie', flag: '🇮🇹' },
  { code: 'NL', name: 'Pays-Bas', flag: '🇳🇱' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
];

export default function ShippingCalculator({ 
  fromPostalCode = '', 
  fromCountry = 'FR',
  onSelectQuote = null,
  compact = false 
}) {
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState(null);
  const [error, setError] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  
  const [formData, setFormData] = useState({
    fromPostalCode: fromPostalCode,
    fromCountry: fromCountry,
    toPostalCode: '',
    toCountry: 'FR',
    weight: '',
    length: '',
    width: '',
    height: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setQuotes(null);
    setError('');
  };

  const calculateQuotes = async () => {
    // Validation
    if (!formData.fromPostalCode || !formData.toPostalCode || !formData.weight) {
      setError('Veuillez remplir les champs obligatoires');
      return;
    }

    setLoading(true);
    setError('');
    setQuotes(null);

    try {
      const response = await axios.post(`${API}/boxtal/quotes`, {
        shipper: {
          country: formData.fromCountry,
          postal_code: formData.fromPostalCode,
          city: '',
          address: ''
        },
        recipient: {
          country: formData.toCountry,
          postal_code: formData.toPostalCode,
          city: '',
          address: ''
        },
        parcels: [{
          weight: parseFloat(formData.weight) * 1000, // kg → g
          length: formData.length ? parseFloat(formData.length) : 30,
          width: formData.width ? parseFloat(formData.width) : 20,
          height: formData.height ? parseFloat(formData.height) : 15
        }]
      });

      setQuotes(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Erreur lors du calcul des tarifs');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuote = (quote) => {
    setSelectedQuote(quote);
    if (onSelectQuote) {
      onSelectQuote(quote);
    }
  };

  return (
    <Card className={`${compact ? 'border-0 shadow-none' : ''}`}>
      <CardHeader className={compact ? 'pb-2 px-0' : ''}>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Calculator className="w-5 h-5 text-orange-500" />
          Calculateur de frais de port
        </CardTitle>
      </CardHeader>
      <CardContent className={compact ? 'px-0' : ''}>
        {/* Formulaire */}
        <div className="space-y-4">
          {/* Adresses */}
          <div className="grid grid-cols-2 gap-4">
            {/* Expéditeur */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm font-medium">
                <MapPin className="w-3 h-3" /> Départ
              </Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.fromCountry} 
                  onValueChange={(v) => handleChange('fromCountry', v)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Code postal"
                  value={formData.fromPostalCode}
                  onChange={(e) => handleChange('fromPostalCode', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Destinataire */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1 text-sm font-medium">
                <MapPin className="w-3 h-3" /> Arrivée
              </Label>
              <div className="flex gap-2">
                <Select 
                  value={formData.toCountry} 
                  onValueChange={(v) => handleChange('toCountry', v)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map(c => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Code postal"
                  value={formData.toPostalCode}
                  onChange={(e) => handleChange('toPostalCode', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">Poids (kg)*</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                placeholder="Ex: 2.5"
                value={formData.weight}
                onChange={(e) => handleChange('weight', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Long. (cm)</Label>
              <Input
                type="number"
                placeholder="30"
                value={formData.length}
                onChange={(e) => handleChange('length', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Larg. (cm)</Label>
              <Input
                type="number"
                placeholder="20"
                value={formData.width}
                onChange={(e) => handleChange('width', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Haut. (cm)</Label>
              <Input
                type="number"
                placeholder="15"
                value={formData.height}
                onChange={(e) => handleChange('height', e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1">
              <Info className="w-4 h-4" /> {error}
            </p>
          )}

          <Button 
            onClick={calculateQuotes} 
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Calcul en cours...
              </>
            ) : (
              <>
                <Calculator className="w-4 h-4 mr-2" />
                Calculer les tarifs
              </>
            )}
          </Button>
        </div>

        {/* Résultats */}
        {quotes && quotes.options && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">
                {quotes.options.length} offres disponibles
              </p>
              {quotes.mode === 'simulation' && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">
                  Tarifs estimés
                </span>
              )}
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {quotes.options
                .sort((a, b) => a.price_ttc - b.price_ttc)
                .map((option, index) => (
                <div
                  key={option.service_id}
                  onClick={() => handleSelectQuote(option)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedQuote?.service_id === option.service_id
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-gray-200 hover:border-orange-300 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                        {option.carrier_name === 'Mondial Relay' && <span className="text-xl">🏪</span>}
                        {option.carrier_name === 'Colissimo' && <span className="text-xl">📦</span>}
                        {option.carrier_name === 'Chronopost' && <span className="text-xl">⚡</span>}
                        {option.carrier_name === 'DPD' && <span className="text-xl">🚚</span>}
                        {!['Mondial Relay', 'Colissimo', 'Chronopost', 'DPD'].includes(option.carrier_name) && (
                          <Truck className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm">{option.carrier_name}</p>
                        <p className="text-xs text-gray-500">{option.service_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-orange-600">
                        {option.price_ttc.toFixed(2)}€
                      </p>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {option.delivery_time_min === option.delivery_time_max 
                          ? `${option.delivery_time_min}j`
                          : `${option.delivery_time_min}-${option.delivery_time_max}j`
                        }
                      </div>
                    </div>
                  </div>
                  
                  {index === 0 && (
                    <div className="mt-2 text-xs text-green-600 font-medium">
                      ✓ Meilleur prix
                    </div>
                  )}
                  
                  {option.insurance_available && (
                    <div className="mt-1 text-xs text-blue-600">
                      🛡️ Assurance disponible
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 mt-2">
              💡 Les tarifs incluent la marge WorldAuto. Le vendeur gère l'expédition via son compte transporteur.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
