import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Search, Filter, Grid3X3, List, MapPin, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import SEO, { createBreadcrumbSchema } from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categoryNames = {
  pieces: 'Pièces Détachées',
  voitures: 'Voitures d\'Occasion',
  motos: 'Motos',
  utilitaires: 'Utilitaires',
  accessoires: 'Accessoires',
};

const categoryDescriptions = {
  pieces: 'Trouvez des pièces détachées automobiles neuves et d\'occasion. Moteurs, carrosserie, électronique et plus.',
  voitures: 'Découvrez notre sélection de voitures d\'occasion vérifiées par des particuliers et professionnels.',
  motos: 'Achetez ou vendez des motos d\'occasion. Large choix de marques et modèles.',
  utilitaires: 'Utilitaires, camionnettes et véhicules commerciaux d\'occasion à vendre.',
  accessoires: 'Accessoires automobiles, équipements et tuning pour personnaliser votre véhicule.',
};

const conditionLabels = {
  neuf: 'Neuf',
  occasion: 'Occasion',
  reconditionne: 'Reconditionné',
};

export default function Listings() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [subcategories, setSubcategories] = useState({});
  const [carBrands, setCarBrands] = useState([]);
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') || '');
  const [compatibleBrand, setCompatibleBrand] = useState(searchParams.get('brand') || '');
  const [oemReference, setOemReference] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (category === 'pieces' || category === 'accessoires') {
      fetchSubcategories();
    }
    fetchCarBrands();
  }, [category]);

  useEffect(() => {
    fetchListings();
  }, [category, page, sort, subcategory, compatibleBrand]);

  const fetchSubcategories = async () => {
    try {
      const endpoint = category === 'accessoires' ? 'accessoires' : 'pieces';
      const response = await axios.get(`${API}/subcategories/${endpoint}`);
      setSubcategories(response.data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchCarBrands = async () => {
    try {
      const response = await axios.get(`${API}/brands`);
      setCarBrands(response.data);
    } catch (error) {
      console.error('Error fetching car brands:', error);
    }
  };

  const fetchListings = async (resetPage = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (subcategory) params.set('subcategory', subcategory);
      if (compatibleBrand) params.set('compatible_brand', compatibleBrand);
      if (oemReference) params.set('oem_reference', oemReference);
      if (search) params.set('search', search);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      if (condition) params.set('condition', condition);
      params.set('sort', sort);
      params.set('page', resetPage ? '1' : String(page));
      params.set('limit', '12');

      const response = await axios.get(`${API}/listings?${params.toString()}`);
      setListings(response.data.listings || []);
      setTotal(response.data.total || 0);
      setPages(response.data.pages || 1);
      if (resetPage) setPage(1);
    } catch (error) {
      console.error('Error fetching listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchListings(true);
  };

  const handleFilterApply = () => {
    fetchListings(true);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSubcategory('');
    setCompatibleBrand('');
    setOemReference('');
    setMinPrice('');
    setMaxPrice('');
    setCondition('');
    setSort('recent');
    setPage(1);
    fetchListings(true);
  };

  const showCompatibilityFilters = category === 'pieces' || category === 'accessoires';

  // SEO: Build breadcrumb and page title
  const pageTitle = category ? categoryNames[category] : 'Toutes les annonces';
  const pageDescription = category 
    ? categoryDescriptions[category] 
    : 'Parcourez toutes les annonces de pièces détachées et véhicules d\'occasion sur World Auto France.';
  const breadcrumbItems = [
    { name: 'Accueil', url: '/' },
    { name: 'Annonces', url: '/annonces' },
    ...(category ? [{ name: categoryNames[category], url: `/annonces/${category}` }] : [])
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="listings-page">
      <SEO
        title={pageTitle}
        description={pageDescription}
        keywords={`${pageTitle}, annonces auto, ${category || 'pièces véhicules'}, occasion France`}
        url={category ? `/annonces/${category}` : '/annonces'}
        structuredData={createBreadcrumbSchema(breadcrumbItems)}
      />
      {/* Header */}
      <div className="bg-primary py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
            {category ? categoryNames[category] : 'Toutes les annonces'}
          </h1>
          <p className="text-primary-foreground/70">
            {total} annonce{total > 1 ? 's' : ''} disponible{total > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="p-6 sticky top-24">
              <h2 className="font-heading font-bold text-lg mb-6">Filtres</h2>
              
              <form onSubmit={handleSearch} className="space-y-6">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Recherche</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Mots-clés..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                      data-testid="filter-search"
                    />
                  </div>
                </div>

                {/* Subcategory (for pieces and accessoires) */}
                {(category === 'pieces' || category === 'accessoires') && Object.keys(subcategories).length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {category === 'pieces' ? 'Type de pièce' : 'Type d\'accessoire'}
                    </label>
                    <Select value={subcategory || "all"} onValueChange={(v) => setSubcategory(v === "all" ? "" : v)}>
                      <SelectTrigger data-testid="filter-subcategory">
                        <SelectValue placeholder={category === 'pieces' ? 'Toutes les pièces' : 'Tous les accessoires'} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{category === 'pieces' ? 'Toutes les pièces' : 'Tous les accessoires'}</SelectItem>
                        {Object.entries(subcategories).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Compatible Brand - for pieces and accessoires */}
                {showCompatibilityFilters && carBrands.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Marque compatible</label>
                    <Select value={compatibleBrand || "all"} onValueChange={(v) => setCompatibleBrand(v === "all" ? "" : v)}>
                      <SelectTrigger data-testid="filter-compatible-brand">
                        <SelectValue placeholder="Toutes marques" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes marques</SelectItem>
                        {carBrands.map((brand) => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* OEM Reference - for pieces */}
                {showCompatibilityFilters && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Référence OEM</label>
                    <Input
                      placeholder="Ex: 7701474426"
                      value={oemReference}
                      onChange={(e) => setOemReference(e.target.value)}
                      data-testid="filter-oem"
                    />
                  </div>
                )}

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Prix (€)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      data-testid="filter-min-price"
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      data-testid="filter-max-price"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="text-sm font-medium mb-2 block">État</label>
                  <Select value={condition || "all"} onValueChange={(v) => setCondition(v === "all" ? "" : v)}>
                    <SelectTrigger data-testid="filter-condition">
                      <SelectValue placeholder="Tous les états" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les états</SelectItem>
                      <SelectItem value="neuf">Neuf</SelectItem>
                      <SelectItem value="occasion">Occasion</SelectItem>
                      <SelectItem value="reconditionne">Reconditionné</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Trier par</label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger data-testid="filter-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Plus récentes</SelectItem>
                      <SelectItem value="price_asc">Prix croissant</SelectItem>
                      <SelectItem value="price_desc">Prix décroissant</SelectItem>
                      <SelectItem value="views">Plus vues</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90" data-testid="apply-filters-btn">
                    Appliquer
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClearFilters}>
                    Effacer
                  </Button>
                </div>
              </form>
            </Card>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-6">
              <Button
                variant="outline"
                className="lg:hidden"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="toggle-filters-btn"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtres
              </Button>

              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Listings Grid */}
            {loading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-48 w-full" />
                    <div className="p-4 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-8 w-1/3" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-muted-foreground text-lg mb-4">Aucune annonce trouvée</p>
                <Button variant="outline" onClick={handleClearFilters}>
                  Réinitialiser les filtres
                </Button>
              </Card>
            ) : (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
                {listings.map((listing) => (
                  <Link
                    key={listing.id}
                    to={`/annonce/${listing.id}`}
                    className="group"
                    data-testid={`listing-${listing.id}`}
                  >
                    <Card className={`overflow-hidden card-hover border-0 shadow-md ${viewMode === 'list' ? 'flex' : ''}`}>
                      <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-48 flex-shrink-0' : 'h-52'}`}>
                        <img
                          src={listing.images?.[0] || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop'}
                          alt={listing.title}
                          className="w-full h-full object-cover img-zoom"
                        />
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex gap-2">
                          {listing.seller_is_pro && (
                            <span className="badge-pro">PRO</span>
                          )}
                        </div>
                        <span className="absolute top-3 right-3 badge-condition">
                          {conditionLabels[listing.condition] || listing.condition}
                        </span>
                        
                        {/* Quick view */}
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <span className="bg-white/95 backdrop-blur-sm text-primary px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                            Voir →
                          </span>
                        </div>
                      </div>
                      <div className="p-5 flex-1">
                        <h3 className="font-heading font-bold text-lg mb-2 line-clamp-1 group-hover:text-accent transition-colors">
                          {listing.title}
                        </h3>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {listing.description}
                        </p>
                        <div className="flex items-center justify-between pt-3 border-t border-border/50">
                          <span className="font-heading font-bold text-xl price-tag">
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
            )}

            {/* Pagination */}
            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  Page {page} sur {pages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setPage(Math.min(pages, page + 1))}
                  disabled={page === pages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
