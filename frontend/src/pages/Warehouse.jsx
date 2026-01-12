import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  Warehouse, Plus, Search, Package, AlertTriangle, TrendingUp, 
  Edit, Trash2, Eye, Upload, Download, ChevronRight, Loader2,
  MapPin, Tag, BarChart3, ArrowUpDown, ExternalLink
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Catégories avec leurs icônes
const CATEGORY_ICONS = {
  moteur: "⚙️",
  carrosserie: "🚗",
  freinage: "🛑",
  electricite: "⚡",
  suspension: "🔧",
  transmission: "🔄",
  echappement: "💨",
  refroidissement: "❄️",
  direction: "🎯",
  interieur: "💺",
  vitrage: "🪟",
  accessoires: "🔩",
  autre: "📦",
};

export default function WarehousePage() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  
  // Modals
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Forms
  const [sectionForm, setSectionForm] = useState({ name: '', category: 'autre', description: '' });
  const [itemForm, setItemForm] = useState({
    name: '', section_id: '', quantity: 1, location: '',
    reference_oem: '', reference_custom: '', brand: '',
    compatible_vehicles: '', purchase_price: '', selling_price: '',
    condition: 'occasion', notes: '', alert_threshold: 1
  });

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [sectionsRes, statsRes, categoriesRes] = await Promise.all([
        axios.get(`${API}/warehouse/sections`, { headers }),
        axios.get(`${API}/warehouse/stats`, { headers }),
        axios.get(`${API}/warehouse/categories`, { headers }),
      ]);
      setSections(sectionsRes.data);
      setStats(statsRes.data);
      setCategories(categoriesRes.data);
    } catch (err) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (sectionId = null, search = '', lowStock = false) => {
    try {
      const params = new URLSearchParams();
      if (sectionId) params.append('section_id', sectionId);
      if (search) params.append('search', search);
      if (lowStock) params.append('low_stock_only', 'true');
      
      const res = await axios.get(`${API}/warehouse/items?${params}`, { headers });
      setItems(res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des articles');
    }
  };

  const handleSectionClick = (section) => {
    setSelectedSection(section);
    fetchItems(section.id);
  };

  const handleSearch = () => {
    fetchItems(selectedSection?.id, searchQuery, showLowStockOnly);
  };

  const handleSaveSection = async () => {
    try {
      if (editingSection) {
        await axios.put(`${API}/warehouse/sections/${editingSection.id}`, sectionForm, { headers });
        toast.success('Section modifiée');
      } else {
        await axios.post(`${API}/warehouse/sections`, sectionForm, { headers });
        toast.success('Section créée');
      }
      setShowSectionModal(false);
      setEditingSection(null);
      setSectionForm({ name: '', category: 'autre', description: '' });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Supprimer cette section et tous ses articles ?')) return;
    try {
      await axios.delete(`${API}/warehouse/sections/${sectionId}`, { headers });
      toast.success('Section supprimée');
      if (selectedSection?.id === sectionId) {
        setSelectedSection(null);
        setItems([]);
      }
      fetchData();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveItem = async () => {
    try {
      const data = {
        ...itemForm,
        quantity: parseInt(itemForm.quantity) || 1,
        purchase_price: itemForm.purchase_price ? parseFloat(itemForm.purchase_price) : null,
        selling_price: itemForm.selling_price ? parseFloat(itemForm.selling_price) : null,
        alert_threshold: parseInt(itemForm.alert_threshold) || 1,
      };
      
      if (editingItem) {
        await axios.put(`${API}/warehouse/items/${editingItem.id}`, data, { headers });
        toast.success('Article modifié');
      } else {
        await axios.post(`${API}/warehouse/items`, data, { headers });
        toast.success('Article ajouté');
      }
      setShowItemModal(false);
      setEditingItem(null);
      setItemForm({
        name: '', section_id: selectedSection?.id || '', quantity: 1, location: '',
        reference_oem: '', reference_custom: '', brand: '',
        compatible_vehicles: '', purchase_price: '', selling_price: '',
        condition: 'occasion', notes: '', alert_threshold: 1
      });
      fetchItems(selectedSection?.id);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!confirm('Supprimer cet article ?')) return;
    try {
      await axios.delete(`${API}/warehouse/items/${itemId}`, { headers });
      toast.success('Article supprimé');
      fetchItems(selectedSection?.id);
      fetchData();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleAdjustStock = async (itemId, adjustment) => {
    try {
      await axios.post(`${API}/warehouse/items/${itemId}/adjust-stock?adjustment=${adjustment}`, {}, { headers });
      toast.success(`Stock ${adjustment > 0 ? 'augmenté' : 'diminué'}`);
      fetchItems(selectedSection?.id);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const handlePublishItem = async (itemId) => {
    if (!confirm('Publier cet article en annonce ? (1 crédit sera utilisé)')) return;
    try {
      const res = await axios.post(`${API}/warehouse/items/${itemId}/publish`, {}, { headers });
      toast.success('Annonce publiée !');
      fetchItems(selectedSection?.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur');
    }
  };

  const openEditSection = (section) => {
    setEditingSection(section);
    setSectionForm({
      name: section.name,
      category: section.category,
      description: section.description || '',
    });
    setShowSectionModal(true);
  };

  const openEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      name: item.name,
      section_id: item.section_id,
      quantity: item.quantity,
      location: item.location || '',
      reference_oem: item.reference_oem || '',
      reference_custom: item.reference_custom || '',
      brand: item.brand || '',
      compatible_vehicles: item.compatible_vehicles || '',
      purchase_price: item.purchase_price || '',
      selling_price: item.selling_price || '',
      condition: item.condition,
      notes: item.notes || '',
      alert_threshold: item.alert_threshold,
    });
    setShowItemModal(true);
  };

  const openNewItem = () => {
    setEditingItem(null);
    setItemForm({
      name: '', section_id: selectedSection?.id || '', quantity: 1, location: '',
      reference_oem: '', reference_custom: '', brand: '',
      compatible_vehicles: '', purchase_price: '', selling_price: '',
      condition: 'occasion', notes: '', alert_threshold: 1
    });
    setShowItemModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Warehouse className="w-8 h-8 text-orange-500" />
              Mon Entrepôt Pro
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez votre stock de pièces détachées
            </p>
          </div>
          <Button onClick={() => { setEditingSection(null); setSectionForm({ name: '', category: 'autre', description: '' }); setShowSectionModal(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Nouvelle section
          </Button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.total_stock}</div>
                <div className="text-xs text-gray-500">Pièces en stock</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.total_items}</div>
                <div className="text-xs text-gray-500">Références</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Warehouse className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.total_sections}</div>
                <div className="text-xs text-gray-500">Sections</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.stock_value?.toLocaleString()}€</div>
                <div className="text-xs text-gray-500">Valeur stock</div>
              </CardContent>
            </Card>
            <Card className={stats.low_stock_count > 0 ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''}>
              <CardContent className="p-4 text-center">
                <AlertTriangle className={`w-6 h-6 mx-auto mb-2 ${stats.low_stock_count > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                <div className="text-2xl font-bold">{stats.low_stock_count}</div>
                <div className="text-xs text-gray-500">Alertes stock</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sections */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  Sections
                  <Badge variant="secondary">{sections.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Voir tout */}
                <button
                  onClick={() => { setSelectedSection(null); fetchItems(); }}
                  className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    !selectedSection 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                  }`}
                >
                  <span className="text-2xl">📋</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium">Tout voir</p>
                    <p className="text-xs text-gray-500">{stats?.total_items || 0} articles</p>
                  </div>
                </button>

                {/* Liste des sections */}
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className={`relative group p-3 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedSection?.id === section.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                    }`}
                    onClick={() => handleSectionClick(section)}
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className="text-2xl w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: section.color + '20' }}
                      >
                        {section.icon || CATEGORY_ICONS[section.category] || '📦'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{section.name}</p>
                        <p className="text-xs text-gray-500">{section.items_count} articles</p>
                      </div>
                      {section.low_stock_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {section.low_stock_count}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditSection(section); }}
                        className="p-1 bg-white rounded shadow hover:bg-gray-100"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                        className="p-1 bg-white rounded shadow hover:bg-red-100 text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {sections.length === 0 && (
                  <p className="text-center text-gray-500 py-4">
                    Aucune section créée
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Articles */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {selectedSection ? (
                      <>
                        <span className="text-2xl">{selectedSection.icon || CATEGORY_ICONS[selectedSection.category]}</span>
                        {selectedSection.name}
                      </>
                    ) : (
                      'Tous les articles'
                    )}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1 md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        className="pl-10"
                      />
                    </div>
                    <Button 
                      variant={showLowStockOnly ? 'destructive' : 'outline'} 
                      size="icon"
                      onClick={() => { setShowLowStockOnly(!showLowStockOnly); fetchItems(selectedSection?.id, searchQuery, !showLowStockOnly); }}
                      title="Alertes stock bas"
                    >
                      <AlertTriangle className="w-4 h-4" />
                    </Button>
                    {selectedSection && (
                      <Button onClick={openNewItem}>
                        <Plus className="w-4 h-4 mr-2" /> Ajouter
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {items.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left text-sm text-gray-500">
                          <th className="pb-3 font-medium">Article</th>
                          <th className="pb-3 font-medium">Emplacement</th>
                          <th className="pb-3 font-medium text-center">Stock</th>
                          <th className="pb-3 font-medium text-right">Prix vente</th>
                          <th className="pb-3 font-medium text-center">Statut</th>
                          <th className="pb-3 font-medium text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="py-3">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                  {item.reference_oem && <span>OEM: {item.reference_oem}</span>}
                                  {item.brand && <span>• {item.brand}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              {item.location ? (
                                <Badge variant="outline" className="font-mono text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {item.location}
                                </Badge>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleAdjustStock(item.id, -1)}
                                  className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-sm font-bold"
                                  disabled={item.quantity <= 0}
                                >
                                  -
                                </button>
                                <span className={`w-10 text-center font-bold ${item.is_low_stock ? 'text-red-500' : ''}`}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleAdjustStock(item.id, 1)}
                                  className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 text-sm font-bold"
                                >
                                  +
                                </button>
                              </div>
                            </td>
                            <td className="py-3 text-right font-medium">
                              {item.selling_price ? `${item.selling_price}€` : '-'}
                            </td>
                            <td className="py-3 text-center">
                              {item.listing_id ? (
                                <Link to={`/annonce/${item.listing_id}`} className="inline-flex items-center gap-1 text-green-600 text-xs">
                                  <ExternalLink className="w-3 h-3" /> En ligne
                                </Link>
                              ) : item.is_low_stock ? (
                                <Badge variant="destructive" className="text-xs">Stock bas</Badge>
                              ) : (
                                <Badge variant="secondary" className="text-xs">En stock</Badge>
                              )}
                            </td>
                            <td className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1">
                                {!item.listing_id && item.quantity > 0 && (
                                  <Button size="sm" variant="outline" onClick={() => handlePublishItem(item.id)}>
                                    Publier
                                  </Button>
                                )}
                                <button
                                  onClick={() => openEditItem(item)}
                                  className="p-2 hover:bg-gray-100 rounded"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-2 hover:bg-red-100 rounded text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun article dans cette section</p>
                    {selectedSection && (
                      <Button className="mt-4" onClick={openNewItem}>
                        <Plus className="w-4 h-4 mr-2" /> Ajouter un article
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Modal Section */}
        <Dialog open={showSectionModal} onOpenChange={setShowSectionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSection ? 'Modifier la section' : 'Nouvelle section'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nom de la section *</Label>
                <Input
                  value={sectionForm.name}
                  onChange={(e) => setSectionForm({ ...sectionForm, name: e.target.value })}
                  placeholder="Ex: Moteur BMW"
                />
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select value={sectionForm.category} onValueChange={(v) => setSectionForm({ ...sectionForm, category: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categories).map(([key, cat]) => (
                      <SelectItem key={key} value={key}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Description (optionnel)</Label>
                <Input
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  placeholder="Description de la section"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSectionModal(false)}>Annuler</Button>
              <Button onClick={handleSaveSection} disabled={!sectionForm.name}>
                {editingSection ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Article */}
        <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Modifier l\'article' : 'Nouvel article'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>Nom de l'article *</Label>
                <Input
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="Ex: Turbo Garrett GT1749V"
                />
              </div>
              
              <div>
                <Label>Section *</Label>
                <Select value={itemForm.section_id} onValueChange={(v) => setItemForm({ ...itemForm, section_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir une section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.icon} {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Quantité</Label>
                <Input
                  type="number"
                  min="0"
                  value={itemForm.quantity}
                  onChange={(e) => setItemForm({ ...itemForm, quantity: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Emplacement</Label>
                <Input
                  value={itemForm.location}
                  onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                  placeholder="Ex: A2-E3-B5"
                />
              </div>
              
              <div>
                <Label>Référence OEM</Label>
                <Input
                  value={itemForm.reference_oem}
                  onChange={(e) => setItemForm({ ...itemForm, reference_oem: e.target.value })}
                  placeholder="Ex: 11657794144"
                />
              </div>
              
              <div>
                <Label>Marque</Label>
                <Input
                  value={itemForm.brand}
                  onChange={(e) => setItemForm({ ...itemForm, brand: e.target.value })}
                  placeholder="Ex: Garrett, Bosch..."
                />
              </div>
              
              <div>
                <Label>Véhicules compatibles</Label>
                <Input
                  value={itemForm.compatible_vehicles}
                  onChange={(e) => setItemForm({ ...itemForm, compatible_vehicles: e.target.value })}
                  placeholder="Ex: BMW E46, E39, E60"
                />
              </div>
              
              <div>
                <Label>Prix d'achat (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemForm.purchase_price}
                  onChange={(e) => setItemForm({ ...itemForm, purchase_price: e.target.value })}
                />
              </div>
              
              <div>
                <Label>Prix de vente (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={itemForm.selling_price}
                  onChange={(e) => setItemForm({ ...itemForm, selling_price: e.target.value })}
                />
              </div>
              
              <div>
                <Label>État</Label>
                <Select value={itemForm.condition} onValueChange={(v) => setItemForm({ ...itemForm, condition: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neuf">Neuf</SelectItem>
                    <SelectItem value="occasion">Occasion</SelectItem>
                    <SelectItem value="reconditionne">Reconditionné</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Seuil d'alerte stock</Label>
                <Input
                  type="number"
                  min="0"
                  value={itemForm.alert_threshold}
                  onChange={(e) => setItemForm({ ...itemForm, alert_threshold: e.target.value })}
                />
              </div>
              
              <div className="col-span-2">
                <Label>Notes</Label>
                <Input
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                  placeholder="Notes internes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowItemModal(false)}>Annuler</Button>
              <Button onClick={handleSaveItem} disabled={!itemForm.name || !itemForm.section_id}>
                {editingItem ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
