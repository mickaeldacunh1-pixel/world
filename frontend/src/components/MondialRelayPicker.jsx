import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Package, Search, X, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

// Mondial Relay Widget Component
export default function MondialRelayPicker({ onSelect, selectedRelay, postalCode = '' }) {
  const widgetRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchPostal, setSearchPostal] = useState(postalCode);
  const [widgetLoaded, setWidgetLoaded] = useState(false);

  useEffect(() => {
    // Check if jQuery and MR widget are loaded
    if (typeof window !== 'undefined' && window.jQuery) {
      setWidgetLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isOpen && widgetLoaded && widgetRef.current) {
      initWidget();
    }
  }, [isOpen, widgetLoaded, searchPostal]);

  const initWidget = () => {
    const $ = window.jQuery;
    if (!$ || !$.fn.MR_ParcelShopPicker) {
      console.error('Mondial Relay widget not loaded');
      return;
    }

    // Clear previous widget
    $(widgetRef.current).empty();

    // Initialize widget
    $(widgetRef.current).MR_ParcelShopPicker({
      Target: "#MR_Selected_ID",
      Brand: "BDTEST", // Code de test - À remplacer par votre code client en production
      Country: "FR",
      PostCode: searchPostal || "",
      ColLivMod: "24R", // Mode de livraison (Point Relais)
      NbResults: 7,
      ShowResultsOnMap: true,
      Responsive: true,
      OnParcelShopSelected: (data) => {
        if (data && data.ID) {
          const relayInfo = {
            id: data.ID,
            name: data.Nom,
            address: data.Adresse1,
            address2: data.Adresse2 || '',
            postalCode: data.CP,
            city: data.Ville,
            country: data.Pays,
            latitude: data.Latitude,
            longitude: data.Longitude,
            openingHours: data.Horaires_Lundi + ' | ' + data.Horaires_Mardi + ' | ' + data.Horaires_Mercredi + ' | ' + data.Horaires_Jeudi + ' | ' + data.Horaires_Vendredi + ' | ' + data.Horaires_Samedi + ' | ' + data.Horaires_Dimanche
          };
          onSelect(relayInfo);
          setIsOpen(false);
        }
      }
    });
  };

  const handleSearch = () => {
    if (searchPostal && widgetRef.current) {
      initWidget();
    }
  };

  return (
    <div className="space-y-3">
      {/* Hidden input for widget */}
      <input type="hidden" id="MR_Selected_ID" />

      {/* Selected Relay Display */}
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

            {/* Search by postal code */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1">
                <Label htmlFor="postal-search" className="sr-only">Code postal</Label>
                <Input
                  id="postal-search"
                  placeholder="Entrez votre code postal"
                  value={searchPostal}
                  onChange={(e) => setSearchPostal(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Button onClick={handleSearch} className="bg-accent hover:bg-accent/90">
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>
            </div>

            {/* Widget Container */}
            {widgetLoaded ? (
              <div 
                ref={widgetRef} 
                id="Zone_Widget"
                className="min-h-[400px] border rounded-lg"
                style={{ minHeight: '450px' }}
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                Chargement du widget...
              </div>
            )}

            <p className="text-xs text-muted-foreground text-center mt-2">
              Cliquez sur un point relais sur la carte pour le sélectionner
            </p>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
