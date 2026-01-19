import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Download, Printer, ArrowLeft, Euro, Calendar, Users, AlertTriangle, CheckCircle } from 'lucide-react';

export default function AdminGuide() {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user?.is_admin) {
    navigate('/');
    return null;
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Ouvre la page d'impression qui permet de sauvegarder en PDF
    window.print();
  };

  return (
    <div className="min-h-screen bg-secondary/30 py-8 print:bg-white print:py-0">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header - Hidden on print */}
        <div className="flex items-center justify-between mb-8 print:hidden">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/admin/ventes')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <h1 className="font-heading text-2xl font-bold">Guide des Ventes & Reversements</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" />
              Imprimer
            </Button>
            <Button onClick={handleDownloadPDF}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6 print:space-y-4">
          {/* Title for print */}
          <div className="hidden print:block text-center mb-8">
            <h1 className="text-3xl font-bold">📚 GUIDE DE GESTION DES VENTES & REVERSEMENTS</h1>
            <p className="text-gray-600">World Auto France - Paiements CB via Stripe Direct</p>
          </div>

          {/* Résumé */}
          <Card className="print:shadow-none print:border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Euro className="w-5 h-5 text-accent" />
                Résumé du système
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>✅ <strong>Tous les acheteurs</strong> peuvent payer par CB (pas besoin que le vendeur ait Stripe)</p>
                <p>💰 <strong>L'argent arrive sur VOTRE compte Stripe</strong> (plateforme)</p>
                <p>🏦 <strong>Vous reversez ensuite aux vendeurs</strong> par virement bancaire</p>
              </div>
            </CardContent>
          </Card>

          {/* Commission */}
          <Card className="print:shadow-none print:border">
            <CardHeader>
              <CardTitle>💸 Commission & Calculs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-accent/10 rounded-lg p-4 mb-4">
                <p className="text-lg font-bold text-center">Commission : 5% (min 0,50€ - max 15€)</p>
              </div>
              
              <h4 className="font-semibold mb-3">Exemples de calcul :</h4>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="border p-2 text-left">Prix de vente</th>
                      <th className="border p-2 text-left">Commission</th>
                      <th className="border p-2 text-left">À reverser au vendeur</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">10 €</td>
                      <td className="border p-2 text-accent">0,50 € (min)</td>
                      <td className="border p-2 font-bold">9,50 €</td>
                    </tr>
                    <tr className="bg-secondary/50">
                      <td className="border p-2">50 €</td>
                      <td className="border p-2 text-accent">2,50 €</td>
                      <td className="border p-2 font-bold">47,50 €</td>
                    </tr>
                    <tr>
                      <td className="border p-2">80 €</td>
                      <td className="border p-2 text-accent">4,00 €</td>
                      <td className="border p-2 font-bold">76,00 €</td>
                    </tr>
                    <tr className="bg-secondary/50">
                      <td className="border p-2">200 €</td>
                      <td className="border p-2 text-accent">10,00 €</td>
                      <td className="border p-2 font-bold">190,00 €</td>
                    </tr>
                    <tr>
                      <td className="border p-2">500 €</td>
                      <td className="border p-2 text-accent">15,00 € (max)</td>
                      <td className="border p-2 font-bold">485,00 €</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Fréquence */}
          <Card className="print:shadow-none print:border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Fréquence des reversements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto mb-4">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-secondary">
                      <th className="border p-2 text-left">Type vendeur</th>
                      <th className="border p-2 text-left">Fréquence</th>
                      <th className="border p-2 text-left">Délai après vente</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 font-medium">🏢 Vendeurs PRO</td>
                      <td className="border p-2">Hebdomadaire (chaque lundi)</td>
                      <td className="border p-2">7 jours minimum</td>
                    </tr>
                    <tr className="bg-secondary/50">
                      <td className="border p-2 font-medium">👤 Particuliers</td>
                      <td className="border p-2">Bi-mensuel (1er et 15)</td>
                      <td className="border p-2">7-14 jours</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <p className="text-amber-800">
                  <strong>⏳ Pourquoi attendre 7 jours minimum ?</strong><br/>
                  • Permet de gérer les litiges et remboursements<br/>
                  • Protège la plateforme contre la fraude<br/>
                  • Laisse le temps de confirmer la livraison
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Procédure */}
          <Card className="print:shadow-none print:border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Procédure de reversement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</div>
                  <div>
                    <p className="font-semibold">Accéder à la page Admin Ventes</p>
                    <p className="text-muted-foreground text-sm">Menu Admin → Gestion des Ventes ou /admin/ventes</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</div>
                  <div>
                    <p className="font-semibold">Vérifier les ventes à reverser</p>
                    <p className="text-muted-foreground text-sm">Onglet "Reversements par vendeur" → Voir montant par vendeur → Vérifier IBAN</p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</div>
                  <div>
                    <p className="font-semibold">Effectuer le virement</p>
                    <p className="text-muted-foreground text-sm">
                      Banque en ligne → Virement vers IBAN du vendeur<br/>
                      Référence : "WORLDAUTO-[NOM]-[DATE]"
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-accent text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</div>
                  <div>
                    <p className="font-semibold">Marquer comme versé</p>
                    <p className="text-muted-foreground text-sm">Cliquer "Marquer tout comme versé" → Le vendeur reçoit une notification</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Workflow */}
          <Card className="print:shadow-none print:border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Workflow quotidien / hebdomadaire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📅 Tous les jours</h4>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>☐ Vérifier les nouvelles ventes payées</li>
                    <li>☐ Répondre aux litiges éventuels</li>
                  </ul>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h4 className="font-semibold text-green-800 mb-2">📅 Chaque lundi (PRO)</h4>
                  <ul className="text-green-700 text-sm space-y-1">
                    <li>☐ Accéder à /admin/ventes</li>
                    <li>☐ Filtrer vendeurs PRO + ventes {">"} 7j</li>
                    <li>☐ Effectuer les virements</li>
                    <li>☐ Marquer comme versés</li>
                  </ul>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 md:col-span-2">
                  <h4 className="font-semibold text-purple-800 mb-2">📅 1er et 15 du mois (Particuliers)</h4>
                  <ul className="text-purple-700 text-sm space-y-1">
                    <li>☐ Même procédure que pour les PRO</li>
                    <li>☐ Vérifier les IBAN manquants et contacter les vendeurs</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cas particuliers */}
          <Card className="print:shadow-none print:border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Cas particuliers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-red-500 pl-4">
                  <h4 className="font-semibold">🔴 Remboursement demandé</h4>
                  <p className="text-sm text-muted-foreground">
                    • Si virement <strong>pas encore fait</strong> → Annulez la vente, remboursez via Stripe<br/>
                    • Si virement <strong>déjà fait</strong> → Demandez au vendeur de vous rembourser d'abord
                  </p>
                </div>
                
                <div className="border-l-4 border-amber-500 pl-4">
                  <h4 className="font-semibold">🟡 Vendeur sans IBAN</h4>
                  <p className="text-sm text-muted-foreground">
                    • Contactez le vendeur pour obtenir ses coordonnées bancaires<br/>
                    • En attendant, ne faites pas le reversement
                  </p>
                </div>
                
                <div className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold">🔵 Litige acheteur/vendeur</h4>
                  <p className="text-sm text-muted-foreground">
                    • Bloquez le reversement jusqu'à résolution<br/>
                    • Médiatisez si nécessaire<br/>
                    • Remboursez l'acheteur OU versez au vendeur selon décision
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenus estimés */}
          <Card className="print:shadow-none print:border">
            <CardHeader>
              <CardTitle>💰 Revenus mensuels estimés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-accent text-white">
                      <th className="border p-2 text-left">Volume de ventes/mois</th>
                      <th className="border p-2 text-left">Revenus commission</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2">1 000 €</td>
                      <td className="border p-2 font-bold text-green-600">~50 €</td>
                    </tr>
                    <tr className="bg-secondary/50">
                      <td className="border p-2">5 000 €</td>
                      <td className="border p-2 font-bold text-green-600">~250 €</td>
                    </tr>
                    <tr>
                      <td className="border p-2">10 000 €</td>
                      <td className="border p-2 font-bold text-green-600">~500 €</td>
                    </tr>
                    <tr className="bg-secondary/50">
                      <td className="border p-2">50 000 €</td>
                      <td className="border p-2 font-bold text-green-600">~2 500 €</td>
                    </tr>
                    <tr>
                      <td className="border p-2">100 000 €</td>
                      <td className="border p-2 font-bold text-green-600">~5 000 €</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                *Le plafond de 15€/vente limite les revenus sur les grosses ventes
              </p>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground py-4 border-t">
            <p>World Auto France - Guide des Ventes & Reversements</p>
            <p>Dernière mise à jour : 19 janvier 2026</p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
          .print\\:shadow-none { box-shadow: none !important; }
          .print\\:border { border: 1px solid #e5e7eb !important; }
          .print\\:bg-white { background: white !important; }
          .print\\:py-0 { padding-top: 0 !important; padding-bottom: 0 !important; }
          .print\\:space-y-4 > * + * { margin-top: 1rem !important; }
        }
      `}</style>
    </div>
  );
}
