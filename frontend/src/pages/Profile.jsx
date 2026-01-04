import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '../components/ui/dialog';
import { User, Lock, Trash2, Save, Building, MapPin, Phone, Mail, Calendar, Shield } from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
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
        description="Gérez votre compte World Auto France - Modifiez vos informations personnelles et paramètres de sécurité."
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Mot de passe
            </TabsTrigger>
            <TabsTrigger value="danger" className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Supprimer
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
                            <Label htmlFor="company_name">Nom de l'entreprise</Label>
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

          {/* Password Tab */}
          <TabsContent value="password">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Changer le mot de passe</CardTitle>
                <CardDescription>Assurez-vous d'utiliser un mot de passe fort et unique</CardDescription>
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
