import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { ShoppingCart, X, Trash2, ArrowRight, Package } from 'lucide-react';

export default function CartPreview() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      const savedCart = localStorage.getItem('worldauto_cart');
      if (savedCart) {
        try {
          setCartItems(JSON.parse(savedCart));
        } catch (e) {
          setCartItems([]);
        }
      }
    };

    loadCart();

    // Listen for cart updates
    const handleStorageChange = (e) => {
      if (e.key === 'worldauto_cart') {
        loadCart();
      }
    };

    // Custom event for same-tab updates
    const handleCartUpdate = () => loadCart();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const removeItem = (itemId) => {
    const newCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(newCart);
    localStorage.setItem('worldauto_cart', JSON.stringify(newCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const itemCount = cartItems.length;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Cart Button */}
      <Link to="/panier">
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative"
          title="Mon panier"
        >
          <ShoppingCart className="w-5 h-5" />
          {itemCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent text-white text-xs font-bold rounded-full flex items-center justify-center">
              {itemCount > 9 ? '9+' : itemCount}
            </span>
          )}
        </Button>
      </Link>

      {/* Preview Dropdown */}
      {isOpen && (
        <div 
          className="absolute top-full right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-border z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border bg-secondary/30">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <ShoppingCart className="w-4 h-4" />
                Mon panier
              </h3>
              <span className="text-sm text-muted-foreground">
                {itemCount} article{itemCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {cartItems.length === 0 ? (
              <div className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Votre panier est vide</p>
                <Link to="/annonces">
                  <Button variant="link" className="mt-2 text-accent">
                    Découvrir les annonces
                  </Button>
                </Link>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {cartItems.slice(0, 5).map((item) => (
                  <li key={item.id} className="p-3 hover:bg-secondary/30 transition-colors">
                    <div className="flex gap-3">
                      {/* Image */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
                        {item.images?.[0] ? (
                          <img 
                            src={item.images[0]} 
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0">
                        <Link 
                          to={`/annonce/${item.id}`}
                          className="font-medium text-sm hover:text-accent line-clamp-2 transition-colors"
                        >
                          {item.title}
                        </Link>
                        <p className="text-accent font-bold mt-1">
                          {item.price?.toLocaleString('fr-FR')} €
                        </p>
                      </div>

                      {/* Remove button */}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                        title="Retirer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}

                {cartItems.length > 5 && (
                  <li className="p-3 text-center text-sm text-muted-foreground">
                    + {cartItems.length - 5} autre{cartItems.length - 5 > 1 ? 's' : ''} article{cartItems.length - 5 > 1 ? 's' : ''}
                  </li>
                )}
              </ul>
            )}
          </div>

          {/* Footer */}
          {cartItems.length > 0 && (
            <div className="p-4 border-t border-border bg-secondary/20">
              {/* Total */}
              <div className="flex items-center justify-between mb-3">
                <span className="text-muted-foreground">Total</span>
                <span className="text-xl font-bold text-accent">
                  {totalPrice.toLocaleString('fr-FR')} €
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Link to="/panier" className="flex-1">
                  <Button variant="outline" className="w-full">
                    Voir le panier
                  </Button>
                </Link>
                <Link to="/checkout" className="flex-1">
                  <Button className="w-full bg-accent hover:bg-accent/90">
                    Commander
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
