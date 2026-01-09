import { Card } from '../components/ui/card';
import { Link } from 'react-router-dom';
import { RotateCcw, Clock, CheckCircle, XCircle, AlertTriangle, MessageSquare, Shield, Package, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

export default function ReturnsPolicy() {
  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <SEO
        title="Politique de Retours"
        description="Politique de retours et de remboursement sur World Auto Pro. Découvrez les conditions, délais et procédures pour retourner un article."
        keywords="retour, remboursement, rétractation, politique retour, world auto"
        url="/politique-retours"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-accent mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
              <RotateCcw className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h1 className="font-heading text-3xl font-bold">Politique de Retours</h1>
              <p className="text-muted-foreground">Conditions et procédures de retour sur World Auto Pro</p>
            </div>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="p-6 mb-8 border-accent/50 bg-accent/5">
          <div className="flex gap-4">
            <AlertTriangle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-heading font-bold text-lg mb-2">Information importante</h2>
              <p className="text-muted-foreground">
                World Auto Pro est une <strong>plateforme de mise en relation</strong> entre acheteurs et vendeurs. 
                Pour les achats effectués via notre <strong>système de paiement sécurisé</strong>, l'argent est protégé 
                jusqu'à confirmation de réception. Pour les transactions directes entre particuliers, 
                World Auto Pro ne peut être tenu responsable des litiges commerciaux.
              </p>
            </div>
          </div>
        </Card>

        {/* Secure Payment Info */}
        <Card className="p-6 mb-8 border-green-500/50 bg-green-50">
          <div className="flex gap-4">
            <Shield className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="font-heading font-bold text-lg mb-2 text-green-800">🔒 Paiement Sécurisé (Escrow)</h2>
              <p className="text-green-700 mb-3">
                Pour les achats via le bouton <strong>"Acheter maintenant"</strong>, votre argent est protégé :
              </p>
              <ul className="list-disc list-inside space-y-1 text-green-700 text-sm">
                <li>L'argent est bloqué sur un compte sécurisé (escrow) pendant l'expédition</li>
                <li>Le vendeur n'est payé que lorsque vous confirmez la réception</li>
                <li>En cas de litige, nous pouvons intervenir et rembourser</li>
                <li>Commission de 5% prélevée sur le vendeur uniquement (min 1,50€, max 15€)</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Droit de rétractation */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">1. Droit de rétractation (14 jours)</h2>
                <p className="text-muted-foreground mb-4">
                  Conformément à l'article L221-18 du Code de la consommation, pour les achats auprès de 
                  <strong> vendeurs professionnels</strong>, vous disposez d'un délai de <strong>14 jours</strong> à 
                  compter de la réception du bien pour exercer votre droit de rétractation, sans avoir à justifier 
                  de motifs ni à payer de pénalités.
                </p>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Ce délai s'applique si :</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Le vendeur est un professionnel (badge "PRO" sur l'annonce)</li>
                    <li>L'achat a été effectué à distance (en ligne)</li>
                    <li>Le produit n'entre pas dans les exceptions légales</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Ventes entre particuliers */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">2. Ventes entre particuliers</h2>
                <p className="text-muted-foreground mb-4">
                  Pour les achats auprès de <strong>vendeurs particuliers</strong>, le droit de rétractation légal 
                  ne s'applique pas. La vente est considérée comme définitive une fois conclue.
                </p>
                <p className="text-muted-foreground mb-4">
                  Toutefois, nous encourageons fortement les vendeurs particuliers à accepter les retours dans 
                  les cas suivants :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>Article non conforme à la description</li>
                  <li>Article défectueux non mentionné dans l'annonce</li>
                  <li>Article endommagé lors du transport</li>
                  <li>Erreur d'envoi (mauvais article)</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Conditions de retour */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">3. Conditions pour un retour accepté</h2>
                <p className="text-muted-foreground mb-4">
                  Pour qu'un retour soit accepté, l'article doit généralement :
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Accepté
                    </h3>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Être dans son état d'origine</li>
                      <li>• Ne pas avoir été monté/utilisé</li>
                      <li>• Être dans son emballage d'origine si possible</li>
                      <li>• Être accompagné de la facture/preuve d'achat</li>
                    </ul>
                  </div>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h3 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Refusé
                    </h3>
                    <ul className="text-sm text-red-700 space-y-1">
                      <li>• Article monté puis démonté</li>
                      <li>• Article endommagé par l'acheteur</li>
                      <li>• Article incomplet</li>
                      <li>• Retour après le délai convenu</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Exceptions */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <XCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">4. Exceptions au droit de retour</h2>
                <p className="text-muted-foreground mb-4">
                  Conformément à la législation, certains produits ne peuvent pas faire l'objet d'un retour :
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li><strong>Pièces sur mesure</strong> ou personnalisées selon les spécifications de l'acheteur</li>
                  <li><strong>Pièces électroniques reprogrammées</strong> (calculateurs, etc.)</li>
                  <li><strong>Fluides et consommables</strong> descellés (huile, liquide de frein, etc.)</li>
                  <li><strong>Pièces d'occasion</strong> vendues "en l'état" avec défauts clairement indiqués</li>
                  <li><strong>Véhicules</strong> achetés après essai sur place</li>
                </ul>
              </div>
            </div>
          </Card>

          {/* Remboursement */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">5. Procédure de retour et remboursement</h2>
                
                {/* Paiement Sécurisé */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Achats via Paiement Sécurisé
                  </h3>
                  <div className="space-y-3 text-sm text-green-700">
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">1</span>
                      <p><strong>Signaler le problème</strong> - Avant de confirmer la réception, signalez tout problème via votre espace Commandes</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">2</span>
                      <p><strong>Médiation automatique</strong> - L'argent reste bloqué, nous intervenons pour trouver une solution</p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0">3</span>
                      <p><strong>Remboursement rapide</strong> - Si le retour est accepté, remboursement sous 5-7 jours ouvrés</p>
                    </div>
                  </div>
                </div>

                {/* Transaction Directe */}
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Achats par transaction directe</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 items-start">
                      <span className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">1</span>
                      <div>
                        <h4 className="font-semibold">Contactez le vendeur</h4>
                        <p className="text-muted-foreground text-sm">
                          Utilisez la messagerie de la plateforme pour expliquer le motif de votre demande de retour.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">2</span>
                      <div>
                        <h4 className="font-semibold">Attendez l'accord du vendeur</h4>
                        <p className="text-muted-foreground text-sm">
                          Le vendeur dispose de 48h pour répondre à votre demande.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">3</span>
                      <div>
                        <h4 className="font-semibold">Expédiez l'article</h4>
                        <p className="text-muted-foreground text-sm">
                          Emballez soigneusement l'article. <strong>Conservez le numéro de suivi</strong>.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-4 items-start">
                      <span className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">4</span>
                      <div>
                        <h4 className="font-semibold">Remboursement</h4>
                        <p className="text-muted-foreground text-sm">
                          Une fois l'article reçu et vérifié, le remboursement sera effectué sous 14 jours maximum.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Frais de retour */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">6. Frais de retour</h2>
                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">À la charge de l'acheteur :</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Rétractation simple (changement d'avis)</li>
                      <li>Article ne correspondant pas aux attentes (mais conforme à la description)</li>
                    </ul>
                  </div>
                  <div className="bg-secondary/50 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">À la charge du vendeur :</h3>
                    <ul className="list-disc list-inside text-muted-foreground space-y-1">
                      <li>Article non conforme à la description</li>
                      <li>Article défectueux (vice caché)</li>
                      <li>Erreur d'envoi du vendeur</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Litiges */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">7. En cas de litige</h2>
                <p className="text-muted-foreground mb-4">
                  Si vous ne parvenez pas à trouver un accord avec le vendeur :
                </p>
                <ol className="list-decimal list-inside space-y-2 text-muted-foreground mb-4">
                  <li>Contactez notre service client via la page <Link to="/contact" className="text-accent hover:underline">Contact</Link></li>
                  <li>Nous tenterons une médiation entre les deux parties</li>
                  <li>En dernier recours, vous pouvez saisir le médiateur de la consommation</li>
                </ol>
                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                  <p className="text-sm text-indigo-800">
                    <strong>Conseil :</strong> Avant tout achat, lisez attentivement la description de l'annonce, 
                    regardez les photos et n'hésitez pas à poser des questions au vendeur. La plupart des litiges 
                    peuvent être évités par une bonne communication préalable.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Garantie légale */}
          <Card className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">8. Garantie légale de conformité</h2>
                <p className="text-muted-foreground mb-4">
                  Pour les achats auprès de <strong>vendeurs professionnels</strong>, vous bénéficiez de la garantie 
                  légale de conformité (articles L217-4 et suivants du Code de la consommation) pendant <strong>2 ans</strong> 
                  à compter de la livraison du bien.
                </p>
                <p className="text-muted-foreground">
                  Cette garantie vous permet d'obtenir la réparation ou le remplacement du bien en cas de défaut 
                  de conformité, sans frais. Si ces solutions sont impossibles, vous pouvez obtenir un remboursement.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>Dernière mise à jour : Janvier 2026</p>
          <p className="mt-2">
            Pour toute question, contactez-nous via notre <Link to="/contact" className="text-accent hover:underline">formulaire de contact</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}
