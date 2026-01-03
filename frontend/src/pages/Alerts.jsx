import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Bell, BellOff, Plus, Trash2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Alerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    model: '',
    keywords: '',
    min_price: '',
    max_price: ''
  });

  useEffect(() => {
    if (user) {
      fetchAlerts();
    } else {
      setLoading(false);
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
      await axios.post(`${API}/alerts`, {
        name: formData.name,
        brand: formData.brand || null,
        model: formData.model || null,
        keywords: formData.keywords || null,
        min_price: formData.min_price ? parseFloat(formData.min_price) : null,
        max_price: formData.max_price ? parseFloat(formData.max_price) : null
      });
      toast.success('Alerte créée !');
      setShowForm(false);
      setFormData({ name: '', brand: '', model: '', keywords: '', min_price: '', max_price: '' });
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
          <Button 
            onClick={() => setShowForm(!showForm)} 
            className="bg-accent hover:bg-accent/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle alerte
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <Link to="/favoris">
            <Button variant="outline">Voir mes favoris</Button>
          </Link>
        </div>

        {showForm && (
          <Card className="mb-6 p-6">
            <h3 className="font-bold mb-4">Créer une alerte</h3>
            <form onSubmit={createAlert} className="space-y-4">
              <div>
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
                <div>
                  <Label htmlFor="brand">Marque</Label>
                  <Input
                    id="brand"
                    placeholder="Ex: BMW"
                    value={formData.brand}
                    onChange={(e) => setFormData({...formData, brand: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="model">Modèle</Label>
                  <Input
                    id="model"
                    placeholder="Ex: Serie 3"
                    value={formData.model}
                    onChange={(e) => setFormData({...formData, model: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="keywords">Mots-clés</Label>
                <Input
                  id="keywords"
                  placeholder="Ex: turbo, N47, injecteur..."
                  value={formData.keywords}
                  onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="min_price">Prix min (€)</Label>
                  <Input
                    id="min_price"
                    type="number"
                    placeholder="0"
                    value={formData.min_price}
                    onChange={(e) => setFormData({...formData, min_price: e.target.value})}
                  />
                </div>
                <div>
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

              <div className="flex gap-2">
                <Button type="submit" className="bg-accent hover:bg-accent/90">
                  Créer l'alerte
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          </Card>
        )}

        {alerts.length === 0 ? (
          <Card className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Aucune alerte</h2>
            <p className="text-muted-foreground mb-4">
              Créez une alerte pour être notifié quand une pièce correspondant à vos critères est publiée.
            </p>
            <Button onClick={() => setShowForm(true)} className="bg-accent hover:bg-accent/90">
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
                        {alert.brand && <Badge variant="outline">{alert.brand}</Badge>}
                        {alert.model && <Badge variant="outline">{alert.model}</Badge>}
                        {alert.keywords && <Badge variant="outline">"{alert.keywords}"</Badge>}
                        {(alert.min_price || alert.max_price) && (
                          <Badge variant="outline">
                            {alert.min_price || 0}€ - {alert.max_price || '∞'}€
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant={alert.active ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleAlert(alert.id)}
                        className={alert.active ? 'bg-accent hover:bg-accent/90' : ''}
                      >
                        {alert.active ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                      </Button>
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
          </ul>
        </Card>
      </div>
    </div>
  );
}
