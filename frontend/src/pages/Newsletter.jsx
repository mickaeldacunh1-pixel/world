import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Checkbox } from '../components/ui/checkbox';
import { ArrowLeft, Mail, CheckCircle, Loader2, Send, Bell, Sparkles, Tag } from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [preferences, setPreferences] = useState({
    new_listings: true,
    promotions: true,
    updates: true,
    weekly_digest: true,
  });
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Veuillez entrer votre email');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/newsletter/subscribe`, {
        email,
        name,
        preferences
      });
      setSubscribed(true);
      toast.success('Inscription réussie !');
    } catch (error) {
      const message = error.response?.data?.detail || 'Erreur lors de l\'inscription';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const togglePreference = (key) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  if (subscribed) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <SEO
          title="Newsletter - Inscription confirmée"
          description="Merci pour votre inscription à la newsletter World Auto France"
          noindex={true}
        />
        <div className="max-w-md mx-auto px-4">
          <Card className="text-center p-8">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h1 className="font-heading text-2xl font-bold mb-2">Merci pour votre inscription !</h1>
            <p className="text-muted-foreground mb-6">
              Vous recevrez bientôt nos actualités et offres exclusives.
            </p>
            <Link to="/">
              <Button className="bg-accent hover:bg-accent/90">
                Retour à l'accueil
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title="Newsletter - Restez informé"
        description="Inscrivez-vous à la newsletter World Auto France pour recevoir les dernières annonces, promotions et actualités de la marketplace automobile."
      />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Mail className="w-8 h-8 text-accent" />
            Newsletter
          </h1>
          <p className="text-muted-foreground mt-2">
            Recevez les meilleures annonces et actualités directement dans votre boîte mail
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Benefits */}
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold">Pourquoi s'inscrire ?</h2>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border">
                <Bell className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h3 className="font-medium">Nouvelles annonces</h3>
                  <p className="text-sm text-muted-foreground">
                    Soyez alerté des nouvelles pièces correspondant à vos recherches
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border">
                <Tag className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h3 className="font-medium">Promotions exclusives</h3>
                  <p className="text-sm text-muted-foreground">
                    Profitez d'offres réservées aux abonnés
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-4 bg-white rounded-lg border">
                <Sparkles className="w-5 h-5 text-accent mt-0.5" />
                <div>
                  <h3 className="font-medium">Nouveautés du site</h3>
                  <p className="text-sm text-muted-foreground">
                    Découvrez les nouvelles fonctionnalités en avant-première
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                S'inscrire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Prénom (optionnel)</Label>
                  <Input
                    id="name"
                    placeholder="Jean"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-3">
                  <Label>Je souhaite recevoir :</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="new_listings"
                        checked={preferences.new_listings}
                        onCheckedChange={() => togglePreference('new_listings')}
                      />
                      <Label htmlFor="new_listings" className="text-sm font-normal">
                        Les nouvelles annonces
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="promotions"
                        checked={preferences.promotions}
                        onCheckedChange={() => togglePreference('promotions')}
                      />
                      <Label htmlFor="promotions" className="text-sm font-normal">
                        Les promotions et offres spéciales
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="updates"
                        checked={preferences.updates}
                        onCheckedChange={() => togglePreference('updates')}
                      />
                      <Label htmlFor="updates" className="text-sm font-normal">
                        Les nouveautés du site
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="weekly_digest"
                        checked={preferences.weekly_digest}
                        onCheckedChange={() => togglePreference('weekly_digest')}
                      />
                      <Label htmlFor="weekly_digest" className="text-sm font-normal">
                        Le résumé hebdomadaire
                      </Label>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-accent hover:bg-accent/90"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Inscription...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      S'inscrire gratuitement
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Vous pouvez vous désinscrire à tout moment. 
                  Consultez notre <Link to="/politique-confidentialite" className="text-accent hover:underline">politique de confidentialité</Link>.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
