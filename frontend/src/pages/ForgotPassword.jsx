import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '../components/ui/card';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.post(`${API}/auth/forgot-password`, { email });
      setSent(true);
      toast.success(t('auth.email_sent', 'Email envoyé !'));
    } catch (error) {
      toast.error(t('common.error', 'Une erreur est survenue'));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="font-heading">{t('auth.email_sent', 'Email envoyé !')}</CardTitle>
            <CardDescription>
              {t('auth.reset_email_description', 'Si un compte existe avec cette adresse, vous recevrez un email avec un lien pour réinitialiser votre mot de passe.')}
            </CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground text-center">
              {t('auth.check_spam', 'Vérifiez aussi vos spams si vous ne voyez pas l\'email.')}
            </p>
            <Link to="/connexion" className="w-full">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('auth.back_to_login', 'Retour à la connexion')}
              </Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="font-heading">{t('auth.forgot_password', 'Mot de passe oublié ?')}</CardTitle>
          <CardDescription>
            {t('auth.forgot_password_description', 'Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.')}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.email', 'Adresse email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('auth.email_placeholder', 'votre@email.com')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90" disabled={loading}>
              {loading ? t('common.sending', 'Envoi...') : t('auth.send_reset_link', 'Envoyer le lien')}
            </Button>
            <Link to="/connexion" className="text-sm text-muted-foreground hover:text-accent">
              <ArrowLeft className="w-4 h-4 inline mr-1" />
              {t('auth.back_to_login', 'Retour à la connexion')}
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
