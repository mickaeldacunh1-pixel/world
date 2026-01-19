import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { ShoppingCart, MapPin, Phone, User, CreditCard, ArrowLeft, CheckCircle, Loader2, AlertCircle, Home, Package } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '../components/SEO';
import MondialRelayPicker from '../components/MondialRelayPicker';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Checkout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [orderResult, setOrderResult] = useState(null);
  
  const [shippingInfo, setShippingInfo] = useState({
    address: '',
    city: '',
    postal_code: '',
    phone: ''
  });

  const [deliveryMethod, setDeliveryMethod] = useState(''); // Set dynamically
  const [selectedRelay, setSelectedRelay] = useState(null);
  const [availableShippingMethods, setAvailableShippingMethods] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('stripe'); // 'stripe' ou 'contact'
  const [sellerHasStripe, setSellerHasStripe] = useState(false);

  // Shipping methods configuration
  const SHIPPING_METHODS = {
    hand_delivery: { id: 'hand_delivery', name: 'Remise en main propre', icon: '🤝', desc: 'Récupérer directement chez le vendeur', needsAddress: false },
    home: { id: 'home', name: 'Livraison à domicile', icon: '🏠', desc: 'Recevoir à votre adresse', needsAddress: true },
    colissimo: { id: 'colissimo', name: 'Colissimo', icon: '📦', desc: 'Livraison La Poste (2-3 jours)', needsAddress: true },
    mondial_relay: { id: 'mondial_relay', name: 'Point Relais Mondial Relay', icon: '📍', desc: 'Retirer dans un point relais', needsAddress: false, isRelay: true },
    chronopost: { id: 'chronopost', name: 'Chronopost', icon: '⚡', desc: 'Livraison express (24h)', needsAddress: true },
    boxtal: { id: 'boxtal', name: 'Boxtal', icon: '📫', desc: 'Multi-transporteurs au meilleur prix', needsAddress: true },
    custom: { id: 'custom', name: 'Autre transporteur', icon: '🚚', desc: 'Transporteur choisi par le vendeur', needsAddress: true },
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      toast.error('Veuillez vous connecter pour continuer');
      navigate('/auth?mode=login');
      return;
    }

    // Pre-fill with user's info
    setShippingInfo({
      address: user.address || '',
      city: user.city || '',
      postal_code: user.postal_code || '',
      phone: user.phone || ''
    });

    // Load cart from localStorage
    const savedCart = localStorage.getItem('worldauto_cart');
    if (savedCart) {
      const items = JSON.parse(savedCart);
      if (items.length === 0) {
        toast.error('Votre panier est vide');
        navigate('/panier');
        return;
      }
      fetchListingDetails(items);
    } else {
      toast.error('Votre panier est vide');
      navigate('/panier');
    }
  }, [user, navigate]);

  const fetchListingDetails = async (items) => {
    try {
      const updatedItems = await Promise.all(
        items.map(async (item) => {
          try {
            const response = await axios.get(`${API}/listings/${item.id}`);
            // Accepter les annonces active OU reserved (réservée par cet utilisateur)
            const isAvailable = response.data.status === 'active' || response.data.status === 'reserved';
            return { ...item, ...response.data, available: isAvailable };
          } catch {
            return { ...item, available: false };
          }
        })
      );
      
      const availableItems = updatedItems.filter(item => item.available);
      setCartItems(availableItems);
      
      // Vérifier si tous les vendeurs ont Stripe Connect configuré
      const allSellersHaveStripe = availableItems.every(item => item.seller_stripe_connected === true);
      setSellerHasStripe(allSellersHaveStripe);
      
      // Si aucun vendeur n'a Stripe, forcer le mode contact
      if (!allSellersHaveStripe) {
        setPaymentMethod('contact');
      }
      
      // Determine available shipping methods from items
      const allMethods = new Set();
      availableItems.forEach(item => {
        const methods = item.shipping_methods || [];
        if (methods.length === 0) {
          // Default methods if none configured - ajouter toutes les options par défaut
          allMethods.add('hand_delivery');
          allMethods.add('home');
          allMethods.add('colissimo');
          allMethods.add('mondial_relay');
        } else {
          methods.forEach(m => allMethods.add(m));
        }
      });
      
      // Convert to array and sort
      const methodsArray = Array.from(allMethods).map(m => SHIPPING_METHODS[m] || SHIPPING_METHODS.custom).filter(Boolean);
      setAvailableShippingMethods(methodsArray);
      
      // Set default delivery method
      if (methodsArray.length > 0 && !deliveryMethod) {
        setDeliveryMethod(methodsArray[0].id);
      }
      
      if (availableItems.length < items.length) {
        toast.warning('Certains articles ne sont plus disponibles et ont été retirés');
        localStorage.setItem('worldauto_cart', JSON.stringify(availableItems));
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      toast.error('Erreur lors du chargement du panier');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setShippingInfo(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const currentMethod = availableShippingMethods.find(m => m.id === deliveryMethod);
    
    // For relay delivery, only need selected relay
    if (currentMethod?.isRelay) {
      if (!selectedRelay) {
        toast.error('Veuillez sélectionner un point relais');
        return false;
      }
      return true;
    }
    
    // For hand delivery, no address needed
    if (deliveryMethod === 'hand_delivery') {
      return true;
    }
    
    // For methods that need address
    if (currentMethod?.needsAddress !== false) {
      if (!shippingInfo.address.trim()) {
        toast.error('Veuillez entrer votre adresse');
        return false;
      }
      if (!shippingInfo.city.trim()) {
        toast.error('Veuillez entrer votre ville');
        return false;
      }
      if (!shippingInfo.postal_code.trim()) {
        toast.error('Veuillez entrer votre code postal');
        return false;
      }
      if (!/^\d{5}$/.test(shippingInfo.postal_code.trim())) {
        toast.error('Le code postal doit contenir 5 chiffres');
        return false;
      }
    }
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      const currentMethod = availableShippingMethods.find(m => m.id === deliveryMethod);
      
      // Prepare shipping data based on delivery method
      let shippingData = {
        delivery_method: deliveryMethod
      };
      
      if (currentMethod?.isRelay && selectedRelay) {
        shippingData = {
          ...shippingData,
          buyer_address: `Point Relais: ${selectedRelay.name} - ${selectedRelay.address}`,
          buyer_city: selectedRelay.city,
          buyer_postal: selectedRelay.postalCode,
          buyer_phone: shippingInfo.phone || undefined,
          relay_id: selectedRelay.id,
          relay_name: selectedRelay.name
        };
      } else if (deliveryMethod === 'hand_delivery') {
        shippingData = {
          ...shippingData,
          buyer_address: 'Remise en main propre',
          buyer_city: shippingInfo.city || user?.city || '',
          buyer_postal: shippingInfo.postal_code || user?.postal_code || '',
          buyer_phone: shippingInfo.phone || undefined,
        };
      } else {
        shippingData = {
          ...shippingData,
          buyer_address: shippingInfo.address,
          buyer_city: shippingInfo.city,
          buyer_postal: shippingInfo.postal_code,
          buyer_phone: shippingInfo.phone || undefined,
        };
      }
      
      // Choisir l'endpoint selon le mode de paiement
      if (paymentMethod === 'stripe') {
        // Paiement Stripe - redirection vers la page de paiement
        const response = await axios.post(
          `${API}/stripe/connect/checkout`,
          {
            listing_id: cartItems[0].id, // Pour l'instant, un article à la fois pour Stripe
            ...shippingData
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Redirection vers Stripe Checkout
        if (response.data.checkout_url) {
          window.location.href = response.data.checkout_url;
          return;
        }
      } else {
        // Mode contact direct - pas de paiement sur la plateforme
        const response = await axios.post(
          `${API}/orders/checkout`,
          {
            listing_ids: cartItems.map(item => item.id),
            ...shippingData
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Clear cart
        localStorage.removeItem('worldauto_cart');
        
        setOrderResult(response.data);
        setOrderSuccess(true);
        toast.success('Commande envoyée ! Le vendeur va vous contacter.');
      }
      
    } catch (error) {
      console.error('Checkout error:', error);
      const errorMsg = error.response?.data?.detail?.message || error.response?.data?.detail || 'Erreur lors de la commande';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (orderSuccess && orderResult) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <SEO
          title="Commande confirmée"
          description="Votre commande a été confirmée"
          noindex={true}
        />
        
        <div className="max-w-2xl mx-auto px-4">
          <Card className="p-8 text-center">
            <CheckCircle className="w-20 h-20 mx-auto text-green-500 mb-6" />
            <h1 className="font-heading text-3xl font-bold mb-4">Commandes confirmées !</h1>
            <p className="text-muted-foreground mb-6">
              {orderResult.orders_created} commande{orderResult.orders_created > 1 ? 's' : ''} créée{orderResult.orders_created > 1 ? 's' : ''} pour un total de{' '}
              <span className="font-bold text-accent">{orderResult.total_amount?.toLocaleString('fr-FR')} €</span>
            </p>
            
            <div className="bg-secondary/50 rounded-lg p-4 mb-6 text-left">
              <h3 className="font-semibold mb-3">Prochaines étapes :</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent">1.</span>
                  Les vendeurs ont été notifiés de vos commandes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">2.</span>
                  Vous recevrez un email de confirmation pour chaque commande
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent">3.</span>
                  Suivez vos commandes depuis votre espace "Mes commandes"
                </li>
              </ul>
            </div>
            
            {orderResult.errors && orderResult.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Certains articles n'ont pas pu être commandés
                </h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {orderResult.errors.map((err, idx) => (
                    <li key={idx}>{err.error}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex gap-4 justify-center">
              <Link to="/commandes">
                <Button className="bg-accent hover:bg-accent/90">
                  Voir mes commandes
                </Button>
              </Link>
              <Link to="/annonces">
                <Button variant="outline">
                  Continuer mes achats
                </Button>
              </Link>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title="Finaliser ma commande"
        description="Finalisez votre commande sur World Auto Pro Pro"
        noindex={true}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/panier" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour au panier
          </Link>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
            <CreditCard className="w-8 h-8" />
            Finaliser ma commande
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Mode de livraison
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Delivery Method Selection */}
                <RadioGroup value={deliveryMethod} onValueChange={setDeliveryMethod} className="space-y-3">
                  {availableShippingMethods.map((method) => (
                    <div 
                      key={method.id}
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${deliveryMethod === method.id ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id} className="flex items-center gap-3 cursor-pointer flex-1">
                        <span className="text-2xl">{method.icon}</span>
                        <div>
                          <p className="font-medium">{method.name}</p>
                          <p className="text-sm text-muted-foreground">{method.desc}</p>
                        </div>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {/* Mondial Relay Picker */}
                {deliveryMethod === 'mondial_relay' && (
                  <div className="pt-4 border-t">
                    <MondialRelayPicker 
                      postalCode={shippingInfo.postal_code || user?.postal_code}
                      onSelect={setSelectedRelay}
                      selectedRelay={selectedRelay}
                    />
                  </div>
                )}

                {/* Address Form - for methods that need it */}
                {deliveryMethod && 
                 deliveryMethod !== 'mondial_relay' && 
                 deliveryMethod !== 'hand_delivery' && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse *</Label>
                      <Input
                        id="address"
                        placeholder="123 rue de la Pièce Auto"
                        value={shippingInfo.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="postal_code">Code postal *</Label>
                        <Input
                          id="postal_code"
                          placeholder="75001"
                          value={shippingInfo.postal_code}
                          onChange={(e) => handleInputChange('postal_code', e.target.value)}
                          maxLength={5}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="city">Ville *</Label>
                        <Input
                          id="city"
                          placeholder="Paris"
                          value={shippingInfo.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <Input
                        id="phone"
                        placeholder="06 12 34 56 78"
                        value={shippingInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Pour que le vendeur puisse vous contacter si besoin</p>
                    </div>
                  </div>
                )}

                {/* Hand delivery info */}
                {deliveryMethod === 'hand_delivery' && (
                  <div className="pt-4 border-t">
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <p className="text-sm text-amber-800">
                        <strong>🤝 Remise en main propre</strong><br/>
                        Le vendeur vous contactera pour convenir d'un lieu et d'une heure de rendez-vous.
                        Assurez-vous que votre numéro de téléphone est à jour dans votre profil.
                      </p>
                    </div>
                    <div className="space-y-2 mt-4">
                      <Label htmlFor="phone_hand">Téléphone de contact</Label>
                      <Input
                        id="phone_hand"
                        placeholder="06 12 34 56 78"
                        value={shippingInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Payment Method Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Mode de paiement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="space-y-3">
                  {/* Option Stripe */}
                  <div 
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'stripe' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                    } ${!sellerHasStripe ? 'opacity-50' : ''}`}
                  >
                    <RadioGroupItem value="stripe" id="stripe" disabled={!sellerHasStripe} />
                    <Label htmlFor="stripe" className="flex items-center gap-3 cursor-pointer flex-1">
                      <span className="text-2xl">💳</span>
                      <div>
                        <p className="font-medium">Payer maintenant par carte bancaire</p>
                        <p className="text-sm text-muted-foreground">
                          Paiement sécurisé via Stripe - Argent protégé jusqu'à réception
                        </p>
                        {!sellerHasStripe && (
                          <p className="text-xs text-amber-600 mt-1">
                            ⚠️ Le vendeur n'a pas encore configuré le paiement en ligne
                          </p>
                        )}
                      </div>
                    </Label>
                  </div>
                  
                  {/* Option Contact direct */}
                  <div 
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                      paymentMethod === 'contact' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <RadioGroupItem value="contact" id="contact" />
                    <Label htmlFor="contact" className="flex items-center gap-3 cursor-pointer flex-1">
                      <span className="text-2xl">🤝</span>
                      <div>
                        <p className="font-medium">Contacter le vendeur</p>
                        <p className="text-sm text-muted-foreground">
                          Réserver l'article et payer directement au vendeur
                        </p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {paymentMethod === 'contact' && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-blue-800">
                      <strong>ℹ️ Comment ça marche ?</strong><br/>
                      1. Vous réservez l'article<br/>
                      2. Le vendeur vous contacte pour organiser le paiement et la livraison<br/>
                      3. Vous réglez directement avec le vendeur (espèces, virement, etc.)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cart Items Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  Récapitulatif ({cartItems.length} article{cartItems.length > 1 ? 's' : ''})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                    <img
                      src={item.images?.[0] || '/placeholder.jpg'}
                      alt={item.title}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{item.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        Vendu par {item.seller_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-accent">{item.price?.toLocaleString('fr-FR')} €</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Récapitulatif</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{totalPrice.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Frais de livraison</span>
                    <span className="text-sm">À définir avec vendeur</span>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-semibold text-lg">Total</span>
                    <span className="font-heading text-2xl font-bold text-accent">
                      {totalPrice.toLocaleString('fr-FR')} €
                    </span>
                  </div>
                  
                  <Button
                    onClick={handleCheckout}
                    disabled={submitting || cartItems.length === 0}
                    className="w-full h-12 bg-accent hover:bg-accent/90 text-lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {paymentMethod === 'stripe' ? 'Redirection vers le paiement...' : 'Envoi de la demande...'}
                      </>
                    ) : (
                      <>
                        {paymentMethod === 'stripe' ? (
                          <>
                            <CreditCard className="w-5 h-5 mr-2" />
                            Payer {totalPrice.toLocaleString('fr-FR')} €
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-5 h-5 mr-2" />
                            Réserver et contacter le vendeur
                          </>
                        )}
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    {paymentMethod === 'stripe' 
                      ? "Paiement sécurisé par Stripe. L'argent est protégé jusqu'à confirmation de réception."
                      : "En réservant, le vendeur sera notifié et vous contactera pour organiser le paiement et la livraison."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
