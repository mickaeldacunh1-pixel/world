import { Link } from 'react-router-dom';
import { Mail, Car, Wrench, Bike, Truck } from 'lucide-react';
import WorldAutoLogo from './WorldAutoLogo';
import FranceText from './FranceText';

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground mt-auto" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 group">
              <WorldAutoLogo className="w-10 h-10 transition-transform group-hover:scale-110" />
              <span className="font-heading font-bold text-xl">World Auto <FranceText /></span>
            </Link>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              La marketplace automobile de référence pour les pièces détachées, 
              véhicules d'occasion et accessoires. Pour particuliers et professionnels.
            </p>
          </div>

          {/* Catégories */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
              <Car className="w-5 h-5 text-accent" />
              Catégories
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/annonces/pieces" className="text-primary-foreground/70 hover:text-accent transition-colors flex items-center gap-2 group">
                  <Wrench className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                  Pièces Détachées
                </Link>
              </li>
              <li>
                <Link to="/annonces/voitures" className="text-primary-foreground/70 hover:text-accent transition-colors flex items-center gap-2 group">
                  <Car className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  Voitures
                </Link>
              </li>
              <li>
                <Link to="/annonces/motos" className="text-primary-foreground/70 hover:text-accent transition-colors flex items-center gap-2 group">
                  <Bike className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  Motos
                </Link>
              </li>
              <li>
                <Link to="/annonces/utilitaires" className="text-primary-foreground/70 hover:text-accent transition-colors flex items-center gap-2 group">
                  <Truck className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  Utilitaires
                </Link>
              </li>
            </ul>
          </div>

          {/* Liens utiles */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Liens utiles</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/a-propos" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/faq" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/cgv" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link to="/politique-retours" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Politique de retours
                </Link>
              </li>
              <li>
                <Link to="/mentions-legales" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-primary-foreground/70 hover:text-accent transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Contact</h3>
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
            © {new Date().getFullYear()} World Auto. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
