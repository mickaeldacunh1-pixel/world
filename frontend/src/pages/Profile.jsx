import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { User, Lock, Trash2, Save, Building, MapPin, Phone, Mail, Calendar, Shield, CreditCard, CheckCircle, AlertCircle, ExternalLink, Loader2, Palmtree, Bell } from 'lucide-react';
import SEO from '../components/SEO';
import VacationMode from '../components/VacationMode';
import TwoFactorSettings from '../components/TwoFactorSettings';
import IdentityVerification from '../components/IdentityVerification';
import PushNotificationManager from '../components/PushNotificationManager';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Profile() {
  const { t } = useTranslation();
  const { user, token, refreshUser, logout, lastRefresh } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // IBAN state
  const [ibanData, setIbanData] = useState({ iban: "", bic: "", account_holder: "" });
  
  // Stripe Connect state
  const [stripeStatus, setStripeStatus] = useState(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  
  // Profile form
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
    city: user?.city || '',
    postal_code: user?.postal_code || '',
    company_name: user?.company_name || '',
    siret: user?.siret || '',
  });
  
  // Password form
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  // Check Stripe status on mount and after redirect
  useEffect(() => {
    checkStripeStatus();
    // Refresh user data on mount to ensure fresh data
    refreshUser();
    
    // Handle Stripe redirect
    if (searchParams.get('stripe_success') === 'true') {
      toast.success(t('profile.stripe_success'));
      checkStripeStatus();
    } else if (searchParams.get('stripe_refresh') === 'true') {
      toast.info(t('profile.stripe_refresh'));
    }
  }, [searchParams, lastRefresh]);


  // Save IBAN
  const saveIban = async () => {
    if (!ibanData.iban || !ibanData.account_holder) {
      toast.error(t('profile.iban_required'));
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API}/users/me/iban`, ibanData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('profile.iban_saved'));
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('profile.iban_error'));
    } finally {
      setLoading(false);
    }
  };
  const checkStripeStatus = async () => {
    if (!token) return;
    
    try {
      const response = await axios.get(`${API}/stripe/connect/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStripeStatus(response.data);
    } catch (error) {
      console.error('Error checking Stripe status:', error);
    }
  };

  const handleStripeConnect = async () => {
    setStripeLoading(true);
    try {
      const response = await axios.post(`${API}/stripe/connect/onboard`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.already_connected) {
        toast.success(t('profile.stripe_already_connected'));
        checkStripeStatus();
      } else if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || t('profile.stripe_error'));
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
      toast.error(error.response?.data?.detail || t('profile.stripe_link_error'));
    } finally {
      setStripeLoading(false);
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
      toast.success(t('profile.profile_updated'));
    } catch (error) {
      toast.error(error.response?.data?.detail || t('profile.update_error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error(t('profile.password_mismatch'));
      return;
    }
    
    if (passwordData.new_password.length < 6) {
      toast.error(t('profile.password_too_short'));
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.put(`${API}/auth/password`, {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
      });
      setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
      toast.success(t('profile.password_changed'));
    } catch (error) {
      toast.error(error.response?.data?.detail || t('profile.password_error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'SUPPRIMER') {
      toast.error(t('profile.type_delete_error'));
      return;
    }
    
    setLoading(true);
    
    try {
      await axios.delete(`${API}/auth/account`);
      toast.success(t('profile.account_deleted'));
      logout();
    } catch (error) {
      toast.error(error.response?.data?.detail || t('profile.delete_error'));
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
        title={t('profile.title')}
        description={t('profile.subtitle')}
        url="/profil"
        noindex={true}
      />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">{t('profile.title')}</h1>
          <p className="text-muted-foreground">{t('profile.subtitle')}</p>
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
                    {t('profile.member_since')} {formatDate(user?.created_at)}
                  </span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    user?.is_professional 
                      ? 'bg-accent/10 text-accent' 
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {user?.is_professional ? (
                      <><Building className="w-3 h-3" /> {t('profile.professional')}</>
                    ) : (
                      <><User className="w-3 h-3" /> {t('profile.individual')}</>
                    )}
                  </span>
                  <span className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    <Shield className="w-3 h-3" />
                    {user?.credits || 0} {t('profile.credits')}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vacation Mode Card */}
        <div className="mb-8">
          <VacationMode />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {t('profile.tab_info')}
            </TabsTrigger>
            <TabsTrigger value="stripe" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              {t('profile.tab_payments')}
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              {t('profile.tab_password')}
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              {t('profile.tab_delete')}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">{t('profile.personal_info')}</CardTitle>
                <CardDescription>{t('profile.personal_info_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">{t('profile.full_name')} *</Label>
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
                      <Label htmlFor="phone">{t('profile.phone')}</Label>
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
                    <Label htmlFor="address">{t('profile.address')}</Label>
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
                      <Label htmlFor="city">{t('profile.city')}</Label>
                      <Input
                        id="city"
                        name="city"
                        value={profileData.city}
                        onChange={handleProfileChange}
                        placeholder="Paris"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="postal_code">{t('profile.postal_code')}</Label>
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
                          {t('profile.pro_info')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label htmlFor="company_name">{t('profile.company_name')}</Label>
                            <Input
                              id="company_name"
                              name="company_name"
                              value={profileData.company_name}
                              onChange={handleProfileChange}
                              placeholder="Auto Pièces SARL"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="siret">{t('profile.siret')}</Label>
                            <Input
                              id="siret"
                              name="siret"
                              value={profileData.siret}
                              onChange={handleProfileChange}
                              placeholder="123 456 789 00012"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={loading} className="bg-accent hover:bg-accent/90">
                      <Save className="w-4 h-4 mr-2" />
                      {loading ? t('profile.saving') : t('profile.save_changes')}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Identity Verification */}
            <div className="mt-6">
              <IdentityVerification />
            </div>
          </TabsContent>

          {/* Stripe Connect Tab */}
          <TabsContent value="stripe">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t('profile.receive_payments')}
                </CardTitle>
                <CardDescription>
                  {t('profile.receive_payments_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Status Card */}
                <div className={`p-4 rounded-lg border ${
                  stripeStatus?.charges_enabled 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-start gap-3">
                    {stripeStatus?.charges_enabled ? (
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className={`font-semibold ${
                        stripeStatus?.charges_enabled ? 'text-green-800' : 'text-yellow-800'
                      }`}>
                        {stripeStatus?.charges_enabled 
                          ? t('profile.stripe_connected')
                          : t('profile.stripe_not_configured')}
                      </h3>
                      <p className={`text-sm ${
                        stripeStatus?.charges_enabled ? 'text-green-700' : 'text-yellow-700'
                      }`}>
                        {stripeStatus?.charges_enabled 
                          ? t('profile.stripe_can_receive')
                          : t('profile.stripe_configure')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                {!stripeStatus?.charges_enabled && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">{t('profile.why_stripe')}</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                        <Shield className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{t('profile.secure_payments')}</p>
                          <p className="text-xs text-muted-foreground">{t('profile.secure_payments_desc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                        <CreditCard className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{t('profile.auto_transfers')}</p>
                          <p className="text-xs text-muted-foreground">{t('profile.auto_transfers_desc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{t('profile.verified_badge')}</p>
                          <p className="text-xs text-muted-foreground">{t('profile.verified_badge_desc')}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
                        <Mail className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-sm">{t('profile.notifications')}</p>
                          <p className="text-xs text-muted-foreground">{t('profile.notifications_desc')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {stripeStatus?.charges_enabled ? (
                    <Button variant="outline" asChild>
                      <a 
                        href="https://dashboard.stripe.com" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        {t('profile.access_stripe')}
                      </a>
                    </Button>
                  ) : stripeStatus?.connected && !stripeStatus?.charges_enabled ? (
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
                      {t('profile.finalize_config')}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleStripeConnect} 
                      disabled={stripeLoading}
                      className="bg-accent hover:bg-accent/90"
                    >
                      {stripeLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <CreditCard className="w-4 h-4 mr-2" />
                      )}
                      {t('profile.connect_stripe')}
                    </Button>
                  )}
                </div>

                {/* Info */}
                <p className="text-xs text-muted-foreground">
                  {t('profile.stripe_terms')}
                </p>
              </CardContent>
            </Card>

            {/* IBAN Section */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  {t('profile.iban_title')}
                </CardTitle>
                <CardDescription>
                  {t('profile.iban_desc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="iban">{t('profile.iban')}</Label>
                  <Input
                    id="iban"
                    placeholder="FR76 1234 5678 9012 3456 7890 123"
                    value={ibanData.iban}
                    onChange={(e) => setIbanData({...ibanData, iban: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bic">{t('profile.bic')}</Label>
                  <Input
                    id="bic"
                    placeholder="BNPAFRPP"
                    value={ibanData.bic}
                    onChange={(e) => setIbanData({...ibanData, bic: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="account_holder">{t('profile.account_holder')}</Label>
                  <Input
                    id="account_holder"
                    placeholder="Nom du titulaire"
                    value={ibanData.account_holder}
                    onChange={(e) => setIbanData({...ibanData, account_holder: e.target.value})}
                  />
                </div>
                <Button onClick={saveIban} disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {t('profile.save_iban')}
                </Button>
                {user?.iban_configured && (
                  <p className="text-sm text-green-600">
                    ✅ {t('profile.iban_configured')} : {user.iban_display}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">{t('profile.change_password')}</CardTitle>
                <CardDescription>{t('profile.password_hint')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="current_password">{t('profile.current_password')}</Label>
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
                    <Label htmlFor="new_password">{t('profile.new_password')}</Label>
                    <Input
                      id="new_password"
                      name="new_password"
                      type="password"
                      value={passwordData.new_password}
                      onChange={handlePasswordChange}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">{t('profile.password_min')}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm_password">{t('profile.confirm_password')}</Label>
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
                    {loading ? t('profile.changing') : t('profile.change_password_btn')}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* 2FA Section */}
            <div className="mt-6">
              <TwoFactorSettings />
            </div>

            {/* Push Notifications Section */}
            <div className="mt-6">
              <PushNotificationManager token={token} />
            </div>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="font-heading text-destructive">{t('profile.danger_zone')}</CardTitle>
                <CardDescription>{t('profile.danger_zone_desc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-6">
                  <h3 className="font-heading font-semibold text-destructive mb-2">{t('profile.delete_account')}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t('profile.delete_warning')}
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside mb-6 space-y-1">
                    <li>{t('common.favorites')}</li>
                    <li>{t('common.messages')}</li>
                    <li>{t('common.alerts')}</li>
                  </ul>
                  
                  <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        {t('profile.delete_account')}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle className="text-destructive">{t('profile.confirm_delete')}</DialogTitle>
                        <DialogDescription>
                          {t('profile.delete_final')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4">
                        <Label htmlFor="delete-confirm">
                          {t('profile.type_delete')}
                        </Label>
                        <Input
                          id="delete-confirm"
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder={t('profile.delete_placeholder')}
                          className="mt-2"
                        />
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                          {t('common.cancel')}
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleDeleteAccount}
                          disabled={loading || deleteConfirmText !== 'SUPPRIMER'}
                        >
                          {loading ? t('profile.deleting') : t('profile.delete_permanently')}
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
