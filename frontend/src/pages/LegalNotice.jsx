import { Card } from '../components/ui/card';
import SEO from '../components/SEO';

export default function LegalNotice() {
  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <SEO
        title="Mentions Légales"
        description="Mentions légales de World Auto France. Informations sur l'éditeur, l'hébergement, la propriété intellectuelle et la politique de confidentialité."
        keywords="mentions légales, RGPD, politique confidentialité, world auto"
        url="/mentions-legales"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="font-heading text-4xl font-bold mb-4">Mentions Légales</h1>
          <p className="text-muted-foreground">Informations légales obligatoires</p>
        </div>

        <Card className="p-8 space-y-8 animate-fade-in-up">
          <section>
            <h2 className="font-heading text-xl font-bold mb-4">1. Éditeur du site</h2>
            <div className="text-muted-foreground space-y-2">
              <p><strong>Nom du site :</strong> World Auto</p>
              <p><strong>URL :</strong> https://worldautofrance.com</p>
              <p><strong>Email :</strong> contact@worldautofrance.com</p>
              <p><strong>Statut :</strong> Plateforme de mise en relation</p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">2. Hébergement</h2>
            <div className="text-muted-foreground space-y-2">
              <p><strong>Hébergeur :</strong> Hostinger International Ltd</p>
              <p><strong>Adresse :</strong> 61 Lordou Vironos Street, 6023 Larnaca, Cyprus</p>
              <p><strong>Site web :</strong> https://www.hostinger.fr</p>
            </div>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">3. Propriété intellectuelle</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              L'ensemble du contenu de ce site (textes, images, vidéos, logos, icônes, 
              sons, logiciels, etc.) est la propriété exclusive de World Auto ou de ses 
              partenaires et est protégé par les lois françaises et internationales 
              relatives à la propriété intellectuelle.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Toute reproduction, représentation, modification, publication, adaptation 
              de tout ou partie des éléments du site, quel que soit le moyen ou le procédé 
              utilisé, est interdite sans autorisation écrite préalable.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">4. Protection des données personnelles</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Conformément au Règlement Général sur la Protection des Données (RGPD) et 
              à la loi Informatique et Libertés, vous disposez d'un droit d'accès, de 
              rectification, de suppression et d'opposition aux données personnelles vous concernant.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Les données collectées sont :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mb-3">
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Numéro de téléphone (optionnel)</li>
              <li>Adresse postale (pour les livraisons)</li>
              <li>Données de navigation (cookies)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Pour exercer vos droits, contactez-nous à : contact@worldautofrance.com
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">5. Cookies</h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              Ce site utilise des cookies pour améliorer l'expérience utilisateur et 
              réaliser des statistiques de visite. Les cookies utilisés sont :
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
              <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site</li>
              <li><strong>Cookies analytiques :</strong> pour mesurer l'audience</li>
              <li><strong>Cookies de préférence :</strong> pour mémoriser vos choix</li>
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">6. Limitation de responsabilité</h2>
            <p className="text-muted-foreground leading-relaxed">
              World Auto s'efforce d'assurer l'exactitude des informations diffusées sur 
              ce site. Toutefois, elle ne peut garantir l'exactitude, la complétude et 
              l'actualité des informations. World Auto décline toute responsabilité pour 
              tout dommage résultant d'une intrusion frauduleuse d'un tiers ou de la 
              présence d'un virus informatique.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">7. Droit applicable</h2>
            <p className="text-muted-foreground leading-relaxed">
              Les présentes mentions légales sont régies par le droit français. En cas 
              de litige, et après échec de toute tentative de recherche d'une solution 
              amiable, les tribunaux français seront seuls compétents.
            </p>
          </section>

          <section>
            <h2 className="font-heading text-xl font-bold mb-4">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              Pour toute question concernant ces mentions légales, vous pouvez nous 
              contacter à l'adresse : <a href="mailto:contact@worldautofrance.com" 
              className="text-accent hover:underline">contact@worldautofrance.com</a>
            </p>
          </section>
        </Card>
      </div>
    </div>
  );
}
