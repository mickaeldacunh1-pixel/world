import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Heart, Trash2, MapPin, Eye } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`);
      setFavorites(response.data);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (listingId) => {
    try {
      await axios.delete(`${API}/favorites/${listingId}`);
      setFavorites(favorites.filter(f => f.id !== listingId));
      toast.success('Retiré des favoris');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Connectez-vous</h2>
          <p className="text-muted-foreground mb-4">Pour voir vos favoris, vous devez être connecté.</p>
          <Link to="/auth">
            <Button className="bg-accent hover:bg-accent/90">Se connecter</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Mes favoris</h1>
            <p className="text-muted-foreground">{favorites.length} annonce{favorites.length > 1 ? 's' : ''} sauvegardée{favorites.length > 1 ? 's' : ''}</p>
          </div>
          <Link to="/alertes">
            <Button variant="outline">Gérer mes alertes</Button>
          </Link>
        </div>

        {favorites.length === 0 ? (
          <Card className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Aucun favori</h2>
            <p className="text-muted-foreground mb-4">Parcourez les annonces et ajoutez vos préférées en favoris.</p>
            <Link to="/annonces">
              <Button className="bg-accent hover:bg-accent/90">Voir les annonces</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favorites.map((listing) => (
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
                        Pas d'image
                      </div>
                    )}
                    {listing.status !== 'active' && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge variant="destructive">Vendu</Badge>
                      </div>
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
                    <span>{listing.location}</span>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Eye className="w-4 h-4" />
                      <span>{listing.views || 0} vues</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeFavorite(listing.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Retirer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
