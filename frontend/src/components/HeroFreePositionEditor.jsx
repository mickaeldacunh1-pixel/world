import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Move, Eye, EyeOff, Save, Loader2, RotateCcw, 
  AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter,
  Maximize2, Minimize2, Lock, Unlock, Layers, Settings2, X, Check
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

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

// Composant élément draggable
function DraggableElement({ 
  element, 
  position, 
  isSelected, 
  onSelect, 
  onDrag, 
  onDragEnd,
  containerRef,
  settings 
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
    
    // Limiter aux bords
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

  // Rendu du contenu de l'élément
  const renderContent = () => {
    switch (element.id) {
      case 'badge':
        return (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-orange-500/20 text-orange-400">
            {settings.hero_badge_icon || '🚗'} {settings.hero_badge_text || 'Badge'}
          </span>
        );
      case 'title1':
        return (
          <h1 className="text-2xl md:text-3xl font-bold text-white truncate">
            {settings.hero_title_line1 || 'Titre Ligne 1'}
          </h1>
        );
      case 'title2':
        return (
          <h2 className="text-2xl md:text-3xl font-bold text-orange-500 truncate">
            {settings.hero_title_line2 || 'Titre Ligne 2'}
          </h2>
        );
      case 'subtitle':
        return (
          <p className="text-white/70 text-sm truncate">
            {settings.hero_subtitle || 'Sous-titre descriptif'}
          </p>
        );
      case 'search':
        return (
          <div className="flex gap-2 bg-white/10 rounded-lg p-2 backdrop-blur">
            <div className="bg-white/20 rounded px-3 py-1 text-white/60 text-sm">🔍 Rechercher...</div>
          </div>
        );
      case 'cta_buttons':
        return (
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium">
              {settings.hero_cta1_text || 'CTA 1'}
            </button>
            <button className="px-4 py-2 border border-white/30 text-white rounded-lg text-sm font-medium">
              {settings.hero_cta2_text || 'CTA 2'}
            </button>
          </div>
        );
      case 'premium_buttons':
        return (
          <div className="flex gap-2">
            {settings.hero_cta3_enabled && (
              <button className="px-3 py-1.5 bg-yellow-500 text-white rounded-lg text-xs font-medium ring-2 ring-yellow-400/50">
                {settings.hero_cta3_text || 'Premium 1'}
              </button>
            )}
            {settings.hero_cta4_enabled && (
              <button className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-xs font-medium ring-2 ring-purple-400/50">
                {settings.hero_cta4_text || 'Premium 2'}
              </button>
            )}
          </div>
        );
      case 'stats':
        return (
          <div className="flex gap-4 text-white/70 text-sm">
            <span><strong className="text-white">100+</strong> annonces</span>
            <span><strong className="text-white">5</strong> catégories</span>
          </div>
        );
      case 'plate_scanner':
        return (
          <button className="px-3 py-2 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-lg text-xs font-medium flex items-center gap-2">
            📷 Scanner plaque
          </button>
        );
      case 'tobi_button':
        return (
          <button className="px-3 py-2 bg-purple-500/80 text-white rounded-lg text-xs font-medium flex items-center gap-2">
            💬 Demander à Tobi
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
        absolute -top-6 left-1/2 -translate-x-1/2 
        bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap
        transition-opacity
        ${isSelected || isDragging ? 'opacity-100' : 'opacity-0 hover:opacity-100'}
      `}>
        {element.label}
        {!isVisible && ' (masqué)'}
      </div>

      {/* Contenu */}
      <div className={`
        p-2 rounded-lg border-2 transition-colors
        ${isSelected ? 'border-orange-500 bg-orange-500/10' : 'border-transparent hover:border-white/30'}
      `}>
        {renderContent()}
      </div>

      {/* Indicateur de sélection */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
          <Move className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
}

export default function HeroFreePositionEditor({ settings, onChange, onSave }) {
  const containerRef = useRef(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [positions, setPositions] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Charger les positions sauvegardées
  useEffect(() => {
    const savedPositions = settings.hero_element_positions || {};
    const defaultPositions = {};
    
    // Positions par défaut en layout vertical centré
    const defaultLayout = [
      { id: 'badge', x: 50, y: 10 },
      { id: 'title1', x: 50, y: 22 },
      { id: 'title2', x: 50, y: 32 },
      { id: 'subtitle', x: 50, y: 42 },
      { id: 'search', x: 50, y: 55 },
      { id: 'plate_scanner', x: 35, y: 70 },
      { id: 'tobi_button', x: 65, y: 70 },
      { id: 'cta_buttons', x: 50, y: 78 },
      { id: 'premium_buttons', x: 50, y: 88 },
      { id: 'stats', x: 50, y: 95 },
    ];

    defaultLayout.forEach(item => {
      defaultPositions[item.id] = {
        x: savedPositions[item.id]?.x ?? item.x,
        y: savedPositions[item.id]?.y ?? item.y,
        visible: savedPositions[item.id]?.visible ?? true,
      };
    });

    setPositions(defaultPositions);
  }, [settings.hero_element_positions]);

  const handleDrag = (elementId, newPos) => {
    setPositions(prev => ({
      ...prev,
      [elementId]: { ...prev[elementId], ...newPos }
    }));
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    // Optionnel: auto-save ou marquer comme modifié
  };

  const toggleVisibility = (elementId) => {
    setPositions(prev => ({
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
        hero_element_positions: positions
      };
      
      const token = localStorage.getItem('token');
      await axios.post(`${API}/api/settings/hero`, newSettings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      onChange(newSettings);
      setHasChanges(false);
      toast.success('Positions sauvegardées !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const resetPositions = () => {
    const defaultLayout = {
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
    setPositions(defaultLayout);
    setHasChanges(true);
    toast.info('Positions réinitialisées');
  };

  const alignSelected = (alignment) => {
    if (!selectedElement) return;
    
    let newX = positions[selectedElement]?.x || 50;
    
    switch (alignment) {
      case 'left': newX = 15; break;
      case 'center': newX = 50; break;
      case 'right': newX = 85; break;
    }
    
    setPositions(prev => ({
      ...prev,
      [selectedElement]: { ...prev[selectedElement], x: newX }
    }));
    setHasChanges(true);
  };

  const selectedElementData = selectedElement ? HERO_ELEMENTS.find(e => e.id === selectedElement) : null;

  return (
    <div className="space-y-4">
      {/* Barre d'outils */}
      <div className="flex items-center justify-between gap-4 p-3 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">Éditeur libre</span>
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
            className="relative w-full bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-lg overflow-hidden"
            style={{ aspectRatio: '16/9' }}
            onClick={() => setSelectedElement(null)}
          >
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
                position={positions[element.id] || { x: 50, y: 50, visible: true }}
                isSelected={selectedElement === element.id}
                onSelect={setSelectedElement}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
                containerRef={containerRef}
                settings={settings}
              />
            ))}

            {/* Instructions */}
            <div className="absolute bottom-2 left-2 text-white/40 text-xs">
              Glissez les éléments pour les repositionner
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
                const pos = positions[element.id];
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
                    value={Math.round(positions[selectedElement]?.x || 50)}
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
                    value={Math.round(positions[selectedElement]?.y || 50)}
                    onChange={(e) => handleDrag(selectedElement, { y: parseFloat(e.target.value) })}
                    className="h-8 bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
