import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import WorldAutoLogo from './WorldAutoLogo';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <WorldAutoLogo className="w-10 h-10" />
              <span className="font-heading font-bold text-xl">World Auto</span>
            </Link>
            <p className="text-primary-foreground/70 max-w-md">
              La marketplace internationale pour les pièces détachées automobiles, 
              voitures d'occasion, motos et utilitaires. Pour particuliers et professionnels.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Catégories</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/annonces/pieces" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Pièces Détachées
                </Link>
              </li>
              <li>
                <Link to="/annonces/voitures" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Voitures d'Occasion
                </Link>
              </li>
              <li>
                <Link to="/annonces/motos" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Motos
                </Link>
              </li>
              <li>
                <Link to="/annonces/utilitaires" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Utilitaires
                </Link>
              </li>
              <li>
                <Link to="/annonces/accessoires" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Accessoires
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-primary-foreground/70">
                <Mail className="w-4 h-4" />
                contact@worldauto.fr
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/70">
                <Phone className="w-4 h-4" />
                01 23 45 67 89
              </li>
              <li className="flex items-center gap-2 text-primary-foreground/70">
                <MapPin className="w-4 h-4" />
                Paris, France
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-primary-foreground/50 text-sm">
            © {new Date().getFullYear()} World Auto. Tous droits réservés.
          </p>
          <div className="flex gap-6 text-sm">
            <Link to="/tarifs" className="text-primary-foreground/50 hover:text-accent transition-colors">
              Tarifs
            </Link>
            <a href="#" className="text-primary-foreground/50 hover:text-accent transition-colors">
              CGU
            </a>
            <a href="#" className="text-primary-foreground/50 hover:text-accent transition-colors">
              Mentions légales
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
