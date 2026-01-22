import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Loader2, Truck, Package, AlertCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BoxtalPicker({ 
  onSelect, 
  selectedCarrier,
  senderPostalCode = '75001',
  senderCity = 'Paris',
  receiverPostalCode,
  receiverCity,
  weight = 1,
  token
}) {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parcelWeight, setParcelWeight] = useState(weight);
  const [dimensions, setDimensions] = useState({ length: 30, width: 20, height: 15 });

  useEffect(() => {
    if (receiverPostalCode && receiverPostalCode.length === 5 && receiverCity) {
      fetchQuotes();
    }
  }, [receiverPostalCode, receiverCity, parcelWeight]);

  const fetchQuotes = async () => {
    if (!receiverPostalCode || !receiverCity) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API}/boxtal/quotes`, {
        sender_address: {
          country: 'FR',
          postal_code: senderPostalCode,
          city: senderCity
        },
        receiver_address: {
          country: 'FR',
          postal_code: receiverPostalCode,
          city: receiverCity
        },
        parcels: [{
          weight: parseFloat(parcelWeight) || 1,
          length: dimensions.length,
          width: dimensions.width,
          height: dimensions.height
        }]
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      // L'API renvoie "options" pour les transporteurs
      const carriers = response.data.options || response.data.quotes || [];
      if (carriers.length > 0) {
        // Garder le format original de l'API + ajouter des champs utiles
        const formattedCarriers = carriers.map(c => ({
          ...c,  // Garder toutes les données originales
          id: c.service_id,
          name: c.carrier_name,
          logo: c.carrier_logo,
          delivery_type: c.service_name,
          delivery_time: `${c.delivery_time_min}-${c.delivery_time_max} jours`,
          price: c.price_ttc || c.price_ht,
          original_price: c.price_ht_base,
          quote_id: response.data.quote_id
        }));
        setCarriers(formattedCarriers);
      } else {
        setCarriers([]);
        setError('Aucun transporteur disponible pour cette destination');
      }
    } catch (err) {
      console.error('Boxtal error:', err);
      setError(err.response?.data?.detail || 'Erreur lors de la récupération des devis');
      setCarriers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (carrier) => {
    onSelect(carrier);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
        <Truck className="w-4 h-4" />
        <span>Comparez les transporteurs Boxtal</span>
      </div>

      {/* Poids du colis */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="weight">Poids estimé (kg)</Label>
          <Input
            id="weight"
            type="number"
            min="0.1"
            step="0.1"
            value={parcelWeight}
            onChange={(e) => setParcelWeight(e.target.value)}
            placeholder="1"
          />
        </div>
        <div className="flex items-end">
          <Button 
            variant="outline" 
            onClick={fetchQuotes}
            disabled={loading || !receiverPostalCode || !receiverCity}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Actualiser'}
          </Button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-accent mr-2" />
          <span>Recherche des transporteurs...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-800 font-medium">Impossible de charger les transporteurs</p>
            <p className="text-red-600 text-sm">{error}</p>
            <Button variant="link" className="text-red-600 p-0 h-auto" onClick={fetchQuotes}>
              Réessayer
            </Button>
          </div>
        </div>
      )}

      {/* Carriers List */}
      {!loading && carriers.length > 0 && (
        <RadioGroup 
          value={selectedCarrier?.id || ''} 
          onValueChange={(value) => {
            const carrier = carriers.find(c => c.id === value);
            if (carrier) handleSelect(carrier);
          }}
          className="space-y-2"
        >
          {carriers.map((carrier) => (
            <div
              key={carrier.id}
              className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedCarrier?.id === carrier.id 
                  ? 'border-accent bg-accent/5' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <RadioGroupItem value={carrier.id} id={carrier.id} />
              <Label htmlFor={carrier.id} className="flex-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {carrier.logo ? (
                      <img src={carrier.logo} alt={carrier.name} className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{carrier.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {carrier.delivery_type} • {carrier.delivery_time}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-accent">{carrier.price?.toFixed(2)} €</p>
                    {carrier.original_price && carrier.original_price > carrier.price && (
                      <p className="text-xs text-muted-foreground line-through">
                        {carrier.original_price?.toFixed(2)} €
                      </p>
                    )}
                  </div>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      )}

      {/* No carriers message */}
      {!loading && !error && carriers.length === 0 && receiverPostalCode && receiverCity && (
        <div className="text-center py-6 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>Entrez votre adresse complète pour voir les transporteurs disponibles</p>
        </div>
      )}
    </div>
  );
}
