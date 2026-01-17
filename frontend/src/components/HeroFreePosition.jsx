import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, MessageCircle, X, Mic, ChevronDown, Car, Wrench, Bike, Truck, Settings, Tractor, Star } from 'lucide-react';
import PlateScanner from './PlateScanner';
import VoiceSearch from './VoiceSearch';

// Hook pour détecter si on est sur mobile
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return isMobile;
}

// Bouton de recherche compact avec popup
function CompactSearchButton({ settings, navigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [oemQuery, setOemQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const popupRef = useRef(null);

  const categories = [
    { name: 'Pièces', slug: 'pieces', icon: Wrench },
    { name: 'Voitures', slug: 'voitures', icon: Car },
    { name: 'Motos', slug: 'motos', icon: Bike },
    { name: 'Utilitaires', slug: 'utilitaires', icon: Truck },
    { name: 'Engins', slug: 'engins', icon: Tractor },
    { name: 'Accessoires', slug: 'accessoires', icon: Settings },
    { name: 'Pièces Rares', slug: 'rare', icon: Star },
  ];

  // Fermer le popup quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSearch = (e) => {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (oemQuery) params.set('oem', oemQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/annonces?${params.toString()}`);
    setIsOpen(false);
  };

  const handleCategoryClick = (slug) => {
    navigate(`/annonces?category=${slug}`);
    setIsOpen(false);
  };

  const handleVoiceResult = (text) => {
    setSearchQuery(text);
    const params = new URLSearchParams();
    params.set('search', text);
    navigate(`/annonces?${params.toString()}`);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={popupRef}>
      {/* Bouton compact */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 sm:gap-2 px-3 sm:px-5 py-2 sm:py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
      >
        <Search className="w-4 sm:w-5 h-4 sm:h-5" />
        <span className="font-medium">Rechercher</span>
        <ChevronDown className={`w-3 sm:w-4 h-3 sm:h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popup de recherche */}
      {isOpen && (
        <div className="absolute top-full mt-2 sm:mt-3 left-1/2 -translate-x-1/2 w-[95vw] sm:w-[90vw] max-w-md bg-gray-900/95 backdrop-blur-xl border border-white/20 rounded-xl sm:rounded-2xl shadow-2xl p-3 sm:p-5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h3 className="text-white font-semibold flex items-center gap-2 text-sm sm:text-base">
              <Search className="w-3 sm:w-4 h-3 sm:h-4 text-orange-400" />
              Recherche avancée
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-white/10 rounded-full"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          </div>

          <form onSubmit={handleSearch} className="space-y-3 sm:space-y-4">
            {/* Recherche texte */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <Input
                type="text"
                placeholder="Rechercher une pièce, marque..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 sm:pl-10 pr-10 h-10 sm:h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-lg sm:rounded-xl text-sm"
                autoFocus
              />
              {/* Bouton vocal */}
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <VoiceSearch onSearch={handleVoiceResult} compact />
              </div>
            </div>

            {/* Recherche OEM */}
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] sm:text-xs text-orange-400 font-bold">OEM</span>
              <Input
                type="text"
                placeholder="Référence constructeur..."
                value={oemQuery}
                onChange={(e) => setOemQuery(e.target.value)}
                className="pl-11 sm:pl-12 h-10 sm:h-11 bg-white/10 border-white/20 text-white placeholder:text-white/40 rounded-lg sm:rounded-xl text-sm"
              />
            </div>

            {/* Catégories en grille */}
            <div>
              <p className="text-white/60 text-xs mb-2">Catégories</p>
              <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                {categories.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      onClick={() => handleCategoryClick(cat.slug)}
                      className="flex flex-col items-center gap-0.5 sm:gap-1 p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-white/5 hover:bg-orange-500/20 border border-transparent hover:border-orange-500/30 transition-all group"
                    >
                      <Icon className="w-4 sm:w-5 h-4 sm:h-5 text-white/60 group-hover:text-orange-400" />
                      <span className="text-[8px] sm:text-[10px] text-white/60 group-hover:text-white text-center leading-tight">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bouton rechercher */}
            <Button 
              type="submit" 
              className="w-full h-10 sm:h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg sm:rounded-xl text-sm"
            >
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

// Composant pour afficher un élément positionné librement
// Sur mobile, utilise les positions mobiles si disponibles
function PositionedElement({ elementId, position, mobilePosition, isMobile, children, fallbackPosition }) {
  const desktopPos = position || fallbackPosition || { x: 50, y: 50 };
  const mobilePos = mobilePosition || fallbackPosition || desktopPos;
  const pos = isMobile ? mobilePos : desktopPos;
  const isVisible = pos.visible !== false;
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
      }}
    >
      {children}
    </div>
  );
}

export default function HeroFreePosition({ settings, onSearch }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const isMobile = useIsMobile();
  
  const positions = settings.hero_element_positions || {};
  
  // Positions par défaut si non définies - Desktop
  const defaultPositions = {
    badge: { x: 50, y: 12, visible: true },
    title1: { x: 50, y: 25, visible: true },
    title2: { x: 50, y: 35, visible: true },
    subtitle: { x: 50, y: 45, visible: true },
    search: { x: 50, y: 58, visible: true },
    plate_scanner: { x: 35, y: 72, visible: true },
    tobi_button: { x: 50, y: 72, visible: true },
    radio_button: { x: 65, y: 72, visible: true },
    cta_buttons: { x: 50, y: 82, visible: true },
    premium_buttons: { x: 50, y: 92, visible: true },
  };
  
  // Positions par défaut pour mobile - Layout vertical optimisé
  const mobileDefaultPositions = {
    badge: { x: 50, y: 8, visible: true },
    title1: { x: 50, y: 18, visible: true },
    title2: { x: 50, y: 26, visible: true },
    subtitle: { x: 50, y: 35, visible: true },
    search: { x: 50, y: 48, visible: true },
    plate_scanner: { x: 50, y: 60, visible: true }, // Visible sur mobile
    tobi_button: { x: 35, y: 70, visible: true },
    radio_button: { x: 65, y: 70, visible: true }, // Visible sur mobile
    cta_buttons: { x: 50, y: 80, visible: true },
    premium_buttons: { x: 50, y: 90, visible: false }, // Caché sur mobile par défaut
  };
  
  const getPos = (id) => positions[id] || defaultPositions[id];
  const getMobilePos = (id) => settings.hero_element_positions_mobile?.[id] || mobileDefaultPositions[id];
  
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/annonces?${params.toString()}`);
  };
  
  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Badge */}
      <PositionedElement 
        elementId="badge" 
        position={getPos('badge')} 
        mobilePosition={getMobilePos('badge')}
        isMobile={isMobile}
      >
        <div 
          className="inline-flex items-center gap-1.5 sm:gap-2 backdrop-blur-sm px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm"
          style={{ 
            backgroundColor: settings.hero_badge_bg_color || 'rgba(249, 115, 22, 0.2)',
            borderColor: settings.hero_badge_border_color || 'rgba(249, 115, 22, 0.3)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <span>{settings.hero_badge_icon || '✨'}</span>
          <span className="font-medium" style={{ color: settings.hero_badge_text_color || '#F97316' }}>
            {isMobile 
              ? (settings.hero_badge_text_mobile || settings.hero_badge_text || 'La référence auto')
              : (settings.hero_badge_text || 'La référence automobile en France')
            }
          </span>
        </div>
      </PositionedElement>
      
      {/* Titre Ligne 1 */}
      <PositionedElement 
        elementId="title1" 
        position={getPos('title1')}
        mobilePosition={getMobilePos('title1')}
        isMobile={isMobile}
      >
        <h1 
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-center px-2"
          style={{ color: settings.hero_title_line1_color || '#FFFFFF' }}
        >
          {settings.hero_title_line1 || 'Achetez et Vendez'}
        </h1>
      </PositionedElement>
      
      {/* Titre Ligne 2 */}
      <PositionedElement 
        elementId="title2" 
        position={getPos('title2')}
        mobilePosition={getMobilePos('title2')}
        isMobile={isMobile}
      >
        <h2 
          className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-center px-2"
          style={settings.hero_title_line2_gradient ? {
            backgroundImage: `linear-gradient(90deg, ${settings.hero_title_line2_gradient_from || '#F97316'}, ${settings.hero_title_line2_gradient_to || '#EA580C'})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          } : { 
            color: settings.hero_title_line2_color || '#F97316' 
          }}
        >
          {settings.hero_title_line2 || 'Pièces Auto'}
        </h2>
      </PositionedElement>
      
      {/* Sous-titre */}
      <PositionedElement 
        elementId="subtitle" 
        position={getPos('subtitle')}
        mobilePosition={getMobilePos('subtitle')}
        isMobile={isMobile}
      >
        <p 
          className="text-sm sm:text-lg md:text-xl max-w-[90vw] sm:max-w-2xl text-center px-4"
          style={{ color: settings.hero_description_color || 'rgba(255, 255, 255, 0.8)' }}
        >
          {isMobile 
            ? (settings.hero_description_mobile || settings.hero_description || 'Trouvez la pièce qu\'il vous faut')
            : (settings.hero_description || 'Trouvez la pièce qu\'il vous faut')
          }
        </p>
      </PositionedElement>
      
      {/* Barre de recherche - Mode compact ou étendu */}
      {settings.hero_show_search !== false && (
        <PositionedElement 
          elementId="search" 
          position={getPos('search')}
          mobilePosition={getMobilePos('search')}
          isMobile={isMobile}
        >
          {(settings.hero_search_compact || isMobile) ? (
            // Mode compact avec popup - toujours sur mobile
            <CompactSearchButton settings={settings} navigate={navigate} />
          ) : (
            // Mode barre étendue classique - desktop seulement
            <form 
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2 glass p-2 rounded-2xl w-[90vw] max-w-3xl"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder={settings.hero_search_placeholder || "Rechercher une pièce, marque, modèle..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 bg-white/10 border-white/20 text-white placeholder:text-white/60 rounded-xl"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="h-14 min-w-[180px] bg-white/10 border-white/20 text-white rounded-xl">
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
              {settings.hero_show_voice_search !== false && (
                <VoiceSearch onSearch={(q) => navigate(`/annonces?search=${encodeURIComponent(q)}`)} />
              )}
              <Button 
                type="submit" 
                className="h-14 px-8 rounded-xl text-base font-semibold"
                style={{ backgroundColor: settings.hero_search_button_bg || '#F97316' }}
              >
                <Search className="w-5 h-5 mr-2" />
                {settings.hero_search_button_text || 'Rechercher'}
              </Button>
            </form>
          )}
        </PositionedElement>
      )}
      
      {/* Scanner Plaque - Visible sur mobile aussi */}
      {settings.hero_show_plate_scanner !== false && (
        <PositionedElement 
          elementId="plate_scanner" 
          position={getPos('plate_scanner')}
          mobilePosition={getMobilePos('plate_scanner')}
          isMobile={isMobile}
        >
          <PlateScanner onVehicleSelect={(v) => {
            navigate(`/annonces?brand=${encodeURIComponent(v.brand)}&model=${encodeURIComponent(v.model)}&year=${v.year}`);
          }} />
        </PositionedElement>
      )}
      
      {/* Bouton Tobi */}
      <PositionedElement 
        elementId="tobi_button" 
        position={getPos('tobi_button')}
        mobilePosition={getMobilePos('tobi_button')}
        isMobile={isMobile}
      >
        <Link to="/tobi">
          <Button 
            className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg"
          >
            <MessageCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            <span className="hidden sm:inline">Demander à Tobi</span>
            <span className="sm:hidden">Tobi IA</span>
          </Button>
        </Link>
      </PositionedElement>
      
      {/* Bouton Radio */}
      <PositionedElement 
        elementId="radio_button" 
        position={getPos('radio_button')}
        mobilePosition={getMobilePos('radio_button')}
        isMobile={isMobile}
      >
        <Button 
          onClick={() => {
            // Déclencher l'ouverture du lecteur radio global
            window.dispatchEvent(new CustomEvent('toggleRadio'));
          }}
          className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10 px-3 sm:px-4 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white shadow-lg"
          data-testid="hero-radio-btn"
        >
          <span className="text-base">🎵</span>
          <span className="hidden sm:inline">Radio Live</span>
          <span className="sm:hidden">Radio</span>
        </Button>
      </PositionedElement>
      
      {/* Boutons CTA */}
      <PositionedElement 
        elementId="cta_buttons" 
        position={getPos('cta_buttons')}
        mobilePosition={getMobilePos('cta_buttons')}
        isMobile={isMobile}
      >
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 px-2">
          {settings.hero_cta1_enabled !== false && settings.hero_cta1_text && (
            <Link to={settings.hero_cta1_link || '/deposer'}>
              <Button 
                className="text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
                style={{ 
                  backgroundColor: settings.hero_cta1_bg_color || '#F97316',
                  color: settings.hero_cta1_text_color || '#FFFFFF',
                }}
              >
                {settings.hero_cta1_icon && <span className="mr-1 sm:mr-2">{settings.hero_cta1_icon}</span>}
                <span className="hidden sm:inline">{settings.hero_cta1_text}</span>
                <span className="sm:hidden">Déposer</span>
              </Button>
            </Link>
          )}
          {settings.hero_cta2_enabled && settings.hero_cta2_text && (
            <Link to={settings.hero_cta2_link || '/encheres'}>
              <Button 
                variant="outline"
                className="text-xs sm:text-sm h-8 sm:h-10 px-3 sm:px-4"
                style={{ 
                  color: settings.hero_cta2_text_color || '#FFFFFF',
                  borderColor: settings.hero_cta2_border_color || 'rgba(255, 255, 255, 0.3)'
                }}
              >
                {settings.hero_cta2_icon && <span className="mr-1 sm:mr-2">{settings.hero_cta2_icon}</span>}
                <span className="hidden sm:inline">{settings.hero_cta2_text}</span>
                <span className="sm:hidden">Enchères</span>
              </Button>
            </Link>
          )}
        </div>
      </PositionedElement>
      
      {/* Boutons Premium - Cachés sur mobile */}
      {!isMobile && (
        <PositionedElement 
          elementId="premium_buttons" 
          position={getPos('premium_buttons')}
          mobilePosition={getMobilePos('premium_buttons')}
          isMobile={isMobile}
        >
          <div className="flex flex-wrap items-center justify-center gap-3">
            {settings.hero_cta3_enabled && settings.hero_cta3_text && (
              <Link to={settings.hero_cta3_link || '/tarifs'}>
                <Button 
                  className="ring-2 ring-yellow-400/50"
                  style={{ 
                    backgroundColor: settings.hero_cta3_bg_color || '#EAB308',
                    color: settings.hero_cta3_text_color || '#FFFFFF'
                  }}
                >
                  {settings.hero_cta3_icon && <span className="mr-2">{settings.hero_cta3_icon}</span>}
                  {settings.hero_cta3_text}
                </Button>
              </Link>
            )}
            {settings.hero_cta4_enabled && settings.hero_cta4_text && (
              <Link to={settings.hero_cta4_link || '/tarifs'}>
                <Button 
                  className="ring-2 ring-purple-400/50"
                  style={{ 
                    backgroundColor: settings.hero_cta4_bg_color || '#8B5CF6',
                    color: settings.hero_cta4_text_color || '#FFFFFF'
                  }}
                >
                  {settings.hero_cta4_icon && <span className="mr-2">{settings.hero_cta4_icon}</span>}
                  {settings.hero_cta4_text}
                </Button>
              </Link>
            )}
          </div>
        </PositionedElement>
      )}
    </div>
  );
}
