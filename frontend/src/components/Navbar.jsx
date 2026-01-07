import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import axios from 'axios';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Car, Wrench, Bike, Truck, Settings, User, LogOut, MessageSquare, LayoutDashboard, Menu, X, Plus, Package, Heart, Bell, TrendingUp, Palette, Moon, Sun, Gift, Stethoscope, Tractor } from 'lucide-react';
import WorldAutoLogo from './WorldAutoLogo';
import FranceText from './FranceText';
import LanguageSelector from './LanguageSelector';
import PromoBanner from './PromoBanner';
import CartPreview from './CartPreview';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Navbar() {
  const { t } = useTranslation();
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [navbarSettings, setNavbarSettings] = useState({
    promo_bg_color: '#1E3A5F',
    promo_text_color: '#FFFFFF',
    cart_bg_color: '#1E3A5F',
    cart_text_color: '#FFFFFF',
  });

  const categories = [
    { name: t('nav.parts'), slug: 'pieces', icon: Wrench },
    { name: t('nav.cars'), slug: 'voitures', icon: Car },
    { name: t('nav.motorcycles'), slug: 'motos', icon: Bike },
    { name: t('nav.utilities'), slug: 'utilitaires', icon: Truck },
    { name: 'Engins', slug: 'engins', icon: Tractor },
    { name: t('nav.accessories'), slug: 'accessoires', icon: Settings },
  ];

  // Fetch navbar settings
  useEffect(() => {
    const fetchNavbarSettings = async () => {
      try {
        const response = await axios.get(`${API}/settings/hero`);
        if (response.data) {
          setNavbarSettings(prev => ({
            ...prev,
            promo_bg_color: response.data.promo_bg_color || '#1E3A5F',
            promo_text_color: response.data.promo_text_color || '#FFFFFF',
            cart_bg_color: response.data.cart_bg_color || '#1E3A5F',
            cart_text_color: response.data.cart_text_color || '#FFFFFF',
          }));
        }
      } catch (error) {
        console.log('Using default navbar settings');
      }
    };
    fetchNavbarSettings();
  }, []);

  // Fetch unread messages count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user || !token) {
        setUnreadMessages(0);
        return;
      }
      try {
        const response = await axios.get(`${API}/users/me/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUnreadMessages(response.data.unread_messages || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Poll every 30 seconds for unread messages
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [user, token]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border" data-testid="navbar">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Ligne 1: Logo, Promo Banner, Icônes utilisateur */}
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo - Plus compact sur mobile */}
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 shrink-0" data-testid="logo-link">
            <WorldAutoLogo className="w-8 h-8 sm:w-10 sm:h-10" />
            <span className="font-heading font-bold text-base sm:text-xl text-primary whitespace-nowrap">
              World Auto <span className="hidden sm:inline"><FranceText /></span>
            </span>
          </Link>

          {/* Promo Banner - Desktop only */}
          <div className="hidden lg:block flex-1 mx-4">
            <PromoBanner 
              bgColor={navbarSettings.promo_bg_color} 
              textColor={navbarSettings.promo_text_color} 
            />
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {user ? (
              <>
                {/* Mode sombre */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                  className="hidden sm:flex"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>

                {/* Diagnostic IA */}
                <Link to="/diagnostic" className="hidden sm:flex" title="Diagnostic IA">
                  <Button variant="ghost" size="icon" className="relative">
                    <Stethoscope className="w-5 h-5 text-accent" />
                  </Button>
                </Link>

                {/* Fidélité */}
                <Link to="/fidelite" className="hidden sm:flex" title="Programme Fidélité">
                  <Button variant="ghost" size="icon" className="relative">
                    <Gift className="w-5 h-5" />
                  </Button>
                </Link>

                {/* Favoris */}
                <Link to="/favoris" className="hidden sm:flex" title="Mes favoris">
                  <Button variant="ghost" size="icon" className="relative">
                    <Heart className="w-5 h-5" />
                  </Button>
                </Link>

                {/* Messages */}
                <Link to="/messages" className="hidden sm:flex" title="Messages">
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageSquare className="w-5 h-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadMessages}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Profil (Menu utilisateur) */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="flex items-center gap-1.5 px-2 sm:px-3" data-testid="user-menu">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline max-w-[100px] truncate">{user.name}</span>
                      {user.credits > 0 && (
                        <span className="bg-accent text-accent-foreground text-xs px-1.5 py-0.5 rounded-full">
                          {user.credits}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profil" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        {t('common.profile')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/tableau-de-bord" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="w-4 h-4" />
                        {t('common.dashboard')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/commandes" className="flex items-center gap-2 cursor-pointer">
                        <Package className="w-4 h-4" />
                        {t('nav.myOrders')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/messages" className="flex items-center gap-2 cursor-pointer">
                        <MessageSquare className="w-4 h-4" />
                        {t('common.messages')}
                        {unreadMessages > 0 && (
                          <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                            {unreadMessages}
                          </span>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/favoris" className="flex items-center gap-2 cursor-pointer">
                        <Heart className="w-4 h-4" />
                        {t('common.favorites')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/alertes" className="flex items-center gap-2 cursor-pointer">
                        <Bell className="w-4 h-4" />
                        {t('common.alerts')}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/statistiques" className="flex items-center gap-2 cursor-pointer">
                        <TrendingUp className="w-4 h-4" />
                        {t('common.statistics')}
                      </Link>
                    </DropdownMenuItem>
                    {(user.email === 'admin@worldautofrance.com' || user.is_professional) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin/parametres" className="flex items-center gap-2 cursor-pointer text-accent">
                            <Palette className="w-4 h-4" />
                            {t('nav.customization')}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/tarifs" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4" />
                        {t('common.buy_credits')} ({user.credits})
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      {t('common.logout')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sélecteur de langue */}
                <LanguageSelector />

                {/* Panier rectangle - tout à droite */}
                <div className="hidden sm:block">
                  <CartPreview 
                    bgColor={navbarSettings.cart_bg_color}
                    textColor={navbarSettings.cart_text_color}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Utilisateur non connecté : Mode sombre + Langue + Connexion/Inscription */}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
                  className="hidden sm:flex"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
                <LanguageSelector />
                <Link to="/auth">
                  <Button variant="ghost" data-testid="login-btn">{t('common.login')}</Button>
                </Link>
                <Link to="/auth?mode=register">
                  <Button className="bg-primary hover:bg-primary/90" data-testid="register-btn">{t('common.register')}</Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>



        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border animate-fade-in">
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/annonces/${cat.slug}`}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-secondary rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <cat.icon className="w-4 h-4" />
                  {cat.name}
                </Link>
              ))}
              <Link
                to="/tarifs"
                className="px-4 py-2 hover:bg-secondary rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Tarifs
              </Link>
              {user && (
                <Link
                  to="/deposer"
                  className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="w-4 h-4" />
                  Déposer une annonce
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
