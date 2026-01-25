import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Package, Percent, Check, Loader2, Tag } from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function CreateBundle() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingListings, setLoadingListings] = useState(true);
  const [myListings, setMyListings] = useState([]);
  const [selectedListings, setSelectedListings] = useState([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    bundle_price: ''
  });

  useEffect(() => {
    fetchMyListings();
  }, []);

  const fetchMyListings = async () => {
    try {
      const response = await axios.get(`${API}/my-listings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Filtrer uniquement les annonces actives
      const activeListings = response.data.filter(l => l.status === 'active');
      setMyListings(activeListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast.error('Erreur lors du chargement de vos annonces');
    } finally {
      setLoadingListings(false);
    }
  };

  const toggleListing = (listingId) => {
    setSelectedListings(prev => {
      if (prev.includes(listingId)) {
        return prev.filter(id => id !== listingId);
      }
      return [...prev, listingId];
    });
  };

  const totalOriginalPrice = selectedListings.reduce((sum, id) => {
    const listing = myListings.find(l => l.id === id);
    return sum + (listing?.price || 0);
  }, 0);

  const bundlePrice = parseFloat(formData.bundle_price) || 0;
  const discount = totalOriginalPrice > 0 && bundlePrice > 0 
    ? Math.round((1 - bundlePrice / totalOriginalPrice) * 100)
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedListings.length < 2) {
      toast.error('Sélectionnez au moins 2 annonces');
      return;
    }

    if (!formData.title || !formData.bundle_price) {
      toast.error('Remplissez tous les champs obligatoires');
      return;
    }

    if (bundlePrice >= totalOriginalPrice) {
      toast.error('Le prix du lot doit être inférieur au total des pièces');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/bundles`, {
        title: formData.title,
        description: formData.description,
        listing_ids: selectedListings,
        bundle_price: bundlePrice
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Lot créé avec ${discount}% de remise !`);
      navigate('/lots');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Connectez-vous</h2>
          <p className="text-muted-foreground mb-4">Pour créer un lot, vous devez être connecté.</p>
          <Link to="/auth">
            <Button className="bg-accent hover:bg-accent/90">Se connecter</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title="Créer un lot"
        description="Créez un lot de pièces avec une remise groupée"
        noindex={true}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to="/tableau-de-bord" className="text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour au tableau de bord
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl flex items-center gap-3">
              <Package className="w-7 h-7 text-accent" />
              Créer un lot groupé
            </CardTitle>
            <p className="text-muted-foreground">
              Regroupez plusieurs pièces et proposez une remise attractive
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Sélection des annonces */}
              <div className="space-y-3">
                <Label>Sélectionnez les annonces à regrouper *</Label>
                
                {loadingListings ? (
                  <div className="flex items-center justify-center p-8">
                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  </div>
                ) : myListings.length === 0 ? (
                  <Card className="p-6 text-center bg-yellow-50 border-yellow-200">
                    <p className="text-yellow-800">
                      Vous n&apos;avez pas d&apos;annonces actives. Publiez au moins 2 annonces pour créer un lot.
                    </p>
                    <Link to="/deposer">
                      <Button className="mt-4" variant="outline">Publier une annonce</Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="grid gap-3 max-h-80 overflow-y-auto p-1">
                    {myListings.map((listing) => (
                      <div
                        key={listing.id}
                        className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedListings.includes(listing.id)
                            ? 'border-accent bg-accent/5'
                            : 'border-border hover:border-accent/50'
                        }`}
                        onClick={() => toggleListing(listing.id)}
                      >
                        <Checkbox
                          checked={selectedListings.includes(listing.id)}
                          onCheckedChange={() => toggleListing(listing.id)}
                        />
                        <img
                          src={listing.images?.[0] || '/placeholder.jpg'}
                          alt={listing.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{listing.title}</p>
                          <p className="text-sm text-muted-foreground">{listing.category}</p>
                        </div>
                        <p className="font-bold text-accent">{listing.price?.toLocaleString('fr-FR')} €</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {selectedListings.length > 0 && (
                  <p className="text-sm text-accent flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    {selectedListings.length} annonce(s) sélectionnée(s) - Total : {totalOriginalPrice.toLocaleString('fr-FR')} €
                  </p>
                )}
              </div>

              {/* Titre du lot */}
              <div className="space-y-2">
                <Label htmlFor="title">Titre du lot *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Lot pièces BMW E90 - Freinage complet"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez le contenu du lot et ses avantages..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              {/* Prix du lot */}
              <div className="space-y-2">
                <Label htmlFor="bundle_price">Prix du lot (€) *</Label>
                <div className="relative">
                  <Input
                    id="bundle_price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.bundle_price}
                    onChange={(e) => setFormData(prev => ({ ...prev, bundle_price: e.target.value }))}
                    required
                    className="pr-20"
                  />
                  {discount > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-100 text-green-700 px-2 py-0.5 rounded text-sm font-medium">
                      -{discount}%
                    </span>
                  )}
                </div>
                {totalOriginalPrice > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Prix total des pièces séparées : <span className="line-through">{totalOriginalPrice.toLocaleString('fr-FR')} €</span>
                  </p>
                )}
              </div>

              {/* Récapitulatif */}
              {selectedListings.length >= 2 && bundlePrice > 0 && bundlePrice < totalOriginalPrice && (
                <Card className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Percent className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-bold text-green-800">
                          Économie de {(totalOriginalPrice - bundlePrice).toLocaleString('fr-FR')} €
                        </p>
                        <p className="text-sm text-green-600">
                          Soit {discount}% de remise pour vos acheteurs
                        </p>
                      </div>
                    </div>
                    <Tag className="w-6 h-6 text-green-500" />
                  </div>
                </Card>
              )}

              <Button
                type="submit"
                disabled={loading || selectedListings.length < 2}
                className="w-full h-12 bg-accent hover:bg-accent/90"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Package className="w-5 h-5 mr-2" />
                )}
                Créer le lot
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
