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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  Save, ArrowLeft, Plus, Trash2, Edit2, Loader2, 
  Rocket, Wrench, Bug, Sparkles, Calendar, Image, Upload,
  AlertCircle, Users, Mail
} from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const UPDATE_TYPES = [
  { value: 'new', label: 'Nouveau', icon: Rocket, color: 'bg-green-500' },
  { value: 'improvement', label: 'Amélioration', icon: Sparkles, color: 'bg-blue-500' },
  { value: 'fix', label: 'Correction', icon: Bug, color: 'bg-orange-500' },
  { value: 'maintenance', label: 'Maintenance', icon: Wrench, color: 'bg-gray-500' },
];

const CATEGORIES = [
  { value: 'general', label: 'Général' },
  { value: 'feature', label: 'Fonctionnalité' },
  { value: 'security', label: 'Sécurité' },
  { value: 'performance', label: 'Performance' },
];

export default function AdminUpdates() {
  const { user, token } = useAuth();
  const [updates, setUpdates] = useState([]);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    title: '',
    version: '',
    category: 'general',
    image_url: '',
    items: [{ type: 'new', text: '' }]
  });

  useEffect(() => {
    fetchUpdates();
    fetchSubscribers();
  }, []);

  const fetchUpdates = async () => {
    try {
      const response = await axios.get(`${API}/updates`);
      setUpdates(response.data || []);
    } catch (error) {
      console.error('Error fetching updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      const response = await axios.get(`${API}/newsletter/subscribers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscribers(response.data.subscribers || []);
    } catch (error) {
      console.error('Error fetching subscribers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate
    if (!formData.title || !formData.version) {
      toast.error('Veuillez remplir le titre et la version');
      return;
    }

    const validItems = formData.items.filter(item => item.text.trim());
    if (validItems.length === 0) {
      toast.error('Ajoutez au moins un élément de mise à jour');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...formData,
        items: validItems
      };

      if (editingId) {
        await axios.put(`${API}/updates/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Actualité mise à jour !');
      } else {
        await axios.post(`${API}/updates`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Actualité créée !');
      }

      resetForm();
      fetchUpdates();
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette actualité ?')) return;

    try {
      await axios.delete(`${API}/updates/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Actualité supprimée');
      fetchUpdates();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleEdit = (update) => {
    setEditingId(update.id);
    setFormData({
      title: update.title,
      version: update.version,
      category: update.category || 'general',
      image_url: update.image_url || '',
      items: update.items.length > 0 ? update.items : [{ type: 'new', text: '' }]
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      title: '',
      version: '',
      category: 'general',
      image_url: '',
      items: [{ type: 'new', text: '' }]
    });
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { type: 'new', text: '' }]
    }));
  };

  const removeItem = (index) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingImage(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      
      const response = await axios.post(`${API}/upload-image`, formDataUpload, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
      });
      
      setFormData(prev => ({ ...prev, image_url: response.data.url }));
      toast.success('Image uploadée !');
    } catch (error) {
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingImage(false);
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  // Check admin access
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
      <SEO title="Administration - Actualités" noindex={true} />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin/parametres" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Retour aux paramètres
            </Link>
            <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
              <Sparkles className="w-8 h-8" />
              Gestion des actualités
            </h1>
            <p className="text-muted-foreground">Gérez les mises à jour affichées sur la page Nouveautés</p>
          </div>
          <Button 
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-accent hover:bg-accent/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle actualité
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                <Sparkles className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{updates.length}</p>
                <p className="text-sm text-muted-foreground">Actualités publiées</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Mail className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{subscribers.length}</p>
                <p className="text-sm text-muted-foreground">Abonnés newsletter</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Calendar className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {updates[0] ? `v${updates[0].version}` : '-'}
                </p>
                <p className="text-sm text-muted-foreground">Dernière version</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Form */}
        {showForm && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {editingId ? <Edit2 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                {editingId ? 'Modifier l\'actualité' : 'Nouvelle actualité'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Titre *</Label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="ex: Nouvelles fonctionnalités majeures"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Version *</Label>
                    <Input
                      value={formData.version}
                      onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="ex: 2.6.0"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Catégorie</Label>
                    <Select 
                      value={formData.category} 
                      onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(cat => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Image (optionnel)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={formData.image_url}
                        onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                        placeholder="URL de l'image ou uploader"
                        className="flex-1"
                      />
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingImage}
                      >
                        {uploadingImage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    {formData.image_url && (
                      <img 
                        src={formData.image_url} 
                        alt="Preview" 
                        className="w-full h-32 object-cover rounded-lg mt-2"
                      />
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Éléments de mise à jour</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                      <Plus className="w-4 h-4 mr-1" />
                      Ajouter
                    </Button>
                  </div>

                  {formData.items.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <Select 
                        value={item.type} 
                        onValueChange={(v) => updateItem(index, 'type', v)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {UPDATE_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${type.color}`}></span>
                                {type.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={item.text}
                        onChange={(e) => updateItem(index, 'text', e.target.value)}
                        placeholder="Description de la mise à jour..."
                        className="flex-1"
                      />
                      {formData.items.length > 1 && (
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Annuler
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={saving}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {editingId ? 'Mettre à jour' : 'Publier'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Updates List */}
        <div className="space-y-4">
          <h2 className="font-heading text-xl font-bold">Actualités publiées</h2>
          
          {updates.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Aucune actualité publiée</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => { resetForm(); setShowForm(true); }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer la première actualité
                </Button>
              </CardContent>
            </Card>
          ) : (
            updates.map((update, index) => (
              <Card key={update.id} className="relative overflow-hidden">
                {index === 0 && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-none rounded-bl-lg bg-accent">
                      Dernière version
                    </Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-heading text-lg font-bold">{update.title}</h3>
                        <Badge variant="outline">v{update.version}</Badge>
                        {update.category && (
                          <Badge variant="secondary" className="text-xs">
                            {CATEGORIES.find(c => c.value === update.category)?.label || update.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(update.date)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(update)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDelete(update.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {update.image_url && (
                    <img 
                      src={update.image_url} 
                      alt={update.title}
                      className="w-full h-32 object-cover rounded-lg mt-4"
                    />
                  )}

                  <ul className="mt-4 space-y-1">
                    {update.items.slice(0, 3).map((item, i) => {
                      const typeInfo = UPDATE_TYPES.find(t => t.value === item.type) || UPDATE_TYPES[0];
                      return (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          <span className={`w-2 h-2 rounded-full ${typeInfo.color}`}></span>
                          <span className="text-muted-foreground">{item.text}</span>
                        </li>
                      );
                    })}
                    {update.items.length > 3 && (
                      <li className="text-sm text-muted-foreground">
                        + {update.items.length - 3} autres éléments
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Newsletter Subscribers Preview */}
        {subscribers.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Derniers abonnés newsletter
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {subscribers.slice(0, 5).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{sub.email}</span>
                      {sub.name && <span className="text-muted-foreground">({sub.name})</span>}
                    </div>
                    <span className="text-muted-foreground text-xs">
                      {formatDate(sub.subscribed_at)}
                    </span>
                  </div>
                ))}
                {subscribers.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    + {subscribers.length - 5} autres abonnés
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
