import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Upload, X, ImagePlus, Loader2, Save } from 'lucide-react';
import SEO from '../components/SEO';
import CommissionSimulator from '../components/CommissionSimulator';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { value: 'pieces', label: 'Pièces Détachées' },
  { value: 'voitures', label: 'Voitures d\'Occasion' },
  { value: 'motos', label: 'Motos' },
  { value: 'utilitaires', label: 'Utilitaires' },
  { value: 'accessoires', label: 'Accessoires' },
];

const conditions = [
  { value: 'neuf', label: 'Neuf' },
  { value: 'occasion', label: 'Occasion' },
  { value: 'reconditionne', label: 'Reconditionné' },
];

export default function EditListing() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [images, setImages] = useState([]);
  const [piecesSubcategories, setPiecesSubcategories] = useState({});
  const [accessoiresSubcategories, setAccessoiresSubcategories] = useState({});
  const [carBrands, setCarBrands] = useState([]);
  const fileInputRef = useRef(null);

  const regions = [
    { value: 'ile-de-france', label: 'Île-de-France' },
    { value: 'auvergne-rhone-alpes', label: 'Auvergne-Rhône-Alpes' },
    { value: 'hauts-de-france', label: 'Hauts-de-France' },
    { value: 'nouvelle-aquitaine', label: 'Nouvelle-Aquitaine' },
    { value: 'occitanie', label: 'Occitanie' },
    { value: 'grand-est', label: 'Grand Est' },
    { value: 'provence-alpes-cote-dazur', label: 'Provence-Alpes-Côte d\'Azur' },
    { value: 'pays-de-la-loire', label: 'Pays de la Loire' },
    { value: 'bretagne', label: 'Bretagne' },
    { value: 'normandie', label: 'Normandie' },
    { value: 'bourgogne-franche-comte', label: 'Bourgogne-Franche-Comté' },
    { value: 'centre-val-de-loire', label: 'Centre-Val de Loire' },
    { value: 'corse', label: 'Corse' },
  ];

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
    compatible_brands: [],
    compatible_models: '',
    compatible_years: '',
    oem_reference: '',
    aftermarket_reference: '',
  });

  useEffect(() => {
    fetchSubcategories();
    fetchCarBrands();
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const response = await axios.get(`${API}/listings/${id}`);
      const listing = response.data;
      
      // Vérifier que l'utilisateur est le propriétaire
      if (user && listing.seller_id !== user.id) {
        toast.error('Vous ne pouvez pas modifier cette annonce');
        navigate('/tableau-de-bord');
        return;
      }
      
      setFormData({
        title: listing.title || '',
        description: listing.description || '',
        price: listing.price?.toString() || '',
        category: listing.category || '',
        subcategory: listing.subcategory || '',
        condition: listing.condition || 'occasion',
        brand: listing.brand || '',
        model: listing.model || '',
        year: listing.year?.toString() || '',
        mileage: listing.mileage?.toString() || '',
        location: listing.location || '',
        postal_code: listing.postal_code || '',
        region: listing.region || '',
        shipping_cost: listing.shipping_cost?.toString() || '',
        shipping_info: listing.shipping_info || '',
        compatible_brands: listing.compatible_brands || [],
        compatible_models: listing.compatible_models?.join(', ') || '',
        compatible_years: listing.compatible_years || '',
        oem_reference: listing.oem_reference || '',
        aftermarket_reference: listing.aftermarket_reference || '',
      });
      
      setImages(listing.images || []);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Annonce introuvable');
      navigate('/tableau-de-bord');
    } finally {
      setLoadingData(false);
    }
  };

  const fetchSubcategories = async () => {
    try {
      const [piecesRes, accessoiresRes] = await Promise.all([
        axios.get(`${API}/categories/pieces`),
        axios.get(`${API}/categories/accessoires`)
      ]);
      setPiecesSubcategories(piecesRes.data);
      setAccessoiresSubcategories(accessoiresRes.data);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchCarBrands = async () => {
    try {
      const response = await axios.get(`${API}/car-brands`);
      setCarBrands(response.data);
    } catch (error) {
      console.error('Error fetching car brands:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    
    if (images.length + files.length > 10) {
      toast.error('Maximum 10 images par annonce');
      return;
    }

    setUploadingImages(true);
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${API}/upload-image`, formData, {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
        });
        
        setImages(prev => [...prev, response.data.url]);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Erreur upload: ${file.name}`);
      }
    }
    
    setUploadingImages(false);
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const compatible_models = formData.compatible_models 
        ? formData.compatible_models.split(',').map(m => m.trim()).filter(m => m)
        : [];
      
      await axios.put(`${API}/listings/${id}`, {
        ...formData,
        price: parseFloat(formData.price),
        shipping_cost: formData.shipping_cost ? parseFloat(formData.shipping_cost) : null,
        year: formData.year ? parseInt(formData.year) : null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        compatible_models,
        images: images,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Annonce modifiée avec succès !');
      navigate(`/annonce/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la modification');
    } finally {
      setLoading(false);
    }
  };

  const showVehicleFields = ['voitures', 'motos', 'utilitaires'].includes(formData.category);
  const showSubcategories = formData.category === 'pieces' || formData.category === 'accessoires';
  const subcategories = formData.category === 'pieces' ? piecesSubcategories : accessoiresSubcategories;

  if (loadingData) {
    return (
      <div className="min-h-screen bg-secondary/30 py-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO 
        title="Modifier mon annonce"
        description="Modifiez votre annonce sur World Auto Pro Pro"
        noindex={true}
      />
      
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link to={`/annonce/${id}`} className="text-muted-foreground hover:text-foreground flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'annonce
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="font-heading text-2xl">Modifier mon annonce</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title">Titre de l'annonce *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Phare avant gauche BMW Série 3 E90"
                  value={formData.title}
                  onChange={(e) => handleChange('title', e.target.value)}
                  required
                />
              </div>

              {/* Category & Subcategory */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Catégorie *</Label>
                  <Select value={formData.category} onValueChange={(v) => handleChange('category', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {showSubcategories && Object.keys(subcategories).length > 0 && (
                  <div className="space-y-2">
                    <Label>Sous-catégorie</Label>
                    <Select value={formData.subcategory} onValueChange={(v) => handleChange('subcategory', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(subcategories).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>État *</Label>
                  <Select value={formData.condition} onValueChange={(v) => handleChange('condition', v)}>
                    <SelectTrigger>
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

              {/* Shipping */}
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
                    />
                  </div>
                </div>
              </div>

              {/* Vehicle fields */}
              {showVehicleFields && (
                <div className="p-4 bg-secondary/50 rounded-lg space-y-4">
                  <h3 className="font-medium">Informations véhicule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="brand">Marque</Label>
                      <Input
                        id="brand"
                        placeholder="Ex: BMW, Renault..."
                        value={formData.brand}
                        onChange={(e) => handleChange('brand', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="model">Modèle</Label>
                      <Input
                        id="model"
                        placeholder="Ex: Série 3, Clio..."
                        value={formData.model}
                        onChange={(e) => handleChange('model', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year">Année</Label>
                      <Input
                        id="year"
                        type="number"
                        min="1900"
                        max="2030"
                        placeholder="2020"
                        value={formData.year}
                        onChange={(e) => handleChange('year', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mileage">Kilométrage</Label>
                      <Input
                        id="mileage"
                        type="number"
                        min="0"
                        placeholder="150000"
                        value={formData.mileage}
                        onChange={(e) => handleChange('mileage', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Compatibility (for parts) */}
              {(formData.category === 'pieces' || formData.category === 'accessoires') && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-4">
                  <h3 className="font-medium text-blue-900">🔧 Compatibilité véhicule</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Marques compatibles</Label>
                      <Select 
                        value={formData.compatible_brands[0] || ''} 
                        onValueChange={(v) => handleChange('compatible_brands', [v])}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner..." />
                        </SelectTrigger>
                        <SelectContent>
                          {carBrands.map(brand => (
                            <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compatible_models">Modèles compatibles</Label>
                      <Input
                        id="compatible_models"
                        placeholder="Ex: Série 3, Série 5"
                        value={formData.compatible_models}
                        onChange={(e) => handleChange('compatible_models', e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">Séparez par des virgules</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="compatible_years">Années compatibles</Label>
                      <Input
                        id="compatible_years"
                        placeholder="Ex: 2015-2020"
                        value={formData.compatible_years}
                        onChange={(e) => handleChange('compatible_years', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oem_reference">Référence OEM</Label>
                      <Input
                        id="oem_reference"
                        placeholder="Ex: 63117377851"
                        value={formData.oem_reference}
                        onChange={(e) => handleChange('oem_reference', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}

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
                />
              </div>

              {/* Location */}
              <div className="p-4 bg-secondary/50 rounded-lg space-y-4">
                <h3 className="font-medium">📍 Localisation</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Ville</Label>
                    <Input
                      id="location"
                      placeholder="Paris"
                      value={formData.location}
                      onChange={(e) => handleChange('location', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Code postal</Label>
                    <Input
                      id="postal_code"
                      placeholder="75001"
                      maxLength={5}
                      value={formData.postal_code}
                      onChange={(e) => handleChange('postal_code', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Région</Label>
                    <Select value={formData.region} onValueChange={(v) => handleChange('region', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner..." />
                      </SelectTrigger>
                      <SelectContent>
                        {regions.map(reg => (
                          <SelectItem key={reg.value} value={reg.value}>{reg.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Images */}
              <div className="space-y-4">
                <Label>Photos ({images.length}/10)</Label>
                
                <div className="grid grid-cols-5 gap-4">
                  {images.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-lg overflow-hidden border">
                      <img src={url} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {images.length < 10 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingImages}
                      className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 hover:border-accent flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-accent transition-colors"
                    >
                      {uploadingImages ? (
                        <Loader2 className="w-8 h-8 animate-spin" />
                      ) : (
                        <>
                          <ImagePlus className="w-8 h-8" />
                          <span className="text-xs">Ajouter</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <Link to={`/annonce/${id}`} className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Annuler
                  </Button>
                </Link>
                <Button 
                  type="submit" 
                  className="flex-1 bg-accent hover:bg-accent/90"
                  disabled={loading || uploadingImages}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Enregistrer les modifications
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
