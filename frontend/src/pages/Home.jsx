import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card } from '../components/ui/card';
import { Search, Car, Wrench, Bike, Truck, Settings, ArrowRight, Shield, Users, Clock, MapPin, Eye, Sparkles, Gavel } from 'lucide-react';
import SEO, { createOrganizationSchema, createWebsiteSchema } from '../components/SEO';
import SeasonalAnimation from '../components/SeasonalAnimation';
import AITools from '../components/AITools';
import PlateScanner from '../components/PlateScanner';
import VoiceSearch from '../components/VoiceSearch';
import AnimatedText from '../components/AnimatedText';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { name: 'Pièces Détachées', slug: 'pieces', icon: Wrench, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop', count: 0, color: 'from-orange-500 to-red-500' },
  { name: 'Voitures', slug: 'voitures', icon: Car, image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop', count: 0, color: 'from-blue-500 to-indigo-500' },
  { name: 'Motos', slug: 'motos', icon: Bike, image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=400&fit=crop', count: 0, color: 'from-green-500 to-teal-500' },
  { name: 'Utilitaires', slug: 'utilitaires', icon: Truck, image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&h=400&fit=crop', count: 0, color: 'from-purple-500 to-pink-500' },
  { name: 'Accessoires', slug: 'accessoires', icon: Settings, image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop', count: 0, color: 'from-yellow-500 to-orange-500' },
];

const features = [
  { icon: Shield, title: 'Transactions Sécurisées', description: 'Paiements sécurisés via Stripe et messagerie intégrée pour des échanges en toute confiance.' },
  { icon: Users, title: 'Pro & Particuliers', description: 'Une communauté de vendeurs vérifiés, particuliers comme professionnels du secteur.' },
  { icon: Clock, title: 'Annonces 30 jours', description: 'Vos annonces restent visibles pendant 30 jours avec possibilité de renouvellement.' },
];

const DEFAULT_HERO = {
  hero_title_line1: "La marketplace auto",
  hero_title_line2: "pour tous",
  hero_description: "Achetez et vendez des pièces détachées, voitures, motos et utilitaires. Pour particuliers et professionnels.",
  hero_image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2832&auto=format&fit=crop",
  hero_cta_text: "Déposer une annonce",
  hero_cta_link: "/deposer",
  seasonal_animation: "",
  announcement_enabled: false,
  announcement_text: "",
  announcement_link: "",
  announcement_bg_color: "#e74c3c",
  announcement_text_color: "#ffffff"
};

export default function Home() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [oemSearch, setOemSearch] = useState('');
  const [categoryStats, setCategoryStats] = useState({});
  const [recentListings, setRecentListings] = useState([]);
  const [heroSettings, setHeroSettings] = useState(DEFAULT_HERO);

  useEffect(() => {
    const fetchHeroSettings = async () => {
      try {
        const response = await axios.get(`${API}/settings/hero`);
        if (response.data) {
          setHeroSettings({ ...DEFAULT_HERO, ...response.data });
        }
      } catch (error) {
        console.error('Error fetching hero settings:', error);
      }
    };

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

    fetchCategoryStats();
    fetchRecentListings();
    fetchHeroSettings();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    navigate(`/annonces?${params.toString()}`);
  };

  const handleOemSearch = (e) => {
    e.preventDefault();
    if (oemSearch.trim()) {
      navigate(`/annonces/pieces?oem_reference=${encodeURIComponent(oemSearch.trim())}`);
    }
  };

  const conditionLabels = {
    neuf: 'Neuf',
    occasion: 'Occasion',
    reconditionne: 'Reconditionné',
  };

  return (
    <div className="animate-fade-in" data-testid="home-page">
      {/* Seasonal Animation */}
      <SeasonalAnimation type={heroSettings.seasonal_animation} enabled={!!heroSettings.seasonal_animation} />
      
      {/* Announcement Bar */}
      {heroSettings.announcement_enabled && heroSettings.announcement_text && (
        <div 
          className="w-full py-3 px-4 text-center font-medium text-sm md:text-base"
          style={{ 
            backgroundColor: heroSettings.announcement_bg_color || '#e74c3c', 
            color: heroSettings.announcement_text_color || '#ffffff' 
          }}
        >
          {heroSettings.announcement_link ? (
            <a 
              href={heroSettings.announcement_link} 
              className="hover:opacity-80 transition-opacity"
            >
              {heroSettings.announcement_text}
            </a>
          ) : (
            <span>{heroSettings.announcement_text}</span>
          )}
        </div>
      )}
      
      <SEO
        title="Accueil"
        description="World Auto France - La marketplace automobile pour acheter et vendre des pièces détachées, voitures, motos et utilitaires d'occasion. Particuliers et professionnels."
        keywords="pièces détachées auto, voiture occasion, moto occasion, utilitaire occasion, marketplace automobile, France"
        url="/"
        structuredData={[createOrganizationSchema(), createWebsiteSchema()]}
      />
      {/* Hero Section - Improved */}
      <section className="relative min-h-[600px] md:min-h-[700px] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src={heroSettings.hero_image} 
            alt="Hero background" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 hero-gradient" />
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 w-full">
          <div className="max-w-3xl animate-fade-in-up">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-6 animate-fade-in-up stagger-1">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-sm font-medium">La référence automobile en France</span>
            </div>
            
            <h1 className="font-heading text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tight leading-none mb-6 animate-fade-in-up stagger-2">
              <AnimatedText 
                text={heroSettings.hero_title_line1} 
                animation={heroSettings.hero_text_animation}
                className="block"
              /><br />
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-accent to-orange-400 ${heroSettings.hero_text_animation === 'glow' ? 'animate-text-glow' : ''}`}>
                <AnimatedText 
                  text={heroSettings.hero_title_line2} 
                  animation={heroSettings.hero_text_animation}
                  delay={heroSettings.hero_text_animation === 'typewriter' ? heroSettings.hero_title_line1.length * 50 + 200 : 200}
                />
              </span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 mb-10 max-w-xl animate-fade-in-up stagger-3">
              {heroSettings.hero_description}
            </p>

            {/* Search Form - Glass effect */}
            <form 
              onSubmit={handleSearch} 
              className="flex flex-col sm:flex-row gap-3 animate-fade-in-up stagger-4 glass p-2 rounded-2xl"
              data-testid="search-form"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une pièce, un véhicule..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-12 h-14 bg-transparent border-0 text-lg focus-ring rounded-xl"
                  data-testid="search-input"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full sm:w-52 h-14 bg-transparent border-0 text-base rounded-xl focus-ring" data-testid="category-select">
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
              <VoiceSearch onSearch={(q) => navigate(`/annonces?search=${encodeURIComponent(q)}`)} />
              <Button 
                type="submit" 
                className="h-14 px-8 btn-primary rounded-xl text-base font-semibold" 
                data-testid="search-btn"
              >
                <Search className="w-5 h-5 mr-2" />
                Rechercher
              </Button>
            </form>

            {/* Plate Scanner & Quick Tools */}
            <div className="flex flex-wrap items-center gap-4 mt-6 animate-fade-in-up stagger-4">
              <PlateScanner onVehicleSelect={(v) => {
                navigate(`/annonces?brand=${encodeURIComponent(v.brand)}&model=${encodeURIComponent(v.model)}&year=${v.year}`);
              }} />
              <Link to="/encheres">
                <Button variant="outline" className="gap-2 border-white/30 text-white hover:bg-white/10">
                  <Gavel className="w-5 h-5" />
                  Enchères en direct
                </Button>
              </Link>
            </div>

            {/* Quick stats */}
            <div className="flex flex-wrap items-center gap-6 mt-8 animate-fade-in-up stagger-5">
              <div className="text-white/70">
                <span className="text-2xl font-bold text-white">{Object.values(categoryStats).reduce((a, b) => a + b, 0) || '100+'}+</span>
                <span className="ml-2 text-sm">annonces actives</span>
              </div>
              <div className="text-white/70">
                <span className="text-2xl font-bold text-white">5</span>
                <span className="ml-2 text-sm">catégories</span>
              </div>
              <div className="ml-auto">
                <AITools />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Bento Grid - Improved */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/50 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Explorez nos catégories
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Trouvez exactement ce que vous cherchez parmi des milliers d'annonces vérifiées
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {categories.map((cat, index) => (
              <Link
                key={cat.slug}
                to={`/annonces/${cat.slug}`}
                className={`group relative overflow-hidden rounded-2xl hover-lift animate-fade-in-up stagger-${index + 1} ${
                  index === 0 ? 'col-span-2 row-span-2' : ''
                }`}
                data-testid={`category-${cat.slug}`}
              >
                <div className={`relative ${index === 0 ? 'h-80 md:h-[420px]' : 'h-44 md:h-52'}`}>
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="absolute inset-0 w-full h-full object-cover img-zoom"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                  
                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                        <cat.icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-white font-heading font-bold text-lg md:text-xl drop-shadow-lg">
                        {cat.name}
                      </span>
                    </div>
                    <p className="text-white/80 text-sm font-medium">
                      {categoryStats[cat.slug] || 0} annonces
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Search by Brand Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Rechercher par marque
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Trouvez des pièces et véhicules de votre marque préférée
            </p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-4 md:gap-6">
            {[
              { name: 'Renault', logo: 'https://www.carlogos.org/car-logos/renault-logo.png' },
              { name: 'Peugeot', logo: 'https://www.carlogos.org/car-logos/peugeot-logo.png' },
              { name: 'Citroën', logo: 'https://www.carlogos.org/car-logos/citroen-logo.png' },
              { name: 'Volkswagen', logo: 'https://www.carlogos.org/car-logos/volkswagen-logo.png' },
              { name: 'BMW', logo: 'https://www.carlogos.org/car-logos/bmw-logo.png' },
              { name: 'Mercedes', logo: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png' },
              { name: 'Audi', logo: 'https://www.carlogos.org/car-logos/audi-logo.png' },
              { name: 'Ford', logo: 'https://www.carlogos.org/car-logos/ford-logo.png' },
              { name: 'Opel', logo: 'https://www.carlogos.org/car-logos/opel-logo.png' },
              { name: 'Toyota', logo: 'https://www.carlogos.org/car-logos/toyota-logo.png' },
              { name: 'Nissan', logo: 'https://www.carlogos.org/car-logos/nissan-logo.png' },
              { name: 'Honda', logo: 'https://www.carlogos.org/car-logos/honda-logo.png' },
              { name: 'Fiat', logo: 'https://www.carlogos.org/car-logos/fiat-logo.png' },
              { name: 'Seat', logo: 'https://www.carlogos.org/car-logos/seat-logo.png' },
              { name: 'Skoda', logo: 'https://www.carlogos.org/car-logos/skoda-logo.png' },
              { name: 'Hyundai', logo: 'https://www.carlogos.org/car-logos/hyundai-logo.png' },
              { name: 'Kia', logo: 'https://www.carlogos.org/car-logos/kia-logo.png' },
              { name: 'Dacia', logo: 'https://www.carlogos.org/car-logos/dacia-logo.png' },
              { name: 'Volvo', logo: 'https://www.carlogos.org/car-logos/volvo-logo.png' },
              { name: 'Mazda', logo: 'https://www.carlogos.org/car-logos/mazda-logo.png' },
            ].map((brand, index) => (
              <Link
                key={brand.name}
                to={`/annonces?brand=${encodeURIComponent(brand.name)}`}
                className="group flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-border hover:border-accent hover:shadow-lg transition-all duration-300 hover-lift"
                title={`Voir les annonces ${brand.name}`}
              >
                <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div class="w-12 h-12 md:w-14 md:h-14 bg-accent/10 rounded-full flex items-center justify-center"><span class="text-accent font-bold text-lg">${brand.name.charAt(0)}</span></div>`;
                    }}
                  />
                </div>
                <span className="mt-2 text-xs md:text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              to="/marques" 
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Voir toutes les marques
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Search by Part Category Section */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Recherche par type de pièce
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Trouvez rapidement la pièce dont vous avez besoin
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[
              { name: 'Phares', subcategory: 'phares', image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=200&h=150&fit=crop' },
              { name: 'Pare-chocs', subcategory: 'pare-chocs', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop' },
              { name: 'Moteurs', subcategory: 'moteurs', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200&h=150&fit=crop' },
              { name: 'Freinage', subcategory: 'freinage', image: 'https://images.unsplash.com/photo-1558618047-f4e68a95a13b?w=200&h=150&fit=crop' },
              { name: 'Transmission', subcategory: 'transmission', image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&h=150&fit=crop' },
              { name: 'Électronique', subcategory: 'electronique', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=150&fit=crop' },
              { name: 'Carrosserie', subcategory: 'carrosserie', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=150&fit=crop' },
              { name: 'Suspension', subcategory: 'suspension', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=200&h=150&fit=crop' },
              { name: 'Échappement', subcategory: 'echappement', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200&h=150&fit=crop' },
              { name: 'Intérieur', subcategory: 'interieur', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=150&fit=crop' },
            ].map((part) => (
              <Link
                key={part.name}
                to={`/annonces/pieces?subcategory=${part.subcategory}`}
                className="group relative overflow-hidden rounded-xl bg-white border border-border hover:border-accent hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={part.image}
                    alt={part.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=200&h=150&fit=crop';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-heading font-bold text-white text-lg group-hover:text-accent transition-colors">
                    {part.name}
                  </h3>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              to="/annonces/pieces" 
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Voir toutes les catégories
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* OEM Reference Search Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-4">
              <span className="text-lg">🔍</span>
              <span className="text-sm font-medium">Recherche professionnelle</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
              Recherche par référence OEM
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Trouvez la pièce exacte avec sa référence constructeur ou équipementier
            </p>
          </div>

          <form 
            onSubmit={handleOemSearch}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Entrez la référence OEM (ex: 7701474426, 1K0615301M...)"
                  value={oemSearch}
                  onChange={(e) => setOemSearch(e.target.value)}
                  className="w-full h-14 px-5 bg-white rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-lg"
                />
              </div>
              <Button 
                type="submit"
                disabled={!oemSearch.trim()}
                className="h-14 px-8 btn-primary rounded-xl text-base font-semibold whitespace-nowrap"
              >
                <Search className="w-5 h-5 mr-2" />
                Rechercher
              </Button>
            </div>
            
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="text-white/60 text-sm">Exemples :</span>
              {['7701474426', '1K0615301M', '30735878', '04E115561H'].map((ref) => (
                <button
                  key={ref}
                  type="button"
                  onClick={() => setOemSearch(ref)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white/80 text-sm font-mono transition-colors"
                >
                  {ref}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl mb-2">🏭</div>
              <p className="text-white/80 text-sm">Références constructeur</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl mb-2">🔧</div>
              <p className="text-white/80 text-sm">Références équipementier</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-white/80 text-sm">Compatibilité garantie</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-white/80 text-sm">Recherche instantanée</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search by Region Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Recherche par région
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Trouvez des annonces près de chez vous
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {[
              { name: 'Île-de-France', code: 'ile-de-france' },
              { name: 'Auvergne-Rhône-Alpes', code: 'auvergne-rhone-alpes' },
              { name: 'Nouvelle-Aquitaine', code: 'nouvelle-aquitaine' },
              { name: 'Occitanie', code: 'occitanie' },
              { name: 'Hauts-de-France', code: 'hauts-de-france' },
              { name: 'Provence-Alpes-Côte d\'Azur', code: 'paca' },
              { name: 'Grand Est', code: 'grand-est' },
              { name: 'Pays de la Loire', code: 'pays-de-la-loire' },
              { name: 'Bretagne', code: 'bretagne' },
              { name: 'Normandie', code: 'normandie' },
              { name: 'Bourgogne-Franche-Comté', code: 'bourgogne-franche-comte' },
              { name: 'Centre-Val de Loire', code: 'centre-val-de-loire' },
            ].map((region) => (
              <Link
                key={region.code}
                to={`/annonces?region=${region.code}`}
                className="group flex items-center justify-center p-4 bg-white rounded-xl border border-border hover:border-accent hover:shadow-lg hover:bg-accent/5 transition-all duration-300 text-center"
              >
                <div>
                  <MapPin className="w-5 h-5 mx-auto mb-2 text-muted-foreground group-hover:text-accent transition-colors" />
                  <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2">
                    {region.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              to="/annonces" 
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium transition-colors"
            >
              Voir toutes les régions
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Listings - Improved cards */}
      {recentListings.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div className="animate-slide-in-left">
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  Annonces récentes
                </h2>
                <p className="text-muted-foreground">
                  Découvrez les dernières annonces publiées
                </p>
              </div>
              <Link to="/annonces" className="animate-slide-in-right">
                <Button variant="outline" className="hidden sm:flex items-center gap-2 hover:bg-accent hover:text-white hover:border-accent transition-all" data-testid="view-all-btn">
                  Voir tout
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentListings.map((listing, index) => (
                <Link
                  key={listing.id}
                  to={`/annonce/${listing.id}`}
                  className={`group animate-fade-in-up stagger-${(index % 5) + 1}`}
                  data-testid={`listing-card-${listing.id}`}
                >
                  <Card className="overflow-hidden card-hover border-0 shadow-md">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={listing.images?.[0] || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop'}
                        alt={listing.title}
                        className="w-full h-full object-cover img-zoom"
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {listing.seller_is_pro && (
                          <span className="badge-pro">PRO</span>
                        )}
                      </div>
                      <span className="absolute top-3 right-3 badge-condition">
                        {conditionLabels[listing.condition] || listing.condition}
                      </span>
                      
                      {/* Quick view button */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <span className="bg-white/95 backdrop-blur-sm text-primary px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                          Voir l'annonce →
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-heading font-bold text-lg mb-2 line-clamp-1 group-hover:text-accent transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <span className="font-heading font-bold text-2xl price-tag">
                          {listing.price?.toLocaleString('fr-FR')} €
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {listing.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {listing.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.views || 0}
                          </span>
                        </div>
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

      {/* Features - Improved */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Pourquoi choisir World Auto France ?
            </h2>
            <p className="text-muted-foreground text-lg">
              La plateforme de confiance pour vos transactions automobiles
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={feature.title} className={`p-8 text-center card-hover border-0 shadow-md animate-fade-in-up stagger-${index + 1}`}>
                <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Improved */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-slate-800" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920')] bg-cover bg-center" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-6">
              Prêt à vendre votre véhicule ?
            </h2>
            <p className="text-white/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              Déposez votre annonce en quelques minutes et touchez des milliers d'acheteurs potentiels dans toute la France.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/deposer">
                <Button size="lg" className="btn-primary text-lg h-14 px-10" data-testid="cta-create-listing">
                  <Sparkles className="w-5 h-5 mr-2" />
                  Déposer une annonce
                </Button>
              </Link>
              <Link to="/tarifs">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-14 px-10 text-lg" data-testid="cta-pricing">
                  Voir les tarifs
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
