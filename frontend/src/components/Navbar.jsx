import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
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
import { Car, Wrench, Bike, Truck, Settings, User, LogOut, MessageSquare, LayoutDashboard, Menu, X, Plus, Package, Heart, Bell, TrendingUp, Palette, ShoppingCart, Moon, Sun, Gift, Stethoscope } from 'lucide-react';
import WorldAutoLogo from './WorldAutoLogo';
import FranceText from './FranceText';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { name: 'Pièces Détachées', slug: 'pieces', icon: Wrench },
  { name: 'Voitures', slug: 'voitures', icon: Car },
  { name: 'Motos', slug: 'motos', icon: Bike },
  { name: 'Utilitaires', slug: 'utilitaires', icon: Truck },
  { name: 'Accessoires', slug: 'accessoires', icon: Settings },
];

export default function Navbar() {
  const { user, token, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo-link">
            <WorldAutoLogo className="w-10 h-10" />
            <span className="font-heading font-bold text-xl text-primary">World Auto <FranceText /></span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="font-medium" data-testid="categories-dropdown">
                  Catégories
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56">
                {categories.map((cat) => (
                  <DropdownMenuItem key={cat.slug} asChild>
                    <Link to={`/annonces/${cat.slug}`} className="flex items-center gap-2 cursor-pointer">
                      <cat.icon className="w-4 h-4" />
                      {cat.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to="/annonces" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="all-listings-link">
              Toutes les annonces
            </Link>

            <Link to="/tarifs" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="pricing-link">
              Tarifs
            </Link>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
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

            {user ? (
              <>
                {/* Quick action icons */}
                <Link to="/diagnostic" className="hidden sm:flex" title="Diagnostic IA">
                  <Button variant="ghost" size="icon" className="relative">
                    <Stethoscope className="w-5 h-5 text-accent" />
                  </Button>
                </Link>

                <Link to="/fidelite" className="hidden sm:flex" title="Programme Fidélité">
                  <Button variant="ghost" size="icon" className="relative">
                    <Gift className="w-5 h-5" />
                  </Button>
                </Link>

                <Link to="/favoris" className="hidden sm:flex" title="Mes favoris">
                  <Button variant="ghost" size="icon" className="relative">
                    <Heart className="w-5 h-5" />
                  </Button>
                </Link>

                <Link to="/messages" className="hidden sm:flex" title="Messages">
                  <Button variant="ghost" size="icon" className="relative">
                    <MessageSquare className="w-5 h-5" />
                    {unreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold animate-pulse">
                        {unreadMessages > 9 ? '9+' : unreadMessages}
                      </span>
                    )}
                  </Button>
                </Link>

                <Link to="/panier" className="hidden sm:flex" title="Panier">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="w-5 h-5" />
                  </Button>
                </Link>

                <Link to="/deposer">
                  <Button className="hidden sm:flex items-center gap-2 bg-accent hover:bg-accent/90 text-accent-foreground btn-primary" data-testid="create-listing-btn">
                    <Plus className="w-4 h-4" />
                    Déposer une annonce
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2" data-testid="user-menu">
                      <User className="w-4 h-4" />
                      <span className="hidden sm:inline">{user.name}</span>
                      {user.credits > 0 && (
                        <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                          {user.credits}
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem asChild>
                      <Link to="/profil" className="flex items-center gap-2 cursor-pointer">
                        <User className="w-4 h-4" />
                        Mon Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/tableau-de-bord" className="flex items-center gap-2 cursor-pointer">
                        <LayoutDashboard className="w-4 h-4" />
                        Tableau de bord
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/commandes" className="flex items-center gap-2 cursor-pointer">
                        <Package className="w-4 h-4" />
                        Mes Commandes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/messages" className="flex items-center gap-2 cursor-pointer">
                        <MessageSquare className="w-4 h-4" />
                        Messages
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
                        Mes Favoris
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/alertes" className="flex items-center gap-2 cursor-pointer">
                        <Bell className="w-4 h-4" />
                        Mes Alertes
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/statistiques" className="flex items-center gap-2 cursor-pointer">
                        <TrendingUp className="w-4 h-4" />
                        Mes Statistiques
                      </Link>
                    </DropdownMenuItem>
                    {(user.email === 'admin@worldautofrance.com' || user.is_professional) && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link to="/admin/parametres" className="flex items-center gap-2 cursor-pointer text-accent">
                            <Palette className="w-4 h-4" />
                            Personnalisation site
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/tarifs" className="flex items-center gap-2 cursor-pointer">
                        <Settings className="w-4 h-4" />
                        Acheter des crédits ({user.credits})
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                      <LogOut className="w-4 h-4 mr-2" />
                      Déconnexion
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" data-testid="login-btn">Connexion</Button>
                </Link>
                <Link to="/auth?mode=register">
                  <Button className="bg-primary hover:bg-primary/90" data-testid="register-btn">S'inscrire</Button>
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
