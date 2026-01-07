import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Package, Percent, ArrowLeft, ShoppingCart, Loader2, User, MessageSquare } from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function BundleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundle();
  }, [id]);

  const fetchBundle = async () => {
    try {
      const response = await axios.get(`${API}/bundles/${id}`);
      setBundle(response.data);
    } catch (error) {
      toast.error('Lot non trouvé');
      navigate('/lots');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (!user) {
      toast.error('Connectez-vous pour contacter le vendeur');
      navigate('/auth');
      return;
    }
    // Rediriger vers les messages avec le vendeur
    navigate(`/messages?seller=${bundle.seller_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  if (!bundle) return null;

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title={`Lot: ${bundle.title}`}
        description={bundle.description}
        url={`/lot/${id}`}
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/lots" className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour aux lots
          </Link>
          
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-3">
                <Package className="w-8 h-8 text-accent" />
                {bundle.title}
              </h1>
              <p className="text-muted-foreground mt-1">{bundle.description}</p>
            </div>
            <Badge className="bg-green-100 text-green-700 text-lg px-3 py-1">
              <Percent className="w-4 h-4 mr-1" />
              -{bundle.discount_percent}%
            </Badge>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Liste des pièces */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold text-lg">
              {bundle.listings.length} pièces dans ce lot
            </h2>
            
            {bundle.listings.map((listing) => (
              <Card key={listing.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex">
                    <div className="w-24 h-24 flex-shrink-0">
                      <img
                        src={listing.images?.[0] || '/placeholder.jpg'}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 p-4 flex items-center justify-between">
                      <div>
                        <Link 
                          to={`/annonce/${listing.id}`}
                          className="font-semibold hover:text-accent"
                        >
                          {listing.title}
                        </Link>
                        <p className="text-sm text-muted-foreground">
                          Vendu séparément : {listing.price?.toFixed(2)} €
                        </p>
                      </div>
                      <Link to={`/annonce/${listing.id}`}>
                        <Button variant="outline" size="sm">
                          Voir
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar prix */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardContent className="p-6 space-y-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Prix si acheté séparément</p>
                  <p className="text-xl line-through text-muted-foreground">
                    {bundle.original_total?.toFixed(2)} €
                  </p>
                </div>
                
                <div className="text-center py-4 bg-accent/10 rounded-lg">
                  <p className="text-sm font-medium text-accent mb-1">Prix du lot</p>
                  <p className="text-3xl font-bold text-accent">
                    {bundle.bundle_price?.toFixed(2)} €
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    Économie : {(bundle.original_total - bundle.bundle_price)?.toFixed(2)} €
                  </p>
                </div>

                <Button 
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={handleContact}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Contacter le vendeur
                </Button>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium">{bundle.seller_name}</p>
                      <Link 
                        to={`/vendeur/${bundle.seller_id}`}
                        className="text-sm text-accent hover:underline"
                      >
                        Voir le profil
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
