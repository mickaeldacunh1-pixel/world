import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { 
  Save, Eye, Image, Type, RefreshCw, Palette, Layout, 
  Plus, Trash2, MoveUp, MoveDown, Upload, Settings, 
  AlertCircle, CheckCircle, Loader2, Sparkles
} from 'lucide-react';
import EmojiPicker from '../components/EmojiPicker';
import { ANIMATION_OPTIONS } from '../components/SeasonalAnimation';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_SETTINGS = {
  // Hero Section
  hero_title_line1: "La marketplace auto",
  hero_title_line2: "pour tous",
  hero_description: "Achetez et vendez des pièces détachées, voitures, motos et utilitaires. Pour particuliers et professionnels.",
  hero_image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2832&auto=format&fit=crop",
  hero_cta_text: "Déposer une annonce",
  hero_cta_link: "/deposer",
  
  // Seasonal Animation
  seasonal_animation: "",
  
  // Colors
  color_primary: "#1E3A5F",
  color_accent: "#F97316",
  color_text: "#0F172A",
  color_background: "#FFFFFF",
  
  // Typography
  font_heading: "Montserrat",
  font_body: "Inter",
  
  // Banners
  banners: [],
  
  // Footer
  footer_text: "World Auto France - La marketplace des pièces automobiles",
  footer_email: "contact@worldautofrance.com",
  footer_phone: "",
  
  // SEO
  site_title: "World Auto France",
  site_description: "Marketplace de pièces détachées automobiles",
  
  // Features toggles
  show_brands_section: true,
  show_categories_section: true,
  show_regions_section: true,
};

const FONT_OPTIONS = [
  { value: 'Montserrat', label: 'Montserrat' },
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Lato', label: 'Lato' },
];

export default function AdminSettings() {
  const { user, token } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');
  const fileInputRef = useRef(null);
  const [uploadTarget, setUploadTarget] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/settings/hero`);
      if (response.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...response.data });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/settings/hero`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Paramètres sauvegardés !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      setSettings(DEFAULT_SETTINGS);
      toast.info('Paramètres réinitialisés (non sauvegardés)');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/upload-image`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      
      if (uploadTarget) {
        setSettings(prev => ({ ...prev, [uploadTarget]: response.data.url }));
        toast.success('Image uploadée !');
      }
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingImage(false);
      setUploadTarget(null);
    }
  };

  const triggerImageUpload = (target) => {
    setUploadTarget(target);
    fileInputRef.current?.click();
  };

  // Banner management
  const addBanner = () => {
    const newBanner = {
      id: Date.now(),
      text: "Nouvelle bannière",
      link: "",
      bgColor: "#F97316",
      textColor: "#FFFFFF",
      enabled: true
    };
    setSettings(prev => ({
      ...prev,
      banners: [...(prev.banners || []), newBanner]
    }));
  };

  const updateBanner = (id, field, value) => {
    setSettings(prev => ({
      ...prev,
      banners: prev.banners.map(b => b.id === id ? { ...b, [field]: value } : b)
    }));
  };

  const removeBanner = (id) => {
    setSettings(prev => ({
      ...prev,
      banners: prev.banners.filter(b => b.id !== id)
    }));
  };

  const moveBanner = (id, direction) => {
    const banners = [...settings.banners];
    const index = banners.findIndex(b => b.id === id);
    if (direction === 'up' && index > 0) {
      [banners[index], banners[index - 1]] = [banners[index - 1], banners[index]];
    } else if (direction === 'down' && index < banners.length - 1) {
      [banners[index], banners[index + 1]] = [banners[index + 1], banners[index]];
    }
    setSettings(prev => ({ ...prev, banners }));
  };

  // Check admin access
  const isAdmin = user?.email === 'contact@worldautofrance.com' || 
                  user?.email === 'admin@worldautofrance.com' || 
                  user?.is_admin;

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
          <p className="text-muted-foreground mb-4">Connectez-vous pour accéder à cette page.</p>
          <Link to="/auth">
            <Button className="bg-accent hover:bg-accent/90">Se connecter</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
              <Settings className="w-8 h-8" />
              Administration
            </h1>
            <p className="text-muted-foreground">Personnalisez l'apparence et le contenu de votre site</p>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Voir le site
              </Button>
            </Link>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-accent hover:bg-accent/90"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="hero" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Hero
            </TabsTrigger>
            <TabsTrigger value="colors" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Couleurs
            </TabsTrigger>
            <TabsTrigger value="typography" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Polices
            </TabsTrigger>
            <TabsTrigger value="banners" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              Bannières
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Sections
            </TabsTrigger>
          </TabsList>

          {/* Hero Tab */}
          <TabsContent value="hero" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  Section Hero (Bannière principale)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero_title_line1">Titre ligne 1</Label>
                    <Input
                      id="hero_title_line1"
                      value={settings.hero_title_line1}
                      onChange={(e) => setSettings({...settings, hero_title_line1: e.target.value})}
                      placeholder="La marketplace auto"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_title_line2">Titre ligne 2 (en couleur accent)</Label>
                    <Input
                      id="hero_title_line2"
                      value={settings.hero_title_line2}
                      onChange={(e) => setSettings({...settings, hero_title_line2: e.target.value})}
                      placeholder="pour tous"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="hero_description">Description</Label>
                  <Textarea
                    id="hero_description"
                    value={settings.hero_description}
                    onChange={(e) => setSettings({...settings, hero_description: e.target.value})}
                    placeholder="Description de votre marketplace..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Image de fond</Label>
                  <div className="flex gap-2">
                    <Input
                      value={settings.hero_image}
                      onChange={(e) => setSettings({...settings, hero_image: e.target.value})}
                      placeholder="https://..."
                      className="flex-1"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => triggerImageUpload('hero_image')}
                      disabled={uploadingImage}
                    >
                      {uploadingImage && uploadTarget === 'hero_image' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {settings.hero_image && (
                    <img 
                      src={settings.hero_image} 
                      alt="Preview" 
                      className="w-full h-40 object-cover rounded-lg mt-2"
                    />
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_text">Texte du bouton</Label>
                    <Input
                      id="hero_cta_text"
                      value={settings.hero_cta_text}
                      onChange={(e) => setSettings({...settings, hero_cta_text: e.target.value})}
                      placeholder="Déposer une annonce"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hero_cta_link">Lien du bouton</Label>
                    <Input
                      id="hero_cta_link"
                      value={settings.hero_cta_link}
                      onChange={(e) => setSettings({...settings, hero_cta_link: e.target.value})}
                      placeholder="/deposer"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Aperçu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative rounded-lg overflow-hidden" style={{ backgroundColor: settings.color_primary }}>
                  <div className="absolute inset-0 opacity-20">
                    <div 
                      className="absolute inset-0 bg-cover bg-center" 
                      style={{ backgroundImage: `url('${settings.hero_image}')` }}
                    />
                  </div>
                  <div className="relative p-8">
                    <h1 className="text-2xl md:text-3xl font-black text-white leading-tight mb-3" style={{ fontFamily: settings.font_heading }}>
                      {settings.hero_title_line1}<br />
                      <span style={{ color: settings.color_accent }}>{settings.hero_title_line2}</span>
                    </h1>
                    <p className="text-white/80 mb-4 text-sm max-w-md" style={{ fontFamily: settings.font_body }}>
                      {settings.hero_description}
                    </p>
                    <Button style={{ backgroundColor: settings.color_accent }} className="text-sm text-white">
                      {settings.hero_cta_text}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Palette de couleurs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Couleur primaire (fond foncé)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.color_primary}
                        onChange={(e) => setSettings({...settings, color_primary: e.target.value})}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.color_primary}
                        onChange={(e) => setSettings({...settings, color_primary: e.target.value})}
                        placeholder="#1E3A5F"
                        className="flex-1"
                      />
                    </div>
                    <div className="h-12 rounded-lg" style={{ backgroundColor: settings.color_primary }}></div>
                  </div>

                  <div className="space-y-2">
                    <Label>Couleur accent (boutons, liens)</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.color_accent}
                        onChange={(e) => setSettings({...settings, color_accent: e.target.value})}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.color_accent}
                        onChange={(e) => setSettings({...settings, color_accent: e.target.value})}
                        placeholder="#F97316"
                        className="flex-1"
                      />
                    </div>
                    <div className="h-12 rounded-lg" style={{ backgroundColor: settings.color_accent }}></div>
                  </div>

                  <div className="space-y-2">
                    <Label>Couleur texte</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.color_text}
                        onChange={(e) => setSettings({...settings, color_text: e.target.value})}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.color_text}
                        onChange={(e) => setSettings({...settings, color_text: e.target.value})}
                        placeholder="#0F172A"
                        className="flex-1"
                      />
                    </div>
                    <div className="h-12 rounded-lg border flex items-center justify-center" style={{ color: settings.color_text }}>
                      Texte exemple
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Couleur fond</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={settings.color_background}
                        onChange={(e) => setSettings({...settings, color_background: e.target.value})}
                        className="w-16 h-10 p-1 cursor-pointer"
                      />
                      <Input
                        value={settings.color_background}
                        onChange={(e) => setSettings({...settings, color_background: e.target.value})}
                        placeholder="#FFFFFF"
                        className="flex-1"
                      />
                    </div>
                    <div className="h-12 rounded-lg border" style={{ backgroundColor: settings.color_background }}></div>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="p-6 rounded-lg border">
                  <h3 className="font-semibold mb-4">Aperçu des couleurs</h3>
                  <div className="flex gap-4 flex-wrap">
                    <Button style={{ backgroundColor: settings.color_primary }} className="text-white">
                      Bouton Primaire
                    </Button>
                    <Button style={{ backgroundColor: settings.color_accent }} className="text-white">
                      Bouton Accent
                    </Button>
                    <div className="px-4 py-2 rounded" style={{ backgroundColor: settings.color_background, color: settings.color_text, border: '1px solid #e2e8f0' }}>
                      Texte sur fond
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Typography Tab */}
          <TabsContent value="typography" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="w-5 h-5" />
                  Typographie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Police des titres</Label>
                    <Select 
                      value={settings.font_heading} 
                      onValueChange={(v) => setSettings({...settings, font_heading: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(font => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="p-4 bg-secondary rounded-lg">
                      <h2 className="text-2xl font-bold" style={{ fontFamily: settings.font_heading }}>
                        Exemple de titre
                      </h2>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Police du texte</Label>
                    <Select 
                      value={settings.font_body} 
                      onValueChange={(v) => setSettings({...settings, font_body: v})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(font => (
                          <SelectItem key={font.value} value={font.value}>
                            <span style={{ fontFamily: font.value }}>{font.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="p-4 bg-secondary rounded-lg">
                      <p style={{ fontFamily: settings.font_body }}>
                        Ceci est un exemple de texte de paragraphe. Il montre à quoi ressemblera le contenu de votre site.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Banners Tab */}
          <TabsContent value="banners" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <Layout className="w-5 h-5" />
                    Bannières promotionnelles
                  </span>
                  <Button onClick={addBanner} size="sm" className="bg-accent hover:bg-accent/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une bannière
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(!settings.banners || settings.banners.length === 0) ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune bannière. Cliquez sur "Ajouter une bannière" pour commencer.</p>
                  </div>
                ) : (
                  settings.banners.map((banner, index) => (
                    <div key={banner.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={banner.enabled}
                            onCheckedChange={(checked) => updateBanner(banner.id, 'enabled', checked)}
                          />
                          <span className="text-sm font-medium">
                            {banner.enabled ? 'Activée' : 'Désactivée'}
                          </span>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => moveBanner(banner.id, 'up')}
                            disabled={index === 0}
                          >
                            <MoveUp className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => moveBanner(banner.id, 'down')}
                            disabled={index === settings.banners.length - 1}
                          >
                            <MoveDown className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => removeBanner(banner.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Texte de la bannière</Label>
                          <Input
                            value={banner.text}
                            onChange={(e) => updateBanner(banner.id, 'text', e.target.value)}
                            placeholder="Texte promotionnel..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Lien (optionnel)</Label>
                          <Input
                            value={banner.link}
                            onChange={(e) => updateBanner(banner.id, 'link', e.target.value)}
                            placeholder="/page ou https://..."
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Couleur de fond</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={banner.bgColor}
                              onChange={(e) => updateBanner(banner.id, 'bgColor', e.target.value)}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={banner.bgColor}
                              onChange={(e) => updateBanner(banner.id, 'bgColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Couleur du texte</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={banner.textColor}
                              onChange={(e) => updateBanner(banner.id, 'textColor', e.target.value)}
                              className="w-12 h-10 p-1 cursor-pointer"
                            />
                            <Input
                              value={banner.textColor}
                              onChange={(e) => updateBanner(banner.id, 'textColor', e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Banner Preview */}
                      <div 
                        className="p-3 rounded text-center text-sm font-medium"
                        style={{ backgroundColor: banner.bgColor, color: banner.textColor }}
                      >
                        {banner.text || 'Aperçu de la bannière'}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Sections de la page d'accueil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Section "Rechercher par marque"</h4>
                      <p className="text-sm text-muted-foreground">Affiche les logos des marques automobiles</p>
                    </div>
                    <Switch
                      checked={settings.show_brands_section}
                      onCheckedChange={(checked) => setSettings({...settings, show_brands_section: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Section "Rechercher par catégorie"</h4>
                      <p className="text-sm text-muted-foreground">Affiche les catégories de pièces</p>
                    </div>
                    <Switch
                      checked={settings.show_categories_section}
                      onCheckedChange={(checked) => setSettings({...settings, show_categories_section: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Section "Rechercher par région"</h4>
                      <p className="text-sm text-muted-foreground">Affiche la carte des régions</p>
                    </div>
                    <Switch
                      checked={settings.show_regions_section}
                      onCheckedChange={(checked) => setSettings({...settings, show_regions_section: checked})}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Informations du site</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom du site (SEO)</Label>
                    <Input
                      value={settings.site_title}
                      onChange={(e) => setSettings({...settings, site_title: e.target.value})}
                      placeholder="World Auto France"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Description (SEO)</Label>
                    <Input
                      value={settings.site_description}
                      onChange={(e) => setSettings({...settings, site_description: e.target.value})}
                      placeholder="Marketplace de pièces détachées..."
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Texte du footer</Label>
                  <Input
                    value={settings.footer_text}
                    onChange={(e) => setSettings({...settings, footer_text: e.target.value})}
                    placeholder="World Auto France - ..."
                  />
                </div>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Email de contact</Label>
                    <Input
                      value={settings.footer_email}
                      onChange={(e) => setSettings({...settings, footer_email: e.target.value})}
                      placeholder="contact@worldautofrance.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Téléphone (optionnel)</Label>
                    <Input
                      value={settings.footer_phone}
                      onChange={(e) => setSettings({...settings, footer_phone: e.target.value})}
                      placeholder="01 23 45 67 89"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Link to Updates Management */}
            <Card className="bg-accent/5 border-accent/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-lg">Gestion des actualités</h3>
                    <p className="text-sm text-muted-foreground">
                      Créez et gérez les mises à jour affichées sur la page Nouveautés
                    </p>
                  </div>
                  <Link to="/admin/actualites">
                    <Button className="bg-accent hover:bg-accent/90">
                      Gérer les actualités
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom Actions */}
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={handleReset}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Réinitialiser
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-accent hover:bg-accent/90"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {saving ? 'Sauvegarde...' : 'Sauvegarder tous les paramètres'}
          </Button>
        </div>
      </div>
    </div>
  );
}
