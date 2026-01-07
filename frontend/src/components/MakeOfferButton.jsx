import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Tag, Loader2, Percent, Send } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function MakeOfferButton({ listing, onSuccess }) {
  const { user, token } = useAuth();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const minOffer = listing.price * 0.5;
  const suggestedOffers = [
    { percent: 10, amount: listing.price * 0.9 },
    { percent: 15, amount: listing.price * 0.85 },
    { percent: 20, amount: listing.price * 0.8 },
  ];

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) < minOffer) {
      toast.error(`L'offre doit être d'au moins ${minOffer.toFixed(2)} €`);
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${API}/offers`,
        {
          listing_id: listing.id,
          amount: parseFloat(amount),
          message: message || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Offre envoyée au vendeur !');
      setOpen(false);
      setAmount('');
      setMessage('');
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l&apos;envoi de l&apos;offre');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Button variant="outline" className="w-full" onClick={() => window.location.href = '/auth'}>
        <Tag className="w-4 h-4 mr-2" />
        Faire une offre
      </Button>
    );
  }

  if (user.id === listing.seller_id) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Tag className="w-4 h-4 mr-2" />
          Faire une offre
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-accent" />
            Faire une offre
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Prix original */}
          <div className="bg-secondary/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground mb-1">Prix demandé</p>
            <p className="text-2xl font-bold">{listing.price?.toFixed(2)} €</p>
          </div>

          {/* Suggestions de prix */}
          <div>
            <p className="text-sm font-medium mb-2">Suggestions :</p>
            <div className="flex gap-2">
              {suggestedOffers.map((offer) => (
                <Button
                  key={offer.percent}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount(offer.amount.toFixed(2))}
                  className={amount === offer.amount.toFixed(2) ? 'border-accent bg-accent/10' : ''}
                >
                  <Percent className="w-3 h-3 mr-1" />
                  -{offer.percent}%
                </Button>
              ))}
            </div>
          </div>

          {/* Input montant */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Votre offre (€)</label>
            <Input
              type="number"
              step="0.01"
              min={minOffer}
              max={listing.price}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Min: ${minOffer.toFixed(2)} €`}
              className="text-lg font-semibold"
            />
            {amount && parseFloat(amount) < listing.price && (
              <p className="text-sm text-green-600">
                Réduction de {((1 - parseFloat(amount) / listing.price) * 100).toFixed(0)}%
              </p>
            )}
          </div>

          {/* Message optionnel */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Message (optionnel)</label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Expliquez pourquoi vous proposez ce prix..."
              rows={2}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            Le vendeur a 48h pour accepter, refuser ou faire une contre-offre.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !amount || parseFloat(amount) < minOffer}
            className="bg-accent hover:bg-accent/90"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Envoyer l'offre
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
