import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { MapPin, Eye, Calendar, User, MessageSquare, Phone, ChevronLeft, ChevronRight, Share2, Heart } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const conditionLabels = {
  neuf: 'Neuf',
  occasion: 'Occasion',
  reconditionne: 'Reconditionné',
};

const categoryLabels = {
  pieces: 'Pièces Détachées',
  voitures: 'Voitures',
  motos: 'Motos',
  utilitaires: 'Utilitaires',
  accessoires: 'Accessoires',
};

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (user && listing) {
      checkFavorite();
    }
  }, [user, listing]);

  const fetchListing = async () => {
    try {
      const response = await axios.get(`${API}/listings/${id}`);
      setListing(response.data);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Annonce non trouvée');
      navigate('/annonces');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const response = await axios.get(`${API}/favorites/check/${id}`);
      setIsFavorite(response.data.is_favorite);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error('Connectez-vous pour ajouter aux favoris');
      navigate('/auth');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await axios.delete(`${API}/favorites/${id}`);
        setIsFavorite(false);
        toast.success('Retiré des favoris');
      } else {
        await axios.post(`${API}/favorites/${id}`);
        setIsFavorite(true);
        toast.success('Ajouté aux favoris');
      }
    } catch (error) {
      toast.error('Erreur');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      toast.error('Connectez-vous pour envoyer un message');
      navigate('/auth');
      return;
    }

    if (!message.trim()) {
      toast.error('Veuillez écrire un message');
      return;
    }

    setSendingMessage(true);
    try {
      await axios.post(`${API}/messages`, {
        listing_id: listing.id,
        receiver_id: listing.seller_id,
        content: message,
      });
      toast.success('Message envoyé !');
      setMessage('');
      setMessageDialogOpen(false);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: listing.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Lien copié !');
    }
  };

  const images = listing?.images?.length > 0 
    ? listing.images 
    : ['https://images.unsplash.com/photo-1767339736233-f4b02c41ee4a?w=800&h=600&fit=crop'];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="listing-detail-loading">
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  return (
    <div className="min-h-screen bg-background" data-testid="listing-detail-page">
      {/* Breadcrumb */}
      <div className="bg-secondary/30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">Accueil</Link>
            <span>/</span>
            <Link to="/annonces" className="hover:text-foreground">Annonces</Link>
            <span>/</span>
            <Link to={`/annonces/${listing.category}`} className="hover:text-foreground">
              {categoryLabels[listing.category]}
            </Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{listing.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative rounded-2xl overflow-hidden bg-secondary">
              <img
                src={images[currentImage]}
                alt={listing.title}
                className="w-full h-80 md:h-96 lg:h-[500px] object-cover"
                data-testid="listing-main-image"
              />
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1))}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    data-testid="prev-image-btn"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1))}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    data-testid="next-image-btn"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {listing.seller_is_pro && (
                <span className="absolute top-4 left-4 badge-pro text-sm">PRO</span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImage === index ? 'border-accent' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{categoryLabels[listing.category]}</Badge>
                <Badge variant="outline">{conditionLabels[listing.condition]}</Badge>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2" data-testid="listing-title">
                {listing.title}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                {listing.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {listing.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {listing.views} vues
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            <div className="text-4xl font-heading font-black text-accent" data-testid="listing-price">
              {listing.price?.toLocaleString('fr-FR')} €
            </div>

            <Card className="p-6">
              <h2 className="font-heading font-bold text-lg mb-4">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line" data-testid="listing-description">
                {listing.description}
              </p>
            </Card>

            {/* Vehicle details if applicable */}
            {(listing.brand || listing.model || listing.year || listing.mileage) && (
              <Card className="p-6">
                <h2 className="font-heading font-bold text-lg mb-4">Caractéristiques</h2>
                <div className="grid grid-cols-2 gap-4">
                  {listing.brand && (
                    <div>
                      <span className="text-muted-foreground text-sm">Marque</span>
                      <p className="font-medium">{listing.brand}</p>
                    </div>
                  )}
                  {listing.model && (
                    <div>
                      <span className="text-muted-foreground text-sm">Modèle</span>
                      <p className="font-medium">{listing.model}</p>
                    </div>
                  )}
                  {listing.year && (
                    <div>
                      <span className="text-muted-foreground text-sm">Année</span>
                      <p className="font-medium">{listing.year}</p>
                    </div>
                  )}
                  {listing.mileage && (
                    <div>
                      <span className="text-muted-foreground text-sm">Kilométrage</span>
                      <p className="font-medium">{listing.mileage?.toLocaleString('fr-FR')} km</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Compatibility Info */}
            {(listing.compatible_brands?.length > 0 || listing.oem_reference || listing.aftermarket_reference || listing.compatible_years) && (
              <Card className="p-6 border-blue-100 bg-blue-50/50">
                <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-blue-600">🔧</span>
                  Compatibilité véhicule
                </h2>
                <div className="space-y-4">
                  {listing.compatible_brands?.length > 0 && (
                    <div>
                      <span className="text-muted-foreground text-sm block mb-2">Marques compatibles</span>
                      <div className="flex flex-wrap gap-2">
                        {listing.compatible_brands.map((brand) => (
                          <span key={brand} className="bg-white px-3 py-1 rounded-full text-sm font-medium border">
                            {brand}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.compatible_models?.length > 0 && (
                    <div>
                      <span className="text-muted-foreground text-sm block mb-2">Modèles compatibles</span>
                      <div className="flex flex-wrap gap-2">
                        {listing.compatible_models.map((model) => (
                          <span key={model} className="bg-white px-3 py-1 rounded-full text-sm font-medium border">
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.compatible_years && (
                    <div>
                      <span className="text-muted-foreground text-sm">Années compatibles</span>
                      <p className="font-medium">{listing.compatible_years}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    {listing.oem_reference && (
                      <div>
                        <span className="text-muted-foreground text-sm">Réf. OEM (constructeur)</span>
                        <p className="font-mono font-bold text-blue-600">{listing.oem_reference}</p>
                      </div>
                    )}
                    {listing.aftermarket_reference && (
                      <div>
                        <span className="text-muted-foreground text-sm">Réf. équipementier</span>
                        <p className="font-mono font-bold">{listing.aftermarket_reference}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Seller Info */}
            <Card className="p-6">
              <h2 className="font-heading font-bold text-lg mb-4">Vendeur</h2>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium flex items-center gap-2">
                    {listing.seller_name}
                    {listing.seller_is_pro && <span className="badge-pro">PRO</span>}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Membre depuis {new Date(listing.created_at).getFullYear()}
                  </p>
                </div>
              </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {user?.id !== listing.seller_id ? (
                <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 h-12 bg-accent hover:bg-accent/90 text-accent-foreground btn-primary" data-testid="contact-seller-btn">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Contacter le vendeur
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Envoyer un message</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <p className="text-sm text-muted-foreground">
                        À propos de : <span className="font-medium text-foreground">{listing.title}</span>
                      </p>
                      <Textarea
                        placeholder="Bonjour, je suis intéressé(e) par votre annonce..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        data-testid="message-textarea"
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={sendingMessage}
                        className="w-full bg-accent hover:bg-accent/90"
                        data-testid="send-message-btn"
                      >
                        {sendingMessage ? 'Envoi...' : 'Envoyer le message'}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Link to="/tableau-de-bord" className="flex-1">
                  <Button className="w-full h-12" variant="outline">
                    Modifier mon annonce
                  </Button>
                </Link>
              )}
              
              <Button variant="outline" className="h-12" onClick={handleShare} data-testid="share-btn">
                <Share2 className="w-5 h-5 mr-2" />
                Partager
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
