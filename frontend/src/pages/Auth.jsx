import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Mail, Lock, User, Phone, Building, FileText, CheckCircle, XCircle, Loader2, Globe } from 'lucide-react';
import WorldAutoLogo from '../components/WorldAutoLogo';
import FranceText from '../components/FranceText';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

export default function Auth() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, login, register } = useAuth();
  
  const [activeTab, setActiveTab] = useState(searchParams.get('mode') === 'register' ? 'register' : 'login');
  const [loading, setLoading] = useState(false);
  
  // SIRET verification state
  const [siretStatus, setSiretStatus] = useState({ checking: false, valid: null, error: null, companyInfo: null });
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [twoFactorRequired, setTwoFactorRequired] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  
  // Liste des pays autorisés
  const ALLOWED_COUNTRIES = [
    { value: 'France', label: '🇫🇷 France' },
    { value: 'Belgique', label: '🇧🇪 Belgique' },
    { value: 'Suisse', label: '🇨🇭 Suisse' },
    { value: 'Allemagne', label: '🇩🇪 Allemagne' },
    { value: 'Pays-Bas', label: '🇳🇱 Pays-Bas' },
    { value: 'Italie', label: '🇮🇹 Italie' },
    { value: 'Espagne', label: '🇪🇸 Espagne' },
    { value: 'Portugal', label: '🇵🇹 Portugal' },
    { value: 'Suède', label: '🇸🇪 Suède' },
  ];
  
  // Register state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    country: 'France',
    is_professional: false,
    company_name: '',
    siret: '',
    address: '',
    city: '',
    postal_code: '',
    referral_code: searchParams.get('ref') || '',
    promo_code: searchParams.get('promo') || '',  // Code promo (ex: LANCEMENT)
  });
  
  // Referral code validation state
  const [referralStatus, setReferralStatus] = useState({ checking: false, valid: null, referrer_name: null });
  
  // Promo code status
  const [promoStatus, setPromoStatus] = useState({ checking: false, valid: null, free_ads: 0, message: null });

  useEffect(() => {
    if (user) {
      navigate('/tableau-de-bord');
    }
  }, [user, navigate]);
  
  // Vérifier le code promo au chargement
  useEffect(() => {
    const promoCode = searchParams.get('promo');
    if (promoCode) {
      setPromoStatus({ checking: true, valid: null, free_ads: 0, message: null });
      axios.get(`${API}/api/promo/${promoCode}/status`)
        .then(response => {
          setPromoStatus({
            checking: false,
            valid: response.data.valid,
            free_ads: response.data.free_ads_per_user || 0,
            remaining: response.data.remaining_global || 0,
            message: response.data.description || response.data.message
          });
          // Forcer l'onglet inscription si promo valide
          if (response.data.valid) {
            setActiveTab('register');
          }
        })
        .catch(() => {
          setPromoStatus({ checking: false, valid: false, free_ads: 0, message: 'Code promo invalide' });
        });
    }
  }, [searchParams]);
  
  // Validate referral code
  useEffect(() => {
    const code = registerData.referral_code?.trim();
    if (code && code.length >= 5) {
      const timeout = setTimeout(async () => {
        setReferralStatus({ checking: true, valid: null, referrer_name: null });
        try {
          const response = await axios.get(`${API}/api/referral/validate/${code}`);
          setReferralStatus({
            checking: false,
            valid: response.data.valid,
            referrer_name: response.data.referrer_name,
            bonus_points: response.data.bonus_points
          });
        } catch (error) {
          setReferralStatus({ checking: false, valid: false, referrer_name: null });
        }
      }, 500);
      return () => clearTimeout(timeout);
    } else {
      setReferralStatus({ checking: false, valid: null, referrer_name: null });
    }
  }, [registerData.referral_code]);

  // Fonction de vérification SIRET avec debounce
  const verifySiret = useCallback(async (siret) => {
    const cleanSiret = siret.replace(/[\s-]/g, '');
    
    // Ne pas vérifier si moins de 14 chiffres
    if (cleanSiret.length < 14) {
      setSiretStatus({ checking: false, valid: null, error: null, companyInfo: null });
      return;
    }
    
    if (cleanSiret.length !== 14 || !/^\d+$/.test(cleanSiret)) {
      setSiretStatus({ checking: false, valid: false, error: 'Le SIRET doit contenir 14 chiffres', companyInfo: null });
      return;
    }
    
    setSiretStatus({ checking: true, valid: null, error: null, companyInfo: null });
    
    try {
      const response = await axios.get(`${API}/api/verify-siret/${cleanSiret}`);
      setSiretStatus({ 
        checking: false, 
        valid: true, 
        error: null, 
        companyInfo: response.data.company_info 
      });
      
      // Auto-remplir le nom de l'entreprise si pas déjà rempli
      if (response.data.company_info?.denomination && !registerData.company_name) {
        setRegisterData(prev => ({ 
          ...prev, 
          company_name: response.data.company_info.denomination 
        }));
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Erreur lors de la vérification';
      setSiretStatus({ checking: false, valid: false, error: errorMessage, companyInfo: null });
    }
  }, [registerData.company_name]);

  // Déclencher la vérification quand le SIRET change
  useEffect(() => {
    const cleanSiret = registerData.siret.replace(/[\s-]/g, '');
    if (registerData.is_professional && cleanSiret.length >= 14) {
      const timeoutId = setTimeout(() => verifySiret(registerData.siret), 500);
      return () => clearTimeout(timeoutId);
    } else {
      setSiretStatus({ checking: false, valid: null, error: null, companyInfo: null });
    }
  }, [registerData.siret, registerData.is_professional, verifySiret]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API}/api/auth/login`, {
        email: loginEmail,
        password: loginPassword,
        totp_code: twoFactorCode || undefined
      });
      
      const data = response.data;
      
      // Check if 2FA is required
      if (data.requires_2fa) {
        setTwoFactorRequired(true);
        setTwoFactorMethod(data.method);
        toast.info(data.message || 'Code de vérification requis');
        setLoading(false);
        return;
      }
      
      // Login successful
      await login(loginEmail, loginPassword, twoFactorCode);
      toast.success('Connexion réussie !');
      navigate('/tableau-de-bord');
    } catch (error) {
      const errorMsg = error.response?.data?.detail || 'Erreur de connexion';
      toast.error(errorMsg);
      // Reset 2FA code on error
      if (twoFactorRequired) {
        setTwoFactorCode('');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTwoFactor = () => {
    setTwoFactorRequired(false);
    setTwoFactorMethod(null);
    setTwoFactorCode('');
    setLoginPassword('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (registerData.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    // Vérifier le SIRET pour les professionnels
    if (registerData.is_professional) {
      const cleanSiret = registerData.siret.replace(/[\s-]/g, '');
      if (!cleanSiret) {
        toast.error('Veuillez saisir votre numéro SIRET');
        return;
      }
      if (siretStatus.valid === false) {
        toast.error('Veuillez corriger votre numéro SIRET avant de continuer');
        return;
      }
      if (siretStatus.checking) {
        toast.error('Vérification du SIRET en cours, veuillez patienter...');
        return;
      }
      if (siretStatus.valid !== true) {
        toast.error('Veuillez vérifier votre numéro SIRET');
        return;
      }
    }

    setLoading(true);
    try {
      const { confirmPassword, ...userData } = registerData;
      await register(userData);
      toast.success('Inscription réussie !');
      navigate('/tableau-de-bord');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  const updateRegisterData = (field, value) => {
    setRegisterData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center py-12 px-4" data-testid="auth-page">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <WorldAutoLogo className="w-12 h-12" />
            <span className="font-heading font-bold text-2xl">World Auto Pro <FranceText /></span>
          </Link>
        </div>

        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="font-heading text-2xl">
              {activeTab === 'login' ? 'Connexion' : 'Créer un compte'}
            </CardTitle>
            <CardDescription>
              {activeTab === 'login' 
                ? 'Connectez-vous à votre compte'
                : 'Rejoignez la communauté World Auto Pro Pro'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login" data-testid="login-tab">Connexion</TabsTrigger>
                <TabsTrigger value="register" data-testid="register-tab">Inscription</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                        data-testid="login-email-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Mot de passe</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="pl-10"
                        required
                        data-testid="login-password-input"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-accent hover:bg-accent/90"
                    disabled={loading}
                    data-testid="login-submit-btn"
                  >
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </Button>

                  <div className="text-center">
                    <Link 
                      to="/mot-de-passe-oublie" 
                      className="text-sm text-muted-foreground hover:text-accent"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>
                </form>
              </TabsContent>

              {/* Register Form */}
              <TabsContent value="register">
                {/* Bannière promo LANCEMENT */}
                {promoStatus.valid && (
                  <div className="mb-4 p-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg text-white">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🎉</span>
                      <span className="font-bold">OFFRE DE LANCEMENT !</span>
                    </div>
                    <p className="text-sm opacity-90">
                      Inscrivez-vous maintenant et recevez <strong>{promoStatus.free_ads} annonces gratuites</strong> !
                    </p>
                    <p className="text-xs mt-1 opacity-75">
                      Plus que {promoStatus.remaining} annonces disponibles sur 1000
                    </p>
                  </div>
                )}
                {promoStatus.valid === false && promoStatus.message && (
                  <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                    {promoStatus.message}
                  </div>
                )}
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nom complet *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-name"
                        placeholder="Jean Dupont"
                        value={registerData.name}
                        onChange={(e) => updateRegisterData('name', e.target.value)}
                        className="pl-10"
                        required
                        data-testid="register-name-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="votre@email.com"
                        value={registerData.email}
                        onChange={(e) => updateRegisterData('email', e.target.value)}
                        className="pl-10"
                        required
                        data-testid="register-email-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Mot de passe *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="••••••••"
                          value={registerData.password}
                          onChange={(e) => updateRegisterData('password', e.target.value)}
                          className="pl-10"
                          required
                          data-testid="register-password-input"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">Confirmer *</Label>
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.confirmPassword}
                        onChange={(e) => updateRegisterData('confirmPassword', e.target.value)}
                        required
                        data-testid="register-confirm-input"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="register-phone"
                        placeholder="06 12 34 56 78"
                        value={registerData.phone}
                        onChange={(e) => updateRegisterData('phone', e.target.value)}
                        className="pl-10"
                        data-testid="register-phone-input"
                      />
                    </div>
                  </div>

                  {/* Country selector */}
                  <div className="space-y-2">
                    <Label htmlFor="register-country">
                      Pays <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                      <Select 
                        value={registerData.country} 
                        onValueChange={(v) => updateRegisterData('country', v)}
                      >
                        <SelectTrigger className="pl-10" data-testid="register-country-select">
                          <SelectValue placeholder="Sélectionnez votre pays" />
                        </SelectTrigger>
                        <SelectContent>
                          {ALLOWED_COUNTRIES.map(country => (
                            <SelectItem key={country.value} value={country.value}>
                              {country.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Inscriptions limitées à certains pays européens
                    </p>
                  </div>

                  {/* Professional checkbox */}
                  <div className="flex items-center space-x-2 py-2">
                    <Checkbox
                      id="is-professional"
                      checked={registerData.is_professional}
                      onCheckedChange={(checked) => updateRegisterData('is_professional', checked)}
                      data-testid="register-professional-checkbox"
                    />
                    <Label htmlFor="is-professional" className="text-sm font-normal">
                      Je suis un professionnel de l'automobile
                    </Label>
                  </div>

                  {/* Professional fields */}
                  {registerData.is_professional && (
                    <div className="space-y-4 p-4 bg-secondary/50 rounded-lg animate-fade-in">
                      <div className="space-y-2">
                        <Label htmlFor="company-name">Nom de l'entreprise</Label>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="company-name"
                            placeholder="Auto Services SARL"
                            value={registerData.company_name}
                            onChange={(e) => updateRegisterData('company_name', e.target.value)}
                            className="pl-10"
                            data-testid="register-company-input"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="siret">
                          SIRET <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="siret"
                            placeholder="123 456 789 00001"
                            value={registerData.siret}
                            onChange={(e) => updateRegisterData('siret', e.target.value)}
                            className={`pl-10 pr-10 ${
                              siretStatus.valid === true ? 'border-green-500 focus-visible:ring-green-500' :
                              siretStatus.valid === false ? 'border-red-500 focus-visible:ring-red-500' : ''
                            }`}
                            data-testid="register-siret-input"
                          />
                          {/* Status indicator */}
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {siretStatus.checking && (
                              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            )}
                            {siretStatus.valid === true && (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            )}
                            {siretStatus.valid === false && (
                              <XCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                        
                        {/* SIRET validation messages */}
                        {siretStatus.valid === true && siretStatus.companyInfo && (
                          <div className="text-sm p-3 bg-green-50 border border-green-200 rounded-md">
                            <p className="font-medium text-green-800">
                              <CheckCircle className="inline w-4 h-4 mr-1" />
                              SIRET vérifié
                            </p>
                            <p className="text-green-700 mt-1">
                              {siretStatus.companyInfo.denomination}
                            </p>
                            {siretStatus.companyInfo.adresse?.libelle_commune && (
                              <p className="text-green-600 text-xs">
                                {siretStatus.companyInfo.adresse.code_postal} {siretStatus.companyInfo.adresse.libelle_commune}
                              </p>
                            )}
                          </div>
                        )}
                        {siretStatus.valid === false && siretStatus.error && (
                          <div className="text-sm p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="font-medium text-red-800">
                              <XCircle className="inline w-4 h-4 mr-1" />
                              {siretStatus.error}
                            </p>
                          </div>
                        )}
                        {siretStatus.checking && (
                          <p className="text-sm text-muted-foreground">
                            Vérification en cours...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Referral Code */}
                  <div className="space-y-2">
                    <Label htmlFor="referral-code">Code de parrainage (optionnel)</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="referral-code"
                        placeholder="Ex: JEA12345"
                        className="pl-10 pr-10"
                        value={registerData.referral_code}
                        onChange={(e) => setRegisterData({ ...registerData, referral_code: e.target.value.toUpperCase() })}
                      />
                      {referralStatus.checking && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                      )}
                      {!referralStatus.checking && referralStatus.valid === true && (
                        <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      )}
                      {!referralStatus.checking && referralStatus.valid === false && (
                        <XCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
                      )}
                    </div>
                    {referralStatus.valid === true && referralStatus.referrer_name && (
                      <p className="text-sm text-green-600">
                        ✨ Parrainé par {referralStatus.referrer_name} ! Vous recevrez {referralStatus.bonus_points || 50} points de bienvenue.
                      </p>
                    )}
                    {referralStatus.valid === false && registerData.referral_code && (
                      <p className="text-sm text-red-500">
                        Ce code de parrainage n'est pas valide
                      </p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-accent hover:bg-accent/90"
                    disabled={loading}
                    data-testid="register-submit-btn"
                  >
                    {loading ? 'Inscription...' : 'Créer mon compte'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          En vous inscrivant, vous acceptez nos{' '}
          <a href="#" className="text-accent hover:underline">Conditions d'utilisation</a>
          {' '}et notre{' '}
          <a href="#" className="text-accent hover:underline">Politique de confidentialité</a>
        </p>
      </div>
    </div>
  );
}
