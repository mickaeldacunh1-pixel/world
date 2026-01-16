import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Star, MapPin, Calendar, Package, CheckCircle, User, MessageSquare, Shield, Trophy, Zap, Sparkles } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Badge icon mapping
const BADGE_ICONS = {
  'shield-check': Shield,
  'trophy': Trophy,
  'zap': Zap,
  'star': Star,
  'sparkles': Sparkles
};

// Badge color mapping
const BADGE_COLORS = {
  'green': 'bg-green-100 text-green-700 border-green-200',
  'gold': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'yellow': 'bg-amber-100 text-amber-700 border-amber-200',
  'purple': 'bg-purple-100 text-purple-700 border-purple-200',
  'blue': 'bg-blue-100 text-blue-700 border-blue-200'
};

export default function SellerProfile() {
  const { sellerId } = useParams();
  const [seller, setSeller] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSellerProfile();
    fetchSellerListings();
  }, [sellerId]);

  const fetchSellerProfile = async () => {
    try {
      const response = await axios.get(`${API}/seller/${sellerId}/profile`);
      setSeller(response.data);
    } catch (err) {
      setError('Vendeur non trouvé');
    } finally {
      setLoading(false);
    }
  };

  const fetchSellerListings = async () => {
    try {
      const response = await axios.get(`${API}/listings?seller_id=${sellerId}&limit=12`);
      setListings(response.data.listings || []);
    } catch (err) {
      console.error('Error fetching listings:', err);
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <User className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Vendeur non trouvé</h2>
          <Link to="/annonces">
            <Button className="bg-accent hover:bg-accent/90">Voir les annonces</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Seller Header */}
        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-3xl font-bold text-accent">
                  {seller.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2 flex-wrap">
                  <h1 className="font-heading text-2xl md:text-3xl font-bold">{seller.name}</h1>
                  {seller.is_professional && (
                    <Badge className="bg-accent">PRO</Badge>
                  )}
                  {seller.is_verified_seller && (
                    <Badge className="bg-green-500 hover:bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Vendeur Vérifié
                    </Badge>
                  )}
                </div>
                {seller.company_name && (
                  <p className="text-muted-foreground mb-2">{seller.company_name}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {seller.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {seller.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Membre depuis {seller.created_at && new Date(seller.created_at).getFullYear() > 1971 
                      ? new Date(seller.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
                      : 'récemment'}
                  </span>
                  {seller.website && (
                    <a 
                      href={seller.website.startsWith('http') ? seller.website : `https://${seller.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-accent hover:underline"
                    >
                      <span className="w-4 h-4">🌐</span>
                      Site web
                    </a>
                  )}
                </div>

                {/* Badges Section */}
                {seller.badges && seller.badges.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-2">Badges obtenus</p>
                    <div className="flex flex-wrap gap-2">
                      {seller.badges.map((badge) => {
                        const IconComponent = BADGE_ICONS[badge.icon] || Star;
                        const colorClass = BADGE_COLORS[badge.color] || BADGE_COLORS.blue;
                        return (
                          <div
                            key={badge.id}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${colorClass}`}
                            title={badge.description}
                          >
                            <IconComponent className="w-3.5 h-3.5" />
                            {badge.name}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                {seller.average_rating > 0 ? (
                  <div className="flex items-center gap-2">
                    {renderStars(seller.average_rating)}
                    <span className="font-bold text-lg">{seller.average_rating}</span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">Pas encore d'avis</span>
                )}
                <span className="text-sm text-muted-foreground">
                  {seller.total_reviews} avis
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-accent">{seller.active_listings}</p>
                <p className="text-sm text-muted-foreground">Annonces actives</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{seller.sold_count}</p>
                <p className="text-sm text-muted-foreground">Ventes réalisées</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{seller.average_rating || '-'}</p>
                <p className="text-sm text-muted-foreground">Note moyenne</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{seller.total_reviews}</p>
                <p className="text-sm text-muted-foreground">Avis reçus</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Listings */}
          <div className="lg:col-span-2">
            <h2 className="font-heading text-xl font-bold mb-4">
              Annonces de {seller.name} ({listings.length})
            </h2>
            {listings.length === 0 ? (
              <Card className="p-8 text-center">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Aucune annonce active</p>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {listings.map((listing) => (
                  <Link key={listing.id} to={`/annonce/${listing.id}`}>
                    <Card className="overflow-hidden card-hover h-full">
                      <div className="aspect-[4/3] bg-secondary">
                        {listing.images && listing.images.length > 0 ? (
                          <img
                            src={listing.images[0]}
                            alt={listing.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            Pas d'image
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-semibold line-clamp-1">{listing.title}</h3>
                        <p className="text-xl font-heading font-bold text-accent mt-1">
                          {listing.price?.toLocaleString('fr-FR')} €
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {listing.location}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Reviews */}
          <div>
            <h2 className="font-heading text-xl font-bold mb-4">
              Avis ({seller.total_reviews})
            </h2>
            {seller.reviews && seller.reviews.length > 0 ? (
              <div className="space-y-4">
                {seller.reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium">{review.buyer_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(review.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {review.listing_title}
                      </p>
                      {review.comment && (
                        <p className="text-sm">{review.comment}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center">
                <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Pas encore d'avis</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
