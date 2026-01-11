import { useState, useEffect } from 'react';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragOverlay 
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy,
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { GripVertical, Eye, EyeOff, Settings2, Move, Check, X } from 'lucide-react';

// Élément draggable du Hero
function SortableHeroElement({ id, element, settings, isSelected, onSelect, onToggleVisibility }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isVisible = element.getVisibility(settings);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative group rounded-lg border-2 transition-all cursor-pointer p-1
        ${isSelected ? 'border-orange-500 ring-2 ring-orange-500/30 bg-orange-500/10' : 'border-transparent hover:border-white/50 hover:bg-white/5'}
        ${isDragging ? 'z-50 shadow-2xl scale-105' : ''}
        ${!isVisible ? 'opacity-40 grayscale' : ''}
      `}
      onClick={() => onSelect(id)}
    >
      {/* Barre de contrôle - toujours visible en haut */}
      <div className={`
        absolute -top-4 left-1/2 -translate-x-1/2 
        flex items-center gap-1 px-3 py-1.5 rounded-full 
        bg-gray-900/95 text-white text-xs shadow-lg
        opacity-0 group-hover:opacity-100 transition-all z-20
        border border-white/20
      `}>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-white/20 rounded"
          title="Déplacer"
        >
          <GripVertical className="w-4 h-4" />
        </button>
        <span className="px-2 font-semibold">{element.label}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(element.key); }}
          className="p-1 hover:bg-white/20 rounded"
          title={isVisible ? "Masquer" : "Afficher"}
        >
          {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4 text-red-400" />}
        </button>
      </div>

      {/* Contenu de l'élément */}
      <div className="p-2">
        {element.render(settings)}
      </div>

      {/* Indicateur de sélection */}
      {isSelected && (
        <div className="absolute -right-2 -top-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
    </div>
  );
}

// Configuration des éléments du Hero
const getHeroElements = () => [
  {
    id: 'badge',
    key: 'hero_show_badge',
    label: 'Badge',
    getVisibility: (s) => s.hero_show_badge !== false,
    render: (s) => (
      <div className="flex justify-center">
        <span 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
          style={{ 
            backgroundColor: s.hero_badge_bg_color || 'rgba(249, 115, 22, 0.2)',
            color: s.hero_badge_text_color || '#F97316'
          }}
        >
          {s.hero_badge_icon && <span>{s.hero_badge_icon}</span>}
          {s.hero_badge_text || 'Badge texte'}
        </span>
      </div>
    )
  },
  {
    id: 'title1',
    key: 'hero_title_line1_enabled',
    label: 'Titre Ligne 1',
    getVisibility: () => true,
    render: (s) => (
      <h1 
        className="text-4xl md:text-5xl font-bold text-center"
        style={{ color: s.hero_title_line1_color || '#FFFFFF' }}
      >
        {s.hero_title_line1 || 'Titre ligne 1'}
      </h1>
    )
  },
  {
    id: 'title2',
    key: 'hero_title_line2_enabled',
    label: 'Titre Ligne 2',
    getVisibility: () => true,
    render: (s) => (
      <h2 
        className="text-4xl md:text-5xl font-bold text-center"
        style={{ 
          color: s.hero_title_line2_gradient 
            ? 'transparent' 
            : (s.hero_title_line2_color || '#F97316'),
          backgroundImage: s.hero_title_line2_gradient 
            ? `linear-gradient(to right, ${s.hero_title_line2_gradient_from || '#F97316'}, ${s.hero_title_line2_gradient_to || '#EA580C'})` 
            : 'none',
          backgroundClip: s.hero_title_line2_gradient ? 'text' : 'unset',
          WebkitBackgroundClip: s.hero_title_line2_gradient ? 'text' : 'unset',
        }}
      >
        {s.hero_title_line2 || 'Titre ligne 2'}
      </h2>
    )
  },
  {
    id: 'description',
    key: 'hero_description_enabled',
    label: 'Description',
    getVisibility: () => true,
    render: (s) => (
      <p 
        className="text-lg text-center max-w-2xl mx-auto"
        style={{ color: s.hero_description_color || 'rgba(255, 255, 255, 0.8)' }}
      >
        {s.hero_description || 'Description du Hero'}
      </p>
    )
  },
  {
    id: 'cta_buttons',
    key: 'hero_cta_buttons_enabled',
    label: 'Boutons CTA',
    getVisibility: (s) => s.hero_cta1_enabled || s.hero_cta2_enabled,
    render: (s) => (
      <div className="flex flex-wrap justify-center gap-3">
        {s.hero_cta1_enabled !== false && s.hero_cta1_text && (
          <button 
            className="px-6 py-3 rounded-lg font-medium flex items-center gap-2"
            style={{ 
              backgroundColor: s.hero_cta1_bg_color || '#F97316',
              color: s.hero_cta1_text_color || '#FFFFFF'
            }}
          >
            {s.hero_cta1_icon && <span>{s.hero_cta1_icon}</span>}
            {s.hero_cta1_text}
          </button>
        )}
        {s.hero_cta2_enabled !== false && s.hero_cta2_text && (
          <button 
            className="px-6 py-3 rounded-lg font-medium flex items-center gap-2 border-2"
            style={{ 
              backgroundColor: 'transparent',
              color: s.hero_cta2_text_color || '#FFFFFF',
              borderColor: s.hero_cta2_border_color || 'rgba(255, 255, 255, 0.3)'
            }}
          >
            {s.hero_cta2_icon && <span>{s.hero_cta2_icon}</span>}
            {s.hero_cta2_text}
          </button>
        )}
      </div>
    )
  },
  {
    id: 'premium_buttons',
    key: 'hero_premium_buttons_enabled',
    label: 'Boutons Premium',
    getVisibility: (s) => s.hero_cta3_enabled || s.hero_cta4_enabled,
    render: (s) => (
      <div className="flex flex-wrap justify-center gap-3">
        {s.hero_cta3_enabled && s.hero_cta3_text && (
          <button 
            className="px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 ring-2 ring-yellow-400/50"
            style={{ 
              backgroundColor: s.hero_cta3_bg_color || '#EAB308',
              color: s.hero_cta3_text_color || '#FFFFFF'
            }}
          >
            {s.hero_cta3_icon && <span>{s.hero_cta3_icon}</span>}
            {s.hero_cta3_text}
          </button>
        )}
        {s.hero_cta4_enabled && s.hero_cta4_text && (
          <button 
            className="px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 ring-2 ring-purple-400/50"
            style={{ 
              backgroundColor: s.hero_cta4_bg_color || '#8B5CF6',
              color: s.hero_cta4_text_color || '#FFFFFF'
            }}
          >
            {s.hero_cta4_icon && <span>{s.hero_cta4_icon}</span>}
            {s.hero_cta4_text}
          </button>
        )}
      </div>
    )
  },
  {
    id: 'shortcuts',
    key: 'hero_shortcuts_enabled',
    label: 'Raccourcis',
    getVisibility: (s) => s.hero_shortcuts_enabled !== false,
    render: (s) => (
      <div className="flex flex-wrap justify-center gap-2">
        {s.hero_shortcut_videos !== false && (
          <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-white/90 text-sm">
            🎬 Vidéos
          </span>
        )}
        {s.hero_shortcut_stories !== false && (
          <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-white/90 text-sm">
            📸 Stories
          </span>
        )}
        {s.hero_shortcut_loyalty !== false && (
          <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-white/90 text-sm">
            🎁 Fidélité
          </span>
        )}
        {s.hero_shortcut_kim !== false && (
          <span className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20 text-white/90 text-sm">
            ✨ KIM Agent
          </span>
        )}
      </div>
    )
  },
  {
    id: 'stats',
    key: 'hero_show_stats',
    label: 'Statistiques',
    getVisibility: (s) => s.hero_show_stats !== false,
    render: (s) => (
      <div className="flex flex-wrap justify-center gap-6 text-white/70">
        <div className="flex items-center gap-2">
          {s.hero_stat1_icon && <span>{s.hero_stat1_icon}</span>}
          <span className="text-2xl font-bold text-white">{s.hero_stat1_number || '100+'}</span>
          <span className="text-sm">{s.hero_stat1_label || 'annonces actives'}</span>
        </div>
        <div className="flex items-center gap-2">
          {s.hero_stat2_icon && <span>{s.hero_stat2_icon}</span>}
          <span className="text-2xl font-bold text-white">{s.hero_stat2_number || '5'}</span>
          <span className="text-sm">{s.hero_stat2_label || 'catégories'}</span>
        </div>
      </div>
    )
  },
];

export default function HeroVisualEditor({ settings, onChange }) {
  const [elements, setElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);
  const [activeId, setActiveId] = useState(null);

  // Initialiser l'ordre des éléments
  useEffect(() => {
    const savedOrder = settings.hero_elements_order;
    const defaultElements = getHeroElements();
    
    if (savedOrder && Array.isArray(savedOrder)) {
      // Réordonner selon l'ordre sauvegardé
      const orderedElements = savedOrder
        .map(id => defaultElements.find(el => el.id === id))
        .filter(Boolean);
      // Ajouter les nouveaux éléments qui ne sont pas dans l'ordre sauvegardé
      const newElements = defaultElements.filter(el => !savedOrder.includes(el.id));
      setElements([...orderedElements, ...newElements]);
    } else {
      setElements(defaultElements);
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);

    if (active.id !== over?.id) {
      setElements((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Sauvegarder le nouvel ordre
        onChange({
          ...settings,
          hero_elements_order: newOrder.map(el => el.id)
        });
        
        return newOrder;
      });
    }
  };

  const handleToggleVisibility = (key) => {
    const currentValue = settings[key];
    onChange({
      ...settings,
      [key]: currentValue === false ? true : false
    });
  };

  const activeElement = activeId ? elements.find(el => el.id === activeId) : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <CardTitle className="flex items-center gap-2">
          <Move className="w-5 h-5" />
          Éditeur Visuel du Hero
        </CardTitle>
        <p className="text-white/80 text-sm">
          Cliquez et glissez les éléments pour les réorganiser. Survolez pour voir les options.
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {/* Zone de prévisualisation */}
        <div 
          className="relative min-h-[500px] p-8"
          style={{
            background: settings.hero_bg_type === 'gradient' 
              ? `linear-gradient(${settings.hero_bg_gradient_direction || '135deg'}, ${settings.hero_bg_gradient_from || '#1E3A5F'}, ${settings.hero_bg_gradient_to || '#0F172A'})`
              : settings.hero_bg_type === 'color'
              ? (settings.hero_bg_color || '#1E3A5F')
              : `url(${settings.hero_bg_image || '/placeholder-hero.jpg'}) center/cover no-repeat`,
          }}
        >
          {/* Overlay */}
          {settings.hero_bg_overlay !== false && (
            <div 
              className="absolute inset-0"
              style={{ 
                backgroundColor: settings.hero_bg_overlay_color || 'rgba(0, 0, 0, 0.4)' 
              }}
            />
          )}

          {/* Contenu */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={elements.map(el => el.id)}
                strategy={verticalListSortingStrategy}
              >
                {elements.map((element) => (
                  <SortableHeroElement
                    key={element.id}
                    id={element.id}
                    element={element}
                    settings={settings}
                    isSelected={selectedElement === element.id}
                    onSelect={setSelectedElement}
                    onToggleVisibility={handleToggleVisibility}
                  />
                ))}
              </SortableContext>

              <DragOverlay>
                {activeElement && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-lg p-4 shadow-2xl ring-2 ring-orange-500">
                    {activeElement.render(settings)}
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </div>
        </div>

        {/* Barre d'info */}
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <GripVertical className="w-4 h-4" />
              Glisser pour réorganiser
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              Cliquer pour afficher/masquer
            </span>
          </div>
          {selectedElement && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedElement(null)}
            >
              <X className="w-4 h-4 mr-1" />
              Désélectionner
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
