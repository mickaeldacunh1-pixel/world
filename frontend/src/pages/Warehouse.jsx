import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { 
  Warehouse, Plus, Search, Package, AlertTriangle, TrendingUp, 
  Edit, Trash2, Upload, Loader2, Filter, X,
  MapPin, BarChart3, ExternalLink, SlidersHorizontal, Grid3X3,
  List, ArrowUpDown, RefreshCw, Download, FileSpreadsheet
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

const CONDITIONS = {
  neuf: { label: "Neuf", color: "bg-green-100 text-green-800" },
  occasion: { label: "Occasion", color: "bg-blue-100 text-blue-800" },
  reconditionne: { label: "Reconditionné", color: "bg-purple-100 text-purple-800" },
};

export default function WarehousePage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState({});
  const [selectedSection, setSelectedSection] = useState(null);
  
  // Recherche et filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    lowStockOnly: false,
    condition: 'all',
    brand: '',
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [viewMode, setViewMode] = useState('table'); // 'table' ou 'grid'
  
  // Modals
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [savingSection, setSavingSection] = useState(false);
  const [savingItem, setSavingItem] = useState(false);
  
  // Forms
  const [sectionForm, setSectionForm] = useState({ name: '', category: 'autre', description: '' });
  const [itemForm, setItemForm] = useState({
    name: '', section_id: '', quantity: 1, location: '',
    reference_oem: '', reference_custom: '', brand: '',
    compatible_vehicles: '', purchase_price: '', selling_price: '',
    condition: 'occasion', notes: '', alert_threshold: 1
  });

  const headers = { Authorization: `Bearer ${token}` };

  // Vérifier si l'utilisateur est professionnel
  useEffect(() => {
    if (user && !user.is_professional) {
      toast.error("Cette fonctionnalité est réservée aux professionnels");
      navigate('/profil');
    }
  }, [user, navigate]);

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
      // Charger tous les articles au démarrage
      fetchItems();
    } catch (err) {
      console.error('Erreur:', err);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchItems = async (sectionId = null) => {
    try {
      const params = new URLSearchParams();
      if (sectionId) params.append('section_id', sectionId);
      if (searchQuery) params.append('search', searchQuery);
      if (filters.lowStockOnly) params.append('low_stock_only', 'true');
      
      const res = await axios.get(`${API}/warehouse/items?${params}`, { headers });
      setItems(res.data);
    } catch (err) {
      toast.error('Erreur lors du chargement des articles');
    }
  };

  // Filtrage et tri côté client pour une meilleure réactivité
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];
    
    // Filtre par condition
    if (filters.condition !== 'all') {
      result = result.filter(item => item.condition === filters.condition);
    }
    
    // Filtre par marque
    if (filters.brand) {
      result = result.filter(item => 
        item.brand?.toLowerCase().includes(filters.brand.toLowerCase())
      );
    }
    
    // Filtre stock bas
    if (filters.lowStockOnly) {
      result = result.filter(item => item.is_low_stock);
    }
    
    // Tri
    result.sort((a, b) => {
      let compareA, compareB;
      switch (filters.sortBy) {
        case 'name':
          compareA = a.name.toLowerCase();
          compareB = b.name.toLowerCase();
          break;
        case 'quantity':
          compareA = a.quantity;
          compareB = b.quantity;
          break;
        case 'price':
          compareA = a.selling_price || 0;
          compareB = b.selling_price || 0;
          break;
        case 'location':
          compareA = a.location || '';
          compareB = b.location || '';
          break;
        default:
          compareA = a.name;
          compareB = b.name;
      }
      
      if (filters.sortOrder === 'asc') {
        return compareA > compareB ? 1 : -1;
      } else {
        return compareA < compareB ? 1 : -1;
      }
    });
    
    return result;
  }, [items, filters]);

  // Liste des marques uniques pour le filtre
  const uniqueBrands = useMemo(() => {
    const brands = items.map(item => item.brand).filter(Boolean);
    return [...new Set(brands)].sort();
  }, [items]);

  const handleSectionClick = (section) => {
    setSelectedSection(section);
    fetchItems(section?.id);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    fetchItems(selectedSection?.id);
  };

  const handleResetFilters = () => {
    setFilters({
      lowStockOnly: false,
      condition: 'all',
      brand: '',
      sortBy: 'name',
      sortOrder: 'asc',
    });
    setSearchQuery('');
    fetchItems(selectedSection?.id);
  };

  const handleSaveSection = async () => {
    setSavingSection(true);
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
      toast.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingSection(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Supprimer cette section et tous ses articles ?')) return;
    try {
      await axios.delete(`${API}/warehouse/sections/${sectionId}`, { headers });
      toast.success('Section supprimée');
      if (selectedSection?.id === sectionId) {
        setSelectedSection(null);
        fetchItems();
      }
      fetchData();
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSaveItem = async () => {
    setSavingItem(true);
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
        toast.success('Article ajouté au stock');
      }
      setShowItemModal(false);
      setEditingItem(null);
      resetItemForm();
      fetchItems(selectedSection?.id);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingItem(false);
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
      toast.error(err.response?.data?.detail || 'Erreur lors de l\'ajustement');
    }
  };

  const handlePublishItem = async (itemId) => {
    if (!confirm('Publier cet article en annonce ? (1 crédit sera utilisé)')) return;
    try {
      const res = await axios.post(`${API}/warehouse/items/${itemId}/publish`, {}, { headers });
      toast.success('Annonce publiée !');
      fetchItems(selectedSection?.id);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Erreur lors de la publication');
    }
  };

  const handleExportCSV = () => {
    const headers = ['Nom', 'Section', 'Quantité', 'Emplacement', 'Réf. OEM', 'Marque', 'État', 'Prix achat', 'Prix vente'];
    const csvContent = [
      headers.join(';'),
      ...filteredAndSortedItems.map(item => [
        item.name,
        item.section_name,
        item.quantity,
        item.location || '',
        item.reference_oem || '',
        item.brand || '',
        item.condition,
        item.purchase_price || '',
        item.selling_price || ''
      ].join(';'))
    ].join('\n');
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `entrepot_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Export CSV téléchargé');
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

  const resetItemForm = () => {
    setItemForm({
      name: '', section_id: selectedSection?.id || '', quantity: 1, location: '',
      reference_oem: '', reference_custom: '', brand: '',
      compatible_vehicles: '', purchase_price: '', selling_price: '',
      condition: 'occasion', notes: '', alert_threshold: 1
    });
  };

  const openNewItem = () => {
    setEditingItem(null);
    resetItemForm();
    setShowItemModal(true);
  };

  const openNewSection = () => {
    setEditingSection(null);
    setSectionForm({ name: '', category: 'autre', description: '' });
    setShowSectionModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="warehouse-loading">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8" data-testid="warehouse-page">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Warehouse className="w-8 h-8 text-orange-500" />
              Mon Entrepôt Pro
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez votre stock de pièces détachées
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExportCSV} data-testid="export-csv-btn">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Exporter
            </Button>
            <Button onClick={openNewSection} data-testid="new-section-btn">
              <Plus className="w-4 h-4 mr-2" /> Nouvelle section
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8" data-testid="warehouse-stats">
            <Card>
              <CardContent className="p-4 text-center">
                <Package className="w-6 h-6 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.total_stock || 0}</div>
                <div className="text-xs text-gray-500">Pièces en stock</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.total_items || 0}</div>
                <div className="text-xs text-gray-500">Références</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Warehouse className="w-6 h-6 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{stats.total_sections || 0}</div>
                <div className="text-xs text-gray-500">Sections</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{(stats.stock_value || 0).toLocaleString()}€</div>
                <div className="text-xs text-gray-500">Valeur stock</div>
              </CardContent>
            </Card>
            <Card className={stats.low_stock_count > 0 ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''}>
              <CardContent className="p-4 text-center">
                <AlertTriangle className={`w-6 h-6 mx-auto mb-2 ${stats.low_stock_count > 0 ? 'text-red-500' : 'text-gray-400'}`} />
                <div className="text-2xl font-bold">{stats.low_stock_count || 0}</div>
                <div className="text-xs text-gray-500">Alertes stock</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sections Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  Sections
                  <Badge variant="secondary">{sections.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
                {/* Voir tout */}
                <button
                  onClick={() => { setSelectedSection(null); fetchItems(); }}
                  data-testid="view-all-btn"
                  className={`w-full p-3 rounded-lg border-2 transition-all flex items-center gap-3 ${
                    !selectedSection 
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' 
                      : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                  }`}
                >
                  <span className="text-2xl">📋</span>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white">Tout voir</p>
                    <p className="text-xs text-gray-500">{stats?.total_items || 0} articles</p>
                  </div>
                </button>

                {/* Liste des sections */}
                {sections.map((section) => (
                  <div
                    key={section.id}
                    data-testid={`section-${section.id}`}
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
                        style={{ backgroundColor: (section.color || '#6b7280') + '20' }}
                      >
                        {section.icon || CATEGORY_ICONS[section.category] || '📦'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-gray-900 dark:text-white">{section.name}</p>
                        <p className="text-xs text-gray-500">{section.items_count} articles</p>
                      </div>
                      {section.low_stock_count > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {section.low_stock_count}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Actions au survol */}
                    <div className="absolute top-2 right-2 hidden group-hover:flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEditSection(section); }}
                        className="p-1 bg-white dark:bg-gray-800 rounded shadow hover:bg-gray-100 dark:hover:bg-gray-700"
                        data-testid={`edit-section-${section.id}`}
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.id); }}
                        className="p-1 bg-white dark:bg-gray-800 rounded shadow hover:bg-red-100 text-red-500"
                        data-testid={`delete-section-${section.id}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {sections.length === 0 && (
                  <div className="text-center py-8">
                    <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm mb-4">Aucune section créée</p>
                    <Button size="sm" onClick={openNewSection}>
                      <Plus className="w-4 h-4 mr-2" /> Créer une section
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Articles Main Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col gap-4">
                  {/* Titre et boutons */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {selectedSection ? (
                        <>
                          <span className="text-2xl">{selectedSection.icon || CATEGORY_ICONS[selectedSection.category]}</span>
                          {selectedSection.name}
                          <Badge variant="secondary" className="ml-2">{filteredAndSortedItems.length}</Badge>
                        </>
                      ) : (
                        <>
                          Tous les articles
                          <Badge variant="secondary" className="ml-2">{filteredAndSortedItems.length}</Badge>
                        </>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {/* Toggle vue */}
                      <div className="flex border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setViewMode('table')}
                          className={`p-2 ${viewMode === 'table' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}`}
                          data-testid="view-table-btn"
                        >
                          <List className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setViewMode('grid')}
                          className={`p-2 ${viewMode === 'grid' ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100'}`}
                          data-testid="view-grid-btn"
                        >
                          <Grid3X3 className="w-4 h-4" />
                        </button>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowFilters(!showFilters)} data-testid="toggle-filters-btn">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Filtres
                        {(filters.lowStockOnly || filters.condition !== 'all' || filters.brand) && (
                          <Badge variant="destructive" className="ml-2 text-xs">!</Badge>
                        )}
                      </Button>
                      {(selectedSection || sections.length > 0) && (
                        <Button onClick={openNewItem} data-testid="add-item-btn">
                          <Plus className="w-4 h-4 mr-2" /> Ajouter
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Barre de recherche */}
                  <form onSubmit={handleSearch} className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Rechercher par nom, référence, marque, emplacement..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        data-testid="search-input"
                      />
                    </div>
                    <Button type="submit" variant="secondary" data-testid="search-btn">
                      <Search className="w-4 h-4" />
                    </Button>
                    <Button type="button" variant="ghost" onClick={() => { setSearchQuery(''); fetchItems(selectedSection?.id); }} data-testid="clear-search-btn">
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </form>

                  {/* Panneau de filtres avancés */}
                  {showFilters && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-4" data-testid="filters-panel">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <Label className="text-xs">État</Label>
                          <Select value={filters.condition} onValueChange={(v) => setFilters({...filters, condition: v})}>
                            <SelectTrigger data-testid="filter-condition">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Tous</SelectItem>
                              <SelectItem value="neuf">Neuf</SelectItem>
                              <SelectItem value="occasion">Occasion</SelectItem>
                              <SelectItem value="reconditionne">Reconditionné</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Marque</Label>
                          <Select value={filters.brand || "all"} onValueChange={(v) => setFilters({...filters, brand: v === "all" ? "" : v})}>
                            <SelectTrigger data-testid="filter-brand">
                              <SelectValue placeholder="Toutes" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Toutes</SelectItem>
                              {uniqueBrands.map(brand => (
                                <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Trier par</Label>
                          <Select value={filters.sortBy} onValueChange={(v) => setFilters({...filters, sortBy: v})}>
                            <SelectTrigger data-testid="filter-sortby">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name">Nom</SelectItem>
                              <SelectItem value="quantity">Quantité</SelectItem>
                              <SelectItem value="price">Prix</SelectItem>
                              <SelectItem value="location">Emplacement</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-xs">Ordre</Label>
                          <Select value={filters.sortOrder} onValueChange={(v) => setFilters({...filters, sortOrder: v})}>
                            <SelectTrigger data-testid="filter-sortorder">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="asc">Croissant</SelectItem>
                              <SelectItem value="desc">Décroissant</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={filters.lowStockOnly}
                            onChange={(e) => setFilters({...filters, lowStockOnly: e.target.checked})}
                            className="rounded border-gray-300"
                            data-testid="filter-lowstock"
                          />
                          <span className="text-sm flex items-center gap-1">
                            <AlertTriangle className="w-4 h-4 text-red-500" />
                            Stock bas uniquement
                          </span>
                        </label>
                        <Button variant="ghost" size="sm" onClick={handleResetFilters} data-testid="reset-filters-btn">
                          <X className="w-4 h-4 mr-1" /> Réinitialiser
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent>
                {filteredAndSortedItems.length > 0 ? (
                  viewMode === 'table' ? (
                    /* Vue Tableau */
                    <div className="overflow-x-auto" data-testid="items-table">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b text-left text-sm text-gray-500">
                            <th className="pb-3 font-medium">Article</th>
                            <th className="pb-3 font-medium hidden md:table-cell">Emplacement</th>
                            <th className="pb-3 font-medium text-center">Stock</th>
                            <th className="pb-3 font-medium text-right hidden sm:table-cell">Prix</th>
                            <th className="pb-3 font-medium text-center">Statut</th>
                            <th className="pb-3 font-medium text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAndSortedItems.map((item) => (
                            <tr key={item.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800" data-testid={`item-row-${item.id}`}>
                              <td className="py-3">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                    {item.reference_oem && <span>OEM: {item.reference_oem}</span>}
                                    {item.brand && <Badge variant="outline" className="text-xs">{item.brand}</Badge>}
                                    {item.condition && (
                                      <span className={`px-1.5 py-0.5 rounded text-xs ${CONDITIONS[item.condition]?.color || 'bg-gray-100'}`}>
                                        {CONDITIONS[item.condition]?.label || item.condition}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 hidden md:table-cell">
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
                                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-bold"
                                    disabled={item.quantity <= 0}
                                    data-testid={`stock-minus-${item.id}`}
                                  >
                                    -
                                  </button>
                                  <span className={`w-10 text-center font-bold ${item.is_low_stock ? 'text-red-500' : ''}`}>
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() => handleAdjustStock(item.id, 1)}
                                    className="w-6 h-6 rounded bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-sm font-bold"
                                    data-testid={`stock-plus-${item.id}`}
                                  >
                                    +
                                  </button>
                                </div>
                              </td>
                              <td className="py-3 text-right hidden sm:table-cell">
                                <div className="text-sm">
                                  {item.selling_price ? (
                                    <span className="font-medium text-green-600">{item.selling_price}€</span>
                                  ) : '-'}
                                </div>
                              </td>
                              <td className="py-3 text-center">
                                {item.listing_id ? (
                                  <Link to={`/annonce/${item.listing_id}`} className="inline-flex items-center gap-1 text-green-600 text-xs hover:underline">
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
                                    <Button size="sm" variant="outline" onClick={() => handlePublishItem(item.id)} data-testid={`publish-${item.id}`}>
                                      <Upload className="w-3 h-3 mr-1" /> Publier
                                    </Button>
                                  )}
                                  <button
                                    onClick={() => openEditItem(item)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                    data-testid={`edit-item-${item.id}`}
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteItem(item.id)}
                                    className="p-2 hover:bg-red-100 rounded text-red-500"
                                    data-testid={`delete-item-${item.id}`}
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
                    /* Vue Grille */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="items-grid">
                      {filteredAndSortedItems.map((item) => (
                        <Card key={item.id} className={`overflow-hidden ${item.is_low_stock ? 'border-red-300' : ''}`} data-testid={`item-card-${item.id}`}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-gray-900 dark:text-white truncate">{item.name}</h3>
                                <p className="text-xs text-gray-500">{item.section_name}</p>
                              </div>
                              <span className={`px-2 py-1 rounded text-xs ${CONDITIONS[item.condition]?.color || 'bg-gray-100'}`}>
                                {CONDITIONS[item.condition]?.label || item.condition}
                              </span>
                            </div>
                            
                            <div className="space-y-2 text-sm">
                              {item.reference_oem && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <span className="font-medium">OEM:</span> {item.reference_oem}
                                </div>
                              )}
                              {item.location && (
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                  <MapPin className="w-3 h-3" /> {item.location}
                                </div>
                              )}
                              {item.brand && (
                                <Badge variant="outline" className="text-xs">{item.brand}</Badge>
                              )}
                            </div>

                            <div className="flex items-center justify-between mt-4 pt-3 border-t">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleAdjustStock(item.id, -1)}
                                  className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-sm font-bold"
                                  disabled={item.quantity <= 0}
                                >
                                  -
                                </button>
                                <span className={`w-10 text-center font-bold text-lg ${item.is_low_stock ? 'text-red-500' : ''}`}>
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleAdjustStock(item.id, 1)}
                                  className="w-7 h-7 rounded bg-gray-100 hover:bg-gray-200 text-sm font-bold"
                                >
                                  +
                                </button>
                              </div>
                              {item.selling_price && (
                                <span className="font-bold text-green-600">{item.selling_price}€</span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-3">
                              {!item.listing_id && item.quantity > 0 && (
                                <Button size="sm" className="flex-1" variant="outline" onClick={() => handlePublishItem(item.id)}>
                                  <Upload className="w-3 h-3 mr-1" /> Publier
                                </Button>
                              )}
                              {item.listing_id && (
                                <Link to={`/annonce/${item.listing_id}`} className="flex-1">
                                  <Button size="sm" variant="secondary" className="w-full">
                                    <ExternalLink className="w-3 h-3 mr-1" /> Voir annonce
                                  </Button>
                                </Link>
                              )}
                              <button onClick={() => openEditItem(item)} className="p-2 hover:bg-gray-100 rounded">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteItem(item.id)} className="p-2 hover:bg-red-100 rounded text-red-500">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="text-center py-12" data-testid="no-items">
                    <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      {searchQuery || filters.lowStockOnly || filters.condition !== 'all' 
                        ? 'Aucun résultat' 
                        : 'Aucun article'}
                    </h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery || filters.lowStockOnly || filters.condition !== 'all' 
                        ? 'Essayez de modifier vos filtres ou votre recherche'
                        : selectedSection 
                          ? 'Cette section est vide'
                          : 'Commencez par créer une section puis ajoutez des articles'}
                    </p>
                    {(searchQuery || filters.lowStockOnly || filters.condition !== 'all') ? (
                      <Button variant="outline" onClick={handleResetFilters}>
                        <RefreshCw className="w-4 h-4 mr-2" /> Réinitialiser les filtres
                      </Button>
                    ) : selectedSection ? (
                      <Button onClick={openNewItem}>
                        <Plus className="w-4 h-4 mr-2" /> Ajouter un article
                      </Button>
                    ) : sections.length === 0 ? (
                      <Button onClick={openNewSection}>
                        <Plus className="w-4 h-4 mr-2" /> Créer une section
                      </Button>
                    ) : (
                      <Button onClick={openNewItem}>
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
          <DialogContent data-testid="section-modal">
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
                  data-testid="section-name-input"
                />
              </div>
              <div>
                <Label>Catégorie</Label>
                <Select value={sectionForm.category} onValueChange={(v) => setSectionForm({ ...sectionForm, category: v })}>
                  <SelectTrigger data-testid="section-category-select">
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
                <Textarea
                  value={sectionForm.description}
                  onChange={(e) => setSectionForm({ ...sectionForm, description: e.target.value })}
                  placeholder="Description de la section"
                  rows={3}
                  data-testid="section-description-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowSectionModal(false)}>Annuler</Button>
              <Button onClick={handleSaveSection} disabled={!sectionForm.name || savingSection} data-testid="save-section-btn">
                {savingSection ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingSection ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Modal Article */}
        <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="item-modal">
            <DialogHeader>
              <DialogTitle>{editingItem ? 'Modifier l\'article' : 'Nouvel article'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label>Nom de l'article *</Label>
                <Input
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder="Ex: Turbo Garrett GT1749V"
                  data-testid="item-name-input"
                />
              </div>
              
              <div>
                <Label>Section *</Label>
                <Select value={itemForm.section_id} onValueChange={(v) => setItemForm({ ...itemForm, section_id: v })}>
                  <SelectTrigger data-testid="item-section-select">
                    <SelectValue placeholder="Choisir une section" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.icon || CATEGORY_ICONS[s.category]} {s.name}
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
                  data-testid="item-quantity-input"
                />
              </div>
              
              <div>
                <Label>Emplacement</Label>
                <Input
                  value={itemForm.location}
                  onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                  placeholder="Ex: A2-E3-B5"
                  data-testid="item-location-input"
                />
              </div>
              
              <div>
                <Label>Référence OEM</Label>
                <Input
                  value={itemForm.reference_oem}
                  onChange={(e) => setItemForm({ ...itemForm, reference_oem: e.target.value })}
                  placeholder="Ex: 11657794144"
                  data-testid="item-oem-input"
                />
              </div>
              
              <div>
                <Label>Marque</Label>
                <Input
                  value={itemForm.brand}
                  onChange={(e) => setItemForm({ ...itemForm, brand: e.target.value })}
                  placeholder="Ex: Garrett, Bosch..."
                  data-testid="item-brand-input"
                />
              </div>
              
              <div>
                <Label>Véhicules compatibles</Label>
                <Input
                  value={itemForm.compatible_vehicles}
                  onChange={(e) => setItemForm({ ...itemForm, compatible_vehicles: e.target.value })}
                  placeholder="Ex: BMW E46, E39, E60"
                  data-testid="item-vehicles-input"
                />
              </div>
              
              <div>
                <Label>Prix d'achat (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.purchase_price}
                  onChange={(e) => setItemForm({ ...itemForm, purchase_price: e.target.value })}
                  data-testid="item-purchase-price-input"
                />
              </div>
              
              <div>
                <Label>Prix de vente (€)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.selling_price}
                  onChange={(e) => setItemForm({ ...itemForm, selling_price: e.target.value })}
                  data-testid="item-selling-price-input"
                />
              </div>
              
              <div>
                <Label>État</Label>
                <Select value={itemForm.condition} onValueChange={(v) => setItemForm({ ...itemForm, condition: v })}>
                  <SelectTrigger data-testid="item-condition-select">
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
                  data-testid="item-threshold-input"
                />
              </div>
              
              <div className="md:col-span-2">
                <Label>Notes internes</Label>
                <Textarea
                  value={itemForm.notes}
                  onChange={(e) => setItemForm({ ...itemForm, notes: e.target.value })}
                  placeholder="Notes internes, état détaillé, provenance..."
                  rows={3}
                  data-testid="item-notes-input"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowItemModal(false)}>Annuler</Button>
              <Button onClick={handleSaveItem} disabled={!itemForm.name || !itemForm.section_id || savingItem} data-testid="save-item-btn">
                {savingItem ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {editingItem ? 'Modifier' : 'Ajouter'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
