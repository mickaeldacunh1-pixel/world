import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Package, Search, X, CheckCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

export default function MondialRelayPicker({ onSelect, selectedRelay, postalCode = '' }) {
  const widgetRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchPostal, setSearchPostal] = useState(postalCode);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if jQuery and widget are loaded
  useEffect(() => {
    const checkWidget = () => {
      if (typeof window !== 'undefined' && window.jQuery && window.jQuery.fn.MR_ParcelShopPicker) {
        setWidgetLoaded(true);
        return true;
      }
      return false;
    };

    if (checkWidget()) return;

    // Poll for widget load
    const interval = setInterval(() => {
      if (checkWidget()) {
        clearInterval(interval);
      }
    }, 500);

    // Timeout after 10s
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!widgetLoaded) {
        setError('Le widget Mondial Relay n\'a pas pu être chargé');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (postalCode && postalCode !== searchPostal) {
      setSearchPostal(postalCode);
    }
  }, [postalCode]);

  useEffect(() => {
    if (isOpen && widgetLoaded && widgetRef.current) {
      setTimeout(() => initWidget(), 100);
    }
  }, [isOpen, widgetLoaded]);

  const initWidget = () => {
    const $ = window.jQuery;
    if (!$ || !$.fn.MR_ParcelShopPicker) {
      setError('Widget Mondial Relay non disponible');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      $(widgetRef.current).empty();

      $(widgetRef.current).MR_ParcelShopPicker({
        Target: "#MR_Selected_ID",
        Brand: "CC23S7ZB",
        Country: "FR",
        PostCode: searchPostal || "",
        ColLivMod: "24R",
        NbResults: 7,
        ShowResultsOnMap: true,
        Responsive: true,
        OnParcelShopSelected: (data) => {
          if (data && data.ID) {
            onSelect({
              id: data.ID,
              name: data.Nom,
              address: data.Adresse1,
              address2: data.Adresse2 || '',
              postalCode: data.CP,
              city: data.Ville,
              country: data.Pays,
              latitude: data.Latitude,
              longitude: data.Longitude
            });
            setIsOpen(false);
          }
        },
        OnNoResultReturned: () => {
          setError('Aucun point relais trouvé pour ce code postal');
          setLoading(false);
        }
      });
      
      setLoading(false);
    } catch (err) {
      console.error('MR Widget error:', err);
      setError('Erreur lors du chargement des points relais');
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchPostal && searchPostal.length === 5) {
      initWidget();
    }
  };

  return (
    <div className="space-y-3">
      <input type="hidden" id="MR_Selected_ID" />

      {selectedRelay ? (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-semibold text-green-800">{selectedRelay.name}</p>
                  <p className="text-sm text-green-700">{selectedRelay.address}</p>
                  <p className="text-sm text-green-700">{selectedRelay.postalCode} {selectedRelay.city}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onSelect(null)}
                className="text-green-600 hover:text-green-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full h-12 justify-start gap-3">
              <MapPin className="w-5 h-5 text-accent" />
              <span>Choisir un Point Relais Mondial Relay</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="w-5 h-5" />
                Choisir un Point Relais
              </DialogTitle>
            </DialogHeader>

            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <Label htmlFor="postal-search" className="sr-only">Code postal</Label>
                <Input
                  id="postal-search"
                  placeholder="Entrez votre code postal (ex: 75001)"
                  value={searchPostal}
                  onChange={(e) => setSearchPostal(e.target.value.replace(/\D/g, '').slice(0, 5))}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  maxLength={5}
                />
              </div>
              <Button onClick={handleSearch} className="bg-accent hover:bg-accent/90" disabled={searchPostal.length !== 5}>
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4">
                {error}
              </div>
            )}

            {!widgetLoaded ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Chargement du widget Mondial Relay...</p>
              </div>
            ) : (
              <div 
                ref={widgetRef} 
                id="Zone_Widget"
                className="min-h-[400px] border rounded-lg bg-white"
                style={{ minHeight: '450px' }}
              />
            )}

            <p className="text-xs text-muted-foreground text-center mt-2">
              Entrez votre code postal et cliquez sur un point relais pour le sélectionner
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
