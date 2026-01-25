import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Heart, MapPin, Eye, User, Calendar, Loader2 } from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SharedWishlist() {
  const { t } = useTranslation();
  const { shareId } = useParams();
  const [wishlist, setWishlist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, [shareId]);

  const fetchWishlist = async () => {
    try {
      const response = await axios.get(`${API}/wishlist/shared/${shareId}`);
      setWishlist(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Wishlist non trouvée');
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

  if (error) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Wishlist introuvable</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link to="/annonces">
            <Button className="bg-accent hover:bg-accent/90">Parcourir les annonces</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title={`Wishlist de ${wishlist.user_name}`}
        description={`Découvrez les ${wishlist.items_count} pièces sélectionnées par ${wishlist.user_name}`}
        url={`/wishlist/${shareId}`}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <Card className="mb-8 p-6 bg-gradient-to-r from-accent/10 to-transparent">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent/20 rounded-full flex items-center justify-center">
              <Heart className="w-7 h-7 text-accent" />
            </div>
            <div className="flex-1">
              <h1 className="font-heading text-2xl font-bold flex items-center gap-2">
                <User className="w-5 h-5" />
                Wishlist de {wishlist.user_name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span>{wishlist.items_count} article(s)</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {wishlist.views} vue(s)
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(wishlist.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Listings */}
        {wishlist.listings.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Wishlist vide</h2>
            <p className="text-muted-foreground">Aucune annonce disponible dans cette wishlist.</p>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden card-hover group">
                <Link to={`/annonce/${listing.id}`}>
                  <div className="relative aspect-[4/3] bg-secondary">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        Pas d&apos;image
                      </div>
                    )}
                    {listing.quantity === 1 && (
                      <Badge className="absolute top-2 right-2 bg-red-500 text-white animate-pulse">
                        Dernière pièce !
                      </Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link to={`/annonce/${listing.id}`}>
                    <h3 className="font-semibold line-clamp-1 group-hover:text-accent transition-colors">
                      {listing.title}
                    </h3>
                  </Link>
                  <p className="text-2xl font-heading font-black text-accent mt-1">
                    {listing.price?.toLocaleString('fr-FR')} €
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
                    <MapPin className="w-4 h-4" />
                    <span>{listing.location || 'France'}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <Eye className="w-4 h-4" />
                    <span>{listing.views || 0} vues</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-muted-foreground mb-4">Vous aussi, créez votre wishlist et partagez-la !</p>
          <Link to="/favoris">
            <Button className="bg-accent hover:bg-accent/90">
              <Heart className="w-4 h-4 mr-2" />
              Créer ma wishlist
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
