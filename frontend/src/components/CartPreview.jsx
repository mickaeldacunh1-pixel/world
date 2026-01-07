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
      className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:opacity-90 font-semibold"
      style={{ backgroundColor: bgColor }}
    >
      {/* Cart Icon */}
      <ShoppingCart className="w-5 h-5" style={{ color: textColor }} />

      {/* Info inline */}
      <span style={{ color: textColor }}>
        Panier
      </span>
      <span 
        className="px-2 py-0.5 rounded-full text-xs font-bold"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.2)', 
          color: textColor 
        }}
      >
        {itemCount}
      </span>
      <span className="font-bold" style={{ color: textColor }}>
        {totalPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
      </span>
    </Link>
  );
}
