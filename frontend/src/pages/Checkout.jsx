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

  const [deliveryMethod, setDeliveryMethod] = useState('home'); // 'home' or 'relay'
  const [selectedRelay, setSelectedRelay] = useState(null);

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
            return { ...item, ...response.data, available: response.data.status === 'active' };
          } catch {
            return { ...item, available: false };
          }
        })
      );
      
      const availableItems = updatedItems.filter(item => item.available);
      setCartItems(availableItems);
      
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
    // For relay delivery, only need phone (relay info handles address)
    if (deliveryMethod === 'relay') {
      if (!selectedRelay) {
        toast.error('Veuillez sélectionner un point relais');
        return false;
      }
      return true;
    }
    
    // Home delivery validation
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
    return true;
  };

  const handleCheckout = async () => {
    if (!validateForm()) return;
    
    setSubmitting(true);
    try {
      // Prepare shipping data based on delivery method
      let shippingData = {};
      
      if (deliveryMethod === 'relay' && selectedRelay) {
        shippingData = {
          buyer_address: `Point Relais: ${selectedRelay.name} - ${selectedRelay.address}`,
          buyer_city: selectedRelay.city,
          buyer_postal: selectedRelay.postalCode,
          buyer_phone: shippingInfo.phone || undefined,
          delivery_method: 'relay',
          relay_id: selectedRelay.id,
          relay_name: selectedRelay.name
        };
      } else {
        shippingData = {
          buyer_address: shippingInfo.address,
          buyer_city: shippingInfo.city,
          buyer_postal: shippingInfo.postal_code,
          buyer_phone: shippingInfo.phone || undefined,
          delivery_method: 'home'
        };
      }
      
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
      toast.success('Commandes confirmées !');
      
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
                  <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${deliveryMethod === 'home' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <RadioGroupItem value="home" id="home" />
                    <Label htmlFor="home" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Home className="w-5 h-5 text-accent" />
                      <div>
                        <p className="font-medium">Livraison à domicile</p>
                        <p className="text-sm text-muted-foreground">Recevoir à votre adresse</p>
                      </div>
                    </Label>
                  </div>
                  
                  <div className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${deliveryMethod === 'relay' ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'}`}>
                    <RadioGroupItem value="relay" id="relay" />
                    <Label htmlFor="relay" className="flex items-center gap-3 cursor-pointer flex-1">
                      <Package className="w-5 h-5 text-accent" />
                      <div>
                        <p className="font-medium">Point Relais Mondial Relay</p>
                        <p className="text-sm text-muted-foreground">Retirer dans un point relais près de chez vous</p>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>

                {/* Home Delivery Form */}
                {deliveryMethod === 'home' && (
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
                  </div>
                )}

                {/* Point Relay Picker */}
                {deliveryMethod === 'relay' && (
                  <div className="pt-4 border-t">
                    <MondialRelayPicker 
                      onSelect={setSelectedRelay}
                      selectedRelay={selectedRelay}
                      postalCode={shippingInfo.postal_code}
                    />
                  </div>
                )}
                
                {/* Phone - Always visible */}
                <div className="space-y-2 pt-4 border-t">
                  <Label htmlFor="phone">Téléphone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      placeholder="06 12 34 56 78"
                      value={shippingInfo.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Pour que le vendeur puisse vous contacter si besoin
                  </p>
                </div>
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
                    <span className="text-sm">À convenir avec vendeur</span>
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
                        Confirmation...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Confirmer ma commande
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    En confirmant, vous acceptez nos conditions de vente.
                    Les vendeurs seront notifiés et vous contacteront pour organiser la livraison et le paiement.
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
