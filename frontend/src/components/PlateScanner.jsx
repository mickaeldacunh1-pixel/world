import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Camera, Upload, Car, Loader2, Check, X, ScanLine } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Marques et modèles de voitures
const CAR_DATA = {
  'Renault': ['Clio', 'Megane', 'Scenic', 'Captur', 'Kadjar', 'Twingo', 'Laguna', 'Espace', 'Talisman', 'Arkana', 'Austral', 'Koleos', 'Zoe', 'Kangoo', 'Trafic', 'Master'],
  'Peugeot': ['208', '308', '508', '2008', '3008', '5008', '108', 'Partner', 'Rifter', 'Expert', 'Boxer', 'e-208', 'e-2008'],
  'Citroën': ['C3', 'C4', 'C5', 'Berlingo', 'C3 Aircross', 'C5 Aircross', 'Jumpy', 'Jumper', 'SpaceTourer', 'Ami', 'C4 X'],
  'Volkswagen': ['Golf', 'Polo', 'Passat', 'Tiguan', 'T-Roc', 'T-Cross', 'Touran', 'Touareg', 'Arteon', 'ID.3', 'ID.4', 'ID.5', 'Caddy', 'Transporter', 'Crafter'],
  'BMW': ['Série 1', 'Série 2', 'Série 3', 'Série 4', 'Série 5', 'Série 7', 'X1', 'X2', 'X3', 'X4', 'X5', 'X6', 'X7', 'iX', 'i4', 'i7'],
  'Mercedes': ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'Classe S', 'CLA', 'GLA', 'GLB', 'GLC', 'GLE', 'GLS', 'EQA', 'EQB', 'EQC', 'EQE', 'EQS', 'Sprinter', 'Vito'],
  'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q2', 'Q3', 'Q4', 'Q5', 'Q7', 'Q8', 'e-tron', 'TT', 'R8'],
  'Toyota': ['Yaris', 'Corolla', 'Camry', 'RAV4', 'C-HR', 'Aygo', 'Prius', 'Land Cruiser', 'Hilux', 'Proace', 'Supra', 'GR86', 'bZ4X'],
  'Ford': ['Fiesta', 'Focus', 'Mondeo', 'Puma', 'Kuga', 'Explorer', 'Mustang', 'Ranger', 'Transit', 'Transit Custom', 'Tourneo'],
  'Opel': ['Corsa', 'Astra', 'Insignia', 'Crossland', 'Grandland', 'Mokka', 'Combo', 'Vivaro', 'Movano', 'Zafira'],
  'Fiat': ['500', 'Panda', 'Tipo', '500X', '500L', 'Doblo', 'Ducato', 'Scudo', '500e'],
  'Nissan': ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Leaf', 'Ariya', 'Navara', 'NV200', 'NV300', 'NV400', 'Primastar'],
  'Hyundai': ['i10', 'i20', 'i30', 'Tucson', 'Kona', 'Santa Fe', 'Ioniq', 'Ioniq 5', 'Ioniq 6', 'Bayon', 'Nexo'],
  'Kia': ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Sorento', 'Niro', 'EV6', 'Stonic', 'XCeed', 'Stinger'],
  'Dacia': ['Sandero', 'Duster', 'Logan', 'Spring', 'Jogger', 'Dokker', 'Lodgy'],
  'Seat': ['Ibiza', 'Leon', 'Arona', 'Ateca', 'Tarraco', 'Alhambra', 'Mii'],
  'Skoda': ['Fabia', 'Octavia', 'Superb', 'Kamiq', 'Karoq', 'Kodiaq', 'Scala', 'Enyaq'],
  'Volvo': ['XC40', 'XC60', 'XC90', 'S60', 'S90', 'V60', 'V90', 'C40', 'EX30', 'EX90'],
  'Mazda': ['2', '3', '6', 'CX-3', 'CX-30', 'CX-5', 'CX-60', 'MX-5', 'MX-30'],
  'Honda': ['Jazz', 'Civic', 'CR-V', 'HR-V', 'ZR-V', 'e', 'Accord'],
  'Suzuki': ['Swift', 'Ignis', 'Vitara', 'S-Cross', 'Jimny', 'Swace', 'Across'],
  'Jeep': ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler', 'Gladiator', 'Avenger'],
  'Alfa Romeo': ['Giulia', 'Stelvio', 'Tonale', 'Giulietta'],
  'Mini': ['Mini 3 portes', 'Mini 5 portes', 'Clubman', 'Countryman', 'Cabrio'],
  'Porsche': ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', 'Boxster', 'Cayman'],
  'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
  'Lexus': ['UX', 'NX', 'RX', 'ES', 'LS', 'LC', 'LBX'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque'],
  'Jaguar': ['XE', 'XF', 'F-Pace', 'E-Pace', 'I-Pace', 'F-Type'],
  'DS': ['DS 3', 'DS 4', 'DS 7', 'DS 9'],
  'Cupra': ['Formentor', 'Leon', 'Born', 'Ateca', 'Tavascan'],
  'MG': ['ZS', 'HS', 'MG4', 'MG5', 'Marvel R'],
  'BYD': ['Atto 3', 'Han', 'Tang', 'Dolphin', 'Seal'],
  'Autre': ['Autre modèle']
};

const YEARS = Array.from({ length: 37 }, (_, i) => (2026 - i).toString());

export default function PlateScanner({ onVehicleSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // 1: scan, 2: confirm, 3: select
  const [plateImage, setPlateImage] = useState(null);
  const [detectedPlate, setDetectedPlate] = useState('');
  const [scanning, setScanning] = useState(false);
  const [manualPlate, setManualPlate] = useState('');
  
  // Vehicle selection
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const resetState = () => {
    setStep(1);
    setPlateImage(null);
    setDetectedPlate('');
    setManualPlate('');
    setSelectedBrand('');
    setSelectedModel('');
    setSelectedYear('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (e) => setPlateImage(e.target.result);
    reader.readAsDataURL(file);

    // OCR scan
    await scanPlate(file);
  };

  const scanPlate = async (file) => {
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API}/scan-plate`, {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.plate) {
          setDetectedPlate(data.plate);
          setManualPlate(data.plate);
          toast.success(`Plaque détectée : ${data.plate}`);
        } else {
          toast.info('Plaque non détectée, veuillez la saisir manuellement');
        }
      }
    } catch (error) {
      console.error('Scan error:', error);
      toast.info('Saisissez la plaque manuellement');
    } finally {
      setScanning(false);
      setStep(2);
    }
  };

  const handleConfirmPlate = () => {
    if (!manualPlate.trim()) {
      toast.error('Veuillez entrer une plaque d\'immatriculation');
      return;
    }
    setStep(3);
  };

  const handleSelectVehicle = () => {
    if (!selectedBrand || !selectedModel || !selectedYear) {
      toast.error('Veuillez sélectionner tous les champs');
      return;
    }

    const vehicleData = {
      plate: manualPlate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
      brand: selectedBrand,
      model: selectedModel,
      year: selectedYear
    };

    onVehicleSelect?.(vehicleData);
    toast.success(`Véhicule sélectionné : ${selectedBrand} ${selectedModel} (${selectedYear})`);
    setIsOpen(false);
    resetState();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetState(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-accent text-accent hover:bg-accent hover:text-white">
          <ScanLine className="w-5 h-5" />
          Scanner ma plaque
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Car className="w-5 h-5 text-accent" />
            {step === 1 && 'Scanner votre plaque'}
            {step === 2 && 'Confirmer la plaque'}
            {step === 3 && 'Sélectionner votre véhicule'}
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Scan */}
        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Prenez une photo de votre plaque d'immatriculation ou importez une image pour trouver rapidement les pièces compatibles.
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => cameraInputRef.current?.click()}
              >
                <Camera className="w-8 h-8 text-accent" />
                <span className="text-sm">Prendre photo</span>
              </Button>
              <Button
                variant="outline"
                className="h-24 flex-col gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-8 h-8 text-accent" />
                <span className="text-sm">Importer image</span>
              </Button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileUpload}
            />
            <input
              type="file"
              ref={cameraInputRef}
              className="hidden"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
            />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            <Button variant="ghost" onClick={() => setStep(2)} className="w-full">
              Saisir manuellement
            </Button>
          </div>
        )}

        {/* Step 2: Confirm plate */}
        {step === 2 && (
          <div className="space-y-4">
            {plateImage && (
              <div className="relative rounded-lg overflow-hidden border">
                <img src={plateImage} alt="Plaque" className="w-full h-32 object-cover" />
                {scanning && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                    <span className="ml-2 text-white">Analyse en cours...</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Plaque d'immatriculation</Label>
              <Input
                placeholder="AA-123-BB"
                value={manualPlate}
                onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                className="text-center text-xl font-bold tracking-widest"
                maxLength={12}
              />
              {detectedPlate && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Détectée automatiquement
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStep(1); setPlateImage(null); }} className="flex-1">
                Retour
              </Button>
              <Button onClick={handleConfirmPlate} className="flex-1 bg-accent hover:bg-accent/90">
                Continuer
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Select vehicle */}
        {step === 3 && (
          <div className="space-y-4">
            <Card className="bg-secondary/50">
              <CardContent className="p-3 flex items-center justify-center">
                <span className="font-mono text-lg font-bold tracking-widest">
                  {manualPlate}
                </span>
              </CardContent>
            </Card>

            <p className="text-sm text-muted-foreground">
              Sélectionnez votre véhicule pour trouver les pièces compatibles :
            </p>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Marque</Label>
                <Select value={selectedBrand} onValueChange={(v) => { setSelectedBrand(v); setSelectedModel(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner la marque" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.keys(CAR_DATA).sort().map((brand) => (
                      <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Modèle</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel} disabled={!selectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner le modèle" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {selectedBrand && CAR_DATA[selectedBrand]?.map((model) => (
                      <SelectItem key={model} value={model}>{model}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label>Année</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner l'année" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {YEARS.map((year) => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Retour
              </Button>
              <Button 
                onClick={handleSelectVehicle} 
                className="flex-1 bg-accent hover:bg-accent/90"
                disabled={!selectedBrand || !selectedModel || !selectedYear}
              >
                <Check className="w-4 h-4 mr-2" />
                Valider
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
