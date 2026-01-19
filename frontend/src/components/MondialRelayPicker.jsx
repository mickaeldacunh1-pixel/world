import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { MapPin, Package, Search, X, CheckCircle, Loader2, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

// Charger jQuery dynamiquement
const loadScript = (src, id) => {
  return new Promise((resolve, reject) => {
    // Vérifier si déjà chargé
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.id = id;
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Charger le CSS dynamiquement
const loadCSS = (href, id) => {
  if (document.getElementById(id)) return;
  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = href;
  document.head.appendChild(link);
};

export default function MondialRelayPicker({ onSelect, selectedRelay, postalCode = '' }) {
  const widgetRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchPostal, setSearchPostal] = useState(postalCode);
  const [widgetLoaded, setWidgetLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [scriptsLoading, setScriptsLoading] = useState(false);

  // Charger les scripts au montage du composant
  useEffect(() => {
    const loadMondialRelayScripts = async () => {
      // Vérifier si déjà disponible
      if (window.jQuery && window.jQuery.fn && window.jQuery.fn.MR_ParcelShopPicker) {
        console.log('Mondial Relay: Widget déjà chargé');
        setWidgetLoaded(true);
        return;
      }

      setScriptsLoading(true);
      setError(null);

      try {
        // Charger jQuery si pas présent
        if (!window.jQuery) {
          console.log('Mondial Relay: Chargement de jQuery...');
          await loadScript('https://code.jquery.com/jquery-3.7.1.min.js', 'mr-jquery');
          // Attendre que jQuery soit disponible
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Charger le CSS du widget
        loadCSS('https://widget.mondialrelay.com/parcelshop-picker/style/style.min.css', 'mr-css');

        // Charger le plugin Mondial Relay
        if (!window.jQuery.fn.MR_ParcelShopPicker) {
          console.log('Mondial Relay: Chargement du plugin...');
          await loadScript(
            'https://widget.mondialrelay.com/parcelshop-picker/jquery.plugin.mondialrelay.parcelshoppicker.min.js',
            'mr-plugin'
          );
          // Attendre que le plugin soit disponible
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Vérifier que tout est chargé
        if (window.jQuery && window.jQuery.fn && window.jQuery.fn.MR_ParcelShopPicker) {
          console.log('Mondial Relay: Widget prêt !');
          setWidgetLoaded(true);
        } else {
          throw new Error('Plugin non disponible après chargement');
        }
      } catch (err) {
        console.error('Mondial Relay: Erreur de chargement', err);
        setError('Erreur de chargement du widget. Cliquez sur "Réessayer".');
      } finally {
        setScriptsLoading(false);
      }
    };

    loadMondialRelayScripts();
  }, []);

  useEffect(() => {
    if (postalCode && postalCode !== searchPostal) {
      setSearchPostal(postalCode);
    }
  }, [postalCode]);

  useEffect(() => {
    if (isOpen && widgetLoaded && widgetRef.current) {
      setTimeout(() => initWidget(), 200);
    }
  }, [isOpen, widgetLoaded]);

  const initWidget = useCallback(() => {
    const $ = window.jQuery;
    if (!$ || !$.fn.MR_ParcelShopPicker) {
      console.error('Mondial Relay: jQuery ou plugin non disponible', { 
        jQuery: !!$, 
        plugin: $ ? !!$.fn.MR_ParcelShopPicker : false 
      });
      setError('Widget Mondial Relay non disponible. Veuillez rafraîchir la page.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Vider le conteneur
      $(widgetRef.current).empty();

      console.log('Mondial Relay: Initialisation du widget avec CP:', searchPostal);

      // Initialiser le widget
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
          console.log('Mondial Relay: Point sélectionné', data);
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
          console.log('Mondial Relay: Aucun résultat pour', searchPostal);
          setError('Aucun point relais trouvé pour ce code postal');
          setLoading(false);
        },
        OnError: (err) => {
          console.error('Mondial Relay OnError:', err);
          setError('Erreur Mondial Relay: ' + (typeof err === 'string' ? err : 'Erreur de chargement'));
          setLoading(false);
        }
      });
      
      // Petit délai pour laisser le widget s'initialiser
      setTimeout(() => setLoading(false), 800);
    } catch (err) {
      console.error('MR Widget error:', err);
      setError('Erreur lors du chargement des points relais: ' + err.message);
      setLoading(false);
    }
  }, [searchPostal, onSelect]);

  const handleSearch = () => {
    if (searchPostal && searchPostal.length === 5) {
      initWidget();
    }
  };

  const handleRetry = async () => {
    setError(null);
    setWidgetLoaded(false);
    // Forcer le rechargement des scripts
    const jqueryScript = document.getElementById('mr-jquery');
    const pluginScript = document.getElementById('mr-plugin');
    if (jqueryScript) jqueryScript.remove();
    if (pluginScript) pluginScript.remove();
    window.jQuery = undefined;
    
    // Recharger
    window.location.reload();
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
              <Button 
                onClick={handleSearch} 
                className="bg-accent hover:bg-accent/90" 
                disabled={searchPostal.length !== 5 || loading || scriptsLoading}
              >
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mb-4 flex items-center justify-between">
                <span>{error}</span>
                <Button variant="ghost" size="sm" onClick={handleRetry} className="text-red-700">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Réessayer
                </Button>
              </div>
            )}

            {scriptsLoading ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Chargement des scripts Mondial Relay...</p>
              </div>
            ) : !widgetLoaded ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p>Initialisation du widget...</p>
                <Button variant="link" onClick={handleRetry} className="mt-2">
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Forcer le rechargement
                </Button>
              </div>
            ) : (
              <>
                {loading && (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-accent mr-2" />
                    <span>Recherche des points relais...</span>
                  </div>
                )}
                <div 
                  ref={widgetRef} 
                  id="Zone_Widget"
                  className="min-h-[400px] border rounded-lg bg-white"
                  style={{ minHeight: '450px' }}
                />
              </>
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
