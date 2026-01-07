import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Camera, Loader2, Search, DollarSign, Sparkles, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AITools() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('recognize');
  const [isOpen, setIsOpen] = useState(false);
  
  // Recognition state
  const [recognizing, setRecognizing] = useState(false);
  const [recognitionResult, setRecognitionResult] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  
  // Price estimation state
  const [estimating, setEstimating] = useState(false);
  const [estimationResult, setEstimationResult] = useState(null);
  const [partName, setPartName] = useState('');
  const [condition, setCondition] = useState('occasion');
  const [brand, setBrand] = useState('');
  const [year, setYear] = useState('');

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPreviewImage(e.target.result);
    reader.readAsDataURL(file);

    // Upload and recognize
    setRecognizing(true);
    setRecognitionResult(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API}/ai/recognize-part`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setRecognitionResult(response.data.analysis);
      toast.success('Analyse terminée !');
    } catch (error) {
      toast.error('Erreur lors de l\'analyse');
      console.error(error);
    } finally {
      setRecognizing(false);
    }
  };

  const handleEstimatePrice = async () => {
    if (!partName.trim()) {
      toast.error('Veuillez entrer le nom de la pièce');
      return;
    }

    setEstimating(true);
    setEstimationResult(null);
    
    try {
      const response = await axios.post(`${API}/ai/estimate-price`, {
        part_name: partName,
        condition,
        brand: brand || null,
        year: year ? parseInt(year) : null
      });
      
      setEstimationResult(response.data.estimation);
      toast.success('Estimation terminée !');
    } catch (error) {
      toast.error('Erreur lors de l\'estimation');
      console.error(error);
    } finally {
      setEstimating(false);
    }
  };

  const clearRecognition = () => {
    setPreviewImage(null);
    setRecognitionResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatResult = (text) => {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br />');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="gap-2 border-accent/50 hover:border-accent hover:bg-accent/10"
        >
          <Sparkles className="w-4 h-4 text-accent" />
          {t('home.ai_diagnostic')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            {t('home.ai_diagnostic')} - World Auto France
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b pb-4 mt-4">
          <Button
            variant={activeTab === 'recognize' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('recognize')}
            className={activeTab === 'recognize' ? 'bg-accent hover:bg-accent/90' : ''}
          >
            <Camera className="w-4 h-4 mr-2" />
            Reconnaissance
          </Button>
          <Button
            variant={activeTab === 'estimate' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('estimate')}
            className={activeTab === 'estimate' ? 'bg-accent hover:bg-accent/90' : ''}
          >
            <DollarSign className="w-4 h-4 mr-2" />
            Estimation Prix
          </Button>
        </div>

        {/* Recognition Tab */}
        {activeTab === 'recognize' && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              📷 Prenez une photo d'une pièce automobile et notre IA l'identifiera pour vous !
            </p>

            {/* Image Upload */}
            {!previewImage ? (
              <div 
                className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-accent transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium">Cliquez pour prendre ou choisir une photo</p>
                <p className="text-sm text-muted-foreground mt-1">JPG, PNG, WebP acceptés</p>
              </div>
            ) : (
              <div className="relative">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full max-h-64 object-contain rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearRecognition}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Loading */}
            {recognizing && (
              <div className="flex items-center justify-center gap-3 py-6">
                <Loader2 className="w-6 h-6 animate-spin text-accent" />
                <span>Analyse en cours...</span>
              </div>
            )}

            {/* Result */}
            {recognitionResult && (
              <Card className="border-accent/30 bg-accent/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Search className="w-5 h-5 text-accent" />
                    Résultat de l'analyse
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatResult(recognitionResult) }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Estimation Tab */}
        {activeTab === 'estimate' && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              💰 Obtenez une estimation du prix de votre pièce basée sur le marché actuel.
            </p>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="partName">Nom de la pièce *</Label>
                <Input
                  id="partName"
                  placeholder="Ex: Alternateur, Filtre à huile, Plaquettes de frein..."
                  value={partName}
                  onChange={(e) => setPartName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>État</Label>
                  <Select value={condition} onValueChange={setCondition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="neuf">Neuf</SelectItem>
                      <SelectItem value="occasion">Occasion - Bon état</SelectItem>
                      <SelectItem value="use">Occasion - Usé</SelectItem>
                      <SelectItem value="reconditionne">Reconditionné</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="brand">Marque compatible</Label>
                  <Input
                    id="brand"
                    placeholder="Ex: Renault, Peugeot..."
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="year">Année du véhicule</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="Ex: 2018"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>

              <Button 
                onClick={handleEstimatePrice}
                disabled={estimating || !partName.trim()}
                className="w-full bg-accent hover:bg-accent/90"
              >
                {estimating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Estimation en cours...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Estimer le prix
                  </>
                )}
              </Button>
            </div>

            {/* Estimation Result */}
            {estimationResult && (
              <Card className="border-green-500/30 bg-green-50 dark:bg-green-900/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2 text-green-700 dark:text-green-400">
                    <DollarSign className="w-5 h-5" />
                    Estimation de prix
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div 
                    className="prose prose-sm max-w-none prose-green"
                    dangerouslySetInnerHTML={{ __html: formatResult(estimationResult) }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
