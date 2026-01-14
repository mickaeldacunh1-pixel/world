import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { User, Lock, Trash2, Save, Building, MapPin, Phone, Mail, Calendar, Shield, CreditCard, CheckCircle, AlertCircle, ExternalLink, Loader2, Palmtree, Bell, Building2, Edit } from 'lucide-react';
import SEO from '../components/SEO';
import VacationMode from '../components/VacationMode';
import NotificationSettings from '../components/NotificationSettings';
import PushNotificationManager from '../components/PushNotificationManager';
import IdentityVerification from '../components/IdentityVerification';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Profile() {
  const { user, token, refreshUser, logout, lastRefresh } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Stripe Connect state
  const [stripeStatus, setStripeStatus] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  
  // IBAN state
  const [showIbanForm, setShowIbanForm] = useState(false);
  const [ibanValue, setIbanValue] = useState('');
  const [bicValue, setBicValue] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [ibanLoading, setIbanLoading] = useState(false);
  
  // Profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
    company_name: user?.company_name || '',
    siret: user?.siret || '',
    website: user?.website || '',
  });
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Check Stripe status on mount and after redirect
  const checkStripeStatus = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API}/stripe/connect/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStripeStatus(response.data);
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    }
  }, [token]);

  useEffect(() => {
    checkStripeStatus();
    refreshUser();
    
    // Handle Stripe redirect
    if (searchParams.get('stripe_success') === 'true') {
      toast.success('Compte Stripe configuré avec succès !');
      checkStripeStatus();
    } else if (searchParams.get('stripe_refresh') === 'true') {
      toast.info('Veuillez finaliser la configuration de votre compte Stripe');
    }
  }, [searchParams, lastRefresh, checkStripeStatus, refreshUser]);

  const handleStripeConnect = async () => {
    setStripeLoading(true);
    try {
      const response = await axios.post(`${API}/stripe/connect/onboard`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.already_connected) {
        toast.success('Votre compte Stripe est déjà connecté !');
        checkStripeStatus();
      } else if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la connexion Stripe');
    } finally {
      setStripeLoading(false);
    }
  };

  const handleRefreshStripeLink = async () => {
    setStripeLoading(true);
    try {
      const response = await axios.post(`${API}/stripe/connect/refresh-link`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la création du lien');
    } finally {
      setStripeLoading(false);
    }
  };

  // Save IBAN
  const handleSaveIban = async () => {
    // Validate IBAN format (basic validation)
    const cleanIban = ibanValue.replace(/\s/g, '');
    if (cleanIban.length < 14 || cleanIban.length > 34) {
      toast.error('IBAN invalide. Vérifiez le format.');
      return;
    }
    if (!accountHolder.trim()) {
      toast.error('Veuillez entrer le nom du titulaire du compte.');
      return;
    }

    setIbanLoading(true);
    try {
      await axios.post(`${API}/users/me/iban`, {
        iban: cleanIban,
        bic: bicValue.replace(/\s/g, '') || null,
        account_holder: accountHolder.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('IBAN enregistré avec succès !');
      setShowIbanForm(false);
      await refreshUser();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'enregistrement de l\'IBAN');
    } finally {
      setIbanLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.put(`${API}/auth/profile`, profileData);
      await refreshUser();
      toast.success('Profil mis à jour avec succès !');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la mise à jour');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error('Le nouveau mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.put(`${API}/auth/password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      toast.success('Mot de passe modifié avec succès !');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      toast.error('Veuillez taper SUPPRIMER pour confirmer');
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.delete(`${API}/auth/account`);
      toast.success('Compte supprimé avec succès');
      logout();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la suppression');
    } finally {
      setLoading(false);
      setDeleteDialogOpen(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title="Mon Profil"
        description="Gérez votre compte World Auto Pro Pro - Modifiez vos informations personnelles et paramètres de sécurité."
        url="/profil"
        noindex={true}
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Mon Profil</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles et paramètres de sécurité</p>
        </div>

        {/* Account Summary Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-accent" />
              </div>
              <div className="flex-1">
                <h2 className="font-heading text-2xl font-bold">{user?.name}</h2>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </p>
                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Membre depuis {formatDate(user?.created_at)}
                  </span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    user?.is_professional 
                      ? 'bg-accent/10 text-accent' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user?.is_professional ? (
                      <><Building className="w-3 h-3" /> Professionnel</>
                    ) : (
                      <><User className="w-3 h-3" /> Particulier</>
                    )}
                  </span>
                  <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    {user?.credits || 0} crédits
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Informations</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="vacation" className="flex items-center gap-2">
              <Palmtree className="w-4 h-4" />
              <span className="hidden sm:inline">Vacances</span>
            </TabsTrigger>
            <TabsTrigger value="identity" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Vérification</span>
            </TabsTrigger>
            <TabsTrigger value="stripe" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Paiements</span>
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="hidden sm:inline">Mot de passe</span>
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Supprimer</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Informations personnelles</CardTitle>
                <CardDescription>Modifiez vos informations de contact et adresse</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom complet *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        placeholder="Jean Dupont"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Téléphone</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          name="phone"
                          value={profileData.phone}
                          onChange={handleProfileChange}
                          placeholder="06 12 34 56 78"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="address"
                        name="address"
                        value={profileData.address}
                        onChange={handleProfileChange}
                        placeholder="123 rue de la Paix"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city">Ville</Label>
                      <Input
                        id="city"
                        name="city"
                        value={profileData.city}
                        onChange={handleProfileChange}
                        placeholder="Paris"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">Code postal</Label>
                      <Input
                        id="postal_code"
                        name="postal_code"
                        value={profileData.postal_code}
                        onChange={handleProfileChange}
                        placeholder="75001"
                      />
                    </div>
                  </div>

                  {user?.is_professional && (
                    <>
                      <div className="border-t pt-6">
                        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
                          <Building className="w-5 h-5" />
                          Informations professionnelles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="company_name">Nom de l&apos;entreprise</Label>
                            <Input
                              id="company_name"
                              name="company_name"
                              value={profileData.company_name}
                              onChange={handleProfileChange}
                              placeholder="Auto Pièces SARL"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="siret">SIRET</Label>
                            <Input
                              id="siret"
                              name="siret"
                              value={profileData.siret}
                              onChange={handleProfileChange}
                              placeholder="123 456 789 00012"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4 space-y-2">
                          <Label htmlFor="website">Site web</Label>
                          <div className="relative">
                            <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="website"
                              name="website"
                              value={profileData.website}
                              onChange={handleProfileChange}
                              placeholder="https://monsite.fr"
                              className="pl-10"
                            />
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Votre site web sera affiché sur votre profil vendeur
                          </p>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <PushNotificationManager token={token} />
            <NotificationSettings />
          </TabsContent>

          {/* Vacation Mode Tab */}
          <TabsContent value="vacation">
            <VacationMode />
          </TabsContent>

          {/* Identity Verification Tab */}
          <TabsContent value="identity">
            <IdentityVerification user={user} token={token} onVerified={refreshUser} />
          </TabsContent>

          {/* Stripe Connect Tab */}
          <TabsContent value="stripe">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Recevoir des paiements
                </CardTitle>
                <CardDescription>
                  Choisissez votre méthode pour recevoir l'argent de vos ventes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Card */}
                <div className={`p-4 rounded-lg border ${
                  stripeStatus?.charges_enabled || user?.iban_configured
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {stripeStatus?.charges_enabled || user?.iban_configured ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className={`font-semibold ${
                        stripeStatus?.charges_enabled || user?.iban_configured ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        {stripeStatus?.charges_enabled 
                          ? 'Compte Stripe connecté !' 
                          : user?.iban_configured
                          ? 'IBAN configuré !'
                          : 'Paiement non configuré'}
                      </h3>
                      <p className={`text-sm ${
                        stripeStatus?.charges_enabled || user?.iban_configured ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {stripeStatus?.charges_enabled 
                          ? 'Vous pouvez recevoir des paiements pour vos ventes via Stripe.' 
                          : user?.iban_configured
                          ? `IBAN : ${user.iban_display || '****'} - Les paiements seront virés sur ce compte.`
                          : 'Configurez votre méthode de paiement pour recevoir l\'argent de vos ventes.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Two payment options */}
                {!stripeStatus?.charges_enabled && !user?.iban_configured && (
                  <div className="space-y-6">
                    <h4 className="font-semibold text-center">Choisissez votre méthode de paiement</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      {/* Option 1: IBAN Direct */}
                      <div className="p-4 border-2 rounded-lg hover:border-accent transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <Building2 className="w-5 h-5 text-accent" />
                          <h5 className="font-semibold">Virement bancaire (IBAN)</h5>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Simple</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Entrez simplement votre IBAN. Les paiements seront virés directement sur votre compte bancaire.
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                          <li>✓ Pas de compte externe à créer</li>
                          <li>✓ Virement direct sur votre compte</li>
                          <li>✓ Comme sur eBay</li>
                        </ul>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => setShowIbanForm(true)}
                        >
                          <Building2 className="w-4 h-4 mr-2" />
                          Entrer mon IBAN
                        </Button>
                      </div>

                      {/* Option 2: Stripe Connect */}
                      <div className="p-4 border-2 rounded-lg hover:border-accent transition-colors">
                        <div className="flex items-center gap-2 mb-3">
                          <CreditCard className="w-5 h-5 text-accent" />
                          <h5 className="font-semibold">Stripe Connect</h5>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Complet</span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Créez un compte Stripe pour des fonctionnalités avancées et un dashboard complet.
                        </p>
                        <ul className="text-xs text-muted-foreground space-y-1 mb-4">
                          <li>✓ Dashboard détaillé</li>
                          <li>✓ Historique des transactions</li>
                          <li>✓ Protection vendeur Stripe</li>
                        </ul>
                        <Button 
                          onClick={handleStripeConnect} 
                          disabled={stripeLoading}
                          className="w-full bg-[#635BFF] hover:bg-[#635BFF]/90"
                        >
                          {stripeLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CreditCard className="w-4 h-4 mr-2" />
                          )}
                          Connecter Stripe
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* IBAN Form Modal */}
                {showIbanForm && (
                  <div className="p-4 border-2 border-accent rounded-lg bg-accent/5">
                    <h5 className="font-semibold mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      Configurer mon IBAN
                    </h5>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="iban">IBAN *</Label>
                        <Input
                          id="iban"
                          placeholder="FR76 1234 5678 9012 3456 7890 123"
                          value={ibanValue}
                          onChange={(e) => setIbanValue(e.target.value.toUpperCase())}
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Votre IBAN français commence par FR
                        </p>
                      </div>
                      <div>
                        <Label htmlFor="bic">BIC (optionnel)</Label>
                        <Input
                          id="bic"
                          placeholder="BNPAFRPP"
                          value={bicValue}
                          onChange={(e) => setBicValue(e.target.value.toUpperCase())}
                          className="font-mono"
                        />
                      </div>
                      <div>
                        <Label htmlFor="account_holder">Titulaire du compte *</Label>
                        <Input
                          id="account_holder"
                          placeholder="Votre nom complet"
                          value={accountHolder}
                          onChange={(e) => setAccountHolder(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleSaveIban}
                          disabled={ibanLoading || !ibanValue || !accountHolder}
                          className="flex-1 bg-accent hover:bg-accent/90"
                        >
                          {ibanLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Enregistrer mon IBAN
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setShowIbanForm(false)}
                        >
                          Annuler
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        🔒 Vos coordonnées bancaires sont chiffrées et sécurisées. Elles ne seront utilisées que pour vous verser vos gains.
                      </p>
                    </div>
                  </div>
                )}

                {/* Already configured - show options */}
                {(stripeStatus?.charges_enabled || user?.iban_configured) && (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {stripeStatus?.charges_enabled && (
                      <Button variant="outline" asChild>
                        <a 
                          href="https://dashboard.stripe.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Dashboard Stripe
                        </a>
                      </Button>
                    )}
                    {user?.iban_configured && (
                      <Button 
                        variant="outline"
                        onClick={() => setShowIbanForm(true)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Modifier mon IBAN
                      </Button>
                    )}
                  </div>
                )}

                {/* Stripe refresh link if needed */}
                {stripeStatus?.connected && !stripeStatus?.charges_enabled && (
                  <Button 
                    onClick={handleRefreshStripeLink} 
                    disabled={stripeLoading}
                    className="bg-accent hover:bg-accent/90"
                  >
                    {stripeLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Finaliser la configuration Stripe
                  </Button>
                )}

                {/* Info */}
                <p className="text-xs text-muted-foreground">
                  Commission : 5% (min 1,50€, max 15€) prélevée sur chaque vente. Les virements sont effectués sous 3-5 jours ouvrés.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Changer le mot de passe</CardTitle>
                <CardDescription>Assurez-vous d&apos;utiliser un mot de passe fort et unique</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">Mot de passe actuel</Label>
                    <Input
                      id="current_password"
                      name="current_password"
                      type="password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="new_password">Nouveau mot de passe</Label>
                    <Input
                      id="new_password"
                      name="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">Confirmer le nouveau mot de passe</Label>
                    <Input
                      id="confirm_password"
                      name="confirm_password"
                      type="password"
                      value={passwordData.confirm_password}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>

                  <Button type="submit" disabled={loading}>
                    <Lock className="w-4 h-4 mr-2" />
                    {loading ? 'Modification...' : 'Modifier le mot de passe'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="font-heading text-destructive">Zone de danger</CardTitle>
                <CardDescription>Actions irréversibles sur votre compte</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
                  <h3 className="font-heading font-semibold text-destructive mb-2">Supprimer mon compte</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Cette action est <strong>irréversible</strong>. Toutes vos données seront supprimées :
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mb-6 space-y-1">
                    <li>Vos annonces actives</li>
                    <li>Vos messages</li>
                    <li>Vos favoris et alertes</li>
                    <li>Vos avis laissés</li>
                    <li>Vos crédits restants (non remboursables)</li>
                  </ul>
                  
                  <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer mon compte
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-destructive">Confirmer la suppression</DialogTitle>
                        <DialogDescription>
                          Cette action est définitive et ne peut pas être annulée. Toutes vos données seront perdues.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="delete-confirm">
                          Tapez <strong>SUPPRIMER</strong> pour confirmer
                        </Label>
                        <Input
                          id="delete-confirm"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="SUPPRIMER"
                          className="mt-2"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                          Annuler
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteAccount}
                          disabled={loading || deleteConfirmText !== 'SUPPRIMER'}
                        >
                          {loading ? 'Suppression...' : 'Supprimer définitivement'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
