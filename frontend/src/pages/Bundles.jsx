import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Package, Percent, Eye, ShoppingCart, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Bundles() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const response = await axios.get(`${API}/bundles`);
      setBundles(response.data);
    } catch (error) {
      console.error('Error fetching bundles:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title={t('bundles.title')}
        description={t('bundles.subtitle')}
        url="/lots"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
            <Package className="w-8 h-8" />
            {t('bundles.title')}
          </h1>
          <p className="text-muted-foreground">{t('bundles.subtitle')}</p>
        </div>

        {bundles.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">{t('bundles.no_bundles')}</h2>
            <p className="text-muted-foreground mb-4">
              Les vendeurs n'ont pas encore créé de lots
            </p>
            <Link to="/annonces">
              <Button className="bg-accent hover:bg-accent/90">
                Parcourir les annonces
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bundles.map((bundle) => (
              <Card key={bundle.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Images en grille */}
                <div className="grid grid-cols-2 gap-1 h-40">
                  {bundle.listings.slice(0, 4).map((listing, idx) => (
                    <div key={listing.id} className="relative overflow-hidden">
                      <img
                        src={listing.images?.[0] || '/placeholder.jpg'}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                      {idx === 3 && bundle.listings.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <span className="text-white font-bold">+{bundle.listings.length - 4}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold line-clamp-2">{bundle.title}</h3>
                    <Badge className="bg-green-100 text-green-700 flex-shrink-0">
                      <Percent className="w-3 h-3 mr-1" />
                      -{bundle.discount_percent}%
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {bundle.description}
                  </p>

                  <div className="flex items-center justify-between text-sm mb-3">
                    <span className="text-muted-foreground">
                      {bundle.listings.length} pièces
                    </span>
                    <span className="text-muted-foreground line-through">
                      {bundle.original_total?.toFixed(2)} €
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-accent">
                      {bundle.bundle_price?.toFixed(2)} €
                    </span>
                    <Link to={`/lot/${bundle.id}`}>
                      <Button size="sm" className="bg-accent hover:bg-accent/90">
                        <Eye className="w-4 h-4 mr-1" />
                        Voir le lot
                      </Button>
                    </Link>
                  </div>

                  <p className="text-xs text-muted-foreground mt-2">
                    Par {bundle.seller_name}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
