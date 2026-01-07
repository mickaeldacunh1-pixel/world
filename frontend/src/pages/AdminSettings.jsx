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
  AlertCircle, CheckCircle, Loader2, Sparkles,
  Menu, Globe, Facebook, Instagram, Twitter, Youtube, Link2, Mail, Phone
} from 'lucide-react';
import EmojiPicker from '../components/EmojiPicker';
import { ANIMATION_OPTIONS } from '../components/SeasonalAnimation';
import HeroEditor from '../components/HeroEditor';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Galerie d'images Hero prédéfinies
const HERO_IMAGE_PRESETS = [
  { url: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2832&auto=format&fit=crop", label: "Garage" },
  { url: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2832&auto=format&fit=crop", label: "Voiture sport" },
  { url: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=2832&auto=format&fit=crop", label: "Voiture classique" },
  { url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=2832&auto=format&fit=crop", label: "Moto" },
  { url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2832&auto=format&fit=crop", label: "Porsche" },
  { url: "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?q=80&w=2832&auto=format&fit=crop", label: "Mercedes" },
  { url: "https://images.unsplash.com/photo-1619682817481-e994891cd1f5?q=80&w=2832&auto=format&fit=crop", label: "Pièces moteur" },
  { url: "https://images.unsplash.com/photo-1580273916550-e323be2ae537?q=80&w=2832&auto=format&fit=crop", label: "BMW" },
];

// Palettes de couleurs rapides
const COLOR_PRESETS = [
  { name: "World Auto (défaut)", primary: "#1E3A5F", accent: "#F97316" },
  { name: "Bleu Premium", primary: "#1E40AF", accent: "#3B82F6" },
  { name: "Vert Nature", primary: "#166534", accent: "#22C55E" },
  { name: "Rouge Sport", primary: "#991B1B", accent: "#EF4444" },
  { name: "Violet Luxe", primary: "#581C87", accent: "#A855F7" },
  { name: "Orange Energy", primary: "#C2410C", accent: "#FB923C" },
  { name: "Noir Élégant", primary: "#171717", accent: "#A3A3A3" },
  { name: "Bleu Nuit", primary: "#0F172A", accent: "#38BDF8" },
];

// Options d'animation du texte Hero
const HERO_TEXT_ANIMATIONS = [
  { value: "none", label: "Aucune" },
  { value: "fade-in", label: "Fondu" },
  { value: "slide-up", label: "Glisser vers le haut" },
  { value: "slide-left", label: "Glisser depuis la gauche" },
  { value: "zoom-in", label: "Zoom" },
  { value: "typewriter", label: "Machine à écrire" },
];

const DEFAULT_SETTINGS = {
  // ============== HERO SECTION COMPLET ==============
  
  // Badge (petit texte au-dessus du titre)
  hero_badge_enabled: true,
  hero_badge_text: "La référence automobile en France",
  hero_badge_icon: "✨",
  hero_badge_bg_color: "rgba(249, 115, 22, 0.2)",
  hero_badge_text_color: "#F97316",
  hero_badge_border_color: "rgba(249, 115, 22, 0.3)",
  
  // Titre ligne 1
  hero_title_line1: "La marketplace auto",
  hero_title_line1_color: "#FFFFFF",
  hero_title_line1_size: "large",
  
  // Titre ligne 2
  hero_title_line2: "pour tous",
  hero_title_line2_color: "#F97316",
  hero_title_line2_size: "large",
  hero_title_line2_gradient: false,
  hero_title_line2_gradient_from: "#F97316",
  hero_title_line2_gradient_to: "#EA580C",
  
  // Description
  hero_description: "Achetez et vendez des pièces détachées, voitures, motos et utilitaires. Pour particuliers et professionnels.",
  hero_description_color: "rgba(255, 255, 255, 0.8)",
  hero_description_size: "medium",
  
  // Bouton CTA 1
  hero_cta1_enabled: true,
  hero_cta1_text: "Déposer une annonce",
  hero_cta1_link: "/deposer",
  hero_cta1_icon: "📝",
  hero_cta1_bg_color: "#F97316",
  hero_cta1_text_color: "#FFFFFF",
  hero_cta1_style: "filled",
  
  // Bouton CTA 2
  hero_cta2_enabled: true,
  hero_cta2_text: "Enchères en direct",
  hero_cta2_link: "/encheres",
  hero_cta2_icon: "⚡",
  hero_cta2_bg_color: "transparent",
  hero_cta2_text_color: "#FFFFFF",
  hero_cta2_border_color: "rgba(255, 255, 255, 0.3)",
  hero_cta2_style: "outline",
  
  // Image de fond
  hero_image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2832&auto=format&fit=crop",
  hero_overlay_enabled: true,
  hero_overlay_color: "#000000",
  hero_overlay_opacity: 50,
  hero_overlay_gradient: true,
  hero_overlay_gradient_direction: "to-r",
  
  // Layout
  hero_height: "large",
  hero_text_align: "left",
  hero_content_position: "left",
  hero_content_max_width: "3xl",
  hero_padding_top: "20",
  hero_padding_bottom: "32",
  
  // Animations
  hero_text_animation: "none",
  hero_animation_speed: "normal",
  
  // Éléments à afficher/masquer
  hero_show_badge: true,
  hero_show_search: true,
  hero_show_plate_scanner: true,
  hero_show_voice_search: true,
  hero_show_stats: true,
  hero_show_ai_tools: true,
  hero_show_categories: true,
  
  // Barre de recherche
  hero_search_placeholder: "Rechercher une pièce, un véhicule...",
  hero_search_bg_color: "rgba(255, 255, 255, 0.1)",
  hero_search_text_color: "#FFFFFF",
  hero_search_button_text: "Rechercher",
  hero_search_button_bg: "#F97316",
  
  // Stats (chiffres affichés)
  hero_stats_enabled: true,
  hero_stat1_number: "100+",
  hero_stat1_label: "annonces actives",
  hero_stat1_icon: "📦",
  hero_stat2_number: "5",
  hero_stat2_label: "catégories",
  hero_stat2_icon: "📂",
  hero_stat3_enabled: false,
  hero_stat3_number: "",
  hero_stat3_label: "",
  hero_stat3_icon: "",
  hero_stats_color: "rgba(255, 255, 255, 0.7)",
  hero_stats_number_color: "#FFFFFF",
  
  // Mode aperçu
  preview_mode: "desktop",
  
  // Categories Images (mini-catégories sous le hero)
  category_pieces_image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
  category_voitures_image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop",
  category_motos_image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=400&fit=crop",
  category_utilitaires_image: "https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?w=600&h=400&fit=crop",
  category_accessoires_image: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&h=400&fit=crop",
  
  // ============== AUTRES SECTIONS ==============
  
  // Announcement Bar
  announcement_enabled: false,
  announcement_text: "",
  announcement_link: "",
  announcement_bg_color: "#F97316",
  announcement_text_color: "#FFFFFF",
  
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
  footer_bg_color: "#1E3A5F",
  footer_text_color: "#FFFFFF",
  footer_show_newsletter: true,
  footer_show_categories: true,
  footer_show_useful_links: true,
  footer_show_contact: true,
  footer_show_social: true,
  footer_facebook_url: "",
  footer_instagram_url: "",
  footer_twitter_url: "",
  footer_youtube_url: "",
  footer_copyright_text: "© 2025 World Auto France. Tous droits réservés.",
  footer_custom_links: [],
  
  // Navbar
  navbar_bg_color: "#FFFFFF",
  navbar_text_color: "#0F172A",
  navbar_logo_text: "World Auto",
  navbar_show_categories_dropdown: true,
  navbar_show_tarifs_link: true,
  navbar_show_dark_mode_toggle: true,
  navbar_show_notifications: true,
  navbar_sticky: true,
  navbar_custom_links: [],
  
  // SEO
  site_title: "World Auto France",
  site_description: "Marketplace de pièces détachées automobiles",
  
  // Features toggles
  show_brands_section: true,
  show_categories_section: true,
  show_regions_section: true,
  
  // Homepage Sections Control (NEW)
  show_seller_of_week: true,
  show_recent_listings: true,
  recent_listings_count: 6,
  show_diagnostic_section: true,
  show_referral_section: true,
  show_features_section: true,
  show_cta_section: true,
  
  // Seller of the Week (NEW)
  seller_of_week_title: "🏆 Vendeur de la semaine",
  seller_of_week_manual_id: "",
  
  // Recent Listings Section (NEW)
  recent_listings_title: "Annonces récentes",
  recent_listings_subtitle: "Découvrez les dernières annonces publiées",
  
  // Diagnostic Section (NEW)
  diagnostic_title: "Diagnostic Auto",
  diagnostic_subtitle: "par Tobi IA",
  diagnostic_price: "0.99",
  
  // Referral Section (NEW)
  referral_title: "Parrainez vos amis,",
  referral_subtitle: "Gagnez des récompenses !",
  referral_points_per_referral: 100,
  referral_points_for_referred: 50,
};

// Options de taille de titre
const TITLE_SIZE_OPTIONS = [
  { value: 'small', label: 'Petit', class: 'text-2xl md:text-3xl' },
  { value: 'medium', label: 'Moyen', class: 'text-3xl md:text-4xl' },
  { value: 'large', label: 'Grand', class: 'text-4xl md:text-5xl lg:text-6xl' },
  { value: 'xlarge', label: 'Très grand', class: 'text-5xl md:text-6xl lg:text-7xl' },
];

// Options de taille de description
const DESC_SIZE_OPTIONS = [
  { value: 'small', label: 'Petit', class: 'text-sm md:text-base' },
  { value: 'medium', label: 'Moyen', class: 'text-base md:text-lg' },
  { value: 'large', label: 'Grand', class: 'text-lg md:text-xl' },
];

// Options d'alignement
const TEXT_ALIGN_OPTIONS = [
  { value: 'left', label: 'Gauche' },
  { value: 'center', label: 'Centre' },
  { value: 'right', label: 'Droite' },
];

// Options de hauteur du Hero
const HERO_HEIGHT_OPTIONS = [
  { value: 'small', label: 'Petit (400px)', class: 'min-h-[400px]' },
  { value: 'medium', label: 'Moyen (500px)', class: 'min-h-[500px]' },
  { value: 'large', label: 'Grand (600px)', class: 'min-h-[600px]' },
  { value: 'full', label: 'Plein écran', class: 'min-h-screen' },
];

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
            <p className="text-muted-foreground">Personnalisez l&apos;apparence et le contenu de votre site</p>
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
          <TabsList className="grid w-full grid-cols-7 mb-6">
            <TabsTrigger value="hero" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Hero
            </TabsTrigger>
            <TabsTrigger value="navbar" className="flex items-center gap-2">
              <Menu className="w-4 h-4" />
              Navbar
            </TabsTrigger>
            <TabsTrigger value="footer" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Footer
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
            {/* Announcement Bar Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📢 Barre d&apos;annonce
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Activer la barre d&apos;annonce</Label>
                    <p className="text-sm text-muted-foreground">Affiche un message en haut du site</p>
                  </div>
                  <Switch
                    checked={settings.announcement_enabled}
                    onCheckedChange={(checked) => setSettings({...settings, announcement_enabled: checked})}
                  />
                </div>
                
                {settings.announcement_enabled && (
                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <Label>Texte de l&apos;annonce</Label>
                      <div className="flex gap-2">
                        <Input
                          value={settings.announcement_text}
                          onChange={(e) => setSettings({...settings, announcement_text: e.target.value})}
                          placeholder="🎄 Livraison gratuite jusqu'au 31 décembre !"
                          className="flex-1"
                        />
                        <EmojiPicker onSelect={(emoji) => setSettings({...settings, announcement_text: settings.announcement_text + emoji})} />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Lien (optionnel)</Label>
                        <Input
                          value={settings.announcement_link}
                          onChange={(e) => setSettings({...settings, announcement_link: e.target.value})}
                          placeholder="/promotions"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Couleur de fond</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={settings.announcement_bg_color}
                            onChange={(e) => setSettings({...settings, announcement_bg_color: e.target.value})}
                            className="w-12 h-9 p-1 cursor-pointer"
                          />
                          <Input
                            value={settings.announcement_bg_color}
                            onChange={(e) => setSettings({...settings, announcement_bg_color: e.target.value})}
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Couleur du texte</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={settings.announcement_text_color}
                            onChange={(e) => setSettings({...settings, announcement_text_color: e.target.value})}
                            className="w-12 h-9 p-1 cursor-pointer"
                          />
                          <Input
                            value={settings.announcement_text_color}
                            onChange={(e) => setSettings({...settings, announcement_text_color: e.target.value})}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Preview */}
                    <div 
                      className="p-3 rounded-lg text-center text-sm font-medium"
                      style={{ backgroundColor: settings.announcement_bg_color, color: settings.announcement_text_color }}
                    >
                      {settings.announcement_text || "Aperçu de votre annonce"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Section Hero - Éditeur Complet */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Image className="w-5 h-5" />
                  🎨 Éditeur Hero Complet
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    const heroDefaults = Object.keys(DEFAULT_SETTINGS)
                      .filter(k => k.startsWith('hero_') || k.startsWith('category_'))
                      .reduce((acc, k) => ({ ...acc, [k]: DEFAULT_SETTINGS[k] }), {});
                    setSettings({...settings, ...heroDefaults});
                    toast.success('Section Hero réinitialisée');
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réinitialiser
                </Button>
              </CardHeader>
              <CardContent>
                <HeroEditor 
                  settings={settings} 
                  setSettings={setSettings}
                  onImageUpload={triggerImageUpload}
                  uploadingImage={uploadingImage}
                />
              </CardContent>
            </Card>


            {/* Seasonal Animation Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Animation saisonnière
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Ajoutez une ambiance festive à votre site avec des animations !
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {ANIMATION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSettings({...settings, seasonal_animation: option.value})}
                      className={`p-4 rounded-lg border-2 text-center transition-all ${
                        settings.seasonal_animation === option.value
                          ? 'border-accent bg-accent/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{option.emoji}</span>
                      <span className="text-sm font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
                {settings.seasonal_animation && (
                  <p className="text-sm text-accent flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Animation &quot;{ANIMATION_OPTIONS.find(o => o.value === settings.seasonal_animation)?.label}&quot; activée
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Preview with Mobile/Desktop toggle */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Aperçu en direct
                </CardTitle>
                <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setSettings({...settings, preview_mode: 'desktop'})}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      settings.preview_mode !== 'mobile' 
                        ? 'bg-white shadow text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    🖥️ Desktop
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({...settings, preview_mode: 'mobile'})}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      settings.preview_mode === 'mobile' 
                        ? 'bg-white shadow text-foreground' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    📱 Mobile
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                {/* Announcement Bar Preview */}
                {settings.announcement_enabled && settings.announcement_text && (
                  <div 
                    className="text-center text-sm font-medium py-2 px-4 mb-4 rounded-t-lg"
                    style={{ backgroundColor: settings.announcement_bg_color, color: settings.announcement_text_color }}
                  >
                    {settings.announcement_text}
                  </div>
                )}
                
                {/* Hero Preview */}
                <div 
                  className={`relative rounded-lg overflow-hidden transition-all duration-300 mx-auto ${
                    settings.preview_mode === 'mobile' ? 'max-w-[375px]' : 'w-full'
                  } ${HERO_HEIGHT_OPTIONS.find(h => h.value === (settings.hero_height || 'large'))?.class || 'min-h-[600px]'}`}
                >
                  {/* Background Image with Opacity */}
                  <div className="absolute inset-0">
                    <div 
                      className="absolute inset-0 bg-cover bg-center" 
                      style={{ backgroundImage: `url('${settings.hero_image}')` }}
                    />
                    <div 
                      className="absolute inset-0 bg-black"
                      style={{ opacity: (settings.hero_overlay_opacity || 50) / 100 }}
                    />
                  </div>
                  
                  {/* Content */}
                  <div 
                    className={`relative h-full flex flex-col justify-center ${settings.preview_mode === 'mobile' ? 'p-4' : 'p-8'}`}
                    style={{ textAlign: settings.hero_text_align || 'center' }}
                  >
                    <h1 
                      className={`font-black text-white leading-tight mb-3 ${
                        settings.preview_mode === 'mobile' 
                          ? 'text-xl' 
                          : TITLE_SIZE_OPTIONS.find(t => t.value === (settings.hero_title_size || 'large'))?.class || 'text-4xl md:text-5xl lg:text-6xl'
                      } ${settings.hero_text_animation ? `animate-${settings.hero_text_animation}` : ''}`}
                      style={{ fontFamily: settings.font_heading }}
                    >
                      <span style={{ color: settings.hero_title_line1_color || '#FFFFFF' }}>{settings.hero_title_line1}</span><br />
                      <span style={{ color: settings.hero_title_line2_color || settings.color_accent }}>{settings.hero_title_line2}</span>
                    </h1>
                    <p 
                      className={`text-white/80 mb-4 ${settings.hero_text_align === 'center' ? 'mx-auto' : ''} max-w-md ${
                        settings.preview_mode === 'mobile' 
                          ? 'text-xs' 
                          : DESC_SIZE_OPTIONS.find(d => d.value === (settings.hero_description_size || 'medium'))?.class || 'text-base md:text-lg'
                      }`}
                      style={{ fontFamily: settings.font_body }}
                    >
                      {settings.hero_description}
                    </p>
                    <div className={settings.hero_text_align === 'center' ? 'mx-auto' : ''}>
                      <Button 
                        style={{ backgroundColor: settings.color_accent }} 
                        className={`text-white ${settings.preview_mode === 'mobile' ? 'text-xs h-8 px-3' : 'text-sm'}`}
                      >
                        {settings.hero_cta_text}
                      </Button>
                    </div>
                    
                    {/* Search bar preview */}
                    {settings.hero_show_search !== false && (
                      <div className={`mt-6 ${settings.hero_text_align === 'center' ? 'mx-auto' : ''} max-w-xl`}>
                        <div className="bg-white/90 rounded-lg p-2 flex items-center gap-2 shadow-lg">
                          <input 
                            type="text" 
                            placeholder="Rechercher une pièce..." 
                            className="flex-1 px-3 py-2 bg-transparent text-gray-800 text-sm outline-none"
                            disabled
                          />
                          <Button size="sm" style={{ backgroundColor: settings.color_accent }} className="text-white">
                            Rechercher
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Categories Preview */}
                {settings.hero_show_categories !== false && (
                  <div className="mt-4 grid grid-cols-5 gap-2">
                    {[
                      { label: 'Pièces', img: settings.category_pieces_image },
                      { label: 'Voitures', img: settings.category_voitures_image },
                      { label: 'Motos', img: settings.category_motos_image },
                      { label: 'Utilitaires', img: settings.category_utilitaires_image },
                      { label: 'Accessoires', img: settings.category_accessoires_image },
                    ].map((cat, idx) => (
                      <div key={idx} className="relative rounded-lg overflow-hidden aspect-video group">
                        <img 
                          src={cat.img || 'https://via.placeholder.com/150'} 
                          alt={cat.label} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">{cat.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Preview Info */}
                <p className="text-xs text-muted-foreground mt-4 text-center">
                  {settings.preview_mode === 'mobile' 
                    ? '📱 Vue mobile (375px) - comme sur iPhone' 
                    : '🖥️ Vue desktop - comme sur ordinateur'}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Navbar Tab */}
          <TabsContent value="navbar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Menu className="w-5 h-5" />
                  Configuration de la barre de navigation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo et texte */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Logo & Texte</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Texte du logo</Label>
                      <Input
                        value={settings.navbar_logo_text}
                        onChange={(e) => setSettings({...settings, navbar_logo_text: e.target.value})}
                        placeholder="World Auto"
                      />
                    </div>
                  </div>
                </div>

                {/* Couleurs */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Couleurs</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur de fond</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.navbar_bg_color}
                          onChange={(e) => setSettings({...settings, navbar_bg_color: e.target.value})}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.navbar_bg_color}
                          onChange={(e) => setSettings({...settings, navbar_bg_color: e.target.value})}
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur du texte</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.navbar_text_color}
                          onChange={(e) => setSettings({...settings, navbar_text_color: e.target.value})}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.navbar_text_color}
                          onChange={(e) => setSettings({...settings, navbar_text_color: e.target.value})}
                          placeholder="#0F172A"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Éléments à afficher */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Éléments à afficher</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Menu Catégories</p>
                        <p className="text-xs text-muted-foreground">Dropdown des catégories</p>
                      </div>
                      <Switch
                        checked={settings.navbar_show_categories_dropdown}
                        onCheckedChange={(checked) => setSettings({...settings, navbar_show_categories_dropdown: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Lien Tarifs</p>
                        <p className="text-xs text-muted-foreground">Page des prix</p>
                      </div>
                      <Switch
                        checked={settings.navbar_show_tarifs_link}
                        onCheckedChange={(checked) => setSettings({...settings, navbar_show_tarifs_link: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Mode sombre</p>
                        <p className="text-xs text-muted-foreground">Bouton toggle</p>
                      </div>
                      <Switch
                        checked={settings.navbar_show_dark_mode_toggle}
                        onCheckedChange={(checked) => setSettings({...settings, navbar_show_dark_mode_toggle: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Notifications</p>
                        <p className="text-xs text-muted-foreground">Icône cloche</p>
                      </div>
                      <Switch
                        checked={settings.navbar_show_notifications}
                        onCheckedChange={(checked) => setSettings({...settings, navbar_show_notifications: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Navbar fixe</p>
                        <p className="text-xs text-muted-foreground">Reste en haut au scroll</p>
                      </div>
                      <Switch
                        checked={settings.navbar_sticky}
                        onCheckedChange={(checked) => setSettings({...settings, navbar_sticky: checked})}
                      />
                    </div>
                  </div>
                </div>

                {/* Liens personnalisés */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Liens personnalisés</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettings({
                        ...settings,
                        navbar_custom_links: [...(settings.navbar_custom_links || []), { text: '', url: '' }]
                      })}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  {(settings.navbar_custom_links || []).map((link, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={link.text}
                        onChange={(e) => {
                          const newLinks = [...settings.navbar_custom_links];
                          newLinks[index].text = e.target.value;
                          setSettings({...settings, navbar_custom_links: newLinks});
                        }}
                        placeholder="Texte du lien"
                        className="flex-1"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...settings.navbar_custom_links];
                          newLinks[index].url = e.target.value;
                          setSettings({...settings, navbar_custom_links: newLinks});
                        }}
                        placeholder="/page ou https://..."
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newLinks = settings.navbar_custom_links.filter((_, i) => i !== index);
                          setSettings({...settings, navbar_custom_links: newLinks});
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Footer Tab */}
          <TabsContent value="footer" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Configuration du pied de page
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Textes principaux */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Textes</h4>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Description du site</Label>
                      <Textarea
                        value={settings.footer_text}
                        onChange={(e) => setSettings({...settings, footer_text: e.target.value})}
                        placeholder="World Auto France - La marketplace..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texte copyright</Label>
                      <Input
                        value={settings.footer_copyright_text}
                        onChange={(e) => setSettings({...settings, footer_copyright_text: e.target.value})}
                        placeholder="© 2025 World Auto France. Tous droits réservés."
                      />
                    </div>
                  </div>
                </div>

                {/* Couleurs */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Couleurs</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur de fond</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.footer_bg_color}
                          onChange={(e) => setSettings({...settings, footer_bg_color: e.target.value})}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.footer_bg_color}
                          onChange={(e) => setSettings({...settings, footer_bg_color: e.target.value})}
                          placeholder="#1E3A5F"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur du texte</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.footer_text_color}
                          onChange={(e) => setSettings({...settings, footer_text_color: e.target.value})}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.footer_text_color}
                          onChange={(e) => setSettings({...settings, footer_text_color: e.target.value})}
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Informations de contact</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </Label>
                      <Input
                        value={settings.footer_email}
                        onChange={(e) => setSettings({...settings, footer_email: e.target.value})}
                        placeholder="contact@worldautofrance.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Téléphone
                      </Label>
                      <Input
                        value={settings.footer_phone}
                        onChange={(e) => setSettings({...settings, footer_phone: e.target.value})}
                        placeholder="01 23 45 67 89"
                      />
                    </div>
                  </div>
                </div>

                {/* Réseaux sociaux */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Réseaux sociaux</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Facebook className="w-4 h-4" />
                        Facebook
                      </Label>
                      <Input
                        value={settings.footer_facebook_url}
                        onChange={(e) => setSettings({...settings, footer_facebook_url: e.target.value})}
                        placeholder="https://facebook.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Instagram className="w-4 h-4" />
                        Instagram
                      </Label>
                      <Input
                        value={settings.footer_instagram_url}
                        onChange={(e) => setSettings({...settings, footer_instagram_url: e.target.value})}
                        placeholder="https://instagram.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Twitter className="w-4 h-4" />
                        Twitter / X
                      </Label>
                      <Input
                        value={settings.footer_twitter_url}
                        onChange={(e) => setSettings({...settings, footer_twitter_url: e.target.value})}
                        placeholder="https://twitter.com/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Youtube className="w-4 h-4" />
                        YouTube
                      </Label>
                      <Input
                        value={settings.footer_youtube_url}
                        onChange={(e) => setSettings({...settings, footer_youtube_url: e.target.value})}
                        placeholder="https://youtube.com/..."
                      />
                    </div>
                  </div>
                </div>

                {/* Sections à afficher */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Sections à afficher</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Newsletter</p>
                        <p className="text-xs text-muted-foreground">Formulaire d&apos;inscription</p>
                      </div>
                      <Switch
                        checked={settings.footer_show_newsletter}
                        onCheckedChange={(checked) => setSettings({...settings, footer_show_newsletter: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Catégories</p>
                        <p className="text-xs text-muted-foreground">Liste des catégories</p>
                      </div>
                      <Switch
                        checked={settings.footer_show_categories}
                        onCheckedChange={(checked) => setSettings({...settings, footer_show_categories: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Liens utiles</p>
                        <p className="text-xs text-muted-foreground">Nouveautés, À propos, etc.</p>
                      </div>
                      <Switch
                        checked={settings.footer_show_useful_links}
                        onCheckedChange={(checked) => setSettings({...settings, footer_show_useful_links: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Contact</p>
                        <p className="text-xs text-muted-foreground">Email et téléphone</p>
                      </div>
                      <Switch
                        checked={settings.footer_show_contact}
                        onCheckedChange={(checked) => setSettings({...settings, footer_show_contact: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">Réseaux sociaux</p>
                        <p className="text-xs text-muted-foreground">Icônes des réseaux</p>
                      </div>
                      <Switch
                        checked={settings.footer_show_social}
                        onCheckedChange={(checked) => setSettings({...settings, footer_show_social: checked})}
                      />
                    </div>
                  </div>
                </div>

                {/* Liens personnalisés */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Liens personnalisés</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSettings({
                        ...settings,
                        footer_custom_links: [...(settings.footer_custom_links || []), { text: '', url: '' }]
                      })}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>
                  {(settings.footer_custom_links || []).map((link, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        value={link.text}
                        onChange={(e) => {
                          const newLinks = [...settings.footer_custom_links];
                          newLinks[index].text = e.target.value;
                          setSettings({...settings, footer_custom_links: newLinks});
                        }}
                        placeholder="Texte du lien"
                        className="flex-1"
                      />
                      <Input
                        value={link.url}
                        onChange={(e) => {
                          const newLinks = [...settings.footer_custom_links];
                          newLinks[index].url = e.target.value;
                          setSettings({...settings, footer_custom_links: newLinks});
                        }}
                        placeholder="/page ou https://..."
                        className="flex-1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newLinks = settings.footer_custom_links.filter((_, i) => i !== index);
                          setSettings({...settings, footer_custom_links: newLinks});
                        }}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            {/* Quick Color Presets Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎨 Palettes rapides
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Cliquez sur une palette pour l&apos;appliquer instantanément
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {COLOR_PRESETS.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setSettings({
                        ...settings, 
                        color_primary: preset.primary, 
                        color_accent: preset.accent
                      })}
                      className={`p-4 rounded-xl border-2 text-left transition-all hover:scale-105 ${
                        settings.color_primary === preset.primary && settings.color_accent === preset.accent
                          ? 'border-accent ring-2 ring-accent/30 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex gap-2 mb-2">
                        <div 
                          className="w-8 h-8 rounded-lg shadow-inner"
                          style={{ backgroundColor: preset.primary }}
                        />
                        <div 
                          className="w-8 h-8 rounded-lg shadow-inner"
                          style={{ backgroundColor: preset.accent }}
                        />
                      </div>
                      <span className="text-sm font-medium block truncate">{preset.name}</span>
                      {settings.color_primary === preset.primary && settings.color_accent === preset.accent && (
                        <span className="text-xs text-accent">✓ Active</span>
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Personnalisation avancée
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
                    <p>Aucune bannière. Cliquez sur &quot;Ajouter une bannière&quot; pour commencer.</p>
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
                  Sections de la page d&apos;accueil
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground mb-4">
                  Activez ou désactivez les différentes sections de votre page d&apos;accueil
                </p>
                
                <div className="space-y-4">
                  {/* Vendeur de la semaine */}
                  <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          🏆 Section &quot;Vendeur de la semaine&quot;
                        </h4>
                        <p className="text-sm text-muted-foreground">Met en avant un vendeur performant</p>
                      </div>
                      <Switch
                        checked={settings.show_seller_of_week}
                        onCheckedChange={(checked) => setSettings({...settings, show_seller_of_week: checked})}
                      />
                    </div>
                    {settings.show_seller_of_week && (
                      <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 space-y-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Titre de la section</Label>
                          <Input
                            value={settings.seller_of_week_title}
                            onChange={(e) => setSettings({...settings, seller_of_week_title: e.target.value})}
                            placeholder="🏆 Vendeur de la semaine"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">ID vendeur manuel (optionnel)</Label>
                          <Input
                            value={settings.seller_of_week_manual_id}
                            onChange={(e) => setSettings({...settings, seller_of_week_manual_id: e.target.value})}
                            placeholder="Laisser vide pour sélection automatique"
                          />
                          <p className="text-xs text-muted-foreground">
                            Si vide, le vendeur avec le plus de ventes cette semaine sera affiché
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Annonces récentes */}
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          📋 Section &quot;Annonces récentes&quot;
                        </h4>
                        <p className="text-sm text-muted-foreground">Affiche les dernières annonces publiées</p>
                      </div>
                      <Switch
                        checked={settings.show_recent_listings}
                        onCheckedChange={(checked) => setSettings({...settings, show_recent_listings: checked})}
                      />
                    </div>
                    {settings.show_recent_listings && (
                      <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800 grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Titre</Label>
                          <Input
                            value={settings.recent_listings_title}
                            onChange={(e) => setSettings({...settings, recent_listings_title: e.target.value})}
                            placeholder="Annonces récentes"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Nombre d&apos;annonces</Label>
                          <Select
                            value={String(settings.recent_listings_count)}
                            onValueChange={(v) => setSettings({...settings, recent_listings_count: parseInt(v)})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="3">3 annonces</SelectItem>
                              <SelectItem value="6">6 annonces</SelectItem>
                              <SelectItem value="9">9 annonces</SelectItem>
                              <SelectItem value="12">12 annonces</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label className="text-sm">Sous-titre</Label>
                          <Input
                            value={settings.recent_listings_subtitle}
                            onChange={(e) => setSettings({...settings, recent_listings_subtitle: e.target.value})}
                            placeholder="Découvrez les dernières annonces publiées"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Diagnostic IA */}
                  <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          🩺 Section &quot;Diagnostic IA&quot;
                        </h4>
                        <p className="text-sm text-muted-foreground">Bannière pour le diagnostic automobile par Tobi</p>
                      </div>
                      <Switch
                        checked={settings.show_diagnostic_section}
                        onCheckedChange={(checked) => setSettings({...settings, show_diagnostic_section: checked})}
                      />
                    </div>
                    {settings.show_diagnostic_section && (
                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Titre principal</Label>
                          <Input
                            value={settings.diagnostic_title}
                            onChange={(e) => setSettings({...settings, diagnostic_title: e.target.value})}
                            placeholder="Diagnostic Auto"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Sous-titre</Label>
                          <Input
                            value={settings.diagnostic_subtitle}
                            onChange={(e) => setSettings({...settings, diagnostic_subtitle: e.target.value})}
                            placeholder="par Tobi IA"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Prix du diagnostic (€)</Label>
                          <Input
                            value={settings.diagnostic_price}
                            onChange={(e) => setSettings({...settings, diagnostic_price: e.target.value})}
                            placeholder="0.99"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Parrainage */}
                  <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium flex items-center gap-2">
                          🎁 Section &quot;Parrainage&quot;
                        </h4>
                        <p className="text-sm text-muted-foreground">Bannière pour le programme de parrainage</p>
                      </div>
                      <Switch
                        checked={settings.show_referral_section}
                        onCheckedChange={(checked) => setSettings({...settings, show_referral_section: checked})}
                      />
                    </div>
                    {settings.show_referral_section && (
                      <div className="mt-3 pt-3 border-t border-orange-200 dark:border-orange-800 grid md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="text-sm">Titre ligne 1</Label>
                          <Input
                            value={settings.referral_title}
                            onChange={(e) => setSettings({...settings, referral_title: e.target.value})}
                            placeholder="Parrainez vos amis,"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Titre ligne 2</Label>
                          <Input
                            value={settings.referral_subtitle}
                            onChange={(e) => setSettings({...settings, referral_subtitle: e.target.value})}
                            placeholder="Gagnez des récompenses !"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Points par parrainage</Label>
                          <Input
                            type="number"
                            value={settings.referral_points_per_referral}
                            onChange={(e) => setSettings({...settings, referral_points_per_referral: parseInt(e.target.value)})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm">Points pour le filleul</Label>
                          <Input
                            type="number"
                            value={settings.referral_points_for_referred}
                            onChange={(e) => setSettings({...settings, referral_points_for_referred: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Autres sections existantes */}
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Section &quot;Rechercher par marque&quot;</h4>
                      <p className="text-sm text-muted-foreground">Affiche les logos des marques automobiles</p>
                    </div>
                    <Switch
                      checked={settings.show_brands_section}
                      onCheckedChange={(checked) => setSettings({...settings, show_brands_section: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Section &quot;Rechercher par catégorie&quot;</h4>
                      <p className="text-sm text-muted-foreground">Affiche les catégories de pièces</p>
                    </div>
                    <Switch
                      checked={settings.show_categories_section}
                      onCheckedChange={(checked) => setSettings({...settings, show_categories_section: checked})}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Section &quot;Rechercher par région&quot;</h4>
                      <p className="text-sm text-muted-foreground">Affiche la carte des régions</p>
                    </div>
                    <Switch
                      checked={settings.show_regions_section}
                      onCheckedChange={(checked) => setSettings({...settings, show_regions_section: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Section &quot;Pourquoi nous choisir&quot;</h4>
                      <p className="text-sm text-muted-foreground">Affiche les avantages de la plateforme</p>
                    </div>
                    <Switch
                      checked={settings.show_features_section}
                      onCheckedChange={(checked) => setSettings({...settings, show_features_section: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                    <div>
                      <h4 className="font-medium">Section "Appel à l'action" (CTA final)</h4>
                      <p className="text-sm text-muted-foreground">Bannière "Prêt à vendre votre véhicule ?"</p>
                    </div>
                    <Switch
                      checked={settings.show_cta_section}
                      onCheckedChange={(checked) => setSettings({...settings, show_cta_section: checked})}
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
