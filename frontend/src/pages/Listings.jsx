import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Skeleton } from '../components/ui/skeleton';
import { Search, Filter, Grid3X3, List, MapPin, Eye, ChevronLeft, ChevronRight, Car, Zap, Star, Mic } from 'lucide-react';
import SEO, { createBreadcrumbSchema } from '../components/SEO';
import VoiceSearch from '../components/VoiceSearch';
import SearchHistory, { useSaveSearch } from '../components/SearchHistory';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Database of car models by brand
const CAR_MODELS_BY_BRAND = {
  'Renault': ['Clio', 'Megane', 'Captur', 'Scenic', 'Kadjar', 'Twingo', 'Talisman', 'Kangoo', 'Espace', 'Zoe', 'Arkana', 'Austral'],
  'Peugeot': ['208', '308', '2008', '3008', '5008', '508', '108', 'Partner', 'Rifter', 'Expert', 'Traveller'],
  'Citroën': ['C3', 'C4', 'C5', 'Berlingo', 'C3 Aircross', 'C5 Aircross', 'C1', 'Spacetourer', 'Jumpy', 'ë-C4'],
  'Volkswagen': ['Golf', 'Polo', 'Tiguan', 'T-Roc', 'Passat', 'Touran', 'T-Cross', 'Arteon', 'ID.3', 'ID.4', 'Taigo'],
  'BMW': ['Série 1', 'Série 2', 'Série 3', 'Série 4', 'Série 5', 'X1', 'X3', 'X5', 'iX', 'i4', 'Z4'],
  'Mercedes': ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'GLA', 'GLB', 'GLC', 'GLE', 'EQA', 'EQC'],
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'Q2', 'Q3', 'Q5', 'Q7', 'e-tron', 'TT'],
  'Ford': ['Fiesta', 'Focus', 'Puma', 'Kuga', 'Mondeo', 'Mustang', 'Explorer', 'Ranger', 'Transit'],
  'Opel': ['Corsa', 'Astra', 'Crossland', 'Grandland', 'Mokka', 'Insignia', 'Combo', 'Zafira'],
  'Toyota': ['Yaris', 'Corolla', 'C-HR', 'RAV4', 'Aygo', 'Camry', 'Supra', 'Land Cruiser', 'Hilux'],
  'Nissan': ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya', 'Navara', 'Note'],
  'Honda': ['Civic', 'Jazz', 'HR-V', 'CR-V', 'e', 'ZR-V'],
  'Fiat': ['500', 'Panda', 'Tipo', '500X', '500L', 'Doblo', 'Ducato'],
  'Seat': ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Cupra Formentor'],
  'Skoda': ['Fabia', 'Octavia', 'Kamiq', 'Karoq', 'Kodiaq', 'Superb', 'Enyaq'],
  'Hyundai': ['i10', 'i20', 'i30', 'Tucson', 'Kona', 'Santa Fe', 'Ioniq', 'Bayon'],
  'Kia': ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Niro', 'Sorento', 'EV6', 'Stonic'],
  'Dacia': ['Sandero', 'Duster', 'Jogger', 'Spring', 'Logan'],
  'Volvo': ['XC40', 'XC60', 'XC90', 'V40', 'V60', 'V90', 'S60', 'S90', 'C40'],
  'Mazda': ['2', '3', 'CX-3', 'CX-30', 'CX-5', 'MX-5', 'CX-60'],
};

// Generate year range
const generateYears = () => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear + 1; year >= 1990; year--) {
    years.push(year.toString());
  }
  return years;
};

const YEARS = generateYears();

const categoryNames = {
  pieces: 'categories.pieces',
  voitures: 'categories.voitures',
  motos: 'categories.motos',
  utilitaires: 'categories.utilitaires',
  accessoires: 'categories.accessoires',
};

const categoryDescriptions = {
  pieces: 'listings.desc_pieces',
  voitures: 'listings.desc_voitures',
  motos: 'listings.desc_motos',
  utilitaires: 'listings.desc_utilitaires',
  accessoires: 'listings.desc_accessoires',
};

const conditionLabels = {
  neuf: 'listing.new',
  occasion: 'listing.used',
  reconditionne: 'listing.reconditioned',
};

export default function Listings() {
  const { t } = useTranslation();
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [viewMode, setViewMode] = useState('grid');
  const [subcategories, setSubcategories] = useState({});
  const [carBrands, setCarBrands] = useState([]);
  const [filterCounts, setFilterCounts] = useState({});
  
  // Search history hook
  const saveSearch = useSaveSearch();
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [subcategory, setSubcategory] = useState(searchParams.get('subcategory') || '');
  const [compatibleBrand, setCompatibleBrand] = useState(searchParams.get('brand') || '');
  const [compatibleModel, setCompatibleModel] = useState(searchParams.get('model') || '');
  const [compatibleYear, setCompatibleYear] = useState(searchParams.get('year') || '');
  const [region, setRegion] = useState(searchParams.get('region') || '');
  const [country, setCountry] = useState(searchParams.get('country') || '');
  const [oemReference, setOemReference] = useState(searchParams.get('oem_reference') || '');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [sort, setSort] = useState('recent');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  // Filtres véhicule donneur
  const [fuelType, setFuelType] = useState(searchParams.get('fuel_type') || '');
  const [gearbox, setGearbox] = useState(searchParams.get('gearbox') || '');
  const [vehicleColor, setVehicleColor] = useState(searchParams.get('vehicle_color') || '');
  const [bodyType, setBodyType] = useState(searchParams.get('body_type') || '');
  const [driveType, setDriveType] = useState(searchParams.get('drive_type') || '');
  const [steeringSide, setSteeringSide] = useState(searchParams.get('steering_side') || '');
  const [vinAvailable, setVinAvailable] = useState(searchParams.get('vin_available') || '');
  
  // Scroll en haut quand la page change et le contenu est chargé
  useEffect(() => {
    if (shouldScroll && !loading) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setShouldScroll(false);
    }
  }, [shouldScroll, loading]);
  
  // Get available models based on selected brand
  const availableModels = compatibleBrand ? CAR_MODELS_BY_BRAND[compatibleBrand] || [] : [];

  const countries = [
    { value: 'france', label: 'France' },
    { value: 'belgique', label: 'Belgique' },
    { value: 'suisse', label: 'Suisse' },
    { value: 'allemagne', label: 'Allemagne' },
    { value: 'pays-bas', label: 'Pays-Bas' },
    { value: 'italie', label: 'Italie' },
    { value: 'espagne', label: 'Espagne' },
    { value: 'portugal', label: 'Portugal' },
    { value: 'suede', label: 'Suède' },
  ];

  const regions = [
    { value: 'ile-de-france', label: 'Île-de-France' },
    { value: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes' },
    { value: 'nouvelle-aquitaine', label: 'Nouvelle-Aquitaine' },
    { value: 'occitanie', label: 'Occitanie' },
    { value: 'hauts-de-france', label: 'Hauts-de-France' },
    { value: 'paca', label: 'Provence-Alpes-Côte d\'Azur' },
    { value: 'grand-est', label: 'Grand Est' },
    { value: 'pays-de-la-loire', label: 'Pays de la Loire' },
    { value: 'bretagne', label: 'Bretagne' },
    { value: 'normandie', label: 'Normandie' },
    { value: 'bourgogne-franche-comte', label: 'Bourgogne-Franche-Comté' },
    { value: 'centre-val-de-loire', label: 'Centre-Val de Loire' },
    { value: 'corse', label: 'Corse' },
  ];

  // Options filtres véhicule donneur
  const fuelTypes = [
    { value: 'diesel', label: 'Diesel' },
    { value: 'essence', label: 'Essence' },
    { value: 'essence_gpl', label: 'Essence / GPL' },
    { value: 'hybride', label: 'Hybride' },
    { value: 'electrique', label: 'Électrique' },
  ];

  const gearboxTypes = [
    { value: 'manuel', label: 'Manuel' },
    { value: 'automatique', label: 'Automatique' },
  ];

  const vehicleColors = [
    { value: 'noir', label: 'Noir' },
    { value: 'blanc', label: 'Blanc' },
    { value: 'gris', label: 'Gris' },
    { value: 'bleu', label: 'Bleu' },
    { value: 'rouge', label: 'Rouge' },
    { value: 'vert', label: 'Vert' },
    { value: 'jaune', label: 'Jaune' },
    { value: 'orange', label: 'Orange' },
    { value: 'marron', label: 'Marron' },
    { value: 'violet', label: 'Violet' },
  ];

  const bodyTypes = [
    { value: 'berline', label: 'Berline' },
    { value: 'break', label: 'Break' },
    { value: 'hayon', label: 'Voiture à hayon' },
    { value: 'suv', label: 'SUV' },
    { value: 'coupe', label: 'Coupé' },
    { value: 'cabriolet', label: 'Cabriolet' },
    { value: 'monospace', label: 'Monospace' },
    { value: 'utilitaire', label: 'Utilitaire' },
  ];

  const driveTypes = [
    { value: 'avant', label: 'Traction avant' },
    { value: 'arriere', label: 'Propulsion arrière' },
    { value: '4x4', label: '4 roues motrices' },
  ];

  const steeringSides = [
    { value: 'gauche', label: 'Gauche (LHD)' },
    { value: 'droite', label: 'Droite (RHD)' },
  ];

  const vinOptions = [
    { value: 'true', label: 'VIN disponible' },
    { value: 'false', label: 'VIN non disponible' },
  ];

  useEffect(() => {
    if (category === 'pieces' || category === 'accessoires') {
      fetchSubcategories();
    }
    fetchCarBrands();
    fetchFilterCounts();
  }, [category]);

  useEffect(() => {
    fetchListings();
  }, [category, page, sort, subcategory, compatibleBrand, region, country, oemReference, fuelType, gearbox, vehicleColor, bodyType, driveType, steeringSide, vinAvailable]);

  // Update filter counts when main filters change
  useEffect(() => {
    fetchFilterCounts();
  }, [category, subcategory, compatibleBrand, search, oemReference]);

  // Auto-refresh listings when component mounts or tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchListings();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [category, page, sort, subcategory, compatibleBrand, region, country, oemReference, fuelType, gearbox, vehicleColor, bodyType, driveType, steeringSide, vinAvailable]);

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

  const fetchFilterCounts = async () => {
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (subcategory) params.set('subcategory', subcategory);
      if (compatibleBrand) params.set('compatible_brand', compatibleBrand);
      if (search) params.set('search', search);
      if (oemReference) params.set('oem_reference', oemReference);
      
      const response = await axios.get(`${API}/listings/filter-counts?${params.toString()}`);
      setFilterCounts(response.data);
    } catch (error) {
      console.error('Error fetching filter counts:', error);
    }
  };

  const fetchListings = async (resetPage = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (subcategory) params.set('subcategory', subcategory);
      if (compatibleBrand) params.set('compatible_brand', compatibleBrand);
      if (region) params.set('region', region);
      if (country) params.set('country', country);
      if (oemReference) params.set('oem_reference', oemReference);
      // Filtres véhicule donneur
      if (fuelType) params.set('fuel_type', fuelType);
      if (gearbox) params.set('gearbox', gearbox);
      if (vehicleColor) params.set('vehicle_color', vehicleColor);
      if (bodyType) params.set('body_type', bodyType);
      if (driveType) params.set('drive_type', driveType);
      if (steeringSide) params.set('steering_side', steeringSide);
      if (vinAvailable) params.set('vin_available', vinAvailable);
      if (search) params.set('search', search);
      if (minPrice) params.set('min_price', minPrice);
      if (maxPrice) params.set('max_price', maxPrice);
      if (condition) params.set('condition', condition);
      params.set('sort', sort);
      params.set('page', resetPage ? '1' : String(page));
      params.set('limit', '12');
      // Add cache-busting parameter
      params.set('_t', Date.now().toString());

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
    // Update URL with current filter state using setSearchParams
    const params = new URLSearchParams();
    if (subcategory) params.set('subcategory', subcategory);
    if (compatibleBrand) params.set('compatible_brand', compatibleBrand);
    if (region) params.set('region', region);
    if (country) params.set('country', country);
    if (oemReference) params.set('oem_reference', oemReference);
    // Filtres véhicule donneur
    if (fuelType) params.set('fuel_type', fuelType);
    if (gearbox) params.set('gearbox', gearbox);
    if (vehicleColor) params.set('vehicle_color', vehicleColor);
    if (bodyType) params.set('body_type', bodyType);
    if (driveType) params.set('drive_type', driveType);
    if (steeringSide) params.set('steering_side', steeringSide);
    if (vinAvailable) params.set('vin_available', vinAvailable);
    if (search) params.set('search', search);
    if (minPrice) params.set('min_price', minPrice);
    if (maxPrice) params.set('max_price', maxPrice);
    if (condition) params.set('condition', condition);
    if (sort !== 'recent') params.set('sort', sort);
    
    // Update search params
    setSearchParams(params);
    
    // Save search to history
    saveSearch({
      query: search,
      category: category || null,
      brand: compatibleBrand || null,
      model: compatibleModel || null,
      region: region || null,
      min_price: minPrice ? parseFloat(minPrice) : null,
      max_price: maxPrice ? parseFloat(maxPrice) : null
    });
    
    fetchListings(true);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSubcategory('');
    setCompatibleBrand('');
    setRegion('');
    setCountry('');
    setOemReference('');
    setMinPrice('');
    setMaxPrice('');
    setCondition('');
    // Reset filtres véhicule donneur
    setFuelType('');
    setGearbox('');
    setVehicleColor('');
    setBodyType('');
    setDriveType('');
    setSteeringSide('');
    setVinAvailable('');
    setSort('recent');
    setPage(1);
    fetchListings(true);
  };

  const showCompatibilityFilters = category === 'pieces' || category === 'accessoires';

  // SEO: Build breadcrumb and page title
  const pageTitle = category ? t(categoryNames[category]) : t('listings.all_listings');
  const pageDescription = category 
    ? t(categoryDescriptions[category]) 
    : t('listings.no_listings_desc');
  const breadcrumbItems = [
    { name: t('nav.home'), url: '/' },
    { name: t('listings.title'), url: '/annonces' },
    ...(category ? [{ name: t(categoryNames[category]), url: `/annonces/${category}` }] : [])
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
            {category ? t(categoryNames[category]) : t('listings.all_listings')}
          </h1>
          <p className="text-primary-foreground/70">
            {total} {total > 1 ? t('listings.available_plural') : t('listings.available')}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search History */}
        <div className="mb-6">
          <SearchHistory onSelect={(searchItem) => {
            if (searchItem.query) setSearch(searchItem.query);
            if (searchItem.brand) setCompatibleBrand(searchItem.brand);
            if (searchItem.model) setCompatibleModel(searchItem.model);
            if (searchItem.region) setRegion(searchItem.region);
            if (searchItem.min_price) setMinPrice(String(searchItem.min_price));
            if (searchItem.max_price) setMaxPrice(String(searchItem.max_price));
          }} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className={`lg:w-64 flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <Card className="p-6 sticky top-24">
              <h2 className="font-heading font-bold text-lg mb-6">{t('listings.filters')}</h2>
              
              <form onSubmit={handleSearch} className="space-y-6">
                {/* Search with Voice */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('listings.search')}</label>
                  <div className="relative flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder={t('listings.keywords')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                        data-testid="filter-search"
                      />
                    </div>
                    <VoiceSearch onResult={(text) => setSearch(text)} />
                  </div>
                </div>

                {/* Subcategory (for pieces and accessoires) */}
                {(category === 'pieces' || category === 'accessoires') && Object.keys(subcategories).length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      {category === 'pieces' ? t('listings.part_type') : t('listings.accessory_type')}
                    </label>
                    <Select value={subcategory || "all"} onValueChange={(v) => setSubcategory(v === "all" ? "" : v)}>
                      <SelectTrigger data-testid="filter-subcategory">
                        <SelectValue placeholder={category === 'pieces' ? t('listings.all_parts') : t('listings.all_accessories')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{category === 'pieces' ? t('listings.all_parts') : t('listings.all_accessories')}</SelectItem>
                        {Object.entries(subcategories).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Compatible Brand - for pieces and accessoires */}
                {/* Vehicle Compatibility Search - Enhanced */}
                {showCompatibilityFilters && (
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Car className="w-5 h-5 text-primary" />
                      <span className="font-semibold text-sm">{t('listings.vehicle_search')}</span>
                    </div>
                    
                    {/* Brand */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('listings.filter_brand')}</label>
                      <Select 
                        value={compatibleBrand || "all"} 
                        onValueChange={(v) => {
                          setCompatibleBrand(v === "all" ? "" : v);
                          setCompatibleModel(""); // Reset model when brand changes
                        }}
                      >
                        <SelectTrigger data-testid="filter-compatible-brand" className="bg-white">
                          <SelectValue placeholder={t('listings.all_brands')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('listings.all_brands')}</SelectItem>
                          {Object.keys(CAR_MODELS_BY_BRAND).sort().map((brand) => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Model - only show if brand is selected */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('listings.filter_model')}</label>
                      <Select 
                        value={compatibleModel || "all"} 
                        onValueChange={(v) => setCompatibleModel(v === "all" ? "" : v)}
                        disabled={!compatibleBrand}
                      >
                        <SelectTrigger data-testid="filter-compatible-model" className={`bg-white ${!compatibleBrand ? 'opacity-50' : ''}`}>
                          <SelectValue placeholder={compatibleBrand ? t('listings.select_model') : t('listings.all_brands')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('listings.select_model')}</SelectItem>
                          {availableModels.map((model) => (
                            <SelectItem key={model} value={model}>{model}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Year */}
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">{t('listing.year')}</label>
                      <Select 
                        value={compatibleYear || "all"} 
                        onValueChange={(v) => setCompatibleYear(v === "all" ? "" : v)}
                      >
                        <SelectTrigger data-testid="filter-compatible-year" className="bg-white">
                          <SelectValue placeholder={t('listings.all_years')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('listings.all_years')}</SelectItem>
                          {YEARS.map((year) => (
                            <SelectItem key={year} value={year}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Clear filters button */}
                    {(compatibleBrand || compatibleModel || compatibleYear) && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs"
                        onClick={() => {
                          setCompatibleBrand('');
                          setCompatibleModel('');
                          setCompatibleYear('');
                        }}
                      >
                        {t('listings.clear_filters')}
                      </Button>
                    )}
                  </div>
                )}

                {/* OEM Reference Search - Always visible with highlight */}
                <div className={`p-3 rounded-lg ${showCompatibilityFilters ? 'bg-accent/10 border border-accent/30' : 'bg-secondary/50'}`}>
                  <label className="text-sm font-medium mb-2 flex items-center gap-2">
                    🔍 {t('listings.oem_reference')}
                    {showCompatibilityFilters && (
                      <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">Pro</span>
                    )}
                  </label>
                  <Input
                    placeholder="Ex: 7701474426, 1K0615301M..."
                    value={oemReference}
                    onChange={(e) => setOemReference(e.target.value)}
                    className="font-mono"
                    data-testid="filter-oem"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('home.oem_search_desc')}
                  </p>
                </div>

                {/* Price Range */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('listings.filter_price')} (€)</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder={t('listings.filter_min_price')}
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      data-testid="filter-min-price"
                    />
                    <Input
                      type="number"
                      placeholder={t('listings.filter_max_price')}
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      data-testid="filter-max-price"
                    />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('listings.filter_condition')}</label>
                  <Select value={condition || "all"} onValueChange={(v) => setCondition(v === "all" ? "" : v)}>
                    <SelectTrigger data-testid="filter-condition">
                      <SelectValue placeholder={t('listings.all_conditions')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('listings.all_conditions')}</SelectItem>
                      <SelectItem value="neuf">{t('listing.new')}</SelectItem>
                      <SelectItem value="occasion">{t('listing.used')}</SelectItem>
                      <SelectItem value="reconditionne">{t('listing.reconditioned')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Region */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('listings.filter_region')}</label>
                  <Select value={region || "all"} onValueChange={(v) => setRegion(v === "all" ? "" : v)}>
                    <SelectTrigger data-testid="filter-region">
                      <SelectValue placeholder={t('listings.all_regions')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('listings.all_regions')}</SelectItem>
                      {regions.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Country */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('listings.filter_country')}</label>
                  <Select value={country || "all"} onValueChange={(v) => setCountry(v === "all" ? "" : v)}>
                    <SelectTrigger data-testid="filter-country">
                      <SelectValue placeholder={t('listings.all_countries')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('listings.all_countries')}</SelectItem>
                      {countries.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Filtres véhicule donneur - Section collapsible */}
                <details className="border rounded-lg p-3 bg-blue-50/30">
                  <summary className="cursor-pointer font-medium text-sm flex items-center gap-2">
                    🚗 Véhicule donneur
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full ml-auto">Avancé</span>
                  </summary>
                  <div className="mt-3 space-y-3">
                    {/* Type de carburant */}
                    <div>
                      <label className="text-xs font-medium mb-1 block">Carburant</label>
                      <Select value={fuelType || "all"} onValueChange={(v) => setFuelType(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          {fuelTypes.map((ft) => (
                            <SelectItem key={ft.value} value={ft.value}>
                              {ft.label} {filterCounts.fuel_type?.[ft.value] ? `(${filterCounts.fuel_type[ft.value]})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Boîte de vitesses */}
                    <div>
                      <label className="text-xs font-medium mb-1 block">Boîte de vitesses</label>
                      <Select value={gearbox || "all"} onValueChange={(v) => setGearbox(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          {gearboxTypes.map((gt) => (
                            <SelectItem key={gt.value} value={gt.value}>
                              {gt.label} {filterCounts.gearbox?.[gt.value] ? `(${filterCounts.gearbox[gt.value]})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Type de carrosserie */}
                    <div>
                      <label className="text-xs font-medium mb-1 block">Carrosserie</label>
                      <Select value={bodyType || "all"} onValueChange={(v) => setBodyType(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          {bodyTypes.map((bt) => (
                            <SelectItem key={bt.value} value={bt.value}>
                              {bt.label} {filterCounts.body_type?.[bt.value] ? `(${filterCounts.body_type[bt.value]})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Couleur du véhicule */}
                    <div>
                      <label className="text-xs font-medium mb-1 block">Couleur</label>
                      <Select value={vehicleColor || "all"} onValueChange={(v) => setVehicleColor(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          {vehicleColors.map((vc) => (
                            <SelectItem key={vc.value} value={vc.value}>
                              {vc.label} {filterCounts.vehicle_color?.[vc.value] ? `(${filterCounts.vehicle_color[vc.value]})` : ''}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Roues motrices */}
                    <div>
                      <label className="text-xs font-medium mb-1 block">Transmission</label>
                      <Select value={driveType || "all"} onValueChange={(v) => setDriveType(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Toutes" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Toutes</SelectItem>
                          {driveTypes.map((dt) => (
                            <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Position du volant */}
                    <div>
                      <label className="text-xs font-medium mb-1 block">Volant</label>
                      <Select value={steeringSide || "all"} onValueChange={(v) => setSteeringSide(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          {steeringSides.map((ss) => (
                            <SelectItem key={ss.value} value={ss.value}>{ss.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* VIN disponible */}
                    <div>
                      <label className="text-xs font-medium mb-1 block">Numéro VIN</label>
                      <Select value={vinAvailable || "all"} onValueChange={(v) => setVinAvailable(v === "all" ? "" : v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Tous" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous</SelectItem>
                          {vinOptions.map((vo) => (
                            <SelectItem key={vo.value} value={vo.value}>{vo.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </details>

                {/* Sort */}
                <div>
                  <label className="text-sm font-medium mb-2 block">{t('common.sort')}</label>
                  <Select value={sort} onValueChange={setSort}>
                    <SelectTrigger data-testid="filter-sort">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">{t('listings.sort_recent')}</SelectItem>
                      <SelectItem value="price_asc">{t('listings.sort_price_asc')}</SelectItem>
                      <SelectItem value="price_desc">{t('listings.sort_price_desc')}</SelectItem>
                      <SelectItem value="views">{t('listings.sort_views')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1 bg-accent hover:bg-accent/90" data-testid="apply-filters-btn">
                    {t('listings.apply_filters')}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleClearFilters}>
                    {t('listings.clear_filters')}
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
                {t('listings.filters')}
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
                <p className="text-muted-foreground text-lg mb-4">{t('listings.no_results_title')}</p>
                <Button variant="outline" onClick={handleClearFilters}>
                  {t('listings.clear_filters')}
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
                          {listing.is_boosted && (
                            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                              <Zap className="w-3 h-3 mr-1" />
                              {t('listing.boosted')}
                            </Badge>
                          )}
                          {listing.is_featured && (
                            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                              <Star className="w-3 h-3 mr-1" />
                              {t('listing.featured')}
                            </Badge>
                          )}
                          {listing.seller_is_pro && (
                            <span className="badge-pro">PRO</span>
                          )}
                        </div>
                        <span className="absolute top-3 right-3 badge-condition">
                          {t(conditionLabels[listing.condition]) || listing.condition}
                        </span>
                        
                        {/* Quick view */}
                        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <span className="bg-white/95 backdrop-blur-sm text-primary px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                            {t('listing.view_listing')} →
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
                  onClick={() => {
                    setPage(Math.max(1, page - 1));
                    setShouldScroll(true);
                  }}
                  disabled={page === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground px-4">
                  {t('listings.page')} {page} {t('listings.of')} {pages}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setPage(Math.min(pages, page + 1));
                    setShouldScroll(true);
                  }}
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
