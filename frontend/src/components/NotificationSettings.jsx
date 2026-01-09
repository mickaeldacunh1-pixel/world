import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Bell, BellOff, Check, AlertCircle } from 'lucide-react';
import useNotifications from '../hooks/useNotifications';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const { supported, permission, requestPermission, showNotification } = useNotifications();
  const [settings, setSettings] = useState({
    messages: true,
    orders: true,
    priceAlerts: true,
    reviews: true
  });

  const handleEnableNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Notifications activées !');
      // Send test notification
      showNotification('Notifications activées', {
        body: 'Vous recevrez désormais les notifications World Auto Pro'
      });
    } else {
      toast.error('Notifications refusées. Vous pouvez les activer dans les paramètres de votre navigateur.');
    }
  };

  const toggleSetting = (key) => {
    setSettings(prev => {
      const newSettings = { ...prev, [key]: !prev[key] };
      // Save to localStorage
      localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      return newSettings;
    });
  };

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      try {
        setSettings(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  if (!supported) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <AlertCircle className="w-5 h-5" />
            <p>Les notifications ne sont pas supportées par votre navigateur.</p>
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
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Permission Status */}
        <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-3">
            {permission === 'granted' ? (
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                <BellOff className="w-5 h-5 text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-medium">
                {permission === 'granted' ? 'Notifications activées' : 'Notifications désactivées'}
              </p>
              <p className="text-sm text-muted-foreground">
                {permission === 'granted' 
                  ? 'Vous recevez les notifications push'
                  : 'Activez pour ne rien manquer'
                }
              </p>
            </div>
          </div>
          {permission !== 'granted' && (
            <Button onClick={handleEnableNotifications}>
              Activer
            </Button>
          )}
        </div>

        {/* Notification Types */}
        {permission === 'granted' && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Types de notifications</h4>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-messages" className="font-medium">Messages</Label>
                <p className="text-sm text-muted-foreground">Nouveaux messages reçus</p>
              </div>
              <Switch
                id="notif-messages"
                checked={settings.messages}
                onCheckedChange={() => toggleSetting('messages')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-orders" className="font-medium">Commandes</Label>
                <p className="text-sm text-muted-foreground">Nouvelles ventes et expéditions</p>
              </div>
              <Switch
                id="notif-orders"
                checked={settings.orders}
                onCheckedChange={() => toggleSetting('orders')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-alerts" className="font-medium">Alertes prix</Label>
                <p className="text-sm text-muted-foreground">Annonces correspondant à vos alertes</p>
              </div>
              <Switch
                id="notif-alerts"
                checked={settings.priceAlerts}
                onCheckedChange={() => toggleSetting('priceAlerts')}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="notif-reviews" className="font-medium">Avis</Label>
                <p className="text-sm text-muted-foreground">Nouveaux avis sur vos ventes</p>
              </div>
              <Switch
                id="notif-reviews"
                checked={settings.reviews}
                onCheckedChange={() => toggleSetting('reviews')}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
