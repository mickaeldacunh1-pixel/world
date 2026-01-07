import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Trophy, Star, ShoppingBag, Package, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SellerOfTheWeek() {
  const [seller, setSeller] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSeller();
  }, []);

  const fetchSeller = async () => {
    try {
      const response = await axios.get(`${API}/seller-of-the-week`);
      setSeller(response.data);
    } catch (error) {
      console.error('Error fetching seller of the week:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200">
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
        </CardContent>
      </Card>
    );
  }

  if (!seller) return null;

  return (
    <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-amber-200 overflow-hidden">
      <CardContent className="p-0">
        <div className="flex items-center">
          {/* Badge */}
          <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-4 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-amber-500 text-white text-xs">
                🏆 Vendeur de la semaine
              </Badge>
              {seller.is_professional && (
                <Badge variant="secondary" className="text-xs">PRO</Badge>
              )}
            </div>

            <Link 
              to={`/vendeur/${seller.id}`}
              className="font-bold text-lg hover:text-amber-600 transition-colors"
            >
              {seller.company_name || seller.name}
            </Link>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <ShoppingBag className="w-4 h-4 text-green-500" />
                <span>{seller.sales_count} ventes</span>
              </div>
              {seller.avg_rating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span>{seller.avg_rating}/5</span>
                  <span className="text-xs">({seller.reviews_count} avis)</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Package className="w-4 h-4 text-blue-500" />
                <span>{seller.active_listings} annonces</span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="p-4">
            <Link 
              to={`/vendeur/${seller.id}`}
              className="text-sm font-medium text-amber-600 hover:text-amber-700 hover:underline"
            >
              Voir le profil →
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
