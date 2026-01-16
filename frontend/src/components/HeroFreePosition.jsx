import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Search, MessageCircle } from 'lucide-react';
import PlateScanner from './PlateScanner';
import VoiceSearch from './VoiceSearch';

// Composant pour afficher un élément positionné librement
function PositionedElement({ elementId, position, children, fallbackPosition }) {
  const pos = position || fallbackPosition || { x: 50, y: 50 };
  const isVisible = pos.visible !== false;
  
  if (!isVisible) return null;
  
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2"
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
  
  const positions = settings.hero_element_positions || {};
  
  // Positions par défaut si non définies
  const defaultPositions = {
    badge: { x: 50, y: 12, visible: true },
    title1: { x: 50, y: 25, visible: true },
    title2: { x: 50, y: 35, visible: true },
    subtitle: { x: 50, y: 45, visible: true },
    search: { x: 50, y: 58, visible: true },
    plate_scanner: { x: 35, y: 72, visible: true },
    tobi_button: { x: 65, y: 72, visible: true },
    cta_buttons: { x: 50, y: 82, visible: true },
    premium_buttons: { x: 50, y: 92, visible: true },
  };
  
  const getPos = (id) => positions[id] || defaultPositions[id];
  
  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (selectedCategory) params.set('category', selectedCategory);
    navigate(`/annonces?${params.toString()}`);
  };
  
  return (
    <div className="relative w-full h-full">
      {/* Badge */}
      <PositionedElement elementId="badge" position={getPos('badge')}>
        <div 
          className="inline-flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-full"
          style={{ 
            backgroundColor: settings.hero_badge_bg_color || 'rgba(249, 115, 22, 0.2)',
            borderColor: settings.hero_badge_border_color || 'rgba(249, 115, 22, 0.3)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <span>{settings.hero_badge_icon || '✨'}</span>
          <span className="text-sm font-medium" style={{ color: settings.hero_badge_text_color || '#F97316' }}>
            {settings.hero_badge_text || 'La référence automobile en France'}
          </span>
        </div>
      </PositionedElement>
      
      {/* Titre Ligne 1 */}
      <PositionedElement elementId="title1" position={getPos('title1')}>
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight whitespace-nowrap"
          style={{ color: settings.hero_title_line1_color || '#FFFFFF' }}
        >
          {settings.hero_title_line1 || 'Achetez et Vendez'}
        </h1>
      </PositionedElement>
      
      {/* Titre Ligne 2 */}
      <PositionedElement elementId="title2" position={getPos('title2')}>
        <h2 
          className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight whitespace-nowrap"
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
      <PositionedElement elementId="subtitle" position={getPos('subtitle')}>
        <p 
          className="text-lg md:text-xl max-w-2xl text-center"
          style={{ color: settings.hero_description_color || 'rgba(255, 255, 255, 0.8)' }}
        >
          {settings.hero_description || 'Trouvez la pièce qu\'il vous faut'}
        </p>
      </PositionedElement>
      
      {/* Barre de recherche */}
      {settings.hero_show_search !== false && (
        <PositionedElement elementId="search" position={getPos('search')}>
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
        </PositionedElement>
      )}
      
      {/* Scanner Plaque */}
      {settings.hero_show_plate_scanner !== false && (
        <PositionedElement elementId="plate_scanner" position={getPos('plate_scanner')}>
          <PlateScanner onVehicleSelect={(v) => {
            navigate(`/annonces?brand=${encodeURIComponent(v.brand)}&model=${encodeURIComponent(v.model)}&year=${v.year}`);
          }} />
        </PositionedElement>
      )}
      
      {/* Bouton Tobi */}
      <PositionedElement elementId="tobi_button" position={getPos('tobi_button')}>
        <Link to="/tobi">
          <Button 
            className="gap-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg"
          >
            <MessageCircle className="w-4 h-4" />
            Demander à Tobi
          </Button>
        </Link>
      </PositionedElement>
      
      {/* Boutons CTA */}
      <PositionedElement elementId="cta_buttons" position={getPos('cta_buttons')}>
        <div className="flex flex-wrap items-center justify-center gap-4">
          {settings.hero_cta1_enabled !== false && settings.hero_cta1_text && (
            <Link to={settings.hero_cta1_link || '/deposer'}>
              <Button 
                style={{ 
                  backgroundColor: settings.hero_cta1_bg_color || '#F97316',
                  color: settings.hero_cta1_text_color || '#FFFFFF',
                }}
              >
                {settings.hero_cta1_icon && <span className="mr-2">{settings.hero_cta1_icon}</span>}
                {settings.hero_cta1_text}
              </Button>
            </Link>
          )}
          {settings.hero_cta2_enabled && settings.hero_cta2_text && (
            <Link to={settings.hero_cta2_link || '/encheres'}>
              <Button 
                variant="outline"
                style={{ 
                  color: settings.hero_cta2_text_color || '#FFFFFF',
                  borderColor: settings.hero_cta2_border_color || 'rgba(255, 255, 255, 0.3)'
                }}
              >
                {settings.hero_cta2_icon && <span className="mr-2">{settings.hero_cta2_icon}</span>}
                {settings.hero_cta2_text}
              </Button>
            </Link>
          )}
        </div>
      </PositionedElement>
      
      {/* Boutons Premium */}
      <PositionedElement elementId="premium_buttons" position={getPos('premium_buttons')}>
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
    </div>
  );
}
