import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Upload, X, ImagePlus, Loader2, Video, Play, Camera, Plus, Sparkles, Shield, Package, Search, Check, Warehouse } from 'lucide-react';
import CommissionSimulator from '../components/CommissionSimulator';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { value: 'pieces', label: 'Pièces Détachées' },
  { value: 'voitures', label: 'Voitures d\'Occasion' },
  { value: 'motos', label: 'Motos' },
  { value: 'utilitaires', label: 'Utilitaires' },
  { value: 'engins', label: 'Engins' },
  { value: 'accessoires', label: 'Accessoires' },
  { value: 'recherche', label: 'Recherche (je cherche une pièce)' },
  { value: 'rare', label: 'Rare & Collection' },
];

const conditions = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'occasion', label: 'Occasion' },
  { value: 'reconditionne', label: 'Reconditionné' },
];

export default function CreateListing() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [images, setImages] = useState([]);
  const [videoUrl, setVideoUrl] = useState('');
  const [piecesSubcategories, setPiecesSubcategories] = useState({});
  const [accessoiresSubcategories, setAccessoiresSubcategories] = useState({});
  const [motosSubcategories, setMotosSubcategories] = useState({});
  const [utilitairesSubcategories, setUtilitairesSubcategories] = useState({});
  const [enginsSubcategories, setEnginsSubcategories] = useState({});
  const [carBrands, setCarBrands] = useState([]);
  const [photoLimit, setPhotoLimit] = useState({ max_photos: 6, extra_credits: 0, is_pro: false });
  const [videoLimit, setVideoLimit] = useState({ max_duration: 30, max_size_mb: 30, is_extended: false });
  const [buyingPhotos, setBuyingPhotos] = useState(false);
  const [buyingVideo, setBuyingVideo] = useState(false);
  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // États pour la sélection d'article entrepôt
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [warehouseItems, setWarehouseItems] = useState([]);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [warehouseSearch, setWarehouseSearch] = useState('');
  const [selectedWarehouseItem, setSelectedWarehouseItem] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    condition: 'occasion',
    brand: '',
    model: '',
    year: '',
    mileage: '',
    location: '',
    postal_code: '',
    region: '',
    shipping_cost: '',
    shipping_info: '',
    shipping_methods: [], // Modes de livraison sélectionnés
    // Compatibilité
    compatible_brands: [],
    compatible_models: '',
    compatible_years: '',
    oem_reference: '',
    aftermarket_reference: '',
    // Confiance & Traçabilité
    part_origin: '',
    vehicle_mileage: '',
  });

  // Options de livraison disponibles
  const shippingOptions = [
    { value: 'hand_delivery', label: 'Remise en main propre', icon: '🤝', description: "L'acheteur vient chercher" },
    { value: 'colissimo', label: 'Colissimo', icon: '📦', description: 'La Poste - 2-3 jours' },
    { value: 'mondial_relay', label: 'Mondial Relay', icon: '🏪', description: 'Point relais - Économique' },
    { value: 'chronopost', label: 'Chronopost', icon: '⚡', description: 'Express 24h' },
    { value: 'boxtal', label: 'Boxtal Multi-Transporteurs', icon: '🚚', description: 'Comparez les prix' },
    { value: 'custom', label: 'Autre transporteur', icon: '📋', description: 'À préciser' },
  ];

  const regions = [
    { value: 'ile-de-france', label: 'Île-de-France' },
    { value: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes' },
    { value: 'nouvelle-aquitaine', label: 'Nouvelle-Aquitaine' },
    { value: 'occitanie', label: 'Occitanie' },
    { value: 'hauts-de-france', label: 'Hauts-de-France' },
    { value: 'paca', label: 'Provence-Alpes-Côte d\'Azur' },
    { value: 'grand-est', label: 'Grand Est' },
    { value: 'pays-de-la-loire', label: 'Pays de la Loire' },
    { value: 'bretagne', label: 'Bretagne' },
    { value: 'normandie', label: 'Normandie' },
    { value: 'bourgogne-franche-comte', label: 'Bourgogne-Franche-Comté' },
    { value: 'centre-val-de-loire', label: 'Centre-Val de Loire' },
    { value: 'corse', label: 'Corse' },
  ];

  useEffect(() => {
    fetchSubcategories();
    fetchCarBrands();
    fetchPhotoLimit();
    fetchVideoLimit();
    
    // Handle photo purchase success/cancel
    if (searchParams.get('photos_success') === 'true') {
      toast.success('🎉 +15 photos supplémentaires ajoutées !');
      fetchPhotoLimit();
      refreshUser();
    } else if (searchParams.get('photos_cancelled') === 'true') {
      toast.info('Achat de photos annulé');
    }
    
    // Handle video purchase success/cancel
    if (searchParams.get('video_success') === 'true') {
      toast.success('🎬 Option vidéo étendue activée ! (2 min / 100 Mo)');
      fetchVideoLimit();
      refreshUser();
    } else if (searchParams.get('video_cancelled') === 'true') {
      toast.info('Achat vidéo annulé');
    }
  }, [searchParams]);

  // Charger les articles de l'entrepôt
  const fetchWarehouseItems = async () => {
    setLoadingWarehouse(true);
    try {
      const response = await axios.get(`${API}/warehouse/items`);
      // Filtrer uniquement les articles avec stock > 0 et non déjà liés à une annonce
      const availableItems = response.data.filter(item => item.quantity > 0 && !item.listing_id);
      setWarehouseItems(availableItems);
    } catch (error) {
      console.error('Error fetching warehouse items:', error);
      toast.error('Erreur lors du chargement des articles');
    } finally {
      setLoadingWarehouse(false);
    }
  };

  // Ouvrir le modal de sélection d'article entrepôt
  const openWarehouseModal = () => {
    fetchWarehouseItems();
    setShowWarehouseModal(true);
  };

  // Sélectionner un article et pré-remplir le formulaire
  const handleSelectWarehouseItem = (item) => {
    setSelectedWarehouseItem(item);
    setFormData(prev => ({
      ...prev,
      title: item.name || '',
      description: item.notes || '',
      price: item.selling_price?.toString() || '',
      condition: item.condition || 'occasion',
      brand: item.brand || '',
      oem_reference: item.reference_oem || '',
      compatible_models: item.compatible_vehicles || '',
    }));
    setShowWarehouseModal(false);
    toast.success(`Article "${item.name}" sélectionné ! Complétez les informations manquantes.`);
  };

  // Retirer l'article entrepôt sélectionné
  const clearWarehouseItem = () => {
    setSelectedWarehouseItem(null);
    toast.info('Article entrepôt retiré');
  };

  // Filtrer les articles entrepôt par recherche
  const filteredWarehouseItems = warehouseItems.filter(item => 
    item.name?.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
    item.reference_oem?.toLowerCase().includes(warehouseSearch.toLowerCase()) ||
    item.brand?.toLowerCase().includes(warehouseSearch.toLowerCase())
  );

  const fetchPhotoLimit = async () => {
    try {
      const response = await axios.get(`${API}/users/me/photo-limit`);
      setPhotoLimit(response.data);
    } catch (error) {
      console.error('Error fetching photo limit:', error);
    }
  };

  const fetchVideoLimit = async () => {
    try {
      const response = await axios.get(`${API}/users/me/video-limit`);
      setVideoLimit(response.data);
    } catch (error) {
      console.error('Error fetching video limit:', error);
    }
  };

  const handleBuyExtraPhotos = async () => {
    setBuyingPhotos(true);
    try {
      const response = await axios.post(`${API}/photos/create-checkout-session`);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error('Erreur lors de la création du paiement');
      setBuyingPhotos(false);
    }
  };

  const handleBuyExtendedVideo = async () => {
    setBuyingVideo(true);
    try {
      const response = await axios.post(`${API}/video/create-checkout-session`);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error('Error creating video checkout:', error);
      toast.error('Erreur lors de la création du paiement');
      setBuyingVideo(false);
    }
  };

  const maxPhotos = photoLimit.max_photos || 6;

  const fetchSubcategories = async () => {
    try {
      const [piecesRes, accessoiresRes, motosRes, utilitairesRes, enginsRes] = await Promise.all([
        axios.get(`${API}/subcategories/pieces`),
        axios.get(`${API}/subcategories/accessoires`),
        axios.get(`${API}/subcategories/motos`),
        axios.get(`${API}/subcategories/utilitaires`),
        axios.get(`${API}/subcategories/engins`)
      ]);
      setPiecesSubcategories(piecesRes.data);
      setAccessoiresSubcategories(accessoiresRes.data);
      setMotosSubcategories(motosRes.data);
      setUtilitairesSubcategories(utilitairesRes.data);
      setEnginsSubcategories(enginsRes.data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchCarBrands = async () => {
    try {
      const response = await axios.get(`${API}/brands`);
      setCarBrands(response.data);
    } catch (error) {
      console.error('Error fetching car brands:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleCompatibleBrand = (brand) => {
    setFormData(prev => {
      const brands = prev.compatible_brands.includes(brand)
        ? prev.compatible_brands.filter(b => b !== brand)
        : [...prev.compatible_brands, brand];
      return { ...prev, compatible_brands: brands };
    });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    const maxPhotos = photoLimit.max_photos || 5;
    
    if (images.length + files.length > maxPhotos) {
      toast.error(`Maximum ${maxPhotos} photos. Achetez des photos supplémentaires pour en ajouter plus.`);
      return;
    }

    setUploadingImages(true);
    const token = localStorage.getItem('token');

    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await axios.post(`${API}/upload/image`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });

        setImages(prev => [...prev, {
          url: response.data.url,
          public_id: response.data.public_id
        }]);
      } catch (error) {
        toast.error(`Erreur lors de l'upload: ${file.name}`);
        console.error('Upload error:', error);
      }
    }
    setUploadingImages(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeImage = async (index) => {
    const image = images[index];
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/upload/image/${encodeURIComponent(image.public_id)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Delete error:', error);
    }
    setImages(images.filter((_, i) => i !== index));
  };

  // Video upload handler
  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file size based on user's limit
    const maxSizeMb = videoLimit.max_size_mb || 30;
    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`La vidéo ne doit pas dépasser ${maxSizeMb} Mo. ${!videoLimit.is_extended ? 'Achetez l\'option vidéo étendue pour 1€ (100 Mo, 2 min).' : ''}`);
      return;
    }

    // Check file type
    if (!file.type.startsWith('video/')) {
      toast.error('Veuillez sélectionner un fichier vidéo');
      return;
    }

    setUploadingVideo(true);
    try {
      const token = localStorage.getItem('token');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await axios.post(`${API}/upload/video`, formDataUpload, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      setVideoUrl(response.data.url);
      
      // Refresh video limit if extended credit was used
      if (response.data.used_extended) {
        fetchVideoLimit();
      }
      
      toast.success(`🎬 Vidéo uploadée ! (${Math.round(response.data.duration || 0)}s)`);
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erreur lors de l\'upload de la vidéo';
      toast.error(errorMsg);
      console.error('Video upload error:', error);
    } finally {
      setUploadingVideo(false);
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
    }
  };

  const removeVideo = () => {
    setVideoUrl('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Vérifier si l'utilisateur a des crédits OU des annonces gratuites
    const hasCredits = (user?.credits || 0) > 0;
    const hasFreeAds = (user?.free_ads_remaining || 0) > 0;
    
    if (!hasCredits && !hasFreeAds) {
      toast.error('Vous n\'avez pas de crédits. Achetez un pack d\'annonces.');
      navigate('/tarifs');
      return;
    }

    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.shipping_methods.length === 0) {
      toast.error('Veuillez sélectionner au moins un mode de livraison');
      return;
    }

    setLoading(true);
    try {
      const imageUrls = images.map(img => img.url);
      const compatible_models = formData.compatible_models 
        ? formData.compatible_models.split(',').map(m => m.trim()).filter(m => m)
        : [];
      
      const response = await axios.post(`${API}/listings`, {
        ...formData,
        price: parseFloat(formData.price),
        shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : null,
        shipping_methods: formData.shipping_methods,
        year: formData.year ? parseInt(formData.year) : null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        vehicle_mileage: formData.vehicle_mileage ? parseInt(formData.vehicle_mileage) : null,
        compatible_models,
        images: imageUrls,
        video_url: videoUrl || null,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      await refreshUser();
      toast.success('Annonce publiée avec succès !');
      navigate(`/annonce/${response.data.id}`);
    } catch (error) {
      console.error('Erreur création annonce:', error);
      if (error.response?.status === 402) {
        toast.error('Crédits insuffisants. Achetez un pack d\'annonces.');
        navigate('/tarifs');
      } else if (error.response?.status === 403) {
        toast.error(error.response?.data?.detail || 'Action non autorisée');
      } else {
        toast.error(error.response?.data?.detail || 'Erreur lors de la publication');
      }
    } finally {
      setLoading(false);
    }
  };

  const showVehicleFields = ['voitures', 'motos', 'utilitaires'].includes(formData.category);

  return (
    <div className="min-h-screen bg-secondary/30 py-8" data-testid="create-listing-page">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/tableau-de-bord" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" />
          Retour au tableau de bord
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl flex items-center justify-between">
              Déposer une annonce
              <span className="text-sm font-normal text-muted-foreground">
                {(user?.free_ads_remaining || 0) > 0 ? (
                  <span>Annonces gratuites: <span className="font-bold text-green-600">{user.free_ads_remaining}</span></span>
                ) : (
                  <span>Crédits: <span className="font-bold text-accent">{user?.credits || 0}</span></span>
                )}
              </span>
            </CardTitle>
            {user?.is_professional && (
              <div className="mb-6 p-4 bg-accent/10 border border-accent/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-accent">💼 Espace PRO</h3>
                    <p className="text-sm text-muted-foreground">Gérez votre stock et publiez depuis votre entrepôt</p>
                  </div>
                  <Link to="/entrepot">
                    <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-white">
                      Mon Entrepôt
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Category */}
              <div className="space-y-2">
                <Label>Catégorie *</Label>
                <Select value={formData.category} onValueChange={(v) => { handleChange('category', v); handleChange('subcategory', ''); }}>
                  <SelectTrigger data-testid="category-select">
                    <SelectValue placeholder="Choisir une catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Subcategory for Pieces */}
              {formData.category === 'pieces' && Object.keys(piecesSubcategories).length > 0 && (
                <div className="space-y-2">
                  <Label>Type de pièce *</Label>
                  <Select value={formData.subcategory} onValueChange={(v) => handleChange('subcategory', v)}>
                    <SelectTrigger data-testid="subcategory-select">
                      <SelectValue placeholder="Choisir un type de pièce" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(piecesSubcategories).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Subcategory for Accessoires */}
              {formData.category === 'accessoires' && Object.keys(accessoiresSubcategories).length > 0 && (
                <div className="space-y-2">
                  <Label>Type d'accessoire *</Label>
                  <Select value={formData.subcategory} onValueChange={(v) => handleChange('subcategory', v)}>
                    <SelectTrigger data-testid="subcategory-select">
                      <SelectValue placeholder="Choisir un type d'accessoire" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(accessoiresSubcategories).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.category === 'motos' && Object.keys(motosSubcategories).length > 0 && (
                <div className="space-y-2">
                  <Label>Type de deux-roues *</Label>
                  <Select value={formData.subcategory} onValueChange={(v) => handleChange('subcategory', v)}>
                    <SelectTrigger data-testid="subcategory-select">
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(motosSubcategories).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.category === 'utilitaires' && Object.keys(utilitairesSubcategories).length > 0 && (
                <div className="space-y-2">
                  <Label>Type d&apos;utilitaire *</Label>
                  <Select value={formData.subcategory} onValueChange={(v) => handleChange('subcategory', v)}>
                    <SelectTrigger data-testid="subcategory-select">
                      <SelectValue placeholder="Choisir un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(utilitairesSubcategories).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.category === 'engins' && Object.keys(enginsSubcategories).length > 0 && (
                <div className="space-y-2">
                  <Label>Type d&apos;engin *</Label>
                  <Select value={formData.subcategory} onValueChange={(v) => handleChange('subcategory', v)}>
                    <SelectTrigger data-testid="subcategory-engins-select">
                      <SelectValue placeholder="Choisir un type d'engin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(enginsSubcategories).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'annonce *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Moteur BMW 320d 150cv en parfait état"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                  data-testid="title-input"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Décrivez votre article en détail..."
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  rows={5}
                  required
                  data-testid="description-input"
                />
              </div>

              {/* Price & Condition */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Prix (€) *</Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => handleChange('price', e.target.value)}
                    required
                    data-testid="price-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>État *</Label>
                  <Select value={formData.condition} onValueChange={(v) => handleChange('condition', v)}>
                    <SelectTrigger data-testid="condition-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map(cond => (
                        <SelectItem key={cond.value} value={cond.value}>{cond.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Commission Simulator */}
              {formData.price && parseFloat(formData.price) > 0 && (
                <CommissionSimulator 
                  price={formData.price} 
                  shippingCost={formData.shipping_cost}
                />
              )}

              {/* Shipping / Livraison */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                <h3 className="font-medium text-blue-900">📦 Livraison</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="shipping_cost">Frais de port (€)</Label>
                    <Input
                      id="shipping_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0 = Gratuit, vide = À définir"
                      value={formData.shipping_cost}
                      onChange={(e) => handleChange('shipping_cost', e.target.value)}
                      data-testid="shipping-cost-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Laissez vide si à définir avec l'acheteur
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shipping_info">Infos livraison</Label>
                    <Input
                      id="shipping_info"
                      placeholder="Ex: Colissimo, retrait possible..."
                      value={formData.shipping_info}
                      onChange={(e) => handleChange('shipping_info', e.target.value)}
                      data-testid="shipping-info-input"
                    />
                  </div>
                </div>
                
                {/* Shipping Methods Selection */}
                <div className="mt-4">
                  <Label className="mb-2 block">Modes de livraison acceptés *</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {shippingOptions.map((option) => {
                      const isSelected = formData.shipping_methods.includes(option.value);
                      return (
                        <div
                          key={option.value}
                          onClick={() => {
                            const newMethods = isSelected
                              ? formData.shipping_methods.filter(m => m !== option.value)
                              : [...formData.shipping_methods, option.value];
                            handleChange('shipping_methods', newMethods);
                          }}
                          className={`cursor-pointer p-3 rounded-lg border-2 transition-all ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' 
                              : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
                          }`}
                          data-testid={`shipping-method-${option.value}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{option.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${isSelected ? 'text-blue-900 dark:text-blue-200' : 'text-gray-900 dark:text-gray-100'}`}>
                                {option.label}
                              </p>
                              <p className="text-xs text-gray-500 truncate">{option.description}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sélectionnez au moins un mode de livraison
                  </p>
                </div>
              </div>

              {/* Vehicle-specific fields */}
              {showVehicleFields && (
                <div className="p-4 bg-secondary/50 rounded-lg space-y-4 animate-fade-in">
                  <h3 className="font-medium">Informations véhicule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Marque</Label>
                      <Input
                        id="brand"
                        placeholder="Ex: BMW, Renault..."
                        value={formData.brand}
                        onChange={(e) => handleChange('brand', e.target.value)}
                        data-testid="brand-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Modèle</Label>
                      <Input
                        id="model"
                        placeholder="Ex: Série 3, Clio..."
                        value={formData.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                        data-testid="model-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Année</Label>
                      <Input
                        id="year"
                        type="number"
                        placeholder="2020"
                        value={formData.year}
                        onChange={(e) => handleChange('year', e.target.value)}
                        data-testid="year-input"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mileage">Kilométrage</Label>
                      <Input
                        id="mileage"
                        type="number"
                        placeholder="50000"
                        value={formData.mileage}
                        onChange={(e) => handleChange('mileage', e.target.value)}
                        data-testid="mileage-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Brand/Model for parts */}
              {formData.category === 'pieces' && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="brand">Marque du véhicule</Label>
                    <Input
                      id="brand"
                      placeholder="Ex: BMW, Renault..."
                      value={formData.brand}
                      onChange={(e) => handleChange('brand', e.target.value)}
                      data-testid="brand-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="model">Modèle compatible</Label>
                    <Input
                      id="model"
                      placeholder="Ex: Série 3, Clio..."
                      value={formData.model}
                      onChange={(e) => handleChange('model', e.target.value)}
                      data-testid="model-input"
                    />
                  </div>
                </div>
              )}

              {/* Compatibility Section - for pieces and accessoires */}
              {(formData.category === 'pieces' || formData.category === 'accessoires') && (
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg space-y-4">
                  <h3 className="font-heading font-bold text-lg flex items-center gap-2">
                    <span className="text-blue-600">🔧</span>
                    Compatibilité véhicule
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Ces informations aident les acheteurs à trouver la bonne pièce pour leur véhicule
                  </p>
                  
                  {/* Compatible Brands */}
                  <div className="space-y-2">
                    <Label>Marques compatibles</Label>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-white rounded border">
                      {carBrands.slice(0, -1).map((brand) => (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => toggleCompatibleBrand(brand)}
                          className={`px-3 py-1 rounded-full text-sm transition-colors ${
                            formData.compatible_brands.includes(brand)
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                          data-testid={`brand-tag-${brand}`}
                        >
                          {brand}
                        </button>
                      ))}
                    </div>
                    {formData.compatible_brands.length > 0 && (
                      <p className="text-sm text-accent">
                        {formData.compatible_brands.length} marque(s) sélectionnée(s)
                      </p>
                    )}
                  </div>

                  {/* Compatible Models */}
                  <div className="space-y-2">
                    <Label htmlFor="compatible_models">Modèles compatibles</Label>
                    <Input
                      id="compatible_models"
                      placeholder="Ex: 308, 3008, 508 (séparés par des virgules)"
                      value={formData.compatible_models}
                      onChange={(e) => handleChange('compatible_models', e.target.value)}
                      data-testid="compatible-models-input"
                    />
                  </div>

                  {/* Compatible Years */}
                  <div className="space-y-2">
                    <Label htmlFor="compatible_years">Années compatibles</Label>
                    <Input
                      id="compatible_years"
                      placeholder="Ex: 2015-2020"
                      value={formData.compatible_years}
                      onChange={(e) => handleChange('compatible_years', e.target.value)}
                      data-testid="compatible-years-input"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* OEM Reference */}
                    <div className="space-y-2">
                      <Label htmlFor="oem_reference">Référence OEM (constructeur)</Label>
                      <Input
                        id="oem_reference"
                        placeholder="Ex: 7701474426"
                        value={formData.oem_reference}
                        onChange={(e) => handleChange('oem_reference', e.target.value)}
                        data-testid="oem-reference-input"
                      />
                    </div>

                    {/* Aftermarket Reference */}
                    <div className="space-y-2">
                      <Label htmlFor="aftermarket_reference">Référence équipementier</Label>
                      <Input
                        id="aftermarket_reference"
                        placeholder="Ex: VALEO 437389"
                        value={formData.aftermarket_reference}
                        onChange={(e) => handleChange('aftermarket_reference', e.target.value)}
                        data-testid="aftermarket-reference-input"
                      />
                    </div>
                  </div>

                  {/* Confiance & Traçabilité */}
                  <div className="mt-6 p-4 border rounded-lg bg-secondary/30">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-accent" />
                      Traçabilité (améliore votre score de confiance)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="part_origin">Origine de la pièce</Label>
                        <Select value={formData.part_origin} onValueChange={(v) => handleChange('part_origin', v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner l'origine" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="casse">Casse automobile</SelectItem>
                            <SelectItem value="particulier">Particulier</SelectItem>
                            <SelectItem value="professionnel">Professionnel</SelectItem>
                            <SelectItem value="neuf">Pièce neuve</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="vehicle_mileage">Kilométrage du véhicule d'origine</Label>
                        <Input
                          id="vehicle_mileage"
                          type="number"
                          placeholder="Ex: 125000"
                          value={formData.vehicle_mileage}
                          onChange={(e) => handleChange('vehicle_mileage', e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">km au compteur lors du démontage</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Ville</Label>
                  <Input
                    id="location"
                    placeholder="Paris"
                    value={formData.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    data-testid="location-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Code postal</Label>
                  <Input
                    id="postal_code"
                    placeholder="75001"
                    value={formData.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    data-testid="postal-code-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Région</Label>
                  <Select value={formData.region} onValueChange={(v) => handleChange('region', v)}>
                    <SelectTrigger data-testid="region-select">
                      <SelectValue placeholder="Sélectionner une région" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Photos de l'annonce</Label>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${images.length >= maxPhotos ? 'text-orange-500' : 'text-muted-foreground'}`}>
                      {images.length}/{maxPhotos} photos
                    </span>
                    {photoLimit.is_pro && (
                      <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full">PRO</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ajoutez jusqu'à {maxPhotos} photos (JPG, PNG, WebP, HEIC - max 10MB chacune)
                </p>
                
                {/* Image Preview Grid */}
                {images.length > 0 && (
                  <div className="grid grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                        <img
                          src={image.url}
                          alt={`Photo ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 w-6 h-6"
                          onClick={() => removeImage(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        {index === 0 && (
                          <span className="absolute bottom-2 left-2 bg-accent text-white text-xs px-2 py-1 rounded">
                            Photo principale
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload Button */}
                {images.length < maxPhotos && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-accent transition-colors">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,.heic,.heif"
                      multiple
                      className="hidden"
                      id="image-upload"
                    />
                    <label htmlFor="image-upload" className="cursor-pointer">
                      {uploadingImages ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-accent" />
                          <span className="text-sm text-muted-foreground">Upload en cours...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Upload className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm font-medium">Cliquez pour ajouter des photos</span>
                          <span className="text-xs text-muted-foreground">
                            {images.length}/{maxPhotos} photos ajoutées
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                )}

                {/* Buy Extra Photos Option */}
                {images.length >= maxPhotos && !photoLimit.is_pro && (
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/30 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                          <Camera className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Besoin de plus de photos ?</p>
                          <p className="text-xs text-muted-foreground">+15 photos supplémentaires pour seulement 1€</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        onClick={handleBuyExtraPhotos}
                        disabled={buyingPhotos}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {buyingPhotos ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Plus className="w-4 h-4 mr-2" />
                        )}
                        Acheter +15 photos
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Video */}
              <div className="space-y-4">
                <Label className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Vidéo de présentation (optionnel)
                </Label>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {videoLimit.is_extended || videoLimit.is_pro ? (
                      <>🎬 Limite : <span className="font-medium text-green-600">{videoLimit.max_duration}s / {videoLimit.max_size_mb} Mo</span> {videoLimit.is_pro && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full ml-1">PRO</span>}</>
                    ) : (
                      <>🎬 Limite gratuite : <span className="font-medium">{videoLimit.max_duration}s / {videoLimit.max_size_mb} Mo</span></>
                    )}
                  </p>
                  {!videoLimit.is_extended && !videoLimit.is_pro && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleBuyExtendedVideo}
                      disabled={buyingVideo}
                      className="text-xs"
                    >
                      {buyingVideo ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                      2 min / 100 Mo pour 1€
                    </Button>
                  )}
                </div>
                
                {/* Video Preview */}
                {videoUrl && (
                  <div className="relative rounded-lg overflow-hidden border bg-black">
                    <video
                      src={videoUrl}
                      controls
                      className="w-full max-h-64"
                    >
                      Votre navigateur ne supporte pas la lecture vidéo.
                    </video>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={removeVideo}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {/* Video Upload Button */}
                {!videoUrl && (
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-accent transition-colors">
                    <input
                      type="file"
                      ref={videoInputRef}
                      onChange={handleVideoUpload}
                      accept="video/mp4,video/webm,video/quicktime,video/mov"
                      className="hidden"
                      id="video-upload"
                    />
                    <label htmlFor="video-upload" className="cursor-pointer">
                      {uploadingVideo ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="w-8 h-8 animate-spin text-accent" />
                          <span className="text-sm text-muted-foreground">Upload de la vidéo en cours...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2">
                          <Video className="w-8 h-8 text-muted-foreground" />
                          <span className="text-sm font-medium">Cliquez pour ajouter une vidéo</span>
                          <span className="text-xs text-muted-foreground">
                            Max {videoLimit.max_size_mb} Mo • {videoLimit.max_duration}s • MP4, MOV, WebM
                          </span>
                        </div>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-accent hover:bg-accent/90 btn-primary"
                  disabled={loading || uploadingImages || uploadingVideo || user?.credits <= 0}
                  data-testid="submit-listing-btn"
                >
                  {loading ? 'Publication...' : 'Publier l\'annonce (1 crédit)'}
                </Button>
              </div>

              {user?.credits <= 0 && (
                <p className="text-center text-destructive text-sm">
                  Vous n'avez plus de crédits.{' '}
                  <Link to="/tarifs" className="underline">Achetez un pack</Link>
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
