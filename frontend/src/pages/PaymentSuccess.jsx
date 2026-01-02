import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const sessionId = searchParams.get('session_id');

  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus();
    } else {
      setStatus('error');
      setMessage('Session de paiement non trouvée');
    }
  }, [sessionId]);

  const pollPaymentStatus = async () => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('error');
      setMessage('La vérification du paiement a pris trop de temps. Vérifiez votre email.');
      return;
    }

    try {
      const response = await axios.get(`${API}/payments/status/${sessionId}`);
      
      if (response.data.payment_status === 'paid') {
        setStatus('success');
        setMessage('Paiement réussi ! Vos crédits ont été ajoutés.');
        await refreshUser();
        return;
      }

      if (response.data.status === 'expired') {
        setStatus('error');
        setMessage('La session de paiement a expiré.');
        return;
      }

      // Continue polling
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      setAttempts(prev => prev + 1);
      setTimeout(pollPaymentStatus, pollInterval);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 flex items-center justify-center py-12 px-4" data-testid="payment-success-page">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="w-16 h-16 text-accent mx-auto mb-4 animate-spin" />
              <h1 className="font-heading text-2xl font-bold mb-2">
                Vérification du paiement...
              </h1>
              <p className="text-muted-foreground">
                Veuillez patienter pendant que nous confirmons votre paiement.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="font-heading text-2xl font-bold mb-2 text-green-600">
                Paiement réussi !
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <Link to="/deposer">
                  <Button className="w-full bg-accent hover:bg-accent/90" data-testid="create-listing-btn">
                    Créer une annonce
                  </Button>
                </Link>
                <Link to="/tableau-de-bord">
                  <Button variant="outline" className="w-full" data-testid="dashboard-btn">
                    Aller au tableau de bord
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h1 className="font-heading text-2xl font-bold mb-2 text-destructive">
                Erreur de paiement
              </h1>
              <p className="text-muted-foreground mb-6">{message}</p>
              <div className="flex flex-col gap-3">
                <Link to="/tarifs">
                  <Button className="w-full" data-testid="retry-btn">
                    Réessayer
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="w-full">
                    Retour à l'accueil
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
