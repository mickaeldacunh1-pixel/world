import { useState, useEffect } from 'react';
import axios from 'axios';
import { Card } from '../components/ui/card';
import { Target } from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Default values
const DEFAULTS = {
  about_title: 'À propos de World Auto Pro',
  about_subtitle: 'La marketplace automobile de référence en France pour les particuliers et professionnels.',
  about_mission_title: 'Notre mission',
  about_mission_p1: "World Auto Pro est né d'une passion pour l'automobile et d'une volonté de simplifier l'achat et la vente de pièces détachées et de véhicules d'occasion en France.",
  about_mission_p2: "Notre plateforme met en relation acheteurs et vendeurs, qu'ils soient particuliers ou professionnels du secteur automobile. Nous facilitons les transactions en toute sécurité grâce à notre système de paiement intégré et notre messagerie sécurisée.",
  about_mission_p3: "Que vous cherchiez une pièce rare pour votre véhicule de collection ou que vous souhaitiez vendre votre voiture, World Auto Pro est là pour vous accompagner.",
  about_values_title: 'Nos valeurs',
  about_value1_icon: '🛡️',
  about_value1_title: 'Sécurité',
  about_value1_desc: 'Paiements sécurisés via Stripe et vérification des vendeurs professionnels.',
  about_value2_icon: '👥',
  about_value2_title: 'Communauté',
  about_value2_desc: "Une communauté de passionnés et de professionnels de l'automobile.",
  about_value3_icon: '🏆',
  about_value3_title: 'Qualité',
  about_value3_desc: "Des annonces vérifiées et un système d'avis pour garantir la qualité.",
  about_stats_enabled: true,
  about_stats_title: 'World Auto Pro en chiffres',
  about_stat1_value: '1000+',
  about_stat1_label: 'Annonces publiées',
  about_stat2_value: '500+',
  about_stat2_label: 'Utilisateurs actifs',
  about_stat3_value: '50+',
  about_stat3_label: 'Vendeurs PRO',
  about_stat4_value: '98%',
  about_stat4_label: 'Clients satisfaits',
};

export default function About() {
  const [settings, setSettings] = useState(DEFAULTS);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await axios.get(`${API}/settings`);
        setSettings({ ...DEFAULTS, ...res.data });
      } catch (err) {
        console.log('Using default about settings');
      }
    };
    fetchSettings();
  }, []);

  const s = settings;

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <SEO
        title="À propos"
        description="Découvrez World Auto Pro, la marketplace automobile de référence pour l'achat et la vente de pièces détachées et véhicules d'occasion."
        keywords="à propos world auto, marketplace automobile France, qui sommes-nous"
        url="/a-propos"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">
            {s.about_title}
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {s.about_subtitle}
          </p>
        </div>

        {/* Notre mission */}
        <Card className="p-8 mb-8 animate-fade-in-up">
          <h2 className="font-heading text-2xl font-bold mb-4 flex items-center gap-3">
            <Target className="w-6 h-6 text-accent" />
            {s.about_mission_title}
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {s.about_mission_p1}
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {s.about_mission_p2}
          </p>
          <p className="text-muted-foreground leading-relaxed">
            {s.about_mission_p3}
          </p>
        </Card>

        {/* Nos valeurs */}
        <h2 className="font-heading text-2xl font-bold mb-6 text-center">{s.about_values_title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center card-hover animate-fade-in-up stagger-1">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              {s.about_value1_icon}
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">{s.about_value1_title}</h3>
            <p className="text-muted-foreground text-sm">
              {s.about_value1_desc}
            </p>
          </Card>

          <Card className="p-6 text-center card-hover animate-fade-in-up stagger-2">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              {s.about_value2_icon}
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">{s.about_value2_title}</h3>
            <p className="text-muted-foreground text-sm">
              {s.about_value2_desc}
            </p>
          </Card>

          <Card className="p-6 text-center card-hover animate-fade-in-up stagger-3">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">
              {s.about_value3_icon}
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">{s.about_value3_title}</h3>
            <p className="text-muted-foreground text-sm">
              {s.about_value3_desc}
            </p>
          </Card>
        </div>

        {/* Chiffres */}
        {s.about_stats_enabled !== false && (
          <Card className="p-8 bg-primary text-primary-foreground animate-fade-in-up">
            <h2 className="font-heading text-2xl font-bold mb-6 text-center">{s.about_stats_title}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="text-3xl font-bold text-accent">{s.about_stat1_value}</p>
                <p className="text-primary-foreground/70 text-sm">{s.about_stat1_label}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">{s.about_stat2_value}</p>
                <p className="text-primary-foreground/70 text-sm">{s.about_stat2_label}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">{s.about_stat3_value}</p>
                <p className="text-primary-foreground/70 text-sm">{s.about_stat3_label}</p>
              </div>
              <div>
                <p className="text-3xl font-bold text-accent">{s.about_stat4_value}</p>
                <p className="text-primary-foreground/70 text-sm">{s.about_stat4_label}</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
