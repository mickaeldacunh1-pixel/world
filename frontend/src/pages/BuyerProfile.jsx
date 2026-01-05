import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  User, Star, ShieldCheck, Crown, Calendar, 
  Package, MessageSquare, ArrowLeft, Sparkles
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const BADGE_ICONS = {
  'shield-check': ShieldCheck,
  'crown': Crown,
  'star': Sparkles
};

const BADGE_COLORS = {
  'green': 'bg-green-100 text-green-700 border-green-200',
  'gold': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'purple': 'bg-purple-100 text-purple-700 border-purple-200'
};

export default function BuyerProfile() {
  const { buyerId } = useParams();
  const [buyer, setBuyer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBuyer = async () => {
      try {
        const response = await axios.get(`${API}/buyer/profile/${buyerId}`);
        setBuyer(response.data);
      } catch (err) {
        setError('Acheteur non trouvé');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBuyer();
  }, [buyerId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
      </div>
    );
  }

  if (error || !buyer) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <User className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Acheteur non trouvé</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link to="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back button */}
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Link>

        {/* Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-accent/20 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-accent" />
                </div>
                {buyer.is_trusted_buyer && (
                  <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                    <ShieldCheck className="w-5 h-5 text-white" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="font-heading text-2xl font-bold mb-2">{buyer.name}</h1>
                
                {/* Badges */}
                {buyer.badges && buyer.badges.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                    {buyer.badges.map((badge) => {
                      const IconComponent = BADGE_ICONS[badge.icon] || ShieldCheck;
                      const colorClass = BADGE_COLORS[badge.color] || BADGE_COLORS.green;
                      return (
                        <span
                          key={badge.id}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border ${colorClass}`}
                        >
                          <IconComponent className="w-4 h-4" />
                          {badge.name}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Stats */}
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground justify-center md:justify-start">
                  {buyer.city && (
                    <span className="flex items-center gap-1">
                      📍 {buyer.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Membre depuis {new Date(buyer.created_at).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold">{buyer.orders_completed}</p>
              <p className="text-sm text-muted-foreground">Achats</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <MessageSquare className="w-6 h-6 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold">{buyer.total_reviews}</p>
              <p className="text-sm text-muted-foreground">Avis reçus</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <p className="text-2xl font-bold">{buyer.average_rating || '-'}</p>
              <p className="text-sm text-muted-foreground">Note moyenne</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <ShieldCheck className={`w-6 h-6 mx-auto mb-2 ${buyer.is_trusted_buyer ? 'text-green-500' : 'text-gray-400'}`} />
              <p className="text-2xl font-bold">{buyer.is_trusted_buyer ? 'Oui' : 'Non'}</p>
              <p className="text-sm text-muted-foreground">Acheteur de confiance</p>
            </CardContent>
          </Card>
        </div>

        {/* Reviews */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Avis des vendeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {buyer.recent_reviews && buyer.recent_reviews.length > 0 ? (
              <div className="space-y-4">
                {buyer.recent_reviews.map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex">{renderStars(review.rating)}</div>
                        <span className="font-medium">{review.seller_name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Pour : {review.listing_title}
                    </p>
                    {review.comment && (
                      <p className="text-sm">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Aucun avis pour le moment
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
