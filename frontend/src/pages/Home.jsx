import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card } from '../components/ui/card';
import { Search, Car, Wrench, Bike, Truck, Settings, ArrowRight, Shield, Users, Clock } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { name: 'Pièces Détachées', slug: 'pieces', icon: Wrench, image: 'https://images.unsplash.com/photo-1767339736233-f4b02c41ee4a?w=600&h=400&fit=crop', count: 0 },
  { name: 'Voitures', slug: 'voitures', icon: Car, image: 'https://images.unsplash.com/photo-1676288176820-a5a954d81e6e?w=600&h=400&fit=crop', count: 0 },
  { name: 'Motos', slug: 'motos', icon: Bike, image: 'https://images.unsplash.com/photo-1563156400-283584bf1dde?w=600&h=400&fit=crop', count: 0 },
  { name: 'Utilitaires', slug: 'utilitaires', icon: Truck, image: 'https://images.unsplash.com/photo-1622153556915-1078632b7452?w=600&h=400&fit=crop', count: 0 },
  { name: 'Accessoires', slug: 'accessoires', icon: Settings, image: 'https://images.unsplash.com/photo-1745243996628-eccec80eb2d6?w=600&h=400&fit=crop', count: 0 },
];

const features = [
  { icon: Shield, title: 'Transactions Sécurisées', description: 'Paiements sécurisés et messagerie intégrée' },
  { icon: Users, title: 'Pro & Particuliers', description: 'Vendeurs vérifiés, particuliers et professionnels' },
  { icon: Clock, title: 'Annonces 30 jours', description: 'Vos annonces restent visibles pendant 30 jours' },
];

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [categoryStats, setCategoryStats] = useState({});
  const [recentListings, setRecentListings] = useState([]);

  useEffect(() => {
    fetchCategoryStats();
    fetchRecentListings();
  }, []);

  const fetchCategoryStats = async () => {
    try {
      const response = await axios.get(`${API}/categories/stats`);
      setCategoryStats(response.data);
    } catch (error) {
      console.error('Error fetching category stats:', error);
    }
  };

  const fetchRecentListings = async () => {
    try {
      const response = await axios.get(`${API}/listings?limit=6`);
      setRecentListings(response.data.listings || []);
    } catch (error) {
      console.error('Error fetching recent listings:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    navigate(`/annonces?${params.toString()}`);
  };

  return (
    <div className="animate-fade-in" data-testid="home-page">
      {/* Hero Section */}
      <section className="relative bg-primary overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2832&auto=format&fit=crop')] bg-cover bg-center" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="max-w-3xl">
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black text-primary-foreground tracking-tight leading-none mb-6">
              La marketplace auto<br />
              <span className="text-accent">pour tous</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-xl">
              Achetez et vendez des pièces détachées, voitures, motos et utilitaires. 
              Pour particuliers et professionnels.
            </p>

            {/* Search Form */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3" data-testid="search-form">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une pièce, un véhicule..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12 bg-white border-0"
                  data-testid="search-input"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-48 h-12 bg-white border-0" data-testid="category-select">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pieces">Pièces Détachées</SelectItem>
                  <SelectItem value="voitures">Voitures</SelectItem>
                  <SelectItem value="motos">Motos</SelectItem>
                  <SelectItem value="utilitaires">Utilitaires</SelectItem>
                  <SelectItem value="accessoires">Accessoires</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" className="h-12 px-8 bg-accent hover:bg-accent/90 text-accent-foreground btn-primary" data-testid="search-btn">
                Rechercher
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Categories Bento Grid */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Explorez nos catégories
            </h2>
            <p className="text-muted-foreground text-lg">
              Trouvez exactement ce que vous cherchez parmi des milliers d'annonces
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {categories.map((cat, index) => (
              <Link
                key={cat.slug}
                to={`/annonces/${cat.slug}`}
                className={`group relative overflow-hidden rounded-2xl card-hover ${
                  index === 0 ? 'col-span-2 row-span-2' : ''
                }`}
                data-testid={`category-${cat.slug}`}
              >
                <div className={`relative ${index === 0 ? 'h-80 md:h-96' : 'h-40 md:h-48'}`}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <cat.icon className="w-5 h-5 text-accent" />
                      <span className="text-white font-heading font-bold text-lg md:text-xl">
                        {cat.name}
                      </span>
                    </div>
                    <p className="text-white/70 text-sm">
                      {categoryStats[cat.slug] || 0} annonces
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Listings */}
      {recentListings.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  Annonces récentes
                </h2>
                <p className="text-muted-foreground">
                  Découvrez les dernières annonces publiées
                </p>
              </div>
              <Link to="/annonces">
                <Button variant="outline" className="hidden sm:flex items-center gap-2" data-testid="view-all-btn">
                  Voir tout
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentListings.map((listing) => (
                <Link
                  key={listing.id}
                  to={`/annonce/${listing.id}`}
                  className="group"
                  data-testid={`listing-card-${listing.id}`}
                >
                  <Card className="overflow-hidden card-hover">
                    <div className="relative h-48">
                      <img
                        src={listing.images?.[0] || 'https://images.unsplash.com/photo-1767339736233-f4b02c41ee4a?w=400&h=300&fit=crop'}
                        alt={listing.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      {listing.seller_is_pro && (
                        <span className="absolute top-3 left-3 badge-pro">PRO</span>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-heading font-bold text-lg mb-1 line-clamp-1 group-hover:text-accent transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="font-heading font-bold text-xl text-accent">
                          {listing.price?.toLocaleString('fr-FR')} €
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {listing.location || 'France'}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link to="/annonces">
                <Button variant="outline" className="w-full">
                  Voir toutes les annonces
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Features */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <Card key={feature.title} className="p-8 text-center card-hover">
                <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <feature.icon className="w-7 h-7 text-accent" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
            Prêt à vendre ?
          </h2>
          <p className="text-primary-foreground/70 text-lg mb-8 max-w-xl mx-auto">
            Déposez votre annonce en quelques minutes et touchez des milliers d'acheteurs potentiels.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/deposer">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground btn-primary" data-testid="cta-create-listing">
                Déposer une annonce
              </Button>
            </Link>
            <Link to="/tarifs">
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" data-testid="cta-pricing">
                Voir les tarifs
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
