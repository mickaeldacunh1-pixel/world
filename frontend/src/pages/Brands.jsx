import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  { name: 'Volkswagen', logo: 'https://www.carlogos.org/car-logos/volkswagen-logo.png', country: 'Germany' },
  { name: 'BMW', logo: 'https://www.carlogos.org/car-logos/bmw-logo.png', country: 'Germany' },
  { name: 'Mercedes', logo: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png', country: 'Germany' },
  { name: 'Audi', logo: 'https://www.carlogos.org/car-logos/audi-logo.png', country: 'Germany' },
  { name: 'Porsche', logo: 'https://www.carlogos.org/car-logos/porsche-logo.png', country: 'Germany' },
  { name: 'Opel', logo: 'https://www.carlogos.org/car-logos/opel-logo.png', country: 'Germany' },
  { name: 'Mini', logo: 'https://www.carlogos.org/car-logos/mini-logo.png', country: 'Germany' },
  
  // Marques italiennes
  { name: 'Fiat', logo: 'https://www.carlogos.org/car-logos/fiat-logo.png', country: 'Italy' },
  { name: 'Alfa Romeo', logo: 'https://www.carlogos.org/car-logos/alfa-romeo-logo.png', country: 'Italy' },
  { name: 'Ferrari', logo: 'https://www.carlogos.org/car-logos/ferrari-logo.png', country: 'Italy' },
  { name: 'Lamborghini', logo: 'https://www.carlogos.org/car-logos/lamborghini-logo.png', country: 'Italy' },
  { name: 'Maserati', logo: 'https://www.carlogos.org/car-logos/maserati-logo.png', country: 'Italy' },
  
  // Marques japonaises
  { name: 'Toyota', logo: 'https://www.carlogos.org/car-logos/toyota-logo.png', country: 'Japan' },
  { name: 'Honda', logo: 'https://www.carlogos.org/car-logos/honda-logo.png', country: 'Japan' },
  { name: 'Nissan', logo: 'https://www.carlogos.org/car-logos/nissan-logo.png', country: 'Japan' },
  { name: 'Mazda', logo: 'https://www.carlogos.org/car-logos/mazda-logo.png', country: 'Japan' },
  { name: 'Suzuki', logo: 'https://www.carlogos.org/car-logos/suzuki-logo.png', country: 'Japan' },
  { name: 'Mitsubishi', logo: 'https://www.carlogos.org/car-logos/mitsubishi-logo.png', country: 'Japan' },
  { name: 'Subaru', logo: 'https://www.carlogos.org/car-logos/subaru-logo.png', country: 'Japan' },
  { name: 'Lexus', logo: 'https://www.carlogos.org/car-logos/lexus-logo.png', country: 'Japan' },
  
  // Marques coréennes
  { name: 'Hyundai', logo: 'https://www.carlogos.org/car-logos/hyundai-logo.png', country: 'South Korea' },
  { name: 'Kia', logo: 'https://www.carlogos.org/car-logos/kia-logo.png', country: 'South Korea' },
  
  // Marques américaines
  { name: 'Ford', logo: 'https://www.carlogos.org/car-logos/ford-logo.png', country: 'USA' },
  { name: 'Chevrolet', logo: 'https://www.carlogos.org/car-logos/chevrolet-logo.png', country: 'USA' },
  { name: 'Jeep', logo: 'https://www.carlogos.org/car-logos/jeep-logo.png', country: 'USA' },
  { name: 'Dodge', logo: 'https://www.carlogos.org/car-logos/dodge-logo.png', country: 'USA' },
  { name: 'Tesla', logo: 'https://www.carlogos.org/car-logos/tesla-logo.png', country: 'USA' },
  
  // Marques espagnoles
  { name: 'Seat', logo: 'https://www.carlogos.org/car-logos/seat-logo.png', country: 'Spain' },
  { name: 'Cupra', logo: 'https://www.carlogos.org/car-logos/cupra-logo.png', country: 'Spain' },
  
  // Marques tchèques
  { name: 'Skoda', logo: 'https://www.carlogos.org/car-logos/skoda-logo.png', country: 'Czechia' },
  
  // Marques suédoises
  { name: 'Volvo', logo: 'https://www.carlogos.org/car-logos/volvo-logo.png', country: 'Sweden' },
  
  // Marques britanniques
  { name: 'Land Rover', logo: 'https://www.carlogos.org/car-logos/land-rover-logo.png', country: 'UK' },
  { name: 'Jaguar', logo: 'https://www.carlogos.org/car-logos/jaguar-logo.png', country: 'UK' },
  { name: 'Bentley', logo: 'https://www.carlogos.org/car-logos/bentley-logo.png', country: 'UK' },
  { name: 'Aston Martin', logo: 'https://www.carlogos.org/car-logos/aston-martin-logo.png', country: 'UK' },
];

// Grouper par pays
const brandsByCountry = brands.reduce((acc, brand) => {
  if (!acc[brand.country]) {
    acc[brand.country] = [];
  }
  acc[brand.country].push(brand);
  return acc;
}, {});

const countryOrder = ['France', 'Germany', 'Italy', 'Japan', 'South Korea', 'USA', 'Spain', 'Czechia', 'Sweden', 'UK'];

export default function Brands() {
  const { t } = useTranslation();

  const countryNames = {
    'France': t('countries.france', 'France'),
    'Germany': t('countries.germany', 'Allemagne'),
    'Italy': t('countries.italy', 'Italie'),
    'Japan': t('countries.japan', 'Japon'),
    'South Korea': t('countries.south_korea', 'Corée du Sud'),
    'USA': t('countries.usa', 'États-Unis'),
    'Spain': t('countries.spain', 'Espagne'),
    'Czechia': t('countries.czechia', 'Tchéquie'),
    'Sweden': t('countries.sweden', 'Suède'),
    'UK': t('countries.uk', 'Royaume-Uni'),
  };

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title={t('brands.seo_title', 'Toutes les marques automobiles')}
        description={t('brands.seo_description', 'Découvrez toutes les marques automobiles disponibles. Pièces détachées et véhicules pour Renault, Peugeot, BMW, Mercedes, Audi et plus.')}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            {t('common.back_home', 'Retour à l\'accueil')}
          </Link>
          <h1 className="font-heading text-3xl md:text-4xl font-bold flex items-center gap-3">
            <Car className="w-8 h-8 text-accent" />
            {t('brands.title', 'Toutes les marques')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('brands.subtitle', 'Sélectionnez une marque pour voir les annonces correspondantes')}
          </p>
        </div>

        {/* Brands by Country */}
        <div className="space-y-10">
          {countryOrder.map(country => (
            brandsByCountry[country] && (
              <section key={country}>
                <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-accent rounded-full"></span>
                  {countryNames[country]}
                </h2>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                  {brandsByCountry[country].map((brand) => (
                    <Link
                      key={brand.name}
                      to={`/annonces?brand=${encodeURIComponent(brand.name)}`}
                      className="group flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-border hover:border-accent hover:shadow-lg transition-all duration-300"
                      title={t('brands.view_listings', 'Voir les annonces {{brand}}', { brand: brand.name })}
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
