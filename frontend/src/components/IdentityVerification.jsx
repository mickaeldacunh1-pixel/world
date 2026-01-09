import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { 
  Shield, ShieldCheck, ShieldAlert, Upload, Loader2, 
  CheckCircle, XCircle, Clock, Camera, FileText, AlertCircle 
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL;

export default function IdentityVerification({ user, token, onVerified }) {
  const [status, setStatus] = useState(user?.identity_verified || 'not_submitted');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [previewFront, setPreviewFront] = useState(null);
  const [previewBack, setPreviewBack] = useState(null);
  const [previewSelfie, setPreviewSelfie] = useState(null);

  useEffect(() => {
    if (user?.identity_status) {
      setStatus(user.identity_status);
    }
  }, [user]);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Seules les images sont acceptées');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 10 Mo');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      if (type === 'front') {
        setIdFront(file);
        setPreviewFront(e.target.result);
      } else if (type === 'back') {
        setIdBack(file);
        setPreviewBack(e.target.result);
      } else {
        setSelfie(file);
        setPreviewSelfie(e.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post(`${API}/api/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      }
    });
    
    return response.data.url;
  };

  const submitVerification = async () => {
    if (!idFront || !selfie) {
      toast.error('Veuillez fournir au minimum le recto de votre pièce d\'identité et un selfie');
      return;
    }

    setUploading(true);
    try {
      // Upload images
      const frontUrl = await uploadToCloudinary(idFront);
      const backUrl = idBack ? await uploadToCloudinary(idBack) : null;
      const selfieUrl = await uploadToCloudinary(selfie);

      // Submit verification request
      await axios.post(`${API}/api/identity/submit`, {
        id_front_url: frontUrl,
        id_back_url: backUrl,
        selfie_url: selfieUrl
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStatus('pending');
      toast.success('Demande de vérification envoyée ! Nous l\'examinerons sous 24-48h.');
      
      if (onVerified) onVerified();
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi');
    } finally {
      setUploading(false);
    }
  };

  const renderStatus = () => {
    switch (status) {
      case 'verified':
        return (
          <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <ShieldCheck className="w-8 h-8 text-green-600" />
            <div>
              <h4 className="font-semibold text-green-700 dark:text-green-400">Identité vérifiée</h4>
              <p className="text-sm text-green-600 dark:text-green-500">
                Votre compte bénéficie du badge de confiance
              </p>
            </div>
            <Badge className="ml-auto bg-green-600">
              <CheckCircle className="w-3 h-3 mr-1" />
              Vérifié
            </Badge>
          </div>
        );
      
      case 'pending':
        return (
          <div className="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <h4 className="font-semibold text-yellow-700 dark:text-yellow-400">Vérification en cours</h4>
              <p className="text-sm text-yellow-600 dark:text-yellow-500">
                Nous examinons vos documents. Réponse sous 24-48h.
              </p>
            </div>
            <Badge variant="outline" className="ml-auto border-yellow-600 text-yellow-600">
              <Clock className="w-3 h-3 mr-1" />
              En attente
            </Badge>
          </div>
        );
      
      case 'rejected':
        return (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <ShieldAlert className="w-8 h-8 text-red-600" />
            <div>
              <h4 className="font-semibold text-red-700 dark:text-red-400">Vérification refusée</h4>
              <p className="text-sm text-red-600 dark:text-red-500">
                Documents non conformes. Vous pouvez soumettre une nouvelle demande.
              </p>
            </div>
            <Badge variant="destructive" className="ml-auto">
              <XCircle className="w-3 h-3 mr-1" />
              Refusé
            </Badge>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (status === 'verified') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-green-600" />
            Vérification d'identité
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStatus()}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Vérification d'identité
        </CardTitle>
        <CardDescription>
          Obtenez le badge "Vérifié" pour inspirer confiance aux acheteurs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {renderStatus()}

        {status !== 'pending' && (
          <>
            {/* Benefits */}
            <div className="p-4 bg-accent/10 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-accent" />
                Avantages du badge vérifié
              </h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Badge de confiance visible sur vos annonces</li>
                <li>✓ Meilleur positionnement dans les résultats</li>
                <li>✓ Plus de confiance = plus de ventes</li>
                <li>✓ Accès aux fonctionnalités premium</li>
              </ul>
            </div>

            {/* Document info */}
            <div className="p-4 border rounded-lg bg-secondary/30">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Documents acceptés
              </h4>
              <p className="text-sm text-muted-foreground">
                Carte d'identité, Passeport ou Permis de conduire en cours de validité
              </p>
            </div>

            {/* Upload section */}
            <div className="space-y-4">
              <h4 className="font-medium">Documents à fournir</h4>
              
              <div className="grid md:grid-cols-3 gap-4">
                {/* ID Front */}
                <div className="space-y-2">
                  <Label className="text-sm">Pièce d'identité (recto) *</Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-accent transition-colors ${previewFront ? 'border-green-500' : ''}`}
                    onClick={() => document.getElementById('id-front').click()}
                  >
                    {previewFront ? (
                      <img src={previewFront} alt="ID Front" className="w-full h-24 object-cover rounded" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mt-2">Cliquez pour uploader</p>
                      </>
                    )}
                  </div>
                  <input
                    id="id-front"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'front')}
                  />
                </div>

                {/* ID Back */}
                <div className="space-y-2">
                  <Label className="text-sm">Pièce d'identité (verso)</Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-accent transition-colors ${previewBack ? 'border-green-500' : ''}`}
                    onClick={() => document.getElementById('id-back').click()}
                  >
                    {previewBack ? (
                      <img src={previewBack} alt="ID Back" className="w-full h-24 object-cover rounded" />
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mt-2">Optionnel</p>
                      </>
                    )}
                  </div>
                  <input
                    id="id-back"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'back')}
                  />
                </div>

                {/* Selfie */}
                <div className="space-y-2">
                  <Label className="text-sm">Selfie avec la pièce *</Label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-accent transition-colors ${previewSelfie ? 'border-green-500' : ''}`}
                    onClick={() => document.getElementById('selfie').click()}
                  >
                    {previewSelfie ? (
                      <img src={previewSelfie} alt="Selfie" className="w-full h-24 object-cover rounded" />
                    ) : (
                      <>
                        <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground mt-2">Vous + votre pièce</p>
                      </>
                    )}
                  </div>
                  <input
                    id="selfie"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'selfie')}
                  />
                </div>
              </div>

              {/* Privacy notice */}
              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Vos documents sont chiffrés et stockés de manière sécurisée. 
                  Ils ne sont utilisés que pour vérifier votre identité et ne seront jamais partagés.
                </p>
              </div>

              {/* Submit button */}
              <Button 
                onClick={submitVerification}
                disabled={uploading || !idFront || !selfie}
                className="w-full bg-accent hover:bg-accent/90"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 mr-2" />
                    Soumettre ma demande de vérification
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
