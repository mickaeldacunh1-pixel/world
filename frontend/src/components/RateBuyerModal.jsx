import { useState } from 'react';
import axios from 'axios';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Star, User, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function RateBuyerModal({ order, onRated }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Veuillez sélectionner une note');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API}/reviews/buyer`, {
        order_id: order.id,
        rating,
        comment: comment.trim() || null
      });
      
      toast.success('Merci pour votre avis !');
      setIsOpen(false);
      setRating(0);
      setComment('');
      if (onRated) onRated();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Star className="w-4 h-4" />
          Noter l'acheteur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-accent" />
            Noter l'acheteur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Order info */}
          <Card className="bg-secondary/50">
            <CardContent className="p-4">
              <p className="font-medium">{order.listing_title}</p>
              <p className="text-sm text-muted-foreground">
                Acheteur : {order.buyer_name}
              </p>
              <p className="text-sm text-muted-foreground">
                Livrée le : {new Date(order.updated_at || order.created_at).toLocaleDateString('fr-FR')}
              </p>
            </CardContent>
          </Card>

          {/* Rating stars */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Comment s'est passée la transaction ?
            </p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-sm mt-2">
              {rating === 1 && '😞 Très mauvais'}
              {rating === 2 && '😕 Mauvais'}
              {rating === 3 && '😐 Moyen'}
              {rating === 4 && '😊 Bien'}
              {rating === 5 && '🤩 Excellent !'}
            </p>
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium">
              Commentaire (optionnel)
            </label>
            <Textarea
              placeholder="Partagez votre expérience avec cet acheteur..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Submit button */}
          <Button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full bg-accent hover:bg-accent/90"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-2" />
                Publier l'avis
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
