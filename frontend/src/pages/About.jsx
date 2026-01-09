import { Card } from '../components/ui/card';
import { Users, Target, Shield, Award } from 'lucide-react';
import SEO from '../components/SEO';

export default function About() {
  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <SEO
        title="À propos"
        description="Découvrez World Auto Pro Pro, la marketplace automobile de référence pour l'achat et la vente de pièces détachées et véhicules d'occasion."
        keywords="à propos world auto, marketplace automobile France, qui sommes-nous"
        url="/a-propos"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="font-heading text-4xl md:text-5xl font-bold mb-4">À propos de World Auto Pro Pro</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            La marketplace automobile de référence en France pour les particuliers et professionnels.
          </p>
        </div>

        {/* Notre histoire */}
        <Card className="p-8 mb-8 animate-fade-in-up">
          <h2 className="font-heading text-2xl font-bold mb-4 flex items-center gap-3">
            <Target className="w-6 h-6 text-accent" />
            Notre mission
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            World Auto Pro Pro est né d'une passion pour l'automobile et d'une volonté de simplifier 
            l'achat et la vente de pièces détachées et de véhicules d'occasion en France.
          </p>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Notre plateforme met en relation acheteurs et vendeurs, qu'ils soient particuliers 
            ou professionnels du secteur automobile. Nous facilitons les transactions en toute 
            sécurité grâce à notre système de paiement intégré et notre messagerie sécurisée.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Que vous cherchiez une pièce rare pour votre véhicule de collection ou que vous 
            souhaitiez vendre votre voiture, World Auto Pro Pro est là pour vous accompagner.
          </p>
        </Card>

        {/* Nos valeurs */}
        <h2 className="font-heading text-2xl font-bold mb-6 text-center">Nos valeurs</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 text-center card-hover animate-fade-in-up stagger-1">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-accent" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Sécurité</h3>
            <p className="text-muted-foreground text-sm">
              Paiements sécurisés via Stripe et vérification des vendeurs professionnels.
            </p>
          </Card>

          <Card className="p-6 text-center card-hover animate-fade-in-up stagger-2">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Users className="w-7 h-7 text-accent" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Communauté</h3>
            <p className="text-muted-foreground text-sm">
              Une communauté de passionnés et de professionnels de l'automobile.
            </p>
          </Card>

          <Card className="p-6 text-center card-hover animate-fade-in-up stagger-3">
            <div className="w-14 h-14 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Award className="w-7 h-7 text-accent" />
            </div>
            <h3 className="font-heading font-bold text-lg mb-2">Qualité</h3>
            <p className="text-muted-foreground text-sm">
              Des annonces vérifiées et un système d'avis pour garantir la qualité.
            </p>
          </Card>
        </div>

        {/* Chiffres */}
        <Card className="p-8 bg-primary text-primary-foreground animate-fade-in-up">
          <h2 className="font-heading text-2xl font-bold mb-6 text-center">World Auto Pro Pro en chiffres</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-3xl font-bold text-accent">1000+</p>
              <p className="text-primary-foreground/70 text-sm">Annonces publiées</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">500+</p>
              <p className="text-primary-foreground/70 text-sm">Utilisateurs actifs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">50+</p>
              <p className="text-primary-foreground/70 text-sm">Vendeurs PRO</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">98%</p>
              <p className="text-primary-foreground/70 text-sm">Clients satisfaits</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
