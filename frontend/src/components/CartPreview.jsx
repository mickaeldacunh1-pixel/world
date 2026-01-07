import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function CartPreview({ bgColor = '#1E3A5F', textColor = '#FFFFFF' }) {
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

  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || 0), 0);
  const itemCount = cartItems.length;

  return (
    <Link 
      to="/panier"
      className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all hover:opacity-90"
      style={{ backgroundColor: bgColor }}
    >
      {/* Cart Icon */}
      <div className="relative">
        <ShoppingCart className="w-6 h-6" style={{ color: textColor }} />
      </div>

      {/* Info */}
      <div className="text-right leading-tight">
        <div className="text-lg font-bold" style={{ color: textColor }}>
          {itemCount}
        </div>
        <div className="text-xs opacity-80" style={{ color: textColor }}>
          article{itemCount > 1 ? 's' : ''}
        </div>
        <div className="text-sm font-semibold" style={{ color: textColor }}>
          {totalPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
        </div>
      </div>
    </Link>
  );
}
