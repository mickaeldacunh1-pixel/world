import { Link } from 'react-router-dom';
import { ArrowLeft, Car } from 'lucide-react';
import SEO from '../components/SEO';

const brands = [
  // Marques françaises
  { name: 'Renault', logo: 'https://www.carlogos.org/car-logos/renault-logo.png', country: 'France' },
  { name: 'Peugeot', logo: 'https://www.carlogos.org/car-logos/peugeot-logo.png', country: 'France' },
  { name: 'Citroën', logo: 'https://www.carlogos.org/car-logos/citroen-logo.png', country: 'France' },
  { name: 'Dacia', logo: 'https://www.carlogos.org/car-logos/dacia-logo.png', country: 'France' },
  { name: 'Alpine', logo: 'https://www.carlogos.org/car-logos/alpine-logo.png', country: 'France' },
  { name: 'DS', logo: 'https://www.carlogos.org/car-logos/ds-automobiles-logo.png', country: 'France' },
  
  // Marques allemandes
  { name: 'Volkswagen', logo: 'https://www.carlogos.org/car-logos/volkswagen-logo.png', country: 'Allemagne' },
  { name: 'BMW', logo: 'https://www.carlogos.org/car-logos/bmw-logo.png', country: 'Allemagne' },
  { name: 'Mercedes', logo: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png', country: 'Allemagne' },
  { name: 'Audi', logo: 'https://www.carlogos.org/car-logos/audi-logo.png', country: 'Allemagne' },
  { name: 'Porsche', logo: 'https://www.carlogos.org/car-logos/porsche-logo.png', country: 'Allemagne' },
  { name: 'Opel', logo: 'https://www.carlogos.org/car-logos/opel-logo.png', country: 'Allemagne' },
  { name: 'Mini', logo: 'https://www.carlogos.org/car-logos/mini-logo.png', country: 'Allemagne' },
  
  // Marques italiennes
  { name: 'Fiat', logo: 'https://www.carlogos.org/car-logos/fiat-logo.png', country: 'Italie' },
  { name: 'Alfa Romeo', logo: 'https://www.carlogos.org/car-logos/alfa-romeo-logo.png', country: 'Italie' },
  { name: 'Ferrari', logo: 'https://www.carlogos.org/car-logos/ferrari-logo.png', country: 'Italie' },
  { name: 'Lamborghini', logo: 'https://www.carlogos.org/car-logos/lamborghini-logo.png', country: 'Italie' },
  { name: 'Maserati', logo: 'https://www.carlogos.org/car-logos/maserati-logo.png', country: 'Italie' },
  
  // Marques japonaises
  { name: 'Toyota', logo: 'https://www.carlogos.org/car-logos/toyota-logo.png', country: 'Japon' },
  { name: 'Honda', logo: 'https://www.carlogos.org/car-logos/honda-logo.png', country: 'Japon' },
  { name: 'Nissan', logo: 'https://www.carlogos.org/car-logos/nissan-logo.png', country: 'Japon' },
  { name: 'Mazda', logo: 'https://www.carlogos.org/car-logos/mazda-logo.png', country: 'Japon' },
  { name: 'Suzuki', logo: 'https://www.carlogos.org/car-logos/suzuki-logo.png', country: 'Japon' },
  { name: 'Mitsubishi', logo: 'https://www.carlogos.org/car-logos/mitsubishi-logo.png', country: 'Japon' },
  { name: 'Subaru', logo: 'https://www.carlogos.org/car-logos/subaru-logo.png', country: 'Japon' },
  { name: 'Lexus', logo: 'https://www.carlogos.org/car-logos/lexus-logo.png', country: 'Japon' },
  
  // Marques coréennes
  { name: 'Hyundai', logo: 'https://www.carlogos.org/car-logos/hyundai-logo.png', country: 'Corée du Sud' },
  { name: 'Kia', logo: 'https://www.carlogos.org/car-logos/kia-logo.png', country: 'Corée du Sud' },
  
  // Marques américaines
  { name: 'Ford', logo: 'https://www.carlogos.org/car-logos/ford-logo.png', country: 'États-Unis' },
  { name: 'Chevrolet', logo: 'https://www.carlogos.org/car-logos/chevrolet-logo.png', country: 'États-Unis' },
  { name: 'Jeep', logo: 'https://www.carlogos.org/car-logos/jeep-logo.png', country: 'États-Unis' },
  { name: 'Dodge', logo: 'https://www.carlogos.org/car-logos/dodge-logo.png', country: 'États-Unis' },
  { name: 'Tesla', logo: 'https://www.carlogos.org/car-logos/tesla-logo.png', country: 'États-Unis' },
  
  // Marques espagnoles
  { name: 'Seat', logo: 'https://www.carlogos.org/car-logos/seat-logo.png', country: 'Espagne' },
  { name: 'Cupra', logo: 'https://www.carlogos.org/car-logos/cupra-logo.png', country: 'Espagne' },
  
  // Marques tchèques
  { name: 'Skoda', logo: 'https://www.carlogos.org/car-logos/skoda-logo.png', country: 'Tchéquie' },
  
  // Marques suédoises
  { name: 'Volvo', logo: 'https://www.carlogos.org/car-logos/volvo-logo.png', country: 'Suède' },
  
  // Marques britanniques
  { name: 'Land Rover', logo: 'https://www.carlogos.org/car-logos/land-rover-logo.png', country: 'Royaume-Uni' },
  { name: 'Jaguar', logo: 'https://www.carlogos.org/car-logos/jaguar-logo.png', country: 'Royaume-Uni' },
  { name: 'Bentley', logo: 'https://www.carlogos.org/car-logos/bentley-logo.png', country: 'Royaume-Uni' },
  { name: 'Aston Martin', logo: 'https://www.carlogos.org/car-logos/aston-martin-logo.png', country: 'Royaume-Uni' },
];

// Grouper par pays
const brandsByCountry = brands.reduce((acc, brand) => {
  if (!acc[brand.country]) {
    acc[brand.country] = [];
  }
  acc[brand.country].push(brand);
  return acc;
}, {});

const countryOrder = ['France', 'Allemagne', 'Italie', 'Japon', 'Corée du Sud', 'États-Unis', 'Espagne', 'Tchéquie', 'Suède', 'Royaume-Uni'];

export default function Brands() {
  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title="Toutes les marques automobiles"
        description="Découvrez toutes les marques automobiles disponibles sur World Auto France. Pièces détachées et véhicules pour Renault, Peugeot, BMW, Mercedes, Audi et plus."
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Car className="w-8 h-8 text-accent" />
            Toutes les marques
          </h1>
          <p className="text-muted-foreground mt-2">
            Sélectionnez une marque pour voir les annonces correspondantes
          </p>
        </div>

        {/* Brands by Country */}
        <div className="space-y-10">
          {countryOrder.map(country => (
            brandsByCountry[country] && (
              <section key={country}>
                <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  {country}
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {brandsByCountry[country].map((brand) => (
                    <Link
                      key={brand.name}
                      to={`/annonces?brand=${encodeURIComponent(brand.name)}`}
                      className="group flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-border hover:border-accent hover:shadow-lg transition-all duration-300"
                      title={`Voir les annonces ${brand.name}`}
                    >
                      <div className="w-14 h-14 flex items-center justify-center mb-2">
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = `<div class="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center"><span class="text-accent font-bold text-xl">${brand.name.charAt(0)}</span></div>`;
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors text-center">
                        {brand.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )
          ))}
        </div>
      </div>
    </div>
  );
}
