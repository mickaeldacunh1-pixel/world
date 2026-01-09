import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Check, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { toast } from 'sonner';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL;

// VAPID public key - you need to generate this
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBUYIHBQFLXYp5Nksh8U';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationManager({ token }) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState({
    messages: true,
    price_alerts: true,
    new_offers: true,
    order_updates: true,
    promotions: false,
    newsletter: false
  });

  useEffect(() => {
    // Check if push notifications are supported
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestPermission = async () => {
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        await subscribeUser();
      } else if (result === 'denied') {
        toast.error('Notifications refusées. Vous pouvez les activer dans les paramètres de votre navigateur.');
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
      toast.error('Erreur lors de la demande de permission');
    } finally {
      setLoading(false);
    }
  };

  const subscribeUser = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send subscription to backend
      if (token) {
        await axios.post(`${API}/api/push/subscribe`, {
          subscription: subscription.toJSON(),
          preferences
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      setIsSubscribed(true);
      toast.success('Notifications activées !');
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Erreur lors de l\'activation des notifications');
    }
  };

  const unsubscribeUser = async () => {
    setLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        
        // Notify backend
        if (token) {
          await axios.post(`${API}/api/push/unsubscribe`, {
            endpoint: subscription.endpoint
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }

      setIsSubscribed(false);
      toast.success('Notifications désactivées');
    } catch (error) {
      console.error('Error unsubscribing:', error);
      toast.error('Erreur lors de la désactivation');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (key, value) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);
    
    if (token && isSubscribed) {
      try {
        await axios.put(`${API}/api/push/preferences`, {
          preferences: newPrefs
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error updating preferences:', error);
      }
    }
  };

  if (!isSupported) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Votre navigateur ne supporte pas les notifications push.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Notifications Push
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status & Toggle */}
        <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
          <div className="flex items-center gap-3">
            {isSubscribed ? (
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Bell className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <BellOff className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div>
              <h4 className="font-medium">
                {isSubscribed ? 'Notifications activées' : 'Notifications désactivées'}
              </h4>
              <p className="text-sm text-muted-foreground">
                {permission === 'denied' 
                  ? 'Bloqué par le navigateur' 
                  : isSubscribed 
                    ? 'Vous recevrez des alertes en temps réel'
                    : 'Activez pour ne rien manquer'}
              </p>
            </div>
          </div>
          
          {permission === 'denied' ? (
            <Button variant="outline" disabled>
              <AlertCircle className="w-4 h-4 mr-2" />
              Bloqué
            </Button>
          ) : (
            <Button
              onClick={isSubscribed ? unsubscribeUser : requestPermission}
              disabled={loading}
              variant={isSubscribed ? 'outline' : 'default'}
              className={!isSubscribed ? 'bg-accent hover:bg-accent/90' : ''}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : isSubscribed ? (
                <BellOff className="w-4 h-4 mr-2" />
              ) : (
                <Bell className="w-4 h-4 mr-2" />
              )}
              {isSubscribed ? 'Désactiver' : 'Activer'}
            </Button>
          )}
        </div>

        {/* Preferences */}
        {isSubscribed && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Types de notifications
            </h4>
            
            <div className="space-y-2">
              {[
                { key: 'messages', label: 'Nouveaux messages', desc: 'Quand quelqu\'un vous envoie un message', icon: '💬' },
                { key: 'price_alerts', label: 'Alertes prix', desc: 'Quand le prix d\'une pièce suivie baisse', icon: '💰' },
                { key: 'new_offers', label: 'Nouvelles offres', desc: 'Quand quelqu\'un fait une offre sur votre annonce', icon: '🤝' },
                { key: 'order_updates', label: 'Suivi commandes', desc: 'Expédition, livraison, etc.', icon: '📦' },
                { key: 'promotions', label: 'Promotions', desc: 'Bons plans et offres spéciales', icon: '🎁' },
              ].map(({ key, label, desc, icon }) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                  </div>
                  <Switch
                    checked={preferences[key]}
                    onCheckedChange={(v) => updatePreferences(key, v)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test notification */}
        {isSubscribed && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              new Notification('World Auto Pro', {
                body: 'Les notifications fonctionnent ! 🎉',
                icon: '/logo192.png'
              });
            }}
          >
            🔔 Tester les notifications
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
