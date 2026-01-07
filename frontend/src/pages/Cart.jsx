import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ShoppingCart, Trash2, ArrowRight, Package, Ticket, X, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Cart() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackingTimeoutRef = useRef(null);
  
  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Fonction pour tracker le panier (relance abandonnée)
  const trackCart = useCallback(async (items) => {
    if (items.length === 0) return;
    
    try {
      const trackingItems = items.map(item => ({
        listing_id: item.id,
        title: item.title,
        price: item.price || 0,
        image: item.images?.[0] || ''
      }));

      await axios.post(`${API}/cart/track`, {
        items: trackingItems,
        email: user?.email || null
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (error) {
      // Silently fail - tracking should not impact user experience
      console.debug('Cart tracking:', error.message);
    }
  }, [user, token]);

  // Debounced tracking - track cart 5 seconds after last change
  const scheduleTracking = useCallback((items) => {
    if (trackingTimeoutRef.current) {
      clearTimeout(trackingTimeoutRef.current);
    }
    trackingTimeoutRef.current = setTimeout(() => {
      trackCart(items);
    }, 5000);
  }, [trackCart]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (trackingTimeoutRef.current) {
        clearTimeout(trackingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('worldauto_cart');
    if (savedCart) {
      const items = JSON.parse(savedCart);
      setCartItems(items);
      // Fetch latest listing info for each item
      fetchListingDetails(items);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchListingDetails = async (items) => {
    try {
      const updatedItems = await Promise.all(
        items.map(async (item) => {
          try {
            const response = await axios.get(`${API}/listings/${item.id}`);
            return { ...item, ...response.data, available: true };
          } catch {
            return { ...item, available: false };
          }
        })
      );
      const validItems = updatedItems.filter(item => item.available);
      setCartItems(validItems);
      // Update localStorage with valid items only
      localStorage.setItem('worldauto_cart', JSON.stringify(validItems));
      // Track cart for abandoned cart recovery
      if (validItems.length > 0) {
        scheduleTracking(validItems);
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = (listingId) => {
    const updatedCart = cartItems.filter(item => item.id !== listingId);
    setCartItems(updatedCart);
    localStorage.setItem('worldauto_cart', JSON.stringify(updatedCart));
    // Re-track with updated cart
    if (updatedCart.length > 0) {
      scheduleTracking(updatedCart);
    }
    toast.success('Article retiré du panier');
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('worldauto_cart');
    toast.success('Panier vidé');
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title={t('cart.title')}
        description="Votre panier d'achats sur World Auto France"
        url="/panier"
        noindex={true}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
            <ShoppingCart className="w-8 h-8" />
            {t('cart.title')}
          </h1>
          {cartItems.length > 0 && (
            <Button variant="outline" onClick={clearCart} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              {t('cart.clear')}
            </Button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-heading text-xl font-semibold mb-2">{t('cart.empty')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('cart.empty_desc')}
            </p>
            <Link to="/annonces">
              <Button className="bg-accent hover:bg-accent/90">
                {t('cart.browse')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-4">
                  <div className="flex gap-4">
                    <Link to={`/annonce/${item.id}`} className="flex-shrink-0">
                      <img
                        src={item.images?.[0] || '/placeholder.jpg'}
                        alt={item.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/annonce/${item.id}`}>
                        <h3 className="font-heading font-semibold hover:text-accent transition-colors truncate">
                          {item.title}
                        </h3>
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.category} • {item.condition}
                      </p>
                      <p className="font-heading text-xl font-bold text-accent mt-2">
                        {item.price?.toLocaleString('fr-FR')} €
                      </p>
                    </div>
                    <div className="flex items-start">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg">Total ({cartItems.length} article{cartItems.length > 1 ? 's' : ''})</span>
                <span className="font-heading text-2xl font-bold text-accent">
                  {totalPrice.toLocaleString('fr-FR')} €
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                <Package className="w-4 h-4 inline mr-1" />
                Frais de livraison à convenir avec les vendeurs
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/checkout">
                  <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-lg">
                    Passer commande
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/annonces">
                  <Button variant="outline" className="w-full">
                    Continuer mes achats
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
