import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Move, Eye, EyeOff, Save, Loader2, RotateCcw, 
  AlignLeft, AlignCenter, AlignRight,
  Layers, Settings2, Smartphone, Monitor, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Éléments disponibles dans le Hero
const HERO_ELEMENTS = [
  { id: 'badge', label: 'Badge', defaultWidth: 200, defaultHeight: 40 },
  { id: 'title1', label: 'Titre Ligne 1', defaultWidth: 600, defaultHeight: 60 },
  { id: 'title2', label: 'Titre Ligne 2', defaultWidth: 600, defaultHeight: 60 },
  { id: 'subtitle', label: 'Sous-titre', defaultWidth: 500, defaultHeight: 30 },
  { id: 'search', label: 'Barre de recherche', defaultWidth: 700, defaultHeight: 56 },
  { id: 'cta_buttons', label: 'Boutons CTA', defaultWidth: 400, defaultHeight: 50 },
  { id: 'premium_buttons', label: 'Boutons Premium', defaultWidth: 350, defaultHeight: 50 },
  { id: 'stats', label: 'Statistiques', defaultWidth: 500, defaultHeight: 40 },
  { id: 'plate_scanner', label: 'Scanner Plaque', defaultWidth: 200, defaultHeight: 45 },
  { id: 'tobi_button', label: 'Bouton Tobi', defaultWidth: 180, defaultHeight: 45 },
];

// Positions par défaut Desktop
const DEFAULT_DESKTOP_POSITIONS = {
  badge: { x: 50, y: 10, visible: true },
  title1: { x: 50, y: 22, visible: true },
  title2: { x: 50, y: 32, visible: true },
  subtitle: { x: 50, y: 42, visible: true },
  search: { x: 50, y: 55, visible: true },
  plate_scanner: { x: 35, y: 70, visible: true },
  tobi_button: { x: 65, y: 70, visible: true },
  cta_buttons: { x: 50, y: 78, visible: true },
  premium_buttons: { x: 50, y: 88, visible: true },
  stats: { x: 50, y: 95, visible: true },
};

// Positions par défaut Mobile (optimisées pour écran vertical)
const DEFAULT_MOBILE_POSITIONS = {
  badge: { x: 50, y: 8, visible: true },
  title1: { x: 50, y: 18, visible: true },
  title2: { x: 50, y: 26, visible: true },
  subtitle: { x: 50, y: 36, visible: true },
  search: { x: 50, y: 50, visible: true },
  plate_scanner: { x: 50, y: 62, visible: false }, // Caché par défaut sur mobile
  tobi_button: { x: 50, y: 68, visible: true },
  cta_buttons: { x: 50, y: 78, visible: true },
  premium_buttons: { x: 50, y: 88, visible: false }, // Caché par défaut sur mobile
  stats: { x: 50, y: 94, visible: false }, // Caché par défaut sur mobile
};

// Composant élément draggable
function DraggableElement({ 
  element, 
  position, 
  isSelected, 
  onSelect, 
  onDrag, 
  onDragEnd,
  containerRef,
  settings,
  isMobileView
}) {
  const elementRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('.no-drag')) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = elementRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    onSelect(element.id);
  };

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - containerRect.left - dragOffset.x) / containerRect.width) * 100;
    const y = ((e.clientY - containerRect.top - dragOffset.y) / containerRect.height) * 100;
    
    const clampedX = Math.max(0, Math.min(100 - (position.width || 20), x));
    const clampedY = Math.max(0, Math.min(100 - (position.height || 10), y));
    
    onDrag(element.id, { x: clampedX, y: clampedY });
  }, [isDragging, dragOffset, containerRef, element.id, onDrag, position]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      onDragEnd();
    }
  }, [isDragging, onDragEnd]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const isVisible = position.visible !== false;

  // Rendu du contenu de l'élément (simplifié pour mobile)
  const renderContent = () => {
    const mobileScale = isMobileView ? 'text-xs' : 'text-sm';
    
    switch (element.id) {
      case 'badge':
        return (
          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${mobileScale} font-medium bg-orange-500/20 text-orange-400`}>
            {settings.hero_badge_icon || '🚗'} {isMobileView ? 'Badge' : (settings.hero_badge_text || 'Badge')}
          </span>
        );
      case 'title1':
        return (
          <h1 className={`${isMobileView ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-white truncate`}>
            {settings.hero_title_line1 || 'Titre Ligne 1'}
          </h1>
        );
      case 'title2':
        return (
          <h2 className={`${isMobileView ? 'text-lg' : 'text-2xl md:text-3xl'} font-bold text-orange-500 truncate`}>
            {settings.hero_title_line2 || 'Titre Ligne 2'}
          </h2>
        );
      case 'subtitle':
        return (
          <p className={`text-white/70 ${mobileScale} truncate max-w-[200px]`}>
            {isMobileView ? 'Description...' : (settings.hero_subtitle || 'Sous-titre descriptif')}
          </p>
        );
      case 'search':
        return (
          <div className={`flex gap-1 bg-white/10 rounded-lg ${isMobileView ? 'p-1' : 'p-2'} backdrop-blur`}>
            <div className={`bg-white/20 rounded ${isMobileView ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-sm'} text-white/60`}>
              🔍 {isMobileView ? 'Rechercher' : 'Rechercher...'}
            </div>
          </div>
        );
      case 'cta_buttons':
        return (
          <div className="flex gap-1">
            <button className={`${isMobileView ? 'px-2 py-1 text-[10px]' : 'px-4 py-2 text-sm'} bg-orange-500 text-white rounded-lg font-medium`}>
              {isMobileView ? 'CTA' : (settings.hero_cta1_text || 'CTA 1')}
            </button>
            {!isMobileView && (
              <button className="px-4 py-2 border border-white/30 text-white rounded-lg text-sm font-medium">
                {settings.hero_cta2_text || 'CTA 2'}
              </button>
            )}
          </div>
        );
      case 'premium_buttons':
        return (
          <div className="flex gap-1">
            <button className={`${isMobileView ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'} bg-yellow-500 text-white rounded-lg font-medium`}>
              {isMobileView ? 'Pro' : 'Premium'}
            </button>
          </div>
        );
      case 'stats':
        return (
          <div className={`flex gap-2 text-white/70 ${mobileScale}`}>
            <span><strong className="text-white">{isMobileView ? '100' : '100+'}</strong> annonces</span>
          </div>
        );
      case 'plate_scanner':
        return (
          <button className={`${isMobileView ? 'px-2 py-1 text-[10px]' : 'px-3 py-2 text-xs'} bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg font-medium`}>
            📷 {isMobileView ? 'Scan' : 'Scanner plaque'}
          </button>
        );
      case 'tobi_button':
        return (
          <button className={`${isMobileView ? 'px-2 py-1 text-[10px]' : 'px-3 py-2 text-xs'} bg-purple-500/80 text-white rounded-lg font-medium`}>
            💬 {isMobileView ? 'Tobi' : 'Demander à Tobi'}
          </button>
        );
      default:
        return <div className="text-white/50 text-sm">{element.label}</div>;
    }
  };

  return (
    <div
      ref={elementRef}
      className={`
        absolute cursor-move transition-all select-none
        ${isDragging ? 'z-50 scale-105' : 'z-10'}
        ${isSelected ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-transparent' : ''}
        ${!isVisible ? 'opacity-30' : ''}
      `}
      style={{
        left: `${position.x || 50}%`,
        top: `${position.y || 50}%`,
        transform: 'translate(-50%, -50%)',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Label au survol */}
      <div className={`
        absolute -top-5 left-1/2 -translate-x-1/2 
        bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap
        transition-opacity
        ${isSelected || isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
      `}>
        {element.label}
        {!isVisible && ' (masqué)'}
      </div>

      {/* Contenu */}
      <div className={`
        p-1 rounded-lg border-2 transition-colors
        ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-transparent hover:border-white/30'}
      `}>
        {renderContent()}
      </div>

      {/* Indicateur de sélection */}
      {isSelected && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
          <Move className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </div>
  );
}

export default function HeroFreePositionEditor({ settings, onChange, onSave }) {
  const containerRef = useRef(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [desktopPositions, setDesktopPositions] = useState({});
  const [mobilePositions, setMobilePositions] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [viewMode, setViewMode] = useState('desktop'); // 'desktop' ou 'mobile'

  // Charger les positions sauvegardées
  useEffect(() => {
    const savedDesktop = settings.hero_element_positions || {};
    const savedMobile = settings.hero_element_positions_mobile || {};
    
    // Initialiser desktop
    const desktopInit = {};
    Object.keys(DEFAULT_DESKTOP_POSITIONS).forEach(id => {
      desktopInit[id] = {
        x: savedDesktop[id]?.x ?? DEFAULT_DESKTOP_POSITIONS[id].x,
        y: savedDesktop[id]?.y ?? DEFAULT_DESKTOP_POSITIONS[id].y,
        visible: savedDesktop[id]?.visible ?? DEFAULT_DESKTOP_POSITIONS[id].visible,
      };
    });
    setDesktopPositions(desktopInit);
    
    // Initialiser mobile
    const mobileInit = {};
    Object.keys(DEFAULT_MOBILE_POSITIONS).forEach(id => {
      mobileInit[id] = {
        x: savedMobile[id]?.x ?? DEFAULT_MOBILE_POSITIONS[id].x,
        y: savedMobile[id]?.y ?? DEFAULT_MOBILE_POSITIONS[id].y,
        visible: savedMobile[id]?.visible ?? DEFAULT_MOBILE_POSITIONS[id].visible,
      };
    });
    setMobilePositions(mobileInit);
  }, [settings.hero_element_positions, settings.hero_element_positions_mobile]);

  const currentPositions = viewMode === 'mobile' ? mobilePositions : desktopPositions;
  const setCurrentPositions = viewMode === 'mobile' ? setMobilePositions : setDesktopPositions;

  const handleDrag = (elementId, newPos) => {
    setCurrentPositions(prev => ({
      ...prev,
      [elementId]: { ...prev[elementId], ...newPos }
    }));
    setHasChanges(true);
  };

  const handleDragEnd = () => {};

  const toggleVisibility = (elementId) => {
    setCurrentPositions(prev => ({
      ...prev,
      [elementId]: { 
        ...prev[elementId], 
        visible: prev[elementId]?.visible === false ? true : false 
      }
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newSettings = {
        ...settings,
        hero_element_positions: desktopPositions,
        hero_element_positions_mobile: mobilePositions
      };
      
      const token = localStorage.getItem('token');
      await axios.post(`${API}/settings/hero`, newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onChange(newSettings);
      setHasChanges(false);
      toast.success('Positions desktop et mobile sauvegardées !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const resetPositions = () => {
    if (viewMode === 'mobile') {
      setMobilePositions({ ...DEFAULT_MOBILE_POSITIONS });
    } else {
      setDesktopPositions({ ...DEFAULT_DESKTOP_POSITIONS });
    }
    setHasChanges(true);
    toast.info(`Positions ${viewMode === 'mobile' ? 'mobile' : 'desktop'} réinitialisées`);
  };

  const copyDesktopToMobile = () => {
    setMobilePositions({ ...desktopPositions });
    setHasChanges(true);
    toast.success('Positions desktop copiées vers mobile');
  };

  const alignSelected = (alignment) => {
    if (!selectedElement) return;
    
    let newX;
    switch (alignment) {
      case 'left': newX = 15; break;
      case 'center': newX = 50; break;
      case 'right': newX = 85; break;
      default: newX = 50;
    }
    
    setCurrentPositions(prev => ({
      ...prev,
      [selectedElement]: { ...prev[selectedElement], x: newX }
    }));
    setHasChanges(true);
  };

  const selectedElementData = selectedElement ? HERO_ELEMENTS.find(e => e.id === selectedElement) : null;
  const isEnabled = settings.hero_free_position_enabled === true;
  
  const toggleFreePositionMode = async () => {
    const newEnabled = !isEnabled;
    const newSettings = {
      ...settings,
      hero_free_position_enabled: newEnabled
    };
    
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/settings/hero`, newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      onChange(newSettings);
      toast.success(newEnabled ? 'Mode position libre activé !' : 'Mode standard activé');
    } catch (error) {
      toast.error(`Erreur: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toggle Mode */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-500/20 to-purple-500/20 rounded-lg border border-orange-500/30">
        <div>
          <p className="font-medium text-white">Mode Position Libre</p>
          <p className="text-sm text-white/60">Activez pour positionner les éléments où vous voulez</p>
        </div>
        <button
          onClick={toggleFreePositionMode}
          className={`relative w-14 h-7 rounded-full transition-colors ${isEnabled ? 'bg-orange-500' : 'bg-gray-600'}`}
        >
          <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-8' : 'translate-x-1'}`} />
        </button>
      </div>
      
      {!isEnabled && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-sm">
          ⚠️ Le mode position libre est désactivé. Activez-le pour que vos modifications s'appliquent.
        </div>
      )}

      {/* Sélecteur Desktop/Mobile */}
      <div className="flex items-center justify-center gap-2 p-2 bg-gray-800 rounded-lg">
        <button
          onClick={() => setViewMode('desktop')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            viewMode === 'desktop' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-700 text-white/60 hover:bg-gray-600'
          }`}
        >
          <Monitor className="w-4 h-4" />
          <span className="text-sm font-medium">Desktop</span>
        </button>
        <button
          onClick={() => setViewMode('mobile')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
            viewMode === 'mobile' 
              ? 'bg-orange-500 text-white' 
              : 'bg-gray-700 text-white/60 hover:bg-gray-600'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span className="text-sm font-medium">Mobile</span>
        </button>
      </div>
      
      {/* Barre d'outils */}
      <div className="flex items-center justify-between gap-4 p-3 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">
            Éditeur {viewMode === 'mobile' ? '📱 Mobile' : '🖥️ Desktop'}
          </span>
          {hasChanges && (
            <span className="text-orange-400 text-xs animate-pulse">• Non sauvegardé</span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Alignement */}
          {selectedElement && (
            <div className="flex items-center gap-1 px-2 py-1 bg-gray-700 rounded">
              <button 
                onClick={() => alignSelected('left')}
                className="p-1 hover:bg-gray-600 rounded"
                title="Aligner à gauche"
              >
                <AlignLeft className="w-4 h-4 text-white" />
              </button>
              <button 
                onClick={() => alignSelected('center')}
                className="p-1 hover:bg-gray-600 rounded"
                title="Centrer"
              >
                <AlignCenter className="w-4 h-4 text-white" />
              </button>
              <button 
                onClick={() => alignSelected('right')}
                className="p-1 hover:bg-gray-600 rounded"
                title="Aligner à droite"
              >
                <AlignRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {viewMode === 'mobile' && (
            <Button variant="outline" size="sm" onClick={copyDesktopToMobile} title="Copier depuis Desktop">
              <Copy className="w-4 h-4 mr-1" />
              Copier Desktop
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={resetPositions}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Reset
          </Button>
          
          <Button 
            size="sm" 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Zone d'édition */}
      <div className="grid grid-cols-4 gap-4">
        {/* Canvas principal */}
        <div className="col-span-3">
          <div 
            ref={containerRef}
            className={`relative w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg overflow-hidden mx-auto transition-all ${
              viewMode === 'mobile' ? 'max-w-[280px]' : ''
            }`}
            style={{ aspectRatio: viewMode === 'mobile' ? '9/16' : '16/9' }}
            onClick={() => setSelectedElement(null)}
          >
            {/* Label de vue */}
            <div className="absolute top-2 left-2 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2 py-1 rounded text-white/70 text-xs">
              {viewMode === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
              {viewMode === 'mobile' ? '375 × 667px' : '1920 × 1080px'}
            </div>

            {/* Grille de fond */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '10% 10%'
              }}
            />

            {/* Éléments */}
            {HERO_ELEMENTS.map(element => (
              <DraggableElement
                key={element.id}
                element={element}
                position={currentPositions[element.id] || { x: 50, y: 50, visible: true }}
                isSelected={selectedElement === element.id}
                onSelect={setSelectedElement}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                containerRef={containerRef}
                settings={settings}
                isMobileView={viewMode === 'mobile'}
              />
            ))}

            {/* Instructions */}
            <div className="absolute bottom-2 left-2 text-white/40 text-xs">
              Glissez pour repositionner
            </div>
          </div>
        </div>

        {/* Panneau latéral */}
        <div className="col-span-1 space-y-3">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="py-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Layers className="w-4 h-4" />
                Éléments
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 space-y-1 max-h-[300px] overflow-y-auto">
              {HERO_ELEMENTS.map(element => {
                const pos = currentPositions[element.id];
                const isVisible = pos?.visible !== false;
                
                return (
                  <div 
                    key={element.id}
                    className={`
                      flex items-center justify-between p-2 rounded cursor-pointer transition-colors
                      ${selectedElement === element.id ? 'bg-orange-500/20 text-orange-400' : 'text-white/70 hover:bg-gray-700'}
                    `}
                    onClick={() => setSelectedElement(element.id)}
                  >
                    <span className={`text-xs ${!isVisible ? 'line-through opacity-50' : ''}`}>
                      {element.label}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleVisibility(element.id); }}
                      className="p-1 hover:bg-gray-600 rounded"
                    >
                      {isVisible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3 text-red-400" />
                      )}
                    </button>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Propriétés de l'élément sélectionné */}
          {selectedElementData && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader className="py-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Settings2 className="w-4 h-4" />
                  {selectedElementData.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="py-2 space-y-3">
                <div>
                  <Label className="text-white/70 text-xs">Position X (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(currentPositions[selectedElement]?.x || 50)}
                    onChange={(e) => handleDrag(selectedElement, { x: parseFloat(e.target.value) })}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/70 text-xs">Position Y (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={Math.round(currentPositions[selectedElement]?.y || 50)}
                    onChange={(e) => handleDrag(selectedElement, { y: parseFloat(e.target.value) })}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info sur la vue */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="py-3">
              <div className="text-center">
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                  viewMode === 'mobile' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-green-500/20 text-green-400'
                }`}>
                  {viewMode === 'mobile' ? <Smartphone className="w-3 h-3" /> : <Monitor className="w-3 h-3" />}
                  Vue {viewMode === 'mobile' ? 'Mobile' : 'Desktop'}
                </div>
                <p className="text-white/50 text-[10px] mt-2">
                  {viewMode === 'mobile' 
                    ? 'Optimisé pour écrans < 640px' 
                    : 'Optimisé pour écrans ≥ 640px'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Édition des textes */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="py-3">
              <CardTitle className="text-white text-sm flex items-center gap-2">
                ✏️ Textes
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2 space-y-3 max-h-[300px] overflow-y-auto">
              <div>
                <Label className="text-white/70 text-xs">Badge</Label>
                <Input
                  value={settings.hero_badge_text || ''}
                  onChange={(e) => onChange({...settings, hero_badge_text: e.target.value})}
                  placeholder="La référence automobile"
                  className="h-8 bg-gray-700 border-gray-600 text-white text-xs"
                />
              </div>
              <div>
                <Label className="text-white/70 text-xs">Titre Ligne 1</Label>
                <Input
                  value={settings.hero_title_line1 || ''}
                  onChange={(e) => onChange({...settings, hero_title_line1: e.target.value})}
                  placeholder="Achetez et Vendez"
                  className="h-8 bg-gray-700 border-gray-600 text-white text-xs"
                />
              </div>
              <div>
                <Label className="text-white/70 text-xs">Titre Ligne 2</Label>
                <Input
                  value={settings.hero_title_line2 || ''}
                  onChange={(e) => onChange({...settings, hero_title_line2: e.target.value})}
                  placeholder="Pièces Auto"
                  className="h-8 bg-gray-700 border-gray-600 text-white text-xs"
                />
              </div>
              <div>
                <Label className="text-white/70 text-xs">Description</Label>
                <Input
                  value={settings.hero_description || ''}
                  onChange={(e) => onChange({...settings, hero_description: e.target.value})}
                  placeholder="Trouvez la pièce qu&apos;il vous faut"
                  className="h-8 bg-gray-700 border-gray-600 text-white text-xs"
                />
              </div>
              
              {/* Toggle recherche compacte */}
              <div className="pt-3 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/90 text-xs font-medium">🔍 Mode Compact</p>
                    <p className="text-white/50 text-[10px]">Bouton avec popup</p>
                  </div>
                  <button
                    onClick={() => onChange({...settings, hero_search_compact: !settings.hero_search_compact})}
                    className={`relative w-10 h-5 rounded-full transition-colors ${settings.hero_search_compact ? 'bg-orange-500' : 'bg-gray-600'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${settings.hero_search_compact ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
