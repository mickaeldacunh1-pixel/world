import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Palmtree, Calendar, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VacationMode() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vacationMode, setVacationMode] = useState(false);
  const [message, setMessage] = useState('');
  const [returnDate, setReturnDate] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const response = await axios.get(`${API}/auth/vacation`);
      setVacationMode(response.data.vacation_mode || false);
      setMessage(response.data.vacation_message || '');
      setReturnDate(response.data.vacation_return_date || '');
    } catch (error) {
      console.error('Error fetching vacation status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (enabled) => {
    setSaving(true);
    try {
      await axios.post(`${API}/auth/vacation`, {
        enabled,
        message: enabled ? message : null,
        return_date: enabled ? returnDate : null
      });
      setVacationMode(enabled);
      toast.success(enabled ? 'Mode vacances activé' : 'Mode vacances désactivé');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={vacationMode ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20' : ''}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palmtree className={`w-5 h-5 ${vacationMode ? 'text-amber-500' : ''}`} />
          Mode Vacances
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">
              {vacationMode ? 'En vacances' : 'Actif'}
            </p>
            <p className="text-sm text-muted-foreground">
              {vacationMode 
                ? 'Vos annonces sont masquées temporairement'
                : 'Vos annonces sont visibles par tous'
              }
            </p>
          </div>
          <Switch
            checked={vacationMode}
            onCheckedChange={handleToggle}
            disabled={saving}
          />
        </div>

        {vacationMode && (
          <div className="space-y-4 pt-4 border-t">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date de retour
              </Label>
              <Input
                type="date"
                value={returnDate}
                onChange={(e) => setReturnDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="space-y-2">
              <Label>Message aux visiteurs (optionnel)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ex: De retour le 15 janvier ! N'hésitez pas à me contacter."
                rows={3}
              />
            </div>

            <Button 
              onClick={() => handleToggle(true)} 
              disabled={saving}
              variant="outline"
              className="w-full"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Mettre à jour
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
