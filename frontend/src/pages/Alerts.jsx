import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { Bell, BellOff, Plus, Trash2, X, Power } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '../components/ui/dialog';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const CATEGORIES = [
  { value: 'pieces-moteur', label: 'Pièces Moteur' },
  { value: 'carrosserie', label: 'Carrosserie' },
  { value: 'freinage', label: 'Freinage' },
  { value: 'suspension', label: 'Suspension' },
  { value: 'transmission', label: 'Transmission' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'interieur', label: 'Intérieur' },
  { value: 'echappement', label: 'Échappement' },
  { value: 'vehicules', label: 'Véhicules complets' },
  { value: 'autres', label: 'Autres' },
];

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    brand: '',
    model: '',
    min_price: '',
    max_price: '',
    min_year: '',
    max_year: '',
    postal_code: '',
    keywords: ''
  });

  useEffect(() => {
    if (user) {
      fetchAlerts();
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      const response = await axios.get(`${API}/alerts`);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Donnez un nom à votre alerte');
      return;
    }

    try {
      const alertData = {
        name: formData.name,
        category: formData.category || null,
        brand: formData.brand || null,
        model: formData.model || null,
        min_price: formData.min_price ? parseFloat(formData.min_price) : null,
        max_price: formData.max_price ? parseFloat(formData.max_price) : null,
        min_year: formData.min_year ? parseInt(formData.min_year) : null,
        max_year: formData.max_year ? parseInt(formData.max_year) : null,
        postal_code: formData.postal_code || null,
        keywords: formData.keywords || null
      };

      await axios.post(`${API}/alerts`, alertData);
      toast.success('Alerte créée !');
      setShowDialog(false);
      setFormData({
        name: '', category: '', brand: '', model: '',
        min_price: '', max_price: '', min_year: '', max_year: '',
        postal_code: '', keywords: ''
      });
      fetchAlerts();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création');
    }
  };

  const deleteAlert = async (alertId) => {
    try {
      await axios.delete(`${API}/alerts/${alertId}`);
      setAlerts(alerts.filter(a => a.id !== alertId));
      toast.success('Alerte supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleAlert = async (alertId) => {
    try {
      const response = await axios.put(`${API}/alerts/${alertId}/toggle`);
      setAlerts(alerts.map(a => 
        a.id === alertId ? { ...a, active: response.data.active } : a
      ));
      toast.success(response.data.active ? 'Alerte activée' : 'Alerte désactivée');
    } catch (error) {
      toast.error('Erreur');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Connectez-vous</h2>
          <p className="text-muted-foreground mb-4">Pour gérer vos alertes, vous devez être connecté.</p>
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
            <h1 className="font-heading text-3xl font-bold">Mes alertes</h1>
            <p className="text-muted-foreground">Recevez un email quand une annonce correspond à vos critères</p>
          </div>
          <Dialog open={showDialog} onOpenChange={setShowDialog}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle alerte
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Créer une alerte</DialogTitle>
                <DialogDescription>
                  Définissez vos critères de recherche pour recevoir des notifications.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={createAlert} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom de l'alerte *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Moteur BMW E46"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Toutes</SelectItem>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="keywords">Mots-clés</Label>
                    <Input
                      id="keywords"
                      placeholder="Ex: turbo, N47..."
                      value={formData.keywords}
                      onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marque</Label>
                    <Input
                      id="brand"
                      placeholder="Ex: BMW"
                      value={formData.brand}
                      onChange={(e) => setFormData({...formData, brand: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modèle</Label>
                    <Input
                      id="model"
                      placeholder="Ex: Serie 3"
                      value={formData.model}
                      onChange={(e) => setFormData({...formData, model: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_price">Prix min (€)</Label>
                    <Input
                      id="min_price"
                      type="number"
                      placeholder="0"
                      value={formData.min_price}
                      onChange={(e) => setFormData({...formData, min_price: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_price">Prix max (€)</Label>
                    <Input
                      id="max_price"
                      type="number"
                      placeholder="10000"
                      value={formData.max_price}
                      onChange={(e) => setFormData({...formData, max_price: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="min_year">Année min</Label>
                    <Input
                      id="min_year"
                      type="number"
                      placeholder="2000"
                      value={formData.min_year}
                      onChange={(e) => setFormData({...formData, min_year: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="max_year">Année max</Label>
                    <Input
                      id="max_year"
                      type="number"
                      placeholder="2024"
                      value={formData.max_year}
                      onChange={(e) => setFormData({...formData, max_year: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal (2 premiers chiffres)</Label>
                  <Input
                    id="postal_code"
                    placeholder="Ex: 75 pour Paris"
                    maxLength={2}
                    value={formData.postal_code}
                    onChange={(e) => setFormData({...formData, postal_code: e.target.value})}
                  />
                </div>

                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">Annuler</Button>
                  </DialogClose>
                  <Button type="submit" className="bg-accent hover:bg-accent/90">
                    Créer l'alerte
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 mb-6">
          <Link to="/favoris">
            <Button variant="outline">Voir mes favoris</Button>
          </Link>
        </div>

        {alerts.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Aucune alerte</h2>
            <p className="text-muted-foreground mb-4">
              Créez une alerte pour être notifié quand une pièce correspondant à vos critères est publiée.
            </p>
            <Button onClick={() => setShowDialog(true)} className="bg-accent hover:bg-accent/90">
              <Plus className="w-4 h-4 mr-2" />
              Créer ma première alerte
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <Card key={alert.id} className={`transition-opacity ${!alert.active ? 'opacity-60' : ''}`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-heading font-bold text-lg">{alert.name}</h3>
                        <Badge variant={alert.active ? 'default' : 'secondary'}>
                          {alert.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm">
                        {alert.category && (
                          <Badge variant="outline">{CATEGORIES.find(c => c.value === alert.category)?.label || alert.category}</Badge>
                        )}
                        {alert.brand && <Badge variant="outline">{alert.brand}</Badge>}
                        {alert.model && <Badge variant="outline">{alert.model}</Badge>}
                        {alert.keywords && <Badge variant="outline">"{alert.keywords}"</Badge>}
                        {(alert.min_price || alert.max_price) && (
                          <Badge variant="outline">
                            {alert.min_price || 0}€ - {alert.max_price || '∞'}€
                          </Badge>
                        )}
                        {(alert.min_year || alert.max_year) && (
                          <Badge variant="outline">
                            {alert.min_year || '...'} - {alert.max_year || '...'}
                          </Badge>
                        )}
                        {alert.postal_code && <Badge variant="outline">📍 {alert.postal_code}...</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={alert.active}
                          onCheckedChange={() => toggleAlert(alert.id)}
                        />
                        {alert.active ? (
                          <Bell className="w-4 h-4 text-accent" />
                        ) : (
                          <BellOff className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteAlert(alert.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-8 p-6 bg-accent/5 border-accent/20">
          <h3 className="font-heading font-bold mb-2">💡 Comment ça marche ?</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Créez une alerte avec vos critères de recherche</li>
            <li>• Dès qu'une nouvelle annonce correspond, vous recevez un email</li>
            <li>• Vous pouvez créer jusqu'à 10 alertes</li>
            <li>• Désactivez temporairement une alerte sans la supprimer</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
