import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { 
  ArrowLeft, 
  Download, 
  Smartphone, 
  Monitor, 
  Globe,
  MessageCircle,
  Wrench,
  Search,
  Sparkles,
  CheckCircle,
  ExternalLink
} from 'lucide-react';
import SEO from '../components/SEO';

export default function TobiAgent() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('pwa');

  const features = [
    { icon: MessageCircle, title: 'Chat intelligent', desc: 'Posez vos questions en langage naturel' },
    { icon: Wrench, title: 'Diagnostic auto', desc: 'Identifiez les pannes et solutions' },
    { icon: Search, title: 'Recherche de pièces', desc: 'Trouvez les pièces compatibles' },
    { icon: Sparkles, title: 'Conseils personnalisés', desc: 'Recommandations adaptées à votre véhicule' },
  ];

  const installOptions = [
    {
      id: 'pwa',
      icon: Smartphone,
      title: 'Application Web (PWA)',
      desc: 'Installation rapide depuis votre navigateur',
      color: 'from-blue-500 to-cyan-500',
      steps: [
        'Ouvrez Tobi dans votre navigateur',
        'Cliquez sur "Installer" quand proposé',
        'Ou utilisez le menu ⋮ > "Installer l\'application"',
        'L\'icône apparaîtra sur votre écran d\'accueil'
      ]
    },
    {
      id: 'desktop',
      icon: Monitor,
      title: 'Application Bureau',
      desc: 'Version native pour Windows, Mac et Linux',
      color: 'from-purple-500 to-pink-500',
      steps: [
        'Téléchargez le package pour votre système',
        'Décompressez l\'archive',
        'Exécutez npm install puis npm start',
        'Ou compilez avec npm run build-win/mac/linux'
      ]
    },
    {
      id: 'web',
      icon: Globe,
      title: 'Version Web',
      desc: 'Accès direct sans installation',
      color: 'from-green-500 to-teal-500',
      steps: [
        'Cliquez sur "Ouvrir Tobi"',
        'Utilisez-le directement dans votre navigateur',
        'Fonctionne sur tous les appareils',
        'Pas d\'installation requise'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900" data-testid="tobi-page">
      <SEO
        title="Tobi - Assistant IA Automobile"
        description="Découvrez Tobi, votre assistant IA pour l'automobile. Diagnostic, recherche de pièces, conseils personnalisés."
      />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link to="/" className="text-slate-400 hover:text-white flex items-center gap-2 mb-8">
            <ArrowLeft className="w-4 h-4" />
            Retour à l'accueil
          </Link>

          <div className="text-center mb-12">
            {/* Logo */}
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl mb-6 shadow-2xl shadow-blue-500/30">
              <span className="text-5xl font-black text-white">K</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white mb-4">
              Tobi
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Votre assistant IA personnel pour l'automobile. Diagnostic, recherche de pièces, conseils personnalisés - tout en un seul endroit.
            </p>

            {/* Quick action button */}
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a href="/tobi/" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white h-14 px-8 text-lg gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Ouvrir Tobi
                </Button>
              </a>
              <a href="/tobi/index.html" download="tobi.html">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-14 px-8">
                  <Download className="w-5 h-5 mr-2" />
                  Télécharger
                </Button>
              </a>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
            {features.map((feature, i) => (
              <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="p-4 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <feature.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Installation Options */}
      <section className="py-16 bg-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white text-center mb-4">
            Comment utiliser Tobi ?
          </h2>
          <p className="text-slate-400 text-center mb-12 max-w-2xl mx-auto">
            Choisissez la méthode qui vous convient le mieux
          </p>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {installOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setActiveTab(option.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  activeTab === option.id 
                    ? 'bg-white text-slate-900 font-medium' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <option.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{option.title.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Active tab content */}
          {installOptions.map((option) => (
            activeTab === option.id && (
              <Card key={option.id} className="bg-white/5 border-white/10 backdrop-blur-sm max-w-2xl mx-auto">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className={`w-14 h-14 bg-gradient-to-br ${option.color} rounded-2xl flex items-center justify-center`}>
                      <option.icon className="w-7 h-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{option.title}</h3>
                      <p className="text-slate-400">{option.desc}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {option.steps.map((step, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        </div>
                        <span className="text-slate-300">{step}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    {option.id === 'pwa' && (
                      <a href="/tobi/" target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                          <Smartphone className="w-5 h-5 mr-2" />
                          Ouvrir et Installer la PWA
                        </Button>
                      </a>
                    )}
                    {option.id === 'desktop' && (
                      <a href="/tobi-desktop/README.md" download>
                        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                          <Download className="w-5 h-5 mr-2" />
                          Télécharger le package Desktop
                        </Button>
                      </a>
                    )}
                    {option.id === 'web' && (
                      <a href="/tobi/" target="_blank" rel="noopener noreferrer">
                        <Button className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600">
                          <Globe className="w-5 h-5 mr-2" />
                          Ouvrir Tobi
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white text-center mb-8">
            Questions fréquentes
          </h2>

          <div className="space-y-4">
            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="font-bold text-white mb-2">Tobi est-il gratuit ?</h3>
                <p className="text-slate-400">Oui, Tobi est entièrement gratuit pour les utilisateurs de World Auto France.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="font-bold text-white mb-2">Quels navigateurs sont supportés ?</h3>
                <p className="text-slate-400">Tobi fonctionne sur Chrome, Firefox, Safari, Edge et tous les navigateurs modernes. L'installation PWA est optimale sur Chrome et Edge.</p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardContent className="p-6">
                <h3 className="font-bold text-white mb-2">Puis-je utiliser Tobi hors connexion ?</h3>
                <p className="text-slate-400">La version PWA permet un accès basique hors ligne, mais une connexion internet est nécessaire pour les fonctionnalités IA.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Prêt à essayer Tobi ?
          </h2>
          <p className="text-white/80 mb-8">
            Votre assistant automobile intelligent vous attend
          </p>
          <a href="/tobi/" target="_blank" rel="noopener noreferrer">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 h-14 px-10 text-lg">
              Lancer Tobi maintenant
            </Button>
          </a>
        </div>
      </section>
    </div>
  );
}
