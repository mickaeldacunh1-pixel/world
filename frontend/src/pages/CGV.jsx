import { Card } from '../components/ui/card';
import SEO from '../components/SEO';

export default function CGV() {
  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <SEO
        title="Conditions Générales de Vente"
        description="Consultez les Conditions Générales de Vente de World Auto France. Informations sur les services, inscriptions, tarifs et responsabilités."
        keywords="CGV world auto, conditions générales de vente, tarifs annonces"
        url="/cgv"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="font-heading text-4xl font-bold mb-4">Conditions Générales de Vente</h1>
          <p className="text-muted-foreground">Dernière mise à jour : Janvier 2025</p>
        </div>

        <Card className="p-8 space-y-8 animate-fade-in-up">
          <section>
            <h2 className="font-heading text-xl font-bold mb-4">Article 1 - Objet</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes Conditions Générales de Vente (CGV) régissent les relations contractuelles 
              entre World Auto France et ses utilisateurs dans le cadre de l'utilisation de la plateforme 
              de mise en relation pour l'achat et la vente de pièces détachées automobiles et véhicules d'occasion.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">Article 2 - Services proposés</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              World Auto France propose les services suivants :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Publication d'annonces pour la vente de pièces détachées et véhicules</li>
              <li>Système de recherche et de filtrage des annonces</li>
              <li>Messagerie sécurisée entre acheteurs et vendeurs</li>
              <li>Système de paiement sécurisé via Stripe</li>
              <li>Système d'évaluation et d'avis des vendeurs</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">Article 3 - Inscription et compte utilisateur</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              L'inscription sur World Auto France est gratuite. L'utilisateur s'engage à fournir des 
              informations exactes et à jour. Chaque utilisateur est responsable de la 
              confidentialité de ses identifiants de connexion.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              World Auto France se réserve le droit de suspendre ou supprimer tout compte en cas de 
              non-respect des présentes CGV ou de comportement frauduleux.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">Article 4 - Publication d'annonces</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              La publication d'annonces est soumise à l'achat de crédits. Les tarifs sont 
              disponibles sur la page "Tarifs" du site. Chaque annonce est publiée pour une 
              durée de 30 jours renouvelable.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Le vendeur s'engage à décrire ses produits de manière exacte et complète. 
              Les annonces trompeuses ou frauduleuses seront supprimées sans remboursement.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">Article 4bis - Forfaits Vidéo et Mise en Avant</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              World Auto France propose des forfaits vidéo pour enrichir les annonces :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4 mb-3">
              <li>Vidéo Standard : 30 secondes max, incluse avec l'annonce</li>
              <li>Vidéo Étendue : 2 minutes max, 100 Mo - 1,00€</li>
              <li>Vidéo Intermédiaire : 3 minutes max, 150 Mo - 2,99€</li>
              <li>Vidéo PRO Présentation : 10 minutes max, 500 Mo - 9,99€</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Options de mise en avant vidéo sur la page d'accueil :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>Boost Vidéo 1 heure : 0,50€</li>
              <li>Boost Vidéo 24 heures : 5,00€</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              Les forfaits vidéo achetés sont valables pour une annonce. Les vidéos doivent 
              respecter les règles de contenu de la plateforme. Les contenus inappropriés 
              seront supprimés sans remboursement.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">Article 5 - Transactions et paiements</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Les paiements sont sécurisés par Stripe. World Auto France agit en tant qu'intermédiaire 
              et ne peut être tenu responsable des litiges entre acheteurs et vendeurs.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              En cas de litige, les parties sont invitées à trouver une solution amiable. 
              World Auto France peut intervenir en tant que médiateur si nécessaire.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">Article 6 - Responsabilités</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              World Auto France n'est pas responsable :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
              <li>De la qualité, sécurité ou légalité des articles proposés à la vente</li>
              <li>De la véracité des informations fournies par les utilisateurs</li>
              <li>De la capacité des vendeurs à vendre et des acheteurs à acheter</li>
              <li>Des dommages indirects résultant de l'utilisation de la plateforme</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">Article 7 - Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed">
              L'ensemble des éléments constituant le site World Auto France (textes, graphismes, 
              logiciels, etc.) est protégé par le droit de la propriété intellectuelle. 
              Toute reproduction ou utilisation non autorisée est interdite.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">Article 8 - Modification des CGV</h2>
            <p className="text-muted-foreground leading-relaxed">
              World Auto France se réserve le droit de modifier les présentes CGV à tout moment. 
              Les utilisateurs seront informés de toute modification par email ou notification 
              sur le site. L'utilisation continue du service après modification vaut acceptation.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">Article 9 - Droit applicable</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes CGV sont soumises au droit français. En cas de litige, les 
              tribunaux français seront seuls compétents.
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}
