import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Save, Eye, Image, Type, RefreshCw } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const DEFAULT_SETTINGS = {
  hero_title_line1: "La marketplace auto",
  hero_title_line2: "pour tous",
  hero_description: "Achetez et vendez des pièces détachées, voitures, motos et utilitaires. Pour particuliers et professionnels.",
  hero_image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2832&auto=format&fit=crop",
  hero_cta_text: "Déposer une annonce",
  hero_cta_link: "/deposer"
};

export default function AdminSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      await axios.post(`${API}/settings/hero`, settings);
      toast.success('Paramètres sauvegardés !');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    toast.info('Paramètres réinitialisés (non sauvegardés)');
  };

  // Check if user is admin (you can customize this check)
  const isAdmin = user?.email === 'admin@worldautofrance.com' || user?.is_professional;

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
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
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl font-bold">Personnalisation</h1>
            <p className="text-muted-foreground">Modifiez l'apparence de la page d'accueil</p>
          </div>
          <div className="flex gap-2">
            <Link to="/">
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Voir le site
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Hero Section Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Section Hero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hero_title_line1">Titre ligne 1</Label>
                  <Input
                    id="hero_title_line1"
                    value={settings.hero_title_line1}
                    onChange={(e) => setSettings({...settings, hero_title_line1: e.target.value})}
                    placeholder="La marketplace auto"
                  />
                </div>
                <div>
                  <Label htmlFor="hero_title_line2">Titre ligne 2 (en couleur)</Label>
                  <Input
                    id="hero_title_line2"
                    value={settings.hero_title_line2}
                    onChange={(e) => setSettings({...settings, hero_title_line2: e.target.value})}
                    placeholder="pour tous"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="hero_description">Description</Label>
                <Textarea
                  id="hero_description"
                  value={settings.hero_description}
                  onChange={(e) => setSettings({...settings, hero_description: e.target.value})}
                  placeholder="Description de votre marketplace..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="hero_image">URL de l'image de fond</Label>
                <Input
                  id="hero_image"
                  value={settings.hero_image}
                  onChange={(e) => setSettings({...settings, hero_image: e.target.value})}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Utilisez une image Unsplash ou uploadez sur Cloudinary
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hero_cta_text">Texte du bouton</Label>
                  <Input
                    id="hero_cta_text"
                    value={settings.hero_cta_text}
                    onChange={(e) => setSettings({...settings, hero_cta_text: e.target.value})}
                    placeholder="Déposer une annonce"
                  />
                </div>
                <div>
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
              <div className="relative bg-primary rounded-lg overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                  <div 
                    className="absolute inset-0 bg-cover bg-center" 
                    style={{ backgroundImage: `url('${settings.hero_image}')` }}
                  />
                </div>
                <div className="relative p-8">
                  <h1 className="font-heading text-2xl md:text-3xl font-black text-primary-foreground leading-tight mb-3">
                    {settings.hero_title_line1}<br />
                    <span className="text-accent">{settings.hero_title_line2}</span>
                  </h1>
                  <p className="text-primary-foreground/80 mb-4 text-sm max-w-md">
                    {settings.hero_description}
                  </p>
                  <Button className="bg-accent hover:bg-accent/90 text-sm">
                    {settings.hero_cta_text}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleReset}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Réinitialiser
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={saving}
              className="bg-accent hover:bg-accent/90"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
