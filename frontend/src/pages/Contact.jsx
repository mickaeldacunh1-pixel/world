import { useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { Mail, MessageSquare, Send, Clock, CheckCircle } from 'lucide-react';
import SEO from '../components/SEO';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSending(true);
    
    // Simuler l'envoi (dans une vraie app, envoyer au backend)
    setTimeout(() => {
      setSending(false);
      setSent(true);
      toast.success('Message envoyé avec succès !');
    }, 1500);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-secondary/30 py-12">
        <SEO
          title="Contact"
          description="Contactez l'équipe World Auto Pro Pro. Nous sommes là pour répondre à vos questions sur les annonces, paiements et support."
          keywords="contact world auto, support, aide, question"
          url="/contact"
        />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="p-12 text-center animate-scale-in">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="font-heading text-3xl font-bold mb-4">Message envoyé !</h1>
            <p className="text-muted-foreground mb-6">
              Merci de nous avoir contacté. Nous vous répondrons dans les plus brefs délais.
            </p>
            <Button onClick={() => setSent(false)} variant="outline">
              Envoyer un autre message
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-12">
      <SEO
        title="Contact"
        description="Contactez l'équipe World Auto Pro Pro. Nous sommes là pour répondre à vos questions sur les annonces, paiements et support."
        keywords="contact world auto, support, aide, question"
        url="/contact"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in-up">
          <h1 className="font-heading text-4xl font-bold mb-4">Contactez-nous</h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Une question ? Un problème ? Notre équipe est là pour vous aider.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informations de contact */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="p-6 card-hover animate-fade-in-up stagger-1">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Mail className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading font-bold mb-1">Email</h3>
                  <a href="mailto:contact@worldautofrance.com" className="text-accent hover:underline text-sm">
                    contact@worldautofrance.com
                  </a>
                </div>
              </div>
            </Card>

            <Card className="p-6 card-hover animate-fade-in-up stagger-2">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading font-bold mb-1">Délai de réponse</h3>
                  <p className="text-muted-foreground text-sm">
                    Nous répondons généralement sous 24-48h ouvrées.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-6 card-hover animate-fade-in-up stagger-3">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-heading font-bold mb-1">FAQ</h3>
                  <p className="text-muted-foreground text-sm mb-2">
                    Consultez notre FAQ pour des réponses rapides aux questions fréquentes.
                  </p>
                  <a href="/faq" className="text-accent text-sm hover:underline">
                    Voir la FAQ →
                  </a>
                </div>
              </div>
            </Card>
          </div>

          {/* Formulaire de contact */}
          <Card className="lg:col-span-2 p-8 animate-fade-in-up stagger-2">
            <h2 className="font-heading text-2xl font-bold mb-6 flex items-center gap-3">
              <Send className="w-6 h-6 text-accent" />
              Envoyez-nous un message
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input
                    id="name"
                    placeholder="Votre nom"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject">Sujet</Label>
                <Input
                  id="subject"
                  placeholder="De quoi souhaitez-vous parler ?"
                  value={formData.subject}
                  onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Décrivez votre demande en détail..."
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  required
                  className="mt-1 min-h-[150px]"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-accent hover:bg-accent/90 h-12"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Envoyer le message
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
