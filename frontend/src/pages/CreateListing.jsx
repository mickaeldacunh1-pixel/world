import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ArrowLeft, Upload, X, ImagePlus, Loader2 } from 'lucide-react';

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

export default function CreateListing() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState(['']);
  const [piecesSubcategories, setPiecesSubcategories] = useState({});
  const [accessoiresSubcategories, setAccessoiresSubcategories] = useState({});
  const [carBrands, setCarBrands] = useState([]);

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
    // Compatibilité
    compatible_brands: [],
    compatible_models: '',
    compatible_years: '',
    oem_reference: '',
    aftermarket_reference: '',
  });

  useEffect(() => {
    fetchSubcategories();
    fetchCarBrands();
  }, []);

  const fetchSubcategories = async () => {
    try {
      const [piecesRes, accessoiresRes] = await Promise.all([
        axios.get(`${API}/subcategories/pieces`),
        axios.get(`${API}/subcategories/accessoires`)
      ]);
      setPiecesSubcategories(piecesRes.data);
      setAccessoiresSubcategories(accessoiresRes.data);
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

  const addImageUrl = () => {
    if (imageUrls.length < 6) {
      setImageUrls([...imageUrls, '']);
    }
  };

  const updateImageUrl = (index, value) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const removeImageUrl = (index) => {
    setImageUrls(imageUrls.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (user.credits <= 0) {
      toast.error('Vous n\'avez pas de crédits. Achetez un pack d\'annonces.');
      navigate('/tarifs');
      return;
    }

    if (!formData.title || !formData.description || !formData.price || !formData.category) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      const images = imageUrls.filter(url => url.trim() !== '');
      const compatible_models = formData.compatible_models 
        ? formData.compatible_models.split(',').map(m => m.trim()).filter(m => m)
        : [];
      
      const response = await axios.post(`${API}/listings`, {
        ...formData,
        price: parseFloat(formData.price),
        year: formData.year ? parseInt(formData.year) : null,
        mileage: formData.mileage ? parseInt(formData.mileage) : null,
        compatible_models,
        images,
      });

      await refreshUser();
      toast.success('Annonce publiée avec succès !');
      navigate(`/annonce/${response.data.id}`);
    } catch (error) {
      if (error.response?.status === 402) {
        toast.error('Crédits insuffisants. Achetez un pack d\'annonces.');
        navigate('/tarifs');
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
                Crédits disponibles: <span className="font-bold text-accent">{user?.credits || 0}</span>
              </span>
            </CardTitle>
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
              </div>

              {/* Images */}
              <div className="space-y-4">
                <Label>Photos (URLs)</Label>
                <p className="text-sm text-muted-foreground">
                  Ajoutez jusqu'à 6 photos via leurs URLs
                </p>
                {imageUrls.map((url, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="https://exemple.com/image.jpg"
                      value={url}
                      onChange={(e) => updateImageUrl(index, e.target.value)}
                      data-testid={`image-url-${index}`}
                    />
                    {imageUrls.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeImageUrl(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
                {imageUrls.length < 6 && (
                  <Button type="button" variant="outline" onClick={addImageUrl} className="w-full">
                    <ImagePlus className="w-4 h-4 mr-2" />
                    Ajouter une image
                  </Button>
                )}
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  className="flex-1 h-12 bg-accent hover:bg-accent/90 btn-primary"
                  disabled={loading || user?.credits <= 0}
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
