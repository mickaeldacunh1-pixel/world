import { useState, useEffect, useRef, useCallback } from 'react';
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
  Save, Eye, Image as ImageIcon, Type, RefreshCw, Palette, Layout, 
  Plus, Trash2, MoveUp, MoveDown, Upload, Settings, 
  AlertCircle, CheckCircle, Loader2, Sparkles,
  Menu, Globe, Facebook, Instagram, Twitter, Youtube, Link2, Mail, Phone,
  Ticket, Percent, Calendar, Hash, Radio, Music, Volume2, GripVertical,
  Shield, ShieldCheck, XCircle, Clock, FileText, User
} from 'lucide-react';
import EmojiPicker from '../components/EmojiPicker';
import { ANIMATION_OPTIONS } from '../components/SeasonalAnimation';
import HeroEditor from '../components/HeroEditor';
import HeroVisualEditor from '../components/HeroVisualEditor';
import HeroFreePositionEditor from '../components/HeroFreePositionEditor';
import RadioManager from '../components/RadioManager';

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
  { name: "World Auto Pro (défaut)", primary: "#1E3A5F", accent: "#F97316" },
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

// ============== HOME PAGE EDITOR COMPONENT ==============
function HomePageEditor({ settings, updateSetting, onImageUpload, uploadingImage }) {
  const [activeSection, setActiveSection] = useState('hero');
  
  const sections = [
    { id: 'hero', label: '🏠 Hero (Bannière)', icon: '🎯' },
    { id: 'stats', label: '📊 Statistiques', icon: '📈' },
    { id: 'categories', label: '📁 Catégories', icon: '📂' },
    { id: 'brands', label: '🚗 Marques', icon: '🏷️' },
    { id: 'parts', label: '🔧 Pièces', icon: '⚙️' },
    { id: 'oem', label: '🔍 Référence OEM', icon: '🔎' },
    { id: 'regions', label: '📍 Régions', icon: '🗺️' },
    { id: 'recent', label: '🆕 Annonces récentes', icon: '📋' },
    { id: 'diagnostic', label: '🤖 Diagnostic IA', icon: '🧠' },
    { id: 'cta', label: '📣 Appel à l\'action', icon: '🎯' },
  ];

  return (
    <div className="space-y-6">
      {/* Section Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Éditeur Page d&apos;Accueil
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sélectionne une section pour modifier son contenu
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={activeSection === section.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveSection(section.id)}
                className="text-xs"
              >
                {section.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Hero Section Editor */}
      {activeSection === 'hero' && (
        <Card>
          <CardHeader>
            <CardTitle>🏠 Section Hero (Bannière principale)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground mb-4">
              ⚠️ Le Hero a son propre onglet dédié avec plus d&apos;options. Utilisez l&apos;onglet &quot;Hero&quot; pour une personnalisation complète.
            </p>
            <Button variant="outline" onClick={() => document.querySelector('[value="hero"]')?.click()}>
              Aller à l&apos;onglet Hero →
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Section Editor */}
      {activeSection === 'stats' && (
        <Card>
          <CardHeader>
            <CardTitle>📊 Section Statistiques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Afficher les statistiques</Label>
              <Switch 
                checked={settings.home_stats_enabled !== false}
                onCheckedChange={(v) => updateSetting('home_stats_enabled', v)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Texte "annonces actives"</Label>
                <Input 
                  value={settings.home_stats_listings_text || 'annonces actives'}
                  onChange={(e) => updateSetting('home_stats_listings_text', e.target.value)}
                />
              </div>
              <div>
                <Label>Texte "catégories"</Label>
                <Input 
                  value={settings.home_stats_categories_text || 'catégories'}
                  onChange={(e) => updateSetting('home_stats_categories_text', e.target.value)}
                />
              </div>
              <div>
                <Label>Texte "membres"</Label>
                <Input 
                  value={settings.home_stats_members_text || 'membres'}
                  onChange={(e) => updateSetting('home_stats_members_text', e.target.value)}
                />
              </div>
              <div>
                <Label>Texte "ventes"</Label>
                <Input 
                  value={settings.home_stats_sales_text || 'ventes réalisées'}
                  onChange={(e) => updateSetting('home_stats_sales_text', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Categories Section Editor */}
      {activeSection === 'categories' && (
        <Card>
          <CardHeader>
            <CardTitle>📁 Section Catégories</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Afficher la section catégories</Label>
              <Switch 
                checked={settings.home_categories_enabled !== false}
                onCheckedChange={(v) => updateSetting('home_categories_enabled', v)}
              />
            </div>
            <div>
              <Label>Titre de la section</Label>
              <Input 
                value={settings.home_categories_title || 'Explorez nos catégories'}
                onChange={(e) => updateSetting('home_categories_title', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input 
                value={settings.home_categories_subtitle || 'Trouvez ce que vous cherchez'}
                onChange={(e) => updateSetting('home_categories_subtitle', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Brands Section Editor */}
      {activeSection === 'brands' && (
        <Card>
          <CardHeader>
            <CardTitle>🚗 Section Marques</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Afficher la section marques</Label>
              <Switch 
                checked={settings.home_brands_enabled !== false}
                onCheckedChange={(v) => updateSetting('home_brands_enabled', v)}
              />
            </div>
            <div>
              <Label>Titre</Label>
              <Input 
                value={settings.home_brands_title || 'Recherche par marque'}
                onChange={(e) => updateSetting('home_brands_title', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input 
                value={settings.home_brands_subtitle || 'Trouvez des pièces pour votre véhicule'}
                onChange={(e) => updateSetting('home_brands_subtitle', e.target.value)}
              />
            </div>
            <div>
              <Label>Texte bouton "Voir toutes les marques"</Label>
              <Input 
                value={settings.home_brands_button || 'Voir toutes les marques'}
                onChange={(e) => updateSetting('home_brands_button', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parts Section Editor */}
      {activeSection === 'parts' && (
        <Card>
          <CardHeader>
            <CardTitle>🔧 Section Pièces par catégorie</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Afficher la section pièces</Label>
              <Switch 
                checked={settings.home_parts_enabled !== false}
                onCheckedChange={(v) => updateSetting('home_parts_enabled', v)}
              />
            </div>
            <div>
              <Label>Titre</Label>
              <Input 
                value={settings.home_parts_title || 'Pièces par catégorie'}
                onChange={(e) => updateSetting('home_parts_title', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input 
                value={settings.home_parts_subtitle || 'Les pièces les plus recherchées'}
                onChange={(e) => updateSetting('home_parts_subtitle', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* OEM Section Editor */}
      {activeSection === 'oem' && (
        <Card>
          <CardHeader>
            <CardTitle>🔍 Section Référence OEM</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Afficher la section OEM</Label>
              <Switch 
                checked={settings.home_oem_enabled !== false}
                onCheckedChange={(v) => updateSetting('home_oem_enabled', v)}
              />
            </div>
            <div>
              <Label>Titre</Label>
              <Input 
                value={settings.home_oem_title || 'Recherche par référence OEM'}
                onChange={(e) => updateSetting('home_oem_title', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Textarea 
                value={settings.home_oem_subtitle || 'Entrez la référence constructeur (OEM) pour trouver la pièce exacte'}
                onChange={(e) => updateSetting('home_oem_subtitle', e.target.value)}
              />
            </div>
            <div>
              <Label>Placeholder du champ de recherche</Label>
              <Input 
                value={settings.home_oem_placeholder || 'Ex: 1K0615301M, 7701209803...'}
                onChange={(e) => updateSetting('home_oem_placeholder', e.target.value)}
              />
            </div>
            <div>
              <Label>Texte du bouton</Label>
              <Input 
                value={settings.home_oem_button || 'Rechercher'}
                onChange={(e) => updateSetting('home_oem_button', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Regions Section Editor */}
      {activeSection === 'regions' && (
        <Card>
          <CardHeader>
            <CardTitle>📍 Section Régions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Afficher la section régions</Label>
              <Switch 
                checked={settings.home_regions_enabled !== false}
                onCheckedChange={(v) => updateSetting('home_regions_enabled', v)}
              />
            </div>
            <div>
              <Label>Titre</Label>
              <Input 
                value={settings.home_regions_title || 'Recherche par région'}
                onChange={(e) => updateSetting('home_regions_title', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input 
                value={settings.home_regions_subtitle || 'Trouvez des annonces près de chez vous'}
                onChange={(e) => updateSetting('home_regions_subtitle', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Listings Section Editor */}
      {activeSection === 'recent' && (
        <Card>
          <CardHeader>
            <CardTitle>🆕 Section Annonces récentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Afficher les annonces récentes</Label>
              <Switch 
                checked={settings.home_recent_enabled !== false}
                onCheckedChange={(v) => updateSetting('home_recent_enabled', v)}
              />
            </div>
            <div>
              <Label>Titre</Label>
              <Input 
                value={settings.home_recent_title || 'Annonces récentes'}
                onChange={(e) => updateSetting('home_recent_title', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Input 
                value={settings.home_recent_subtitle || 'Les dernières annonces publiées'}
                onChange={(e) => updateSetting('home_recent_subtitle', e.target.value)}
              />
            </div>
            <div>
              <Label>Nombre d&apos;annonces à afficher</Label>
              <Select 
                value={String(settings.home_recent_count || 6)}
                onValueChange={(v) => updateSetting('home_recent_count', parseInt(v))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 annonces</SelectItem>
                  <SelectItem value="6">6 annonces</SelectItem>
                  <SelectItem value="9">9 annonces</SelectItem>
                  <SelectItem value="12">12 annonces</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostic IA Section Editor */}
      {activeSection === 'diagnostic' && (
        <Card>
          <CardHeader>
            <CardTitle>🤖 Section Diagnostic IA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Afficher la section Diagnostic IA</Label>
              <Switch 
                checked={settings.home_diagnostic_enabled !== false}
                onCheckedChange={(v) => updateSetting('home_diagnostic_enabled', v)}
              />
            </div>
            <div>
              <Label>Badge</Label>
              <Input 
                value={settings.home_diagnostic_badge || '🤖 Nouveau'}
                onChange={(e) => updateSetting('home_diagnostic_badge', e.target.value)}
              />
            </div>
            <div>
              <Label>Titre</Label>
              <Input 
                value={settings.home_diagnostic_title || 'Diagnostic IA'}
                onChange={(e) => updateSetting('home_diagnostic_title', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Textarea 
                value={settings.home_diagnostic_subtitle || 'Décrivez votre problème et notre IA vous aidera à identifier la pièce'}
                onChange={(e) => updateSetting('home_diagnostic_subtitle', e.target.value)}
              />
            </div>
            <div>
              <Label>Texte bouton</Label>
              <Input 
                value={settings.home_diagnostic_button || 'Essayer le diagnostic'}
                onChange={(e) => updateSetting('home_diagnostic_button', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA Section Editor */}
      {activeSection === 'cta' && (
        <Card>
          <CardHeader>
            <CardTitle>📣 Section Appel à l&apos;action (CTA)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Afficher la section CTA</Label>
              <Switch 
                checked={settings.home_cta_enabled !== false}
                onCheckedChange={(v) => updateSetting('home_cta_enabled', v)}
              />
            </div>
            <div>
              <Label>Titre</Label>
              <Input 
                value={settings.home_cta_title || 'Prêt à vendre ?'}
                onChange={(e) => updateSetting('home_cta_title', e.target.value)}
              />
            </div>
            <div>
              <Label>Sous-titre</Label>
              <Textarea 
                value={settings.home_cta_subtitle || 'Rejoignez des milliers de vendeurs et touchez des acheteurs dans toute la France'}
                onChange={(e) => updateSetting('home_cta_subtitle', e.target.value)}
              />
            </div>
            <div>
              <Label>Texte bouton principal</Label>
              <Input 
                value={settings.home_cta_button || 'Déposer une annonce'}
                onChange={(e) => updateSetting('home_cta_button', e.target.value)}
              />
            </div>
            <div>
              <Label>Texte bouton secondaire</Label>
              <Input 
                value={settings.home_cta_button2 || 'Voir les tarifs'}
                onChange={(e) => updateSetting('home_cta_button2', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ============== PAGES EDITOR COMPONENT ==============
function PagesEditor({ settings, updateSetting }) {
  const [activePage, setActivePage] = useState('home');
  
  const pages = [
    { id: 'home', label: '🏠 Accueil', description: 'Page principale du site' },
    { id: 'about', label: '📖 À propos', description: 'Présentation de World Auto Pro' },
    { id: 'contact', label: '📧 Contact', description: 'Formulaire de contact' },
    { id: 'faq', label: '❓ FAQ', description: 'Questions fréquentes' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Éditeur de Pages
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sélectionnez une page pour modifier son contenu
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pages.map((page) => (
              <Button
                key={page.id}
                variant={activePage === page.id ? 'default' : 'outline'}
                onClick={() => setActivePage(page.id)}
                className="h-auto py-4 flex flex-col items-center gap-1"
              >
                <span className="text-lg">{page.label}</span>
                <span className="text-xs opacity-70">{page.description}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Home Page - Redirect to HomePageEditor */}
      {activePage === 'home' && (
        <Card>
          <CardHeader>
            <CardTitle>🏠 Page d&apos;Accueil</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              L&apos;éditeur de la page d&apos;accueil est intégré ci-dessous. Vous pouvez modifier toutes les sections de la home.
            </p>
          </CardContent>
        </Card>
      )}

      {/* About Page Editor */}
      {activePage === 'about' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📖 Page À propos - En-tête</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Titre principal</Label>
                <Input 
                  value={settings.about_title || 'À propos de World Auto Pro'}
                  onChange={(e) => updateSetting('about_title', e.target.value)}
                  placeholder="À propos de World Auto Pro"
                />
              </div>
              <div>
                <Label>Sous-titre</Label>
                <Input 
                  value={settings.about_subtitle || 'La marketplace automobile de référence en France pour les particuliers et professionnels.'}
                  onChange={(e) => updateSetting('about_subtitle', e.target.value)}
                  placeholder="La marketplace automobile de référence..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>🎯 Section Mission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Titre de la section</Label>
                <Input 
                  value={settings.about_mission_title || 'Notre mission'}
                  onChange={(e) => updateSetting('about_mission_title', e.target.value)}
                />
              </div>
              <div>
                <Label>Paragraphe 1</Label>
                <Textarea 
                  value={settings.about_mission_p1 || 'World Auto Pro est né d\'une passion pour l\'automobile et d\'une volonté de simplifier l\'achat et la vente de pièces détachées et de véhicules d\'occasion en France.'}
                  onChange={(e) => updateSetting('about_mission_p1', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Paragraphe 2</Label>
                <Textarea 
                  value={settings.about_mission_p2 || 'Notre plateforme met en relation acheteurs et vendeurs, qu\'ils soient particuliers ou professionnels du secteur automobile.'}
                  onChange={(e) => updateSetting('about_mission_p2', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Paragraphe 3</Label>
                <Textarea 
                  value={settings.about_mission_p3 || 'Que vous cherchiez une pièce rare pour votre véhicule de collection ou que vous souhaitiez vendre votre voiture, World Auto Pro est là pour vous accompagner.'}
                  onChange={(e) => updateSetting('about_mission_p3', e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>💎 Section Valeurs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Titre de la section</Label>
                <Input 
                  value={settings.about_values_title || 'Nos valeurs'}
                  onChange={(e) => updateSetting('about_values_title', e.target.value)}
                />
              </div>
              
              {/* Valeur 1 */}
              <div className="p-4 border rounded-lg space-y-3">
                <Label className="font-bold">Valeur 1</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Icône (emoji)</Label>
                    <Input 
                      value={settings.about_value1_icon || '🛡️'}
                      onChange={(e) => updateSetting('about_value1_icon', e.target.value)}
                      className="text-center text-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Titre</Label>
                    <Input 
                      value={settings.about_value1_title || 'Sécurité'}
                      onChange={(e) => updateSetting('about_value1_title', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea 
                    value={settings.about_value1_desc || 'Paiements sécurisés via Stripe et vérification des vendeurs professionnels.'}
                    onChange={(e) => updateSetting('about_value1_desc', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Valeur 2 */}
              <div className="p-4 border rounded-lg space-y-3">
                <Label className="font-bold">Valeur 2</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Icône (emoji)</Label>
                    <Input 
                      value={settings.about_value2_icon || '👥'}
                      onChange={(e) => updateSetting('about_value2_icon', e.target.value)}
                      className="text-center text-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Titre</Label>
                    <Input 
                      value={settings.about_value2_title || 'Communauté'}
                      onChange={(e) => updateSetting('about_value2_title', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea 
                    value={settings.about_value2_desc || 'Une communauté de passionnés et de professionnels de l\'automobile.'}
                    onChange={(e) => updateSetting('about_value2_desc', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>

              {/* Valeur 3 */}
              <div className="p-4 border rounded-lg space-y-3">
                <Label className="font-bold">Valeur 3</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Icône (emoji)</Label>
                    <Input 
                      value={settings.about_value3_icon || '🏆'}
                      onChange={(e) => updateSetting('about_value3_icon', e.target.value)}
                      className="text-center text-xl"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Titre</Label>
                    <Input 
                      value={settings.about_value3_title || 'Qualité'}
                      onChange={(e) => updateSetting('about_value3_title', e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Description</Label>
                  <Textarea 
                    value={settings.about_value3_desc || 'Des annonces vérifiées et un système d\'avis pour garantir la qualité.'}
                    onChange={(e) => updateSetting('about_value3_desc', e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📊 Section Chiffres</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Afficher la section chiffres</Label>
                <Switch 
                  checked={settings.about_stats_enabled !== false}
                  onCheckedChange={(v) => updateSetting('about_stats_enabled', v)}
                />
              </div>
              <div>
                <Label>Titre de la section</Label>
                <Input 
                  value={settings.about_stats_title || 'World Auto Pro en chiffres'}
                  onChange={(e) => updateSetting('about_stats_title', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">Stat 1 - Valeur</Label>
                  <Input 
                    value={settings.about_stat1_value || '1000+'}
                    onChange={(e) => updateSetting('about_stat1_value', e.target.value)}
                  />
                  <Label className="text-xs">Stat 1 - Label</Label>
                  <Input 
                    value={settings.about_stat1_label || 'Annonces publiées'}
                    onChange={(e) => updateSetting('about_stat1_label', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Stat 2 - Valeur</Label>
                  <Input 
                    value={settings.about_stat2_value || '500+'}
                    onChange={(e) => updateSetting('about_stat2_value', e.target.value)}
                  />
                  <Label className="text-xs">Stat 2 - Label</Label>
                  <Input 
                    value={settings.about_stat2_label || 'Utilisateurs actifs'}
                    onChange={(e) => updateSetting('about_stat2_label', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Stat 3 - Valeur</Label>
                  <Input 
                    value={settings.about_stat3_value || '50+'}
                    onChange={(e) => updateSetting('about_stat3_value', e.target.value)}
                  />
                  <Label className="text-xs">Stat 3 - Label</Label>
                  <Input 
                    value={settings.about_stat3_label || 'Vendeurs PRO'}
                    onChange={(e) => updateSetting('about_stat3_label', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Stat 4 - Valeur</Label>
                  <Input 
                    value={settings.about_stat4_value || '98%'}
                    onChange={(e) => updateSetting('about_stat4_value', e.target.value)}
                  />
                  <Label className="text-xs">Stat 4 - Label</Label>
                  <Input 
                    value={settings.about_stat4_label || 'Clients satisfaits'}
                    onChange={(e) => updateSetting('about_stat4_label', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Contact Page Editor */}
      {activePage === 'contact' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>📧 Page Contact - En-tête</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Titre principal</Label>
                <Input 
                  value={settings.contact_title || 'Contactez-nous'}
                  onChange={(e) => updateSetting('contact_title', e.target.value)}
                />
              </div>
              <div>
                <Label>Sous-titre</Label>
                <Input 
                  value={settings.contact_subtitle || 'Une question ? Un problème ? Notre équipe est là pour vous aider.'}
                  onChange={(e) => updateSetting('contact_subtitle', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📬 Informations de contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Email de contact</Label>
                <Input 
                  value={settings.contact_email || 'contact@worldautofrance.com'}
                  onChange={(e) => updateSetting('contact_email', e.target.value)}
                  type="email"
                />
              </div>
              <div>
                <Label>Téléphone (optionnel)</Label>
                <Input 
                  value={settings.contact_phone || ''}
                  onChange={(e) => updateSetting('contact_phone', e.target.value)}
                  placeholder="+33 1 23 45 67 89"
                />
              </div>
              <div>
                <Label>Horaires de disponibilité</Label>
                <Input 
                  value={settings.contact_hours || 'Lun-Ven : 9h-18h'}
                  onChange={(e) => updateSetting('contact_hours', e.target.value)}
                />
              </div>
              <div>
                <Label>Adresse (optionnel)</Label>
                <Textarea 
                  value={settings.contact_address || ''}
                  onChange={(e) => updateSetting('contact_address', e.target.value)}
                  placeholder="123 Rue de l'Automobile&#10;75000 Paris"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📝 Formulaire de contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Activer le formulaire de contact</Label>
                <Switch 
                  checked={settings.contact_form_enabled !== false}
                  onCheckedChange={(v) => updateSetting('contact_form_enabled', v)}
                />
              </div>
              <div>
                <Label>Message de succès</Label>
                <Input 
                  value={settings.contact_success_message || 'Merci de nous avoir contacté. Nous vous répondrons dans les plus brefs délais.'}
                  onChange={(e) => updateSetting('contact_success_message', e.target.value)}
                />
              </div>
              <div>
                <Label>Titre du formulaire</Label>
                <Input 
                  value={settings.contact_form_title || 'Envoyez-nous un message'}
                  onChange={(e) => updateSetting('contact_form_title', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>ℹ️ Section Informations supplémentaires</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Afficher les informations sur le délai de réponse</Label>
                <Switch 
                  checked={settings.contact_show_response_time !== false}
                  onCheckedChange={(v) => updateSetting('contact_show_response_time', v)}
                />
              </div>
              <div>
                <Label>Texte délai de réponse</Label>
                <Input 
                  value={settings.contact_response_time || 'Nous répondons généralement sous 24h'}
                  onChange={(e) => updateSetting('contact_response_time', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FAQ Page Editor */}
      {activePage === 'faq' && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>❓ Page FAQ - En-tête</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Titre principal</Label>
                <Input 
                  value={settings.faq_title || 'Questions fréquentes'}
                  onChange={(e) => updateSetting('faq_title', e.target.value)}
                />
              </div>
              <div>
                <Label>Sous-titre</Label>
                <Input 
                  value={settings.faq_subtitle || 'Trouvez rapidement les réponses à vos questions'}
                  onChange={(e) => updateSetting('faq_subtitle', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📚 Configuration FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Afficher la barre de recherche FAQ</Label>
                <Switch 
                  checked={settings.faq_search_enabled !== false}
                  onCheckedChange={(v) => updateSetting('faq_search_enabled', v)}
                />
              </div>
              <div>
                <Label>Placeholder recherche</Label>
                <Input 
                  value={settings.faq_search_placeholder || 'Rechercher une question...'}
                  onChange={(e) => updateSetting('faq_search_placeholder', e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Afficher les catégories FAQ</Label>
                <Switch 
                  checked={settings.faq_categories_enabled !== false}
                  onCheckedChange={(v) => updateSetting('faq_categories_enabled', v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>📞 Section Contact FAQ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Afficher la section &quot;Vous n&apos;avez pas trouvé votre réponse ?&quot;</Label>
                <Switch 
                  checked={settings.faq_contact_enabled !== false}
                  onCheckedChange={(v) => updateSetting('faq_contact_enabled', v)}
                />
              </div>
              <div>
                <Label>Texte du bouton contact</Label>
                <Input 
                  value={settings.faq_contact_button || 'Contactez-nous'}
                  onChange={(e) => updateSetting('faq_contact_button', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// ============== SUBCATEGORY IMAGES MANAGER COMPONENT ==============
function SubcategoryImagesManager({ token }) {
  const [subcatImages, setSubcatImages] = useState({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('pieces');
  
  const SUBCATEGORIES = {
    pieces: {
      moteur: "Moteur",
      boite_vitesse: "Boîte de vitesse",
      embrayage: "Embrayage",
      transmission: "Transmission",
      echappement: "Échappement",
      refroidissement: "Refroidissement",
      carrosserie: "Carrosserie",
      optique: "Optiques/Éclairage",
      retroviseur: "Rétroviseurs",
      vitrage: "Vitrage",
      interieur: "Intérieur/Sellerie",
      freinage: "Freinage",
      suspension: "Suspension",
      direction: "Direction",
      roues_pneus: "Roues/Pneus",
      electricite: "Électricité",
      climatisation: "Climatisation",
      turbo: "Turbo",
      autre: "Autres"
    },
    accessoires: {
      jantes: "Jantes",
      pneus: "Pneus",
      gps_navigation: "GPS",
      autoradio: "Autoradio",
      alarme: "Alarmes",
      camera: "Caméras",
      eclairage_led: "LED/Tuning",
      tapis: "Tapis",
      coffre: "Coffres de toit",
      attelage: "Attelages",
      outillage: "Outillage"
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      const response = await axios.get(`${API}/subcategory-images`);
      setSubcatImages(response.data);
    } catch (error) {
      console.error('Erreur chargement images:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (category, subcategory, file) => {
    setUploading(`${category}_${subcategory}`);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('category', category);
    formData.append('subcategory', subcategory);
    
    try {
      const response = await axios.post(`${API}/subcategory-images/upload`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setSubcatImages(prev => ({
        ...prev,
        [`${category}_${subcategory}`]: response.data.image_url
      }));
      toast.success('Image mise à jour !');
    } catch (error) {
      toast.error('Erreur upload: ' + (error.response?.data?.detail || error.message));
    } finally {
      setUploading(null);
    }
  };

  const handleUrlChange = async (category, subcategory, url) => {
    try {
      await axios.post(`${API}/subcategory-images`, {
        category,
        subcategory,
        image_url: url
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSubcatImages(prev => ({
        ...prev,
        [`${category}_${subcategory}`]: url
      }));
      toast.success('URL mise à jour !');
    } catch (error) {
      toast.error('Erreur: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Images des sous-catégories
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Personnalisez les vignettes affichées sur la page d&apos;accueil
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Category selector */}
        <div className="flex gap-2">
          <Button
            variant={selectedCategory === 'pieces' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('pieces')}
          >
            Pièces détachées
          </Button>
          <Button
            variant={selectedCategory === 'accessoires' ? 'default' : 'outline'}
            onClick={() => setSelectedCategory('accessoires')}
          >
            Accessoires
          </Button>
        </div>

        {/* Grid of subcategories */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Object.entries(SUBCATEGORIES[selectedCategory] || {}).map(([key, label]) => {
            const imageKey = `${selectedCategory}_${key}`;
            const currentImage = subcatImages[imageKey];
            const isUploading = uploading === imageKey;
            
            return (
              <div key={key} className="border rounded-lg p-3 space-y-2">
                {/* Preview */}
                <div className="aspect-video bg-secondary/30 rounded overflow-hidden relative">
                  {currentImage ? (
                    <img 
                      src={currentImage} 
                      alt={label}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-8 h-8" />
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                
                {/* Label */}
                <p className="text-sm font-medium truncate">{label}</p>
                
                {/* Upload button */}
                <div className="flex gap-1">
                  <label className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleUpload(selectedCategory, key, e.target.files[0]);
                        }
                      }}
                      disabled={isUploading}
                    />
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      disabled={isUploading}
                      asChild
                    >
                      <span>
                        <Upload className="w-3 h-3 mr-1" />
                        Upload
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ============== COUPONS MANAGER COMPONENT ==============
function CouponsManager({ token }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage',
    discount_value: 10,
    min_purchase: 0,
    max_discount: null,
    usage_limit: null,
    per_user_limit: 1,
    valid_from: '',
    valid_until: '',
    active: true,
    description: '',
  });

  const fetchCoupons = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/admin/coupons`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCoupons(response.data);
    } catch (error) {
      console.error('Error fetching coupons:', error);
      toast.error('Erreur lors du chargement des coupons');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const resetForm = () => {
    setFormData({
      code: '',
      discount_type: 'percentage',
      discount_value: 10,
      min_purchase: 0,
      max_discount: null,
      usage_limit: null,
      per_user_limit: 1,
      valid_from: '',
      valid_until: '',
      active: true,
      description: '',
    });
    setEditingCoupon(null);
  };

  const handleEdit = (coupon) => {
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase || 0,
      max_discount: coupon.max_discount || null,
      usage_limit: coupon.usage_limit || null,
      per_user_limit: coupon.per_user_limit || 1,
      valid_from: coupon.valid_from ? coupon.valid_from.split('T')[0] : '',
      valid_until: coupon.valid_until ? coupon.valid_until.split('T')[0] : '',
      active: coupon.active,
      description: coupon.description || '',
    });
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) {
      toast.error('Le code est obligatoire');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        valid_from: formData.valid_from ? new Date(formData.valid_from).toISOString() : null,
        valid_until: formData.valid_until ? new Date(formData.valid_until).toISOString() : null,
      };

      if (editingCoupon) {
        await axios.put(`${API}/admin/coupons/${editingCoupon.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Coupon mis à jour');
      } else {
        await axios.post(`${API}/admin/coupons`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Coupon créé');
      }

      fetchCoupons();
      setShowForm(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (couponId) => {
    if (!window.confirm('Supprimer ce coupon ?')) return;

    try {
      await axios.delete(`${API}/admin/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Coupon supprimé');
      fetchCoupons();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleActive = async (coupon) => {
    try {
      await axios.put(`${API}/admin/coupons/${coupon.id}`, 
        { active: !coupon.active },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchCoupons();
      toast.success(coupon.active ? 'Coupon désactivé' : 'Coupon activé');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Codes Promo / Coupons
            </span>
            <Button 
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-accent hover:bg-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un coupon
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Créez des codes promo pour offrir des réductions à vos clients. 
            Les clients peuvent entrer le code dans leur panier.
          </p>
        </CardContent>
      </Card>

      {/* Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {editingCoupon ? 'Modifier le coupon' : 'Nouveau coupon'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Code */}
                <div className="space-y-2">
                  <Label>Code *</Label>
                  <Input
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="PROMO20"
                    className="font-mono uppercase"
                  />
                  <p className="text-xs text-muted-foreground">Le code sera automatiquement en majuscules</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description (optionnel)</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Offre de bienvenue..."
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Type de réduction */}
                <div className="space-y-2">
                  <Label>Type de réduction</Label>
                  <Select 
                    value={formData.discount_type} 
                    onValueChange={(v) => setFormData({ ...formData, discount_type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Pourcentage (%)</SelectItem>
                      <SelectItem value="fixed">Montant fixe (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Valeur */}
                <div className="space-y-2">
                  <Label>Valeur de la réduction</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {formData.discount_type === 'percentage' ? '%' : '€'}
                    </span>
                  </div>
                </div>

                {/* Minimum d'achat */}
                <div className="space-y-2">
                  <Label>Minimum d&apos;achat</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.min_purchase}
                      onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                {/* Max discount (for percentage) */}
                {formData.discount_type === 'percentage' && (
                  <div className="space-y-2">
                    <Label>Réduction max (optionnel)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.max_discount || ''}
                        onChange={(e) => setFormData({ ...formData, max_discount: e.target.value ? parseFloat(e.target.value) : null })}
                        placeholder="Illimité"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    </div>
                  </div>
                )}

                {/* Usage limit */}
                <div className="space-y-2">
                  <Label>Limite d&apos;utilisation totale</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.usage_limit || ''}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="Illimité"
                  />
                </div>

                {/* Per user limit */}
                <div className="space-y-2">
                  <Label>Limite par utilisateur</Label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.per_user_limit}
                    onChange={(e) => setFormData({ ...formData, per_user_limit: parseInt(e.target.value) || 1 })}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Valid from */}
                <div className="space-y-2">
                  <Label>Valide à partir du (optionnel)</Label>
                  <Input
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                  />
                </div>

                {/* Valid until */}
                <div className="space-y-2">
                  <Label>Valide jusqu&apos;au (optionnel)</Label>
                  <Input
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                  />
                </div>
              </div>

              {/* Active switch */}
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                />
                <Label>Coupon actif</Label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  {editingCoupon ? 'Mettre à jour' : 'Créer le coupon'}
                </Button>
                <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Coupons List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Liste des coupons ({coupons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {coupons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Ticket className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun coupon créé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {coupons.map((coupon) => (
                <div 
                  key={coupon.id} 
                  className={`border rounded-lg p-4 ${!coupon.active ? 'opacity-60 bg-muted/30' : ''}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-lg font-bold bg-accent/10 text-accent px-3 py-1 rounded">
                          {coupon.code}
                        </span>
                        {!coupon.active && (
                          <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                            Désactivé
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Percent className="w-4 h-4" />
                          {coupon.discount_type === 'percentage' 
                            ? `-${coupon.discount_value}%` 
                            : `-${coupon.discount_value} €`}
                        </span>
                        {coupon.min_purchase > 0 && (
                          <span>Min: {coupon.min_purchase} €</span>
                        )}
                        {coupon.usage_limit && (
                          <span className="flex items-center gap-1">
                            <Hash className="w-4 h-4" />
                            {coupon.usage_count || 0}/{coupon.usage_limit} utilisations
                          </span>
                        )}
                        {coupon.valid_until && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            Expire: {new Date(coupon.valid_until).toLocaleDateString('fr-FR')}
                          </span>
                        )}
                      </div>
                      {coupon.description && (
                        <p className="text-sm text-muted-foreground mt-2">{coupon.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={coupon.active}
                        onCheckedChange={() => toggleActive(coupon)}
                      />
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(coupon)}>
                        <Settings className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDelete(coupon.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

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
  hero_cta1_size: "medium",
  hero_cta1_border_radius: "medium",
  
  // Bouton CTA 2
  hero_cta2_enabled: true,
  hero_cta2_text: "Enchères en direct",
  hero_cta2_link: "/encheres",
  hero_cta2_icon: "⚡",
  hero_cta2_bg_color: "transparent",
  hero_cta2_text_color: "#FFFFFF",
  hero_cta2_border_color: "rgba(255, 255, 255, 0.3)",
  hero_cta2_style: "outline",
  hero_cta2_size: "medium",
  hero_cta2_border_radius: "medium",
  
  // Options de disposition des boutons
  hero_buttons_layout: "horizontal",
  hero_buttons_gap: "4",
  hero_buttons_align: "left",
  
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
  category_engins_image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=400&fit=crop",
  category_accessoires_image: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&h=400&fit=crop",

  // Navbar Menu Colors
  promo_bg_color: "#1E3A5F",
  promo_text_color: "#FFFFFF",
  promo_accent_color: "#F97316",
  cart_bg_color: "#1E3A5F",
  cart_text_color: "#FFFFFF",
  
  // Promo Banner (Compte Premium)
  promo_banner_enabled: true,
  promo_banner_title: "Compte Premium",
  promo_banner_badge: "NOUVEAU",
  promo_banner_subtitle: "Économisez encore plus",
  promo_banner_highlight: "dès aujourd'hui avec WORLD AUTO PLUS",
  promo_banner_cta: "Essai gratuit 14 jours",
  promo_banner_link: "/tarifs",
  
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
  footer_text: "World Auto Pro Pro - La marketplace des pièces automobiles",
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
  footer_copyright_text: "© 2025 World Auto Pro Pro. Tous droits réservés.",
  footer_custom_links: [],
  
  // Navbar
  navbar_bg_color: "#FFFFFF",
  navbar_text_color: "#0F172A",
  navbar_logo_text: "World Auto Pro Pro",
  navbar_show_categories_dropdown: true,
  navbar_show_tarifs_link: true,
  navbar_show_dark_mode_toggle: true,
  navbar_show_notifications: true,
  navbar_sticky: true,
  navbar_custom_links: [],
  
  // SEO
  site_title: "World Auto Pro Pro",
  site_description: "Marketplace de pièces détachées automobiles - Achetez et vendez des pièces, voitures, motos et utilitaires",
  
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
  const [pendingVerifications, setPendingVerifications] = useState([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchPendingVerifications = useCallback(async () => {
    setLoadingVerifications(true);
    try {
      const response = await axios.get(`${API}/admin/identity/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingVerifications(response.data);
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoadingVerifications(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPendingVerifications();
  }, [fetchPendingVerifications]);

  const handleApproveIdentity = async (userId) => {
    try {
      await axios.post(`${API}/admin/identity/${userId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Identité vérifiée avec succès !');
      fetchPendingVerifications();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Erreur lors de l'approbation");
    }
  };

  const handleRejectIdentity = async (userId, reason = '') => {
    try {
      await axios.post(`${API}/admin/identity/${userId}/reject`, { reason }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Vérification refusée');
      fetchPendingVerifications();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du refus');
    }
  };

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
      
      const response = await axios.post(`${API}/upload/image`, formData, {
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
      console.error('Upload error:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'upload');
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
          <TabsList className="grid w-full grid-cols-8 mb-6">
            <TabsTrigger value="hero" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
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
            <TabsTrigger value="radio" className="flex items-center gap-2">
              <Radio className="w-4 h-4" />
              <span className="hidden sm:inline">Radio</span>
            </TabsTrigger>
            <TabsTrigger value="sections" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Sections
            </TabsTrigger>
            <TabsTrigger value="pages" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">Pages</span>
            </TabsTrigger>
            <TabsTrigger value="coupons" className="flex items-center gap-2">
              <Ticket className="w-4 h-4" />
              <span className="hidden sm:inline">Coupons</span>
            </TabsTrigger>
            <TabsTrigger value="subcatimages" className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Vignettes</span>
            </TabsTrigger>
            <TabsTrigger value="identity" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Vérifications</span>
            </TabsTrigger>
            <TabsTrigger value="cody" className="flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <span className="hidden sm:inline">Agent Cody</span>
            </TabsTrigger>
          </TabsList>

          {/* Hero Tab */}
          <TabsContent value="hero" className="space-y-6">
            {/* Éditeur de Positionnement Libre */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🎯 Éditeur de Position Libre
                  <span className="text-xs font-normal text-muted-foreground ml-2">Glissez les éléments où vous voulez</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <HeroFreePositionEditor 
                  settings={settings} 
                  onChange={setSettings}
                />
              </CardContent>
            </Card>

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
                        <EmojiPicker onSelect={(emoji) => setSettings({...settings, announcement_text: (settings.announcement_text || '') + emoji})} />
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
                  <ImageIcon className="w-5 h-5" />
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

            {/* Category Images */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Images des catégories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Personnalisez les vignettes des 6 catégories principales affichées sur la page d&apos;accueil.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                  {[
                    { key: 'category_pieces_image', label: 'Pièces', emoji: '🔧' },
                    { key: 'category_voitures_image', label: 'Voitures', emoji: '🚗' },
                    { key: 'category_motos_image', label: 'Motos', emoji: '🏍️' },
                    { key: 'category_utilitaires_image', label: 'Utilitaires', emoji: '🚚' },
                    { key: 'category_engins_image', label: 'Engins', emoji: '🚜' },
                    { key: 'category_accessoires_image', label: 'Accessoires', emoji: '⚙️' },
                  ].map((cat) => (
                    <div key={cat.key} className="space-y-2">
                      <Label className="text-sm">{cat.emoji} {cat.label}</Label>
                      <div 
                        className="relative aspect-video rounded-lg overflow-hidden border-2 border-dashed border-gray-300 hover:border-accent cursor-pointer group transition-colors"
                        onClick={() => triggerImageUpload(cat.key)}
                      >
                        {settings[cat.key] ? (
                          <>
                            <img 
                              src={settings[cat.key]} 
                              alt={cat.label}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Upload className="w-6 h-6 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
                            <Upload className="w-6 h-6 mb-1" />
                            <span className="text-xs">Cliquer</span>
                          </div>
                        )}
                        {uploadingImage && uploadTarget === cat.key && (
                          <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <Input
                        value={settings[cat.key] || ''}
                        onChange={(e) => setSettings({...settings, [cat.key]: e.target.value})}
                        placeholder="URL de l'image..."
                        className="text-xs h-8"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Preview with Mobile/Desktop toggle */}
            <Card className="border-2 border-amber-300 bg-amber-50/30 dark:bg-amber-950/10">
              <CardHeader className="flex flex-col gap-4">
                {/* Warning Banner */}
                <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-300 rounded-lg p-3 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Ceci est un aperçu de vos modifications en cours
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Ces changements ne sont <strong>PAS encore visibles</strong> sur votre site. 
                      Cliquez sur <strong>Sauvegarder</strong> en haut de page pour les appliquer.
                    </p>
                  </div>
                </div>

                <div className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Aperçu des modifications
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Visualisez vos changements avant de les publier
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Reload from server button */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={fetchSettings}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Recharger depuis le site
                    </Button>
                    
                    {/* Mobile/Desktop toggle */}
                    <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
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
                  </div>
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
                    
                    {/* CTA Buttons Preview */}
                    <div className={`flex flex-wrap gap-2 mt-3 ${settings.hero_text_align === 'center' ? 'justify-center' : ''}`}>
                      {settings.hero_cta1_enabled && settings.hero_cta1_text && (
                        <Button 
                          size="sm"
                          style={{ 
                            backgroundColor: settings.hero_cta1_style === 'filled' ? (settings.hero_cta1_bg_color || settings.color_accent) : 'transparent',
                            color: settings.hero_cta1_text_color || '#FFFFFF',
                            borderColor: settings.hero_cta1_border_color || 'transparent',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                          }}
                        >
                          {settings.hero_cta1_icon} {settings.hero_cta1_text}
                        </Button>
                      )}
                      {settings.hero_cta2_enabled && settings.hero_cta2_text && (
                        <Button 
                          size="sm"
                          variant="outline"
                          style={{ 
                            backgroundColor: settings.hero_cta2_style === 'filled' ? settings.hero_cta2_bg_color : 'transparent',
                            color: settings.hero_cta2_text_color || '#FFFFFF',
                            borderColor: settings.hero_cta2_border_color || 'rgba(255,255,255,0.3)'
                          }}
                        >
                          {settings.hero_cta2_icon} {settings.hero_cta2_text}
                        </Button>
                      )}
                      {settings.hero_cta3_enabled && settings.hero_cta3_text && (
                        <Button 
                          size="sm"
                          style={{ 
                            backgroundColor: settings.hero_cta3_style === 'filled' ? (settings.hero_cta3_bg_color || '#EAB308') : 'transparent',
                            color: settings.hero_cta3_text_color || '#FFFFFF',
                            borderColor: settings.hero_cta3_border_color || 'rgba(234, 179, 8, 0.5)',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                          }}
                        >
                          {settings.hero_cta3_icon} {settings.hero_cta3_text}
                        </Button>
                      )}
                      {settings.hero_cta4_enabled && settings.hero_cta4_text && (
                        <Button 
                          size="sm"
                          style={{ 
                            backgroundColor: settings.hero_cta4_style === 'filled' ? (settings.hero_cta4_bg_color || '#8B5CF6') : 'transparent',
                            color: settings.hero_cta4_text_color || '#FFFFFF',
                            borderColor: settings.hero_cta4_border_color || 'rgba(139, 92, 246, 0.5)',
                            borderWidth: '1px',
                            borderStyle: 'solid'
                          }}
                        >
                          {settings.hero_cta4_icon} {settings.hero_cta4_text}
                        </Button>
                      )}
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
                  <div className="mt-4 grid grid-cols-6 gap-2">
                    {[
                      { label: 'Pièces', img: settings.category_pieces_image },
                      { label: 'Voitures', img: settings.category_voitures_image },
                      { label: 'Motos', img: settings.category_motos_image },
                      { label: 'Utilitaires', img: settings.category_utilitaires_image },
                      { label: 'Engins', img: settings.category_engins_image },
                      { label: 'Accessoires', img: settings.category_accessoires_image },
                    ].map((cat, idx) => (
                      <div key={`${idx}-${cat.img}`} className="relative rounded-lg overflow-hidden aspect-video group">
                        <img 
                          src={cat.img || 'https://via.placeholder.com/150'} 
                          alt={cat.label} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/150?text=' + cat.label;
                          }}
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-xs font-semibold">{cat.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Preview Info */}
                <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900 rounded-full flex items-center justify-center flex-shrink-0">
                      <Eye className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
                        🔴 Aperçu en temps réel
                      </h4>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Cet aperçu reflète vos modifications actuelles. Cliquez sur <strong>Sauvegarder</strong> en haut de la page pour les appliquer au site.
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-muted-foreground">
                          {settings.preview_mode === 'mobile' ? '📱 Vue mobile (375px)' : '🖥️ Vue desktop'}
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <a 
                          href="/" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-medium"
                        >
                          Ouvrir le site réel →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
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
                        placeholder="World Auto Pro"
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

                {/* Couleurs Promo & Panier */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">👑 Bouton Compte Premium</h4>
                  
                  {/* Toggle activation */}
                  <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">Afficher le bouton Premium</p>
                      <p className="text-xs text-muted-foreground">Bouton &quot;Compte Premium&quot; dans la navbar</p>
                    </div>
                    <Switch
                      checked={settings.promo_banner_enabled !== false}
                      onCheckedChange={(checked) => setSettings({...settings, promo_banner_enabled: checked})}
                    />
                  </div>

                  {/* Textes du bouton Premium */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Titre du bouton</Label>
                      <Input
                        value={settings.promo_banner_title || 'Compte Premium'}
                        onChange={(e) => setSettings({...settings, promo_banner_title: e.target.value})}
                        placeholder="Compte Premium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Badge (ex: NOUVEAU)</Label>
                      <Input
                        value={settings.promo_banner_badge || 'NOUVEAU'}
                        onChange={(e) => setSettings({...settings, promo_banner_badge: e.target.value})}
                        placeholder="NOUVEAU"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Sous-titre</Label>
                      <Input
                        value={settings.promo_banner_subtitle || 'Économisez encore plus'}
                        onChange={(e) => setSettings({...settings, promo_banner_subtitle: e.target.value})}
                        placeholder="Économisez encore plus"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texte principal</Label>
                      <Input
                        value={settings.promo_banner_highlight || "dès aujourd'hui avec WORLD AUTO PLUS"}
                        onChange={(e) => setSettings({...settings, promo_banner_highlight: e.target.value})}
                        placeholder="dès aujourd'hui avec WORLD AUTO PLUS"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texte du bouton CTA</Label>
                      <Input
                        value={settings.promo_banner_cta || 'Essai gratuit 14 jours'}
                        onChange={(e) => setSettings({...settings, promo_banner_cta: e.target.value})}
                        placeholder="Essai gratuit 14 jours"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Lien du bouton CTA</Label>
                      <Input
                        value={settings.promo_banner_link || '/tarifs'}
                        onChange={(e) => setSettings({...settings, promo_banner_link: e.target.value})}
                        placeholder="/tarifs"
                      />
                    </div>
                  </div>

                  {/* 3 avantages Premium */}
                  <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
                    <Label className="text-sm font-semibold">✨ Les 3 avantages affichés</Label>
                    <p className="text-xs text-muted-foreground mb-2">Ces 3 lignes s'affichent dans le popup du bouton Premium</p>
                    <div className="space-y-2">
                      <Label>Avantage 1 (icône: percent)</Label>
                      <Input
                        value={settings.promo_benefit_1 || '10% de réduction sur tous les frais'}
                        onChange={(e) => setSettings({...settings, promo_benefit_1: e.target.value})}
                        placeholder="10% de réduction sur tous les frais"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Avantage 2 (icône: crown)</Label>
                      <Input
                        value={settings.promo_benefit_2 || 'Visibilité prioritaire'}
                        onChange={(e) => setSettings({...settings, promo_benefit_2: e.target.value})}
                        placeholder="Visibilité prioritaire"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Avantage 3 (icône: shield)</Label>
                      <Input
                        value={settings.promo_benefit_3 || "Jusqu'à 50 photos par annonce"}
                        onChange={(e) => setSettings({...settings, promo_benefit_3: e.target.value})}
                        placeholder="Jusqu'à 50 photos par annonce"
                      />
                    </div>
                  </div>

                  {/* Couleurs */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fond bouton Premium</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.promo_bg_color}
                          onChange={(e) => setSettings({...settings, promo_bg_color: e.target.value})}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.promo_bg_color}
                          onChange={(e) => setSettings({...settings, promo_bg_color: e.target.value})}
                          placeholder="#1E3A5F"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Texte bouton Premium</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.promo_text_color}
                          onChange={(e) => setSettings({...settings, promo_text_color: e.target.value})}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.promo_text_color}
                          onChange={(e) => setSettings({...settings, promo_text_color: e.target.value})}
                          placeholder="#FFFFFF"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur accent (badge, icônes)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.promo_accent_color || '#F97316'}
                          onChange={(e) => setSettings({...settings, promo_accent_color: e.target.value})}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.promo_accent_color || '#F97316'}
                          onChange={(e) => setSettings({...settings, promo_accent_color: e.target.value})}
                          placeholder="#F97316"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton Panier */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">🛒 Bouton Panier</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fond bouton Panier</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.cart_bg_color}
                          onChange={(e) => setSettings({...settings, cart_bg_color: e.target.value})}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.cart_bg_color}
                          onChange={(e) => setSettings({...settings, cart_bg_color: e.target.value})}
                          placeholder="#1E3A5F"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Texte bouton Panier</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={settings.cart_text_color}
                          onChange={(e) => setSettings({...settings, cart_text_color: e.target.value})}
                          className="w-12 h-10 p-1 cursor-pointer"
                        />
                        <Input
                          value={settings.cart_text_color}
                          onChange={(e) => setSettings({...settings, cart_text_color: e.target.value})}
                          placeholder="#FFFFFF"
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

                {/* Boutons icônes de la navbar */}
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">🔘 Boutons icônes</h4>
                  <p className="text-xs text-muted-foreground">Activez ou désactivez les boutons icônes de la navbar</p>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">💬 Messages</p>
                        <p className="text-xs text-muted-foreground">Messagerie interne</p>
                      </div>
                      <Switch
                        checked={settings.navbar_show_messages !== false}
                        onCheckedChange={(checked) => setSettings({...settings, navbar_show_messages: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">❤️ Favoris</p>
                        <p className="text-xs text-muted-foreground">Liste de favoris</p>
                      </div>
                      <Switch
                        checked={settings.navbar_show_favorites !== false}
                        onCheckedChange={(checked) => setSettings({...settings, navbar_show_favorites: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">🎁 Fidélité</p>
                        <p className="text-xs text-muted-foreground">Points de fidélité</p>
                      </div>
                      <Switch
                        checked={settings.navbar_show_loyalty !== false}
                        onCheckedChange={(checked) => setSettings({...settings, navbar_show_loyalty: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">🌐 Langue</p>
                        <p className="text-xs text-muted-foreground">Sélecteur de langue</p>
                      </div>
                      <Switch
                        checked={settings.navbar_show_language !== false}
                        onCheckedChange={(checked) => setSettings({...settings, navbar_show_language: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">🛒 Panier</p>
                        <p className="text-xs text-muted-foreground">Bouton panier</p>
                      </div>
                      <Switch
                        checked={settings.navbar_show_cart !== false}
                        onCheckedChange={(checked) => setSettings({...settings, navbar_show_cart: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                      <div>
                        <p className="font-medium text-sm">🔍 Recherche</p>
                        <p className="text-xs text-muted-foreground">Barre de recherche</p>
                      </div>
                      <Switch
                        checked={settings.navbar_show_search !== false}
                        onCheckedChange={(checked) => setSettings({...settings, navbar_show_search: checked})}
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
                        placeholder="World Auto Pro Pro - La marketplace..."
                        rows={2}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Texte copyright</Label>
                      <Input
                        value={settings.footer_copyright_text}
                        onChange={(e) => setSettings({...settings, footer_copyright_text: e.target.value})}
                        placeholder="© 2025 World Auto Pro Pro. Tous droits réservés."
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

          {/* Radio Tab */}
          <TabsContent value="radio" className="space-y-6">
            <RadioManager token={token} />
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
                      <h4 className="font-medium">Section &quot;Appel à l&apos;action&quot; (CTA final)</h4>
                      <p className="text-sm text-muted-foreground">Bannière &quot;Prêt à vendre votre véhicule ?&quot;</p>
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
                      placeholder="World Auto Pro Pro"
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
                    placeholder="World Auto Pro Pro - ..."
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

          {/* Coupons Tab */}
          <TabsContent value="coupons" className="space-y-6">
            <CouponsManager token={token} />
          </TabsContent>

          {/* Pages Editor Tab */}
          <TabsContent value="pages" className="space-y-6">
            <PagesEditor 
              settings={settings} 
              updateSetting={(key, value) => setSettings({...settings, [key]: value})}
            />
            {/* Home Page Editor - affiché quand la page Accueil est sélectionnée */}
            <HomePageEditor 
              settings={settings} 
              updateSetting={(key, value) => setSettings({...settings, [key]: value})}
              onImageUpload={handleImageUpload}
              uploadingImage={uploadingImage}
            />
          </TabsContent>

          {/* Subcategory Images Tab */}
          <TabsContent value="subcatimages" className="space-y-6">
            <SubcategoryImagesManager token={token} />
          </TabsContent>

          {/* Identity Verification Tab */}
          <TabsContent value="identity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Vérifications d&apos;identité en attente
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingVerifications ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : pendingVerifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ShieldCheck className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Aucune vérification en attente</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pendingVerifications.map((verification) => (
                      <div 
                        key={verification.user_id} 
                        className="border rounded-lg p-4 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                              <User className="w-6 h-6" />
                            </div>
                            <div>
                              <h4 className="font-semibold">{verification.user_name}</h4>
                              <p className="text-sm text-muted-foreground">{verification.user_email}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {new Date(verification.submitted_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              Pièce d&apos;identité (recto)
                            </Label>
                            <a 
                              href={verification.id_front_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img 
                                src={verification.id_front_url} 
                                alt="ID Front" 
                                className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
                              />
                            </a>
                          </div>
                          {verification.id_back_url && (
                            <div className="space-y-2">
                              <Label className="text-sm flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                Pièce d&apos;identité (verso)
                              </Label>
                              <a 
                                href={verification.id_back_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <img 
                                  src={verification.id_back_url} 
                                  alt="ID Back" 
                                  className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
                                />
                              </a>
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label className="text-sm flex items-center gap-1">
                              <User className="w-4 h-4" />
                              Selfie avec pièce
                            </Label>
                            <a 
                              href={verification.selfie_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block"
                            >
                              <img 
                                src={verification.selfie_url} 
                                alt="Selfie" 
                                className="w-full h-32 object-cover rounded-lg border hover:opacity-80 transition-opacity cursor-pointer"
                              />
                            </a>
                          </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t">
                          <Button 
                            onClick={() => handleApproveIdentity(verification.user_id)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <ShieldCheck className="w-4 h-4 mr-2" />
                            Approuver
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => handleRejectIdentity(verification.user_id, 'Documents non conformes')}
                            className="flex-1"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Refuser
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Agent Cody Tab */}
          <TabsContent value="cody" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🤖 Configuration de l&apos;Agent Cody
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Personnalisez l&apos;apparence de votre agent de développement local
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Agent Name */}
                <div className="space-y-2">
                  <Label>Nom de l&apos;agent</Label>
                  <Input
                    value={settings.cody_agent_name || 'Cody'}
                    onChange={(e) => setSettings({...settings, cody_agent_name: e.target.value})}
                    placeholder="Cody"
                  />
                </div>

                {/* Theme Mode */}
                <div className="space-y-2">
                  <Label>Mode de thème</Label>
                  <Select 
                    value={settings.cody_theme_mode || 'light'} 
                    onValueChange={(v) => setSettings({...settings, cody_theme_mode: v})}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">☀️ Clair</SelectItem>
                      <SelectItem value="dark">🌙 Sombre</SelectItem>
                      <SelectItem value="system">💻 Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Colors Section */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Couleurs (Mode Clair)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Couleur d&apos;accentuation</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_accent_color || '#f97316'}
                          onChange={(e) => setSettings({...settings, cody_accent_color: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_accent_color || '#f97316'}
                          onChange={(e) => setSettings({...settings, cody_accent_color: e.target.value})}
                          placeholder="#f97316"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur d&apos;accentuation (hover)</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_accent_hover || '#ea580c'}
                          onChange={(e) => setSettings({...settings, cody_accent_hover: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_accent_hover || '#ea580c'}
                          onChange={(e) => setSettings({...settings, cody_accent_hover: e.target.value})}
                          placeholder="#ea580c"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Fond principal</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_bg_main || '#ffffff'}
                          onChange={(e) => setSettings({...settings, cody_bg_main: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_bg_main || '#ffffff'}
                          onChange={(e) => setSettings({...settings, cody_bg_main: e.target.value})}
                          placeholder="#ffffff"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Fond sidebar/secondaire</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_bg_sidebar || '#f9fafb'}
                          onChange={(e) => setSettings({...settings, cody_bg_sidebar: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_bg_sidebar || '#f9fafb'}
                          onChange={(e) => setSettings({...settings, cody_bg_sidebar: e.target.value})}
                          placeholder="#f9fafb"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Texte principal</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_text_primary || '#1f2937'}
                          onChange={(e) => setSettings({...settings, cody_text_primary: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_text_primary || '#1f2937'}
                          onChange={(e) => setSettings({...settings, cody_text_primary: e.target.value})}
                          placeholder="#1f2937"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Texte secondaire</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_text_secondary || '#6b7280'}
                          onChange={(e) => setSettings({...settings, cody_text_secondary: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_text_secondary || '#6b7280'}
                          onChange={(e) => setSettings({...settings, cody_text_secondary: e.target.value})}
                          placeholder="#6b7280"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Bordures</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_border_color || '#e5e7eb'}
                          onChange={(e) => setSettings({...settings, cody_border_color: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_border_color || '#e5e7eb'}
                          onChange={(e) => setSettings({...settings, cody_border_color: e.target.value})}
                          placeholder="#e5e7eb"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Couleur succès</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_success_color || '#22c55e'}
                          onChange={(e) => setSettings({...settings, cody_success_color: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_success_color || '#22c55e'}
                          onChange={(e) => setSettings({...settings, cody_success_color: e.target.value})}
                          placeholder="#22c55e"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dark Mode Colors */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    🌙 Couleurs (Mode Sombre)
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fond principal (dark)</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_dark_bg_main || '#0f0f0f'}
                          onChange={(e) => setSettings({...settings, cody_dark_bg_main: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_dark_bg_main || '#0f0f0f'}
                          onChange={(e) => setSettings({...settings, cody_dark_bg_main: e.target.value})}
                          placeholder="#0f0f0f"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Fond sidebar (dark)</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_dark_bg_sidebar || '#1a1a1a'}
                          onChange={(e) => setSettings({...settings, cody_dark_bg_sidebar: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_dark_bg_sidebar || '#1a1a1a'}
                          onChange={(e) => setSettings({...settings, cody_dark_bg_sidebar: e.target.value})}
                          placeholder="#1a1a1a"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Texte principal (dark)</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_dark_text_primary || '#f3f4f6'}
                          onChange={(e) => setSettings({...settings, cody_dark_text_primary: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_dark_text_primary || '#f3f4f6'}
                          onChange={(e) => setSettings({...settings, cody_dark_text_primary: e.target.value})}
                          placeholder="#f3f4f6"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Texte secondaire (dark)</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_dark_text_secondary || '#9ca3af'}
                          onChange={(e) => setSettings({...settings, cody_dark_text_secondary: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_dark_text_secondary || '#9ca3af'}
                          onChange={(e) => setSettings({...settings, cody_dark_text_secondary: e.target.value})}
                          placeholder="#9ca3af"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Bordures (dark)</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={settings.cody_dark_border || '#2d2d2d'}
                          onChange={(e) => setSettings({...settings, cody_dark_border: e.target.value})}
                          className="w-10 h-10 rounded cursor-pointer border-2 border-border"
                        />
                        <Input
                          value={settings.cody_dark_border || '#2d2d2d'}
                          onChange={(e) => setSettings({...settings, cody_dark_border: e.target.value})}
                          placeholder="#2d2d2d"
                          className="flex-1 font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Presets rapides */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Thèmes prédéfinis
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { name: 'Orange (défaut)', accent: '#f97316', hover: '#ea580c' },
                      { name: 'Bleu Ocean', accent: '#3b82f6', hover: '#2563eb' },
                      { name: 'Vert Nature', accent: '#22c55e', hover: '#16a34a' },
                      { name: 'Violet Luxe', accent: '#8b5cf6', hover: '#7c3aed' },
                      { name: 'Rose Moderne', accent: '#ec4899', hover: '#db2777' },
                      { name: 'Cyan Tech', accent: '#06b6d4', hover: '#0891b2' },
                      { name: 'Rouge Sport', accent: '#ef4444', hover: '#dc2626' },
                      { name: 'Ambre Chaud', accent: '#f59e0b', hover: '#d97706' },
                    ].map((preset) => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        onClick={() => setSettings({
                          ...settings, 
                          cody_accent_color: preset.accent,
                          cody_accent_hover: preset.hover
                        })}
                        className="justify-start gap-2"
                      >
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: preset.accent }}
                        />
                        <span className="text-xs">{preset.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Font Settings */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Typographie
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Police principale</Label>
                      <Select 
                        value={settings.cody_font_family || 'inter'} 
                        onValueChange={(v) => setSettings({...settings, cody_font_family: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="inter">Inter (défaut)</SelectItem>
                          <SelectItem value="roboto">Roboto</SelectItem>
                          <SelectItem value="poppins">Poppins</SelectItem>
                          <SelectItem value="nunito">Nunito</SelectItem>
                          <SelectItem value="jetbrains">JetBrains Mono</SelectItem>
                          <SelectItem value="fira">Fira Code</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Taille du texte</Label>
                      <Select 
                        value={settings.cody_font_size || 'normal'} 
                        onValueChange={(v) => setSettings({...settings, cody_font_size: v})}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Petit</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="large">Grand</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Other Settings */}
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Autres options
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Sons de notification</Label>
                        <p className="text-sm text-muted-foreground">Jouer un son lors des réponses</p>
                      </div>
                      <Switch
                        checked={settings.cody_sound_enabled !== false}
                        onCheckedChange={(checked) => setSettings({...settings, cody_sound_enabled: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Emojis dans les réponses</Label>
                        <p className="text-sm text-muted-foreground">L&apos;agent utilise des emojis</p>
                      </div>
                      <Switch
                        checked={settings.cody_emoji_enabled !== false}
                        onCheckedChange={(checked) => setSettings({...settings, cody_emoji_enabled: checked})}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Animations</Label>
                        <p className="text-sm text-muted-foreground">Animations de frappe et transitions</p>
                      </div>
                      <Switch
                        checked={settings.cody_animations_enabled !== false}
                        onCheckedChange={(checked) => setSettings({...settings, cody_animations_enabled: checked})}
                      />
                    </div>
                  </div>
                </div>

                {/* Export Config Button */}
                <div className="border-t pt-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        const codyConfig = {
                          agent_name: settings.cody_agent_name || 'Cody',
                          theme_mode: settings.cody_theme_mode || 'light',
                          colors: {
                            accent: settings.cody_accent_color || '#f97316',
                            accent_hover: settings.cody_accent_hover || '#ea580c',
                            bg_main: settings.cody_bg_main || '#ffffff',
                            bg_sidebar: settings.cody_bg_sidebar || '#f9fafb',
                            text_primary: settings.cody_text_primary || '#1f2937',
                            text_secondary: settings.cody_text_secondary || '#6b7280',
                            border: settings.cody_border_color || '#e5e7eb',
                            success: settings.cody_success_color || '#22c55e'
                          },
                          dark_colors: {
                            bg_main: settings.cody_dark_bg_main || '#0f0f0f',
                            bg_sidebar: settings.cody_dark_bg_sidebar || '#1a1a1a',
                            text_primary: settings.cody_dark_text_primary || '#f3f4f6',
                            text_secondary: settings.cody_dark_text_secondary || '#9ca3af',
                            border: settings.cody_dark_border || '#2d2d2d'
                          },
                          font: {
                            family: settings.cody_font_family || 'inter',
                            size: settings.cody_font_size || 'normal'
                          },
                          options: {
                            sound_enabled: settings.cody_sound_enabled !== false,
                            emoji_enabled: settings.cody_emoji_enabled !== false,
                            animations_enabled: settings.cody_animations_enabled !== false
                          }
                        };
                        const blob = new Blob([JSON.stringify(codyConfig, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'cody_config.json';
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success('Configuration Cody exportée !');
                      }}
                      className="flex-1"
                    >
                      📥 Exporter la configuration
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Téléchargez le fichier <code className="bg-muted px-1 rounded">cody_config.json</code> et placez-le dans le dossier de Cody pour appliquer vos personnalisations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Aperçu du thème
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="rounded-lg overflow-hidden border"
                  style={{
                    backgroundColor: settings.cody_bg_main || '#ffffff',
                    borderColor: settings.cody_border_color || '#e5e7eb'
                  }}
                >
                  {/* Header Preview */}
                  <div 
                    className="p-4 border-b flex items-center gap-3"
                    style={{ 
                      backgroundColor: settings.cody_bg_main || '#ffffff',
                      borderColor: settings.cody_border_color || '#e5e7eb'
                    }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
                      style={{ 
                        background: `linear-gradient(135deg, ${settings.cody_accent_color || '#f97316'}, #fb923c)` 
                      }}
                    >
                      C
                    </div>
                    <span 
                      className="font-semibold"
                      style={{ color: settings.cody_text_primary || '#1f2937' }}
                    >
                      {settings.cody_agent_name || 'Cody'}
                    </span>
                    <span 
                      className="text-sm ml-auto"
                      style={{ color: settings.cody_text_secondary || '#6b7280' }}
                    >
                      Agent de développement
                    </span>
                  </div>
                  
                  {/* Message Preview */}
                  <div className="p-4 space-y-4">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div 
                        className="max-w-[80%] p-3 rounded-2xl rounded-tr-md"
                        style={{ 
                          backgroundColor: settings.cody_accent_color || '#f97316',
                          color: '#ffffff'
                        }}
                      >
                        Salut Cody ! Peux-tu m&apos;aider ?
                      </div>
                    </div>
                    
                    {/* Agent message */}
                    <div className="flex gap-3">
                      <div 
                        className="w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                        style={{ 
                          background: `linear-gradient(135deg, ${settings.cody_accent_color || '#f97316'}, #fb923c)` 
                        }}
                      >
                        C
                      </div>
                      <div 
                        className="max-w-[80%] p-3 rounded-2xl rounded-tl-md"
                        style={{ 
                          backgroundColor: settings.cody_bg_sidebar || '#f9fafb',
                          color: settings.cody_text_primary || '#1f2937'
                        }}
                      >
                        Bien sûr ! Je suis là pour t&apos;aider avec ton code. Que veux-tu faire ? 🚀
                      </div>
                    </div>
                  </div>
                  
                  {/* Input Preview */}
                  <div 
                    className="p-4 border-t"
                    style={{ borderColor: settings.cody_border_color || '#e5e7eb' }}
                  >
                    <div 
                      className="flex items-center gap-2 p-3 rounded-xl border"
                      style={{ 
                        backgroundColor: settings.cody_bg_main || '#ffffff',
                        borderColor: settings.cody_border_color || '#e5e7eb'
                      }}
                    >
                      <span 
                        className="flex-1"
                        style={{ color: settings.cody_text_secondary || '#6b7280' }}
                      >
                        Écris ton message...
                      </span>
                      <div 
                        className="px-4 py-2 rounded-lg text-white text-sm"
                        style={{ backgroundColor: settings.cody_accent_color || '#f97316' }}
                      >
                        Envoyer
                      </div>
                    </div>
                  </div>
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
