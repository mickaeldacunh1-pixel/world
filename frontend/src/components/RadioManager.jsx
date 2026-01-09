import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { 
  Radio, Plus, Trash2, Save, Loader2, GripVertical, 
  Music, Volume2, RefreshCw, Play, Settings
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RadioManager({ token }) {
  const [stations, setStations] = useState([]);
  const [settings, setSettings] = useState({
    enabled: true,
    position: 'bottom-left',
    auto_play: false,
    default_volume: 70
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    genre: '',
    logo: '📻',
    stream_url: '',
    color: '#1E3A5F',
    enabled: true
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stationsRes, settingsRes] = await Promise.all([
        axios.get(`${API}/radio/stations/all`),
        axios.get(`${API}/radio/settings`)
      ]);
      setStations(stationsRes.data || []);
      setSettings(settingsRes.data || settings);
    } catch (error) {
      console.error('Error fetching radio data:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      genre: '',
      logo: '📻',
      stream_url: '',
      color: '#1E3A5F',
      enabled: true
    });
    setEditingStation(null);
  };

  const handleEdit = (station) => {
    setFormData({
      name: station.name,
      genre: station.genre,
      logo: station.logo,
      stream_url: station.stream_url,
      color: station.color,
      enabled: station.enabled
    });
    setEditingStation(station);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.stream_url) {
      toast.error('Nom et URL du flux sont obligatoires');
      return;
    }

    setSaving(true);
    try {
      if (editingStation) {
        await axios.put(`${API}/radio/stations/${editingStation.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Station mise à jour');
      } else {
        await axios.post(`${API}/radio/stations`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Station ajoutée');
      }

      fetchData();
      setShowForm(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (stationId) => {
    if (!window.confirm('Supprimer cette station ?')) return;

    try {
      await axios.delete(`${API}/radio/stations/${stationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Station supprimée');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const toggleStation = async (station) => {
    try {
      await axios.put(`${API}/radio/stations/${station.id}`, 
        { enabled: !station.enabled },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchData();
    } catch (error) {
      toast.error('Erreur');
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      await axios.post(`${API}/radio/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Paramètres radio sauvegardés');
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const resetStations = async () => {
    if (!window.confirm('Réinitialiser toutes les stations aux valeurs par défaut ?')) return;

    try {
      await axios.post(`${API}/radio/stations/reset`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Stations réinitialisées');
      fetchData();
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
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Paramètres du lecteur radio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
            <div>
              <h4 className="font-medium">Activer le lecteur radio</h4>
              <p className="text-sm text-muted-foreground">Affiche le bouton radio flottant sur le site</p>
            </div>
            <Switch
              checked={settings.enabled}
              onCheckedChange={(checked) => setSettings({...settings, enabled: checked})}
            />
          </div>

          {settings.enabled && (
            <>
              {/* Position */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Position du lecteur</Label>
                  <Select 
                    value={settings.position} 
                    onValueChange={(v) => setSettings({...settings, position: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-left">En bas à gauche</SelectItem>
                      <SelectItem value="bottom-right">En bas à droite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Volume par défaut: {settings.default_volume}%</Label>
                  <Slider
                    value={[settings.default_volume]}
                    max={100}
                    min={0}
                    step={5}
                    onValueChange={([v]) => setSettings({...settings, default_volume: v})}
                  />
                </div>
              </div>

              {/* Auto play */}
              <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
                <div>
                  <h4 className="font-medium">Lecture automatique</h4>
                  <p className="text-sm text-muted-foreground">Lancer la radio automatiquement (peut être bloqué par le navigateur)</p>
                </div>
                <Switch
                  checked={settings.auto_play}
                  onCheckedChange={(checked) => setSettings({...settings, auto_play: checked})}
                />
              </div>
            </>
          )}

          <Button onClick={saveSettings} disabled={saving} className="bg-accent hover:bg-accent/90">
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Sauvegarder les paramètres
          </Button>
        </CardContent>
      </Card>

      {/* Stations Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Stations de radio ({stations.length})
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetStations}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Réinitialiser
              </Button>
              <Button 
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-accent hover:bg-accent/90"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm mb-4">
            Gérez les stations disponibles dans le lecteur radio. Les utilisateurs pourront choisir parmi ces stations.
          </p>

          {/* Form */}
          {showForm && (
            <div className="border rounded-lg p-4 mb-4 bg-secondary/30">
              <h4 className="font-medium mb-4">{editingStation ? 'Modifier la station' : 'Nouvelle station'}</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nom *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="France Inter"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Genre</Label>
                    <Input
                      value={formData.genre}
                      onChange={(e) => setFormData({...formData, genre: e.target.value})}
                      placeholder="Généraliste"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>URL du flux streaming *</Label>
                  <Input
                    value={formData.stream_url}
                    onChange={(e) => setFormData({...formData, stream_url: e.target.value})}
                    placeholder="https://icecast.radiofrance.fr/franceinter-midfi.mp3"
                  />
                  <p className="text-xs text-muted-foreground">Format: URL directe du flux audio (MP3, AAC...)</p>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Emoji / Logo</Label>
                    <Input
                      value={formData.logo}
                      onChange={(e) => setFormData({...formData, logo: e.target.value})}
                      placeholder="📻"
                      className="text-center text-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Couleur</Label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="w-12 h-10 rounded cursor-pointer border"
                      />
                      <Input
                        value={formData.color}
                        onChange={(e) => setFormData({...formData, color: e.target.value})}
                        className="flex-1 font-mono"
                      />
                    </div>
                  </div>
                  <div className="flex items-end">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData.enabled}
                        onCheckedChange={(checked) => setFormData({...formData, enabled: checked})}
                      />
                      <Label>Activée</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={saving} className="bg-accent hover:bg-accent/90">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {editingStation ? 'Mettre à jour' : 'Ajouter'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                    Annuler
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Stations List */}
          {stations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Radio className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucune station configurée</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={resetStations}
              >
                Charger les stations par défaut
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {stations.map((station) => (
                <div 
                  key={station.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg ${!station.enabled ? 'opacity-50 bg-muted/30' : 'bg-white dark:bg-gray-950'}`}
                  style={{ borderLeftColor: station.color, borderLeftWidth: '4px' }}
                >
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                  
                  <span className="text-2xl">{station.logo}</span>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm">{station.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{station.genre}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={station.enabled}
                      onCheckedChange={() => toggleStation(station)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(station)}>
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleDelete(station.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
