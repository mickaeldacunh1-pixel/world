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
  RefreshCw, Upload
} from 'lucide-react';

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

export default function HeroEditor({ settings, setSettings, onImageUpload, uploadingImage }) {
  const [activeSubTab, setActiveSubTab] = useState('content');

  const updateSetting = (key, value) => {
    setSettings({ ...settings, [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Sub-navigation */}
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="content" className="flex items-center gap-1">
            <Type className="w-4 h-4" />
            <span className="hidden sm:inline">Textes</span>
          </TabsTrigger>
          <TabsTrigger value="style" className="flex items-center gap-1">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Couleurs</span>
          </TabsTrigger>
          <TabsTrigger value="layout" className="flex items-center gap-1">
            <Layout className="w-4 h-4" />
            <span className="hidden sm:inline">Layout</span>
          </TabsTrigger>
          <TabsTrigger value="elements" className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Éléments</span>
          </TabsTrigger>
          <TabsTrigger value="images" className="flex items-center gap-1">
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Icône</Label>
                      <Input
                        value={settings.hero_cta1_icon || '📝'}
                        onChange={(e) => updateSetting('hero_cta1_icon', e.target.value)}
                        placeholder="📝"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texte</Label>
                      <Input
                        value={settings.hero_cta1_text || ''}
                        onChange={(e) => updateSetting('hero_cta1_text', e.target.value)}
                        placeholder="Déposer une annonce"
                      />
                    </div>
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
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Icône</Label>
                      <Input
                        value={settings.hero_cta2_icon || '⚡'}
                        onChange={(e) => updateSetting('hero_cta2_icon', e.target.value)}
                        placeholder="⚡"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texte</Label>
                      <Input
                        value={settings.hero_cta2_text || ''}
                        onChange={(e) => updateSetting('hero_cta2_text', e.target.value)}
                        placeholder="Enchères en direct"
                      />
                    </div>
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
                  description="Applique un dégradé au lieu d'une couleur uniforme"
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
                <Label>Vitesse d'animation</Label>
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
                <Label>URL de l'image</Label>
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
      </Tabs>
    </div>
  );
}
