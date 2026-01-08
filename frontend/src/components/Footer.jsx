import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { toast } from 'sonner';
import { Mail, Car, Wrench, Bike, Truck, Send, Loader2, Sparkles, CheckCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import WorldAutoLogo from './WorldAutoLogo';
import FranceText from './FranceText';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Footer() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await axios.post(`${API}/newsletter/subscribe`, { email });
      setSubscribed(true);
      setEmail('');
      toast.success('Inscription réussie !');
    } catch (error) {
      const message = error.response?.data?.detail || 'Erreur lors de l\'inscription';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-primary text-primary-foreground mt-auto" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <WorldAutoLogo className="w-10 h-10 transition-transform group-hover:scale-110" />
              <span className="font-heading font-bold text-xl">World Auto <FranceText /></span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-6">
              {t('footer.description')}
            </p>

            {/* Newsletter Form */}
            <div className="bg-primary-foreground/10 rounded-lg p-4">
              <h4 className="font-heading font-bold text-sm mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                {t('footer.newsletter')}
              </h4>
              {subscribed ? (
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <CheckCircle className="w-4 h-4" />
                  {t('common.success')}!
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                  <Input
                    type="email"
                    placeholder={t('footer.subscribe_placeholder')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 text-sm h-9"
                    required
                  />
                  <Button 
                    type="submit" 
                    size="sm"
                    className="bg-accent hover:bg-accent/90 h-9 px-3"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>

          {/* Catégories */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-accent" />
              {t('nav.categories')}
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/annonces/pieces" className="text-primary-foreground/70 hover:text-accent transition-colors flex items-center gap-2 group">
                  <Wrench className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  {t('nav.parts')}
                </Link>
              </li>
              <li>
                <Link to="/annonces/voitures" className="text-primary-foreground/70 hover:text-accent transition-colors flex items-center gap-2 group">
                  <Car className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  {t('nav.cars')}
                </Link>
              </li>
              <li>
                <Link to="/annonces/motos" className="text-primary-foreground/70 hover:text-accent transition-colors flex items-center gap-2 group">
                  <Bike className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  {t('nav.motorcycles')}
                </Link>
              </li>
              <li>
                <Link to="/annonces/utilitaires" className="text-primary-foreground/70 hover:text-accent transition-colors flex items-center gap-2 group">
                  <Truck className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  {t('nav.utilities')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">{t('footer.useful_links')}</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/nouveautes" className="text-primary-foreground/70 hover:text-accent transition-colors flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {t('nav.updates')}
                </Link>
              </li>
              <li>
                <Link to="/a-propos" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  {t('footer.faq')}
                </Link>
              </li>
              <li>
                <Link to="/cgv" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  {t('footer.terms')}
                </Link>
              </li>
              <li>
                <Link to="/politique-retours" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  {t('footer.returns')}
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  {t('footer.legal')}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  {t('footer.contact')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">{t('footer.contact')}</h3>
            <a 
              href="mailto:contact@worldautofrance.com" 
              className="flex items-center gap-3 text-primary-foreground/70 hover:text-accent transition-colors group"
            >
              <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center group-hover:bg-accent/30 transition-colors">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <span className="text-sm">contact@worldautofrance.com</span>
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-primary-foreground/20 mt-10 pt-8">
          <p className="text-primary-foreground/50 text-sm text-center">
            © {new Date().getFullYear()} World Auto <FranceText />. {t('footer.allRights')}.
          </p>
          <p className="text-primary-foreground/40 text-xs text-center mt-2">
            Made with{' '}
            <a 
              href="https://app.emergent.sh/?utm_source=emergent-badge" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors underline"
            >
              Emergent
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
