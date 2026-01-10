import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Slider } from './ui/slider';
import { 
  Type, Palette, Layout, Image, Eye, Sparkles, 
  Search, BarChart3, MousePointer, ChevronDown, ChevronUp,
  RefreshCw, Upload, GripVertical
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Options pour les selects
const SIZE_OPTIONS = [
  { value: 'small', label: 'Petit' },
  { value: 'medium', label: 'Moyen' },
  { value: 'large', label: 'Grand' },
  { value: 'xlarge', label: 'Très grand' },
];

const ALIGN_OPTIONS = [
  { value: 'left', label: 'Gauche' },
  { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Droite' },
];

const HEIGHT_OPTIONS = [
  { value: 'small', label: 'Petit (400px)' },
  { value: 'medium', label: 'Moyen (500px)' },
  { value: 'large', label: 'Grand (700px)' },
  { value: 'full', label: 'Plein écran' },
];

const ANIMATION_OPTIONS = [
  { value: 'none', label: 'Aucune' },
  { value: 'fade', label: 'Fondu' },
  { value: 'slide', label: 'Glissement' },
  { value: 'typewriter', label: 'Machine à écrire' },
  { value: 'glow', label: 'Brillance' },
];

const BUTTON_STYLE_OPTIONS = [
  { value: 'filled', label: 'Plein' },
  { value: 'outline', label: 'Contour' },
  { value: 'ghost', label: 'Transparent' },
];

const BUTTON_SIZE_OPTIONS = [
  { value: 'small', label: 'Petit' },
  { value: 'medium', label: 'Moyen' },
  { value: 'large', label: 'Grand' },
];

const BUTTON_RADIUS_OPTIONS = [
  { value: 'none', label: 'Carré' },
  { value: 'small', label: 'Légèrement arrondi' },
  { value: 'medium', label: 'Arrondi' },
  { value: 'large', label: 'Très arrondi' },
  { value: 'full', label: 'Pilule' },
];

const BUTTONS_LAYOUT_OPTIONS = [
  { value: 'horizontal', label: 'Horizontal' },
  { value: 'vertical', label: 'Vertical' },
  { value: 'stacked', label: 'Empilé (mobile)' },
];

const GRADIENT_DIRECTION_OPTIONS = [
  { value: 'to-r', label: 'Gauche → Droite' },
  { value: 'to-l', label: 'Droite → Gauche' },
  { value: 'to-t', label: 'Bas → Haut' },
  { value: 'to-b', label: 'Haut → Bas' },
  { value: 'to-br', label: 'Diagonal ↘' },
  { value: 'to-bl', label: 'Diagonal ↙' },
];

// Composant pour un champ avec couleur
const ColorField = ({ label, value, onChange, placeholder }) => (
  <div className="space-y-2">
    <Label className="text-sm">{label}</Label>
    <div className="flex gap-2">
      <input
        type="color"
        value={value || '#FFFFFF'}
        onChange={(e) => onChange(e.target.value)}
        className="w-10 h-10 rounded cursor-pointer border-2 border-border"
      />
      <Input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || '#FFFFFF'}
        className="flex-1 font-mono text-sm"
      />
    </div>
  </div>
);

// Composant pour un toggle avec label
const ToggleField = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
    <div>
      <Label className="font-medium">{label}</Label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

// Composant Section pliable
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-secondary/30 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-2 font-medium">
          {Icon && <Icon className="w-4 h-4 text-accent" />}
          {title}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && (
        <div className="p-4 space-y-4 border-t">
          {children}
        </div>
      )}
    </div>
  );
};

// Composant draggable pour les raccourcis
const SortableShortcutItem = ({ id, shortcut, checked, onCheckedChange }) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 bg-secondary/30 rounded-lg ${isDragging ? 'z-50 shadow-lg' : ''}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        <span className="text-xl">{shortcut.icon}</span>
        <div>
          <Label className="font-medium">{shortcut.label}</Label>
          <p className="text-xs text-muted-foreground">Lien vers {shortcut.link}</p>
        </div>
      </div>
      <Switch 
        checked={checked}
        onCheckedChange={onCheckedChange}
      />
    </div>
  );
};

export default function HeroEditor({ settings, setSettings, onImageUpload, uploadingImage }) {
  const [activeSubTab, setActiveSubTab] = useState('content');

  // Définition des raccourcis avec leur ordre par défaut
  const defaultShortcutsOrder = ['videos', 'stories', 'loyalty', 'kim'];
  const shortcutsOrder = settings.hero_shortcuts_order || defaultShortcutsOrder;
  
  const shortcutsConfig = {
    videos: { id: 'videos', icon: '🎬', label: 'Vidéos', link: '/videos', settingKey: 'hero_shortcut_videos' },
    stories: { id: 'stories', icon: '📸', label: 'Stories', link: '/stories', settingKey: 'hero_shortcut_stories' },
    loyalty: { id: 'loyalty', icon: '🎁', label: 'Fidélité', link: '/fidelite', settingKey: 'hero_shortcut_loyalty' },
    kim: { id: 'kim', icon: '🤖', label: 'KIM Agent', link: '/kim-agent', settingKey: 'hero_shortcut_kim' },
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const oldIndex = shortcutsOrder.indexOf(active.id);
      const newIndex = shortcutsOrder.indexOf(over.id);
      const newOrder = arrayMove(shortcutsOrder, oldIndex, newIndex);
      setSettings({ ...settings, hero_shortcuts_order: newOrder });
    }
  };

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-4 sm:grid-cols-8 w-full gap-1">
          <TabsTrigger value="content" className="flex items-center gap-1 text-xs sm:text-sm">
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Textes</span>
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center gap-1 text-xs sm:text-sm">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Couleurs</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-1 text-xs sm:text-sm">
            <Layout className="w-4 h-4" />
            <span className="hidden sm:inline">Layout</span>
          </TabsTrigger>
          <TabsTrigger value="elements" className="flex items-center gap-1 text-xs sm:text-sm">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Éléments</span>
          </TabsTrigger>
          <TabsTrigger value="shortcuts" className="flex items-center gap-1 text-xs sm:text-sm">
            <MousePointer className="w-4 h-4" />
            <span className="hidden sm:inline">Raccourcis</span>
          </TabsTrigger>
          <TabsTrigger value="mobile" className="flex items-center gap-1 text-xs sm:text-sm">
            <Layout className="w-4 h-4" />
            <span className="hidden sm:inline">Mobile</span>
          </TabsTrigger>
          <TabsTrigger value="schedule" className="flex items-center gap-1 text-xs sm:text-sm">
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Planning</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-1 text-xs sm:text-sm">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Images</span>
          </TabsTrigger>
        </TabsList>

        {/* ============ TEXTES ============ */}
        <TabsContent value="content" className="space-y-4 mt-4">
          
          {/* Badge */}
          <CollapsibleSection title="Badge (petit texte du haut)" icon={Sparkles} defaultOpen>
            <ToggleField 
              label="Afficher le badge" 
              checked={settings.hero_show_badge !== false}
              onChange={(v) => updateSetting('hero_show_badge', v)}
            />
            {settings.hero_show_badge !== false && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Icône</Label>
                    <Input
                      value={settings.hero_badge_icon || '✨'}
                      onChange={(e) => updateSetting('hero_badge_icon', e.target.value)}
                      placeholder="✨"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Texte du badge</Label>
                    <Input
                      value={settings.hero_badge_text || ''}
                      onChange={(e) => updateSetting('hero_badge_text', e.target.value)}
                      placeholder="La référence automobile en France"
                    />
                  </div>
                </div>
              </>
            )}
          </CollapsibleSection>

          {/* Titres */}
          <CollapsibleSection title="Titres principaux" icon={Type} defaultOpen>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Titre ligne 1</Label>
                <Input
                  value={settings.hero_title_line1 || ''}
                  onChange={(e) => updateSetting('hero_title_line1', e.target.value)}
                  placeholder="La marketplace auto"
                  className="text-lg font-bold"
                />
              </div>
              <div className="space-y-2">
                <Label>Titre ligne 2</Label>
                <Input
                  value={settings.hero_title_line2 || ''}
                  onChange={(e) => updateSetting('hero_title_line2', e.target.value)}
                  placeholder="pour tous"
                  className="text-lg font-bold"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taille titre ligne 1</Label>
                  <Select 
                    value={settings.hero_title_line1_size || 'large'} 
                    onValueChange={(v) => updateSetting('hero_title_line1_size', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SIZE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Taille titre ligne 2</Label>
                  <Select 
                    value={settings.hero_title_line2_size || 'large'} 
                    onValueChange={(v) => updateSetting('hero_title_line2_size', v)}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SIZE_OPTIONS.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CollapsibleSection>

          {/* Description */}
          <CollapsibleSection title="Description" icon={Type}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Texte de description</Label>
                <Textarea
                  value={settings.hero_description || ''}
                  onChange={(e) => updateSetting('hero_description', e.target.value)}
                  placeholder="Achetez et vendez des pièces détachées..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>Taille de la description</Label>
                <Select 
                  value={settings.hero_description_size || 'medium'} 
                  onValueChange={(v) => updateSetting('hero_description_size', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SIZE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleSection>

          {/* Boutons CTA */}
          <CollapsibleSection title="Boutons d'action" icon={MousePointer}>
            <div className="space-y-6">
              {/* Options générales des boutons */}
              <div className="p-4 border rounded-lg bg-secondary/30 space-y-4">
                <Label className="font-bold">Options de disposition</Label>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Disposition</Label>
                    <Select 
                      value={settings.hero_buttons_layout || 'horizontal'} 
                      onValueChange={(v) => updateSetting('hero_buttons_layout', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {BUTTONS_LAYOUT_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Alignement</Label>
                    <Select 
                      value={settings.hero_buttons_align || 'left'} 
                      onValueChange={(v) => updateSetting('hero_buttons_align', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ALIGN_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Espacement: {settings.hero_buttons_gap || 4}</Label>
                    <Slider
                      value={[parseInt(settings.hero_buttons_gap) || 4]}
                      min={0}
                      max={12}
                      step={1}
                      onValueChange={([v]) => updateSetting('hero_buttons_gap', v.toString())}
                    />
                  </div>
                </div>
              </div>

              {/* CTA 1 */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Bouton principal</Label>
                  <Switch 
                    checked={settings.hero_cta1_enabled !== false}
                    onCheckedChange={(v) => updateSetting('hero_cta1_enabled', v)}
                  />
                </div>
                {settings.hero_cta1_enabled !== false && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Icône</Label>
                        <Input
                          value={settings.hero_cta1_icon || '📝'}
                          onChange={(e) => updateSetting('hero_cta1_icon', e.target.value)}
                          placeholder="📝"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Texte</Label>
                        <Input
                          value={settings.hero_cta1_text || ''}
                          onChange={(e) => updateSetting('hero_cta1_text', e.target.value)}
                          placeholder="Déposer une annonce"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Lien</Label>
                        <Input
                          value={settings.hero_cta1_link || ''}
                          onChange={(e) => updateSetting('hero_cta1_link', e.target.value)}
                          placeholder="/deposer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select 
                          value={settings.hero_cta1_style || 'filled'} 
                          onValueChange={(v) => updateSetting('hero_cta1_style', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_STYLE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Taille</Label>
                        <Select 
                          value={settings.hero_cta1_size || 'medium'} 
                          onValueChange={(v) => updateSetting('hero_cta1_size', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_SIZE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Arrondi</Label>
                        <Select 
                          value={settings.hero_cta1_border_radius || 'medium'} 
                          onValueChange={(v) => updateSetting('hero_cta1_border_radius', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_RADIUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <ColorField 
                        label="Couleur de fond"
                        value={settings.hero_cta1_bg_color}
                        onChange={(v) => updateSetting('hero_cta1_bg_color', v)}
                      />
                      <ColorField 
                        label="Couleur du texte"
                        value={settings.hero_cta1_text_color}
                        onChange={(v) => updateSetting('hero_cta1_text_color', v)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CTA 2 */}
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-bold">Bouton secondaire</Label>
                  <Switch 
                    checked={settings.hero_cta2_enabled === true}
                    onCheckedChange={(v) => updateSetting('hero_cta2_enabled', v)}
                  />
                </div>
                {settings.hero_cta2_enabled && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Icône</Label>
                        <Input
                          value={settings.hero_cta2_icon || '⚡'}
                          onChange={(e) => updateSetting('hero_cta2_icon', e.target.value)}
                          placeholder="⚡"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Texte</Label>
                        <Input
                          value={settings.hero_cta2_text || ''}
                          onChange={(e) => updateSetting('hero_cta2_text', e.target.value)}
                          placeholder="Enchères en direct"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Lien</Label>
                        <Input
                          value={settings.hero_cta2_link || ''}
                          onChange={(e) => updateSetting('hero_cta2_link', e.target.value)}
                          placeholder="/encheres"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select 
                          value={settings.hero_cta2_style || 'outline'} 
                          onValueChange={(v) => updateSetting('hero_cta2_style', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_STYLE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Taille</Label>
                        <Select 
                          value={settings.hero_cta2_size || 'medium'} 
                          onValueChange={(v) => updateSetting('hero_cta2_size', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_SIZE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Arrondi</Label>
                        <Select 
                          value={settings.hero_cta2_border_radius || 'medium'} 
                          onValueChange={(v) => updateSetting('hero_cta2_border_radius', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_RADIUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <ColorField 
                        label="Couleur bordure"
                        value={settings.hero_cta2_border_color}
                        onChange={(v) => updateSetting('hero_cta2_border_color', v)}
                      />
                      <ColorField 
                        label="Couleur du texte"
                        value={settings.hero_cta2_text_color}
                        onChange={(v) => updateSetting('hero_cta2_text_color', v)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CTA 3 - Premium */}
              <div className="p-4 border-2 border-amber-500/30 rounded-lg space-y-4 bg-amber-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">⭐</span>
                    <Label className="font-bold">Bouton Premium 1</Label>
                  </div>
                  <Switch 
                    checked={settings.hero_cta3_enabled === true}
                    onCheckedChange={(v) => updateSetting('hero_cta3_enabled', v)}
                  />
                </div>
                {settings.hero_cta3_enabled && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Icône</Label>
                        <Input
                          value={settings.hero_cta3_icon || '🎯'}
                          onChange={(e) => updateSetting('hero_cta3_icon', e.target.value)}
                          placeholder="🎯"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Texte</Label>
                        <Input
                          value={settings.hero_cta3_text || ''}
                          onChange={(e) => updateSetting('hero_cta3_text', e.target.value)}
                          placeholder="Ex: Estimation gratuite"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Lien</Label>
                        <Input
                          value={settings.hero_cta3_link || ''}
                          onChange={(e) => updateSetting('hero_cta3_link', e.target.value)}
                          placeholder="/estimation"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select 
                          value={settings.hero_cta3_style || 'filled'} 
                          onValueChange={(v) => updateSetting('hero_cta3_style', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_STYLE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Taille</Label>
                        <Select 
                          value={settings.hero_cta3_size || 'medium'} 
                          onValueChange={(v) => updateSetting('hero_cta3_size', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_SIZE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Arrondi</Label>
                        <Select 
                          value={settings.hero_cta3_border_radius || 'medium'} 
                          onValueChange={(v) => updateSetting('hero_cta3_border_radius', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_RADIUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <ColorField 
                        label="Couleur de fond"
                        value={settings.hero_cta3_bg_color}
                        onChange={(v) => updateSetting('hero_cta3_bg_color', v)}
                      />
                      <ColorField 
                        label="Couleur du texte"
                        value={settings.hero_cta3_text_color}
                        onChange={(v) => updateSetting('hero_cta3_text_color', v)}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ColorField 
                        label="Couleur bordure"
                        value={settings.hero_cta3_border_color}
                        onChange={(v) => updateSetting('hero_cta3_border_color', v)}
                      />
                      <div className="space-y-2">
                        <Label>Animation au survol</Label>
                        <Select 
                          value={settings.hero_cta3_hover_effect || 'none'} 
                          onValueChange={(v) => updateSetting('hero_cta3_hover_effect', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucune</SelectItem>
                            <SelectItem value="scale">Agrandir</SelectItem>
                            <SelectItem value="glow">Brillance</SelectItem>
                            <SelectItem value="shake">Vibration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CTA 4 - Premium */}
              <div className="p-4 border-2 border-amber-500/30 rounded-lg space-y-4 bg-amber-500/5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-500 font-bold">⭐</span>
                    <Label className="font-bold">Bouton Premium 2</Label>
                  </div>
                  <Switch 
                    checked={settings.hero_cta4_enabled === true}
                    onCheckedChange={(v) => updateSetting('hero_cta4_enabled', v)}
                  />
                </div>
                {settings.hero_cta4_enabled && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Icône</Label>
                        <Input
                          value={settings.hero_cta4_icon || '💎'}
                          onChange={(e) => updateSetting('hero_cta4_icon', e.target.value)}
                          placeholder="💎"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label>Texte</Label>
                        <Input
                          value={settings.hero_cta4_text || ''}
                          onChange={(e) => updateSetting('hero_cta4_text', e.target.value)}
                          placeholder="Ex: Devenir Pro"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Lien</Label>
                        <Input
                          value={settings.hero_cta4_link || ''}
                          onChange={(e) => updateSetting('hero_cta4_link', e.target.value)}
                          placeholder="/pro"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Style</Label>
                        <Select 
                          value={settings.hero_cta4_style || 'filled'} 
                          onValueChange={(v) => updateSetting('hero_cta4_style', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_STYLE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Taille</Label>
                        <Select 
                          value={settings.hero_cta4_size || 'medium'} 
                          onValueChange={(v) => updateSetting('hero_cta4_size', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_SIZE_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Arrondi</Label>
                        <Select 
                          value={settings.hero_cta4_border_radius || 'medium'} 
                          onValueChange={(v) => updateSetting('hero_cta4_border_radius', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {BUTTON_RADIUS_OPTIONS.map(opt => (
                              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <ColorField 
                        label="Couleur de fond"
                        value={settings.hero_cta4_bg_color}
                        onChange={(v) => updateSetting('hero_cta4_bg_color', v)}
                      />
                      <ColorField 
                        label="Couleur du texte"
                        value={settings.hero_cta4_text_color}
                        onChange={(v) => updateSetting('hero_cta4_text_color', v)}
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <ColorField 
                        label="Couleur bordure"
                        value={settings.hero_cta4_border_color}
                        onChange={(v) => updateSetting('hero_cta4_border_color', v)}
                      />
                      <div className="space-y-2">
                        <Label>Animation au survol</Label>
                        <Select 
                          value={settings.hero_cta4_hover_effect || 'none'} 
                          onValueChange={(v) => updateSetting('hero_cta4_hover_effect', v)}
                        >
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Aucune</SelectItem>
                            <SelectItem value="scale">Agrandir</SelectItem>
                            <SelectItem value="glow">Brillance</SelectItem>
                            <SelectItem value="shake">Vibration</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CollapsibleSection>

          {/* Barre de recherche */}
          <CollapsibleSection title="Barre de recherche" icon={Search}>
            <ToggleField 
              label="Afficher la barre de recherche" 
              checked={settings.hero_show_search !== false}
              onChange={(v) => updateSetting('hero_show_search', v)}
            />
            {settings.hero_show_search !== false && (
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Placeholder</Label>
                  <Input
                    value={settings.hero_search_placeholder || ''}
                    onChange={(e) => updateSetting('hero_search_placeholder', e.target.value)}
                    placeholder="Rechercher une pièce..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Texte du bouton</Label>
                  <Input
                    value={settings.hero_search_button_text || ''}
                    onChange={(e) => updateSetting('hero_search_button_text', e.target.value)}
                    placeholder="Rechercher"
                  />
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* Stats */}
          <CollapsibleSection title="Statistiques" icon={BarChart3}>
            <ToggleField 
              label="Afficher les statistiques" 
              checked={settings.hero_show_stats !== false}
              onChange={(v) => updateSetting('hero_show_stats', v)}
            />
            {settings.hero_show_stats !== false && (
              <div className="space-y-4">
                {/* Option Compteur Live */}
                <div className="p-4 border-2 border-green-200 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <ToggleField 
                    label="🔴 Compteur Live" 
                    description="Affiche les vraies statistiques en temps réel (annonces, membres, ventes)"
                    checked={settings.hero_use_live_counter === true}
                    onChange={(v) => updateSetting('hero_use_live_counter', v)}
                  />
                </div>
                
                {!settings.hero_use_live_counter && (
                  <>
                    <div className="p-3 border rounded-lg">
                      <Label className="font-bold mb-2 block">Stat 1</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={settings.hero_stat1_icon || '📦'}
                          onChange={(e) => updateSetting('hero_stat1_icon', e.target.value)}
                          placeholder="📦"
                        />
                        <Input
                          value={settings.hero_stat1_number || '100+'}
                          onChange={(e) => updateSetting('hero_stat1_number', e.target.value)}
                          placeholder="100+"
                        />
                        <Input
                          value={settings.hero_stat1_label || ''}
                          onChange={(e) => updateSetting('hero_stat1_label', e.target.value)}
                          placeholder="annonces"
                        />
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <Label className="font-bold mb-2 block">Stat 2</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          value={settings.hero_stat2_icon || '📂'}
                          onChange={(e) => updateSetting('hero_stat2_icon', e.target.value)}
                          placeholder="📂"
                        />
                        <Input
                          value={settings.hero_stat2_number || '5'}
                          onChange={(e) => updateSetting('hero_stat2_number', e.target.value)}
                          placeholder="5"
                        />
                        <Input
                          value={settings.hero_stat2_label || ''}
                          onChange={(e) => updateSetting('hero_stat2_label', e.target.value)}
                          placeholder="catégories"
                        />
                      </div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <Label className="font-bold">Stat 3 (optionnel)</Label>
                        <Switch 
                          checked={settings.hero_stat3_enabled === true}
                          onCheckedChange={(v) => updateSetting('hero_stat3_enabled', v)}
                        />
                      </div>
                      {settings.hero_stat3_enabled && (
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            value={settings.hero_stat3_icon || ''}
                            onChange={(e) => updateSetting('hero_stat3_icon', e.target.value)}
                            placeholder="🏆"
                          />
                          <Input
                            value={settings.hero_stat3_number || ''}
                            onChange={(e) => updateSetting('hero_stat3_number', e.target.value)}
                            placeholder="1000+"
                          />
                          <Input
                            value={settings.hero_stat3_label || ''}
                            onChange={(e) => updateSetting('hero_stat3_label', e.target.value)}
                            placeholder="utilisateurs"
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </CollapsibleSection>
        </TabsContent>

        {/* ============ COULEURS ============ */}
        <TabsContent value="style" className="space-y-4 mt-4">
          
          <CollapsibleSection title="Couleurs des textes" icon={Palette} defaultOpen>
            <div className="grid md:grid-cols-2 gap-4">
              <ColorField 
                label="Couleur titre ligne 1"
                value={settings.hero_title_line1_color}
                onChange={(v) => updateSetting('hero_title_line1_color', v)}
                placeholder="#FFFFFF"
              />
              <ColorField 
                label="Couleur titre ligne 2"
                value={settings.hero_title_line2_color}
                onChange={(v) => updateSetting('hero_title_line2_color', v)}
                placeholder="#F97316"
              />
              <ColorField 
                label="Couleur description"
                value={settings.hero_description_color}
                onChange={(v) => updateSetting('hero_description_color', v)}
                placeholder="rgba(255,255,255,0.8)"
              />
              <ColorField 
                label="Couleur stats"
                value={settings.hero_stats_number_color}
                onChange={(v) => updateSetting('hero_stats_number_color', v)}
                placeholder="#FFFFFF"
              />
            </div>
            
            {/* Gradient pour titre 2 */}
            <div className="p-4 border rounded-lg space-y-4 mt-4">
              <ToggleField 
                label="Dégradé sur titre ligne 2" 
                description="Applique un effet dégradé coloré"
                checked={settings.hero_title_line2_gradient === true}
                onChange={(v) => updateSetting('hero_title_line2_gradient', v)}
              />
              {settings.hero_title_line2_gradient && (
                <div className="grid md:grid-cols-2 gap-4">
                  <ColorField 
                    label="Couleur de départ"
                    value={settings.hero_title_line2_gradient_from}
                    onChange={(v) => updateSetting('hero_title_line2_gradient_from', v)}
                    placeholder="#F97316"
                  />
                  <ColorField 
                    label="Couleur de fin"
                    value={settings.hero_title_line2_gradient_to}
                    onChange={(v) => updateSetting('hero_title_line2_gradient_to', v)}
                    placeholder="#EA580C"
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Couleurs du badge" icon={Sparkles}>
            <div className="grid md:grid-cols-2 gap-4">
              <ColorField 
                label="Fond du badge"
                value={settings.hero_badge_bg_color}
                onChange={(v) => updateSetting('hero_badge_bg_color', v)}
                placeholder="rgba(249,115,22,0.2)"
              />
              <ColorField 
                label="Texte du badge"
                value={settings.hero_badge_text_color}
                onChange={(v) => updateSetting('hero_badge_text_color', v)}
                placeholder="#F97316"
              />
              <ColorField 
                label="Bordure du badge"
                value={settings.hero_badge_border_color}
                onChange={(v) => updateSetting('hero_badge_border_color', v)}
                placeholder="rgba(249,115,22,0.3)"
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Couleurs des boutons" icon={MousePointer}>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Bouton principal</p>
              <div className="grid md:grid-cols-2 gap-4">
                <ColorField 
                  label="Fond"
                  value={settings.hero_cta1_bg_color}
                  onChange={(v) => updateSetting('hero_cta1_bg_color', v)}
                  placeholder="#F97316"
                />
                <ColorField 
                  label="Texte"
                  value={settings.hero_cta1_text_color}
                  onChange={(v) => updateSetting('hero_cta1_text_color', v)}
                  placeholder="#FFFFFF"
                />
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">Bouton secondaire</p>
              <div className="grid md:grid-cols-2 gap-4">
                <ColorField 
                  label="Fond"
                  value={settings.hero_cta2_bg_color}
                  onChange={(v) => updateSetting('hero_cta2_bg_color', v)}
                  placeholder="transparent"
                />
                <ColorField 
                  label="Texte"
                  value={settings.hero_cta2_text_color}
                  onChange={(v) => updateSetting('hero_cta2_text_color', v)}
                  placeholder="#FFFFFF"
                />
                <ColorField 
                  label="Bordure"
                  value={settings.hero_cta2_border_color}
                  onChange={(v) => updateSetting('hero_cta2_border_color', v)}
                  placeholder="rgba(255,255,255,0.3)"
                />
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Overlay (filtre sur l'image)" icon={Image}>
            <ToggleField 
              label="Activer l'overlay" 
              description="Assombrit l'image de fond pour mieux lire le texte"
              checked={settings.hero_overlay_enabled !== false}
              onChange={(v) => updateSetting('hero_overlay_enabled', v)}
            />
            {settings.hero_overlay_enabled !== false && (
              <div className="space-y-4">
                <ColorField 
                  label="Couleur de l'overlay"
                  value={settings.hero_overlay_color}
                  onChange={(v) => updateSetting('hero_overlay_color', v)}
                  placeholder="#000000"
                />
                <div className="space-y-2">
                  <Label>Opacité: {settings.hero_overlay_opacity || 50}%</Label>
                  <Slider
                    value={[settings.hero_overlay_opacity || 50]}
                    onValueChange={([v]) => updateSetting('hero_overlay_opacity', v)}
                    max={100}
                    min={0}
                    step={5}
                  />
                </div>
                <ToggleField 
                  label="Dégradé" 
                  description="Applique un dégradé au lieu d&apos;une couleur uniforme"
                  checked={settings.hero_overlay_gradient === true}
                  onChange={(v) => updateSetting('hero_overlay_gradient', v)}
                />
                {settings.hero_overlay_gradient && (
                  <div className="space-y-2">
                    <Label>Direction du dégradé</Label>
                    <Select 
                      value={settings.hero_overlay_gradient_direction || 'to-r'} 
                      onValueChange={(v) => updateSetting('hero_overlay_gradient_direction', v)}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {GRADIENT_DIRECTION_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}
          </CollapsibleSection>
        </TabsContent>

        {/* ============ LAYOUT ============ */}
        <TabsContent value="layout" className="space-y-4 mt-4">
          
          <CollapsibleSection title="Dimensions" icon={Layout} defaultOpen>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hauteur du Hero</Label>
                <Select 
                  value={settings.hero_height || 'large'} 
                  onValueChange={(v) => updateSetting('hero_height', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {HEIGHT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Alignement du texte</Label>
                <Select 
                  value={settings.hero_text_align || 'left'} 
                  onValueChange={(v) => updateSetting('hero_text_align', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALIGN_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Position du contenu</Label>
                <Select 
                  value={settings.hero_content_position || 'left'} 
                  onValueChange={(v) => updateSetting('hero_content_position', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ALIGN_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Animations" icon={Sparkles}>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Animation du texte</Label>
                <Select 
                  value={settings.hero_text_animation || 'none'} 
                  onValueChange={(v) => updateSetting('hero_text_animation', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ANIMATION_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vitesse animation</Label>
                <Select 
                  value={settings.hero_animation_speed || 'normal'} 
                  onValueChange={(v) => updateSetting('hero_animation_speed', v)}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Lent</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="fast">Rapide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CollapsibleSection>
        </TabsContent>

        {/* ============ ÉLÉMENTS ============ */}
        <TabsContent value="elements" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Afficher / Masquer les éléments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ToggleField 
                label="Badge" 
                description="Petit texte au-dessus du titre"
                checked={settings.hero_show_badge !== false}
                onChange={(v) => updateSetting('hero_show_badge', v)}
              />
              <ToggleField 
                label="Barre de recherche" 
                description="Formulaire de recherche dans le hero"
                checked={settings.hero_show_search !== false}
                onChange={(v) => updateSetting('hero_show_search', v)}
              />
              <ToggleField 
                label="Scan de plaque" 
                description="Bouton scanner une plaque d'immatriculation"
                checked={settings.hero_show_plate_scanner !== false}
                onChange={(v) => updateSetting('hero_show_plate_scanner', v)}
              />
              <ToggleField 
                label="Recherche vocale" 
                description="Bouton microphone dans la recherche"
                checked={settings.hero_show_voice_search !== false}
                onChange={(v) => updateSetting('hero_show_voice_search', v)}
              />
              <ToggleField 
                label="Statistiques" 
                description="Chiffres clés (annonces, catégories...)"
                checked={settings.hero_show_stats !== false}
                onChange={(v) => updateSetting('hero_show_stats', v)}
              />
              <ToggleField 
                label="Outils IA" 
                description="Boutons d'accès aux outils IA"
                checked={settings.hero_show_ai_tools !== false}
                onChange={(v) => updateSetting('hero_show_ai_tools', v)}
              />
              <ToggleField 
                label="Catégories" 
                description="Section des mini-catégories sous le hero"
                checked={settings.hero_show_categories !== false}
                onChange={(v) => updateSetting('hero_show_categories', v)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ IMAGES ============ */}
        <TabsContent value="images" className="space-y-4 mt-4">
          
          <CollapsibleSection title="Image de fond du Hero" icon={Image} defaultOpen>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>URL image</Label>
                <div className="flex gap-2">
                  <Input
                    value={settings.hero_image || ''}
                    onChange={(e) => updateSetting('hero_image', e.target.value)}
                    placeholder="https://..."
                    className="flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => onImageUpload && onImageUpload('hero_image')}
                    disabled={uploadingImage}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </div>
              </div>
              {settings.hero_image && (
                <div className="relative rounded-lg overflow-hidden">
                  <img 
                    src={settings.hero_image} 
                    alt="Hero background" 
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Images des catégories" icon={Image}>
            <p className="text-sm text-muted-foreground mb-4">
              Images affichées dans la section catégories sous le hero
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { key: 'category_pieces_image', label: 'Pièces détachées' },
                { key: 'category_voitures_image', label: 'Voitures' },
                { key: 'category_motos_image', label: 'Motos' },
                { key: 'category_utilitaires_image', label: 'Utilitaires' },
                { key: 'category_accessoires_image', label: 'Accessoires' },
              ].map(cat => (
                <div key={cat.key} className="space-y-2">
                  <Label>{cat.label}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings[cat.key] || ''}
                      onChange={(e) => updateSetting(cat.key, e.target.value)}
                      placeholder="URL..."
                      className="flex-1 text-xs"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onImageUpload && onImageUpload(cat.key)}
                      disabled={uploadingImage}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  {settings[cat.key] && (
                    <img 
                      src={settings[cat.key]} 
                      alt={cat.label} 
                      className="w-full h-20 object-cover rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </TabsContent>

        {/* ============ RACCOURCIS HERO ============ */}
        <TabsContent value="shortcuts" className="space-y-4 mt-4">
          <CollapsibleSection title="Raccourcis rapides" icon={MousePointer} defaultOpen>
            <p className="text-sm text-muted-foreground mb-4">
              Configure les boutons raccourcis affichés sous les CTA. <strong>Glisse-dépose</strong> pour réorganiser l&apos;ordre.
            </p>
            
            <ToggleField 
              label="Afficher les raccourcis" 
              description="Affiche une ligne de boutons sous les CTA"
              checked={settings.hero_shortcuts_enabled !== false}
              onChange={(v) => updateSetting('hero_shortcuts_enabled', v)}
            />

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={shortcutsOrder}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 mt-4">
                  {shortcutsOrder.map((shortcutId) => {
                    const shortcut = shortcutsConfig[shortcutId];
                    if (!shortcut) return null;
                    return (
                      <SortableShortcutItem
                        key={shortcut.id}
                        id={shortcut.id}
                        shortcut={shortcut}
                        checked={settings[shortcut.settingKey] !== false}
                        onCheckedChange={(v) => updateSetting(shortcut.settingKey, v)}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>

            <div className="mt-4 space-y-3">
              <Label>Style des raccourcis</Label>
              <Select 
                value={settings.hero_shortcuts_style || 'pill'} 
                onValueChange={(v) => updateSetting('hero_shortcuts_style', v)}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="pill">Pilule (arrondi)</SelectItem>
                  <SelectItem value="square">Carré</SelectItem>
                  <SelectItem value="rounded">Arrondi léger</SelectItem>
                  <SelectItem value="icon-only">Icône seule</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleSection>
        </TabsContent>

        {/* ============ OPTIONS MOBILE ============ */}
        <TabsContent value="mobile" className="space-y-4 mt-4">
          <CollapsibleSection title="Textes Mobile" icon={Layout} defaultOpen>
            <p className="text-sm text-muted-foreground mb-4">
              Personnalise les textes pour les écrans mobiles (si différents du desktop)
            </p>
            
            <ToggleField 
              label="Textes différents sur mobile" 
              description="Utilise des textes plus courts sur mobile"
              checked={settings.hero_mobile_custom === true}
              onChange={(v) => updateSetting('hero_mobile_custom', v)}
            />

            {settings.hero_mobile_custom && (
              <div className="space-y-4 mt-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label>Titre ligne 1 (mobile)</Label>
                  <Input
                    value={settings.hero_mobile_title1 || ''}
                    onChange={(e) => updateSetting('hero_mobile_title1', e.target.value)}
                    placeholder="Ex: La marketplace"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Titre ligne 2 (mobile)</Label>
                  <Input
                    value={settings.hero_mobile_title2 || ''}
                    onChange={(e) => updateSetting('hero_mobile_title2', e.target.value)}
                    placeholder="Ex: auto"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (mobile)</Label>
                  <Textarea
                    value={settings.hero_mobile_description || ''}
                    onChange={(e) => updateSetting('hero_mobile_description', e.target.value)}
                    placeholder="Description courte pour mobile..."
                    rows={2}
                  />
                </div>
              </div>
            )}
          </CollapsibleSection>

          <CollapsibleSection title="Éléments à masquer sur mobile" icon={Eye}>
            <div className="space-y-3">
              <ToggleField 
                label="Masquer la barre de recherche" 
                checked={settings.hero_mobile_hide_search === true}
                onChange={(v) => updateSetting('hero_mobile_hide_search', v)}
              />
              <ToggleField 
                label="Masquer les statistiques" 
                checked={settings.hero_mobile_hide_stats === true}
                onChange={(v) => updateSetting('hero_mobile_hide_stats', v)}
              />
              <ToggleField 
                label="Masquer les raccourcis" 
                checked={settings.hero_mobile_hide_shortcuts === true}
                onChange={(v) => updateSetting('hero_mobile_hide_shortcuts', v)}
              />
              <ToggleField 
                label="Masquer le badge" 
                checked={settings.hero_mobile_hide_badge === true}
                onChange={(v) => updateSetting('hero_mobile_hide_badge', v)}
              />
            </div>
          </CollapsibleSection>

          <CollapsibleSection title="Hauteur mobile" icon={Layout}>
            <Select 
              value={settings.hero_mobile_height || 'auto'} 
              onValueChange={(v) => updateSetting('hero_mobile_height', v)}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto</SelectItem>
                <SelectItem value="small">Petit (300px)</SelectItem>
                <SelectItem value="medium">Moyen (400px)</SelectItem>
                <SelectItem value="large">Grand (500px)</SelectItem>
                <SelectItem value="full">Plein écran</SelectItem>
              </SelectContent>
            </Select>
          </CollapsibleSection>
        </TabsContent>

        {/* ============ PLANIFICATION ============ */}
        <TabsContent value="schedule" className="space-y-4 mt-4">
          <CollapsibleSection title="Planification du Hero" icon={RefreshCw} defaultOpen>
            <p className="text-sm text-muted-foreground mb-4">
              Programme des changements automatiques du Hero selon le moment ou la date
            </p>
            
            <ToggleField 
              label="Activer la planification" 
              description="Change automatiquement le Hero selon le planning"
              checked={settings.hero_schedule_enabled === true}
              onChange={(v) => updateSetting('hero_schedule_enabled', v)}
            />
          </CollapsibleSection>

          {settings.hero_schedule_enabled && (
            <>
              <CollapsibleSection title="Hero de nuit (20h - 8h)" icon={Sparkles}>
                <ToggleField 
                  label="Activer le mode nuit" 
                  checked={settings.hero_night_enabled === true}
                  onChange={(v) => updateSetting('hero_night_enabled', v)}
                />
                {settings.hero_night_enabled && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Titre de nuit</Label>
                      <Input
                        value={settings.hero_night_title || ''}
                        onChange={(e) => updateSetting('hero_night_title', e.target.value)}
                        placeholder="Ex: Bonne soirée !"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Image de fond (nuit)</Label>
                      <Input
                        value={settings.hero_night_image || ''}
                        onChange={(e) => updateSetting('hero_night_image', e.target.value)}
                        placeholder="URL de l'image de nuit"
                      />
                    </div>
                  </div>
                )}
              </CollapsibleSection>

              <CollapsibleSection title="Hero weekend" icon={Sparkles}>
                <ToggleField 
                  label="Hero différent le weekend" 
                  checked={settings.hero_weekend_enabled === true}
                  onChange={(v) => updateSetting('hero_weekend_enabled', v)}
                />
                {settings.hero_weekend_enabled && (
                  <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label>Titre weekend</Label>
                      <Input
                        value={settings.hero_weekend_title || ''}
                        onChange={(e) => updateSetting('hero_weekend_title', e.target.value)}
                        placeholder="Ex: Profitez du weekend !"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Badge weekend</Label>
                      <Input
                        value={settings.hero_weekend_badge || ''}
                        onChange={(e) => updateSetting('hero_weekend_badge', e.target.value)}
                        placeholder="Ex: 🎉 Promos weekend"
                      />
                    </div>
                  </div>
                )}
              </CollapsibleSection>

              <CollapsibleSection title="Événements spéciaux" icon={Sparkles}>
                <p className="text-sm text-muted-foreground mb-4">
                  Programme un Hero spécial pour une date précise (ex: Black Friday, Noël)
                </p>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Date de début</Label>
                    <Input
                      type="date"
                      value={settings.hero_event_start || ''}
                      onChange={(e) => updateSetting('hero_event_start', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date de fin</Label>
                    <Input
                      type="date"
                      value={settings.hero_event_end || ''}
                      onChange={(e) => updateSetting('hero_event_end', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Titre événement</Label>
                    <Input
                      value={settings.hero_event_title || ''}
                      onChange={(e) => updateSetting('hero_event_title', e.target.value)}
                      placeholder="Ex: 🎄 Joyeux Noël !"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Badge événement</Label>
                    <Input
                      value={settings.hero_event_badge || ''}
                      onChange={(e) => updateSetting('hero_event_badge', e.target.value)}
                      placeholder="Ex: -20% sur tout !"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image événement</Label>
                    <Input
                      value={settings.hero_event_image || ''}
                      onChange={(e) => updateSetting('hero_event_image', e.target.value)}
                      placeholder="URL de l'image événement"
                    />
                  </div>
                </div>
              </CollapsibleSection>
            </>
          )}
        </TabsContent>

        {/* ============ IMAGES & VIDEO ============ */}
        <TabsContent value="images" className="space-y-4 mt-4">
          
          {/* Vidéo de fond */}
          <CollapsibleSection title="Vidéo de fond" icon={Image} defaultOpen>
            <p className="text-sm text-muted-foreground mb-4">
              Remplace le fond par une vidéo en boucle
            </p>
            
            <ToggleField 
              label="Utiliser une vidéo de fond" 
              description="Remplace le fond image par une vidéo"
              checked={settings.hero_video_enabled === true}
              onChange={(v) => updateSetting('hero_video_enabled', v)}
            />

            {settings.hero_video_enabled && (
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>URL de la vidéo (MP4)</Label>
                  <Input
                    value={settings.hero_video_url || ''}
                    onChange={(e) => updateSetting('hero_video_url', e.target.value)}
                    placeholder="https://exemple.com/video.mp4"
                  />
                </div>
                <ToggleField 
                  label="Boucle infinie" 
                  checked={settings.hero_video_loop !== false}
                  onChange={(v) => updateSetting('hero_video_loop', v)}
                />
                <ToggleField 
                  label="Muet" 
                  checked={settings.hero_video_muted !== false}
                  onChange={(v) => updateSetting('hero_video_muted', v)}
                />
                <div className="space-y-2">
                  <Label>Image de repli (si vidéo ne charge pas)</Label>
                  <Input
                    value={settings.hero_video_poster || ''}
                    onChange={(e) => updateSetting('hero_video_poster', e.target.value)}
                    placeholder="URL de l'image de repli"
                  />
                </div>
              </div>
            )}
          </CollapsibleSection>

          {/* Image de fond Hero (existant) */}
          <CollapsibleSection title="Image de fond du Hero" icon={Image}>
            <p className="text-sm text-muted-foreground mb-4">
              Upload une image ou utilise une URL. L&apos;image sera visible si la vidéo est désactivée.
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>URL image de fond</Label>
                <Input
                  value={settings.hero_image || ''}
                  onChange={(e) => updateSetting('hero_image', e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => onImageUpload && onImageUpload('hero_image')}
                disabled={uploadingImage}
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload une image
              </Button>
              {settings.hero_image && (
                <img 
                  src={settings.hero_image} 
                  alt="Hero preview" 
                  className="w-full h-40 object-cover rounded-lg"
                />
              )}
            </div>
          </CollapsibleSection>

          {/* Images des catégories */}
          <CollapsibleSection title="Images des catégories" icon={Image}>
            <p className="text-sm text-muted-foreground mb-4">
              Images de vignette pour chaque catégorie
            </p>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'category_image_pieces', label: 'Pièces détachées' },
                { key: 'category_image_cars', label: 'Voitures' },
                { key: 'category_image_motos', label: 'Motos' },
                { key: 'category_image_trucks', label: 'Utilitaires' },
                { key: 'category_image_agri', label: 'Agricole' },
                { key: 'category_image_search', label: 'Recherche' },
                { key: 'category_image_rare', label: 'Rare & Collection' },
              ].map((cat) => (
                <div key={cat.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">{cat.label}</Label>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onImageUpload && onImageUpload(cat.key)}
                      disabled={uploadingImage}
                    >
                      <Upload className="w-4 h-4" />
                    </Button>
                  </div>
                  {settings[cat.key] && (
                    <img 
                      src={settings[cat.key]} 
                      alt={cat.label} 
                      className="w-full h-20 object-cover rounded"
                    />
                  )}
                </div>
              ))}
            </div>
          </CollapsibleSection>
        </TabsContent>
      </Tabs>
    </div>
  );
}
