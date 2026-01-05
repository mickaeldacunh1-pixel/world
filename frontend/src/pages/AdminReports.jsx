import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { 
  Flag, AlertTriangle, CheckCircle, XCircle, Eye, Clock, 
  User, FileText, ArrowLeft, Loader2, Shield
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_CONFIG = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  reviewed: { label: 'En cours', color: 'bg-blue-100 text-blue-800', icon: Eye },
  resolved: { label: 'Résolu', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  dismissed: { label: 'Rejeté', color: 'bg-gray-100 text-gray-800', icon: XCircle }
};

export default function AdminReports() {
  const { user, token } = useAuth();
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const isAdmin = user?.email === 'contact@worldautofrance.com' || user?.email === 'admin@worldautofrance.com';

  useEffect(() => {
    if (isAdmin) {
      fetchReports();
    }
  }, [statusFilter, typeFilter, isAdmin]);

  const fetchReports = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set('status', statusFilter);
      if (typeFilter) params.set('target_type', typeFilter);
      
      const response = await axios.get(`${API}/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data.reports);
      setStats(response.data.stats);
    } catch (error) {
      toast.error('Erreur lors du chargement des signalements');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedReport) return;
    
    setUpdating(true);
    try {
      await axios.put(
        `${API}/reports/${selectedReport.id}?status=${status}${adminNotes ? `&admin_notes=${encodeURIComponent(adminNotes)}` : ''}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Signalement mis à jour');
      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
          <p className="text-muted-foreground mb-4">Connectez-vous pour accéder à cette page.</p>
          <Link to="/auth">
            <Button className="bg-accent hover:bg-accent/90">Se connecter</Button>
          </Link>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Accès réservé</h2>
          <p className="text-muted-foreground mb-4">Cette page est réservée aux administrateurs.</p>
          <Link to="/">
            <Button className="bg-accent hover:bg-accent/90">Retour à l'accueil</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link to="/admin/parametres" className="text-accent hover:underline text-sm mb-2 inline-flex items-center gap-1">
              <ArrowLeft className="w-4 h-4" />
              Retour à l'administration
            </Link>
            <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
              <Flag className="w-8 h-8" />
              Signalements
            </h1>
            <p className="text-muted-foreground">Gérez les signalements des utilisateurs</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </CardContent>
          </Card>
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-yellow-700">En attente</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-600">
                {reports.filter(r => r.status === 'resolved').length}
              </div>
              <div className="text-sm text-muted-foreground">Résolus</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-600">
                {reports.filter(r => r.status === 'dismissed').length}
              </div>
              <div className="text-sm text-muted-foreground">Rejetés</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-1 block">Statut</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les statuts</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="reviewed">En cours</SelectItem>
                    <SelectItem value="resolved">Résolu</SelectItem>
                    <SelectItem value="dismissed">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="text-sm font-medium mb-1 block">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Tous les types</SelectItem>
                    <SelectItem value="listing">Annonces</SelectItem>
                    <SelectItem value="user">Utilisateurs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : reports.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Aucun signalement</h3>
            <p className="text-muted-foreground">Tout est calme !</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => {
              const StatusIcon = STATUS_CONFIG[report.status]?.icon || Clock;
              return (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      {/* Icon */}
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                        report.target_type === 'listing' ? 'bg-blue-100' : 'bg-purple-100'
                      }`}>
                        {report.target_type === 'listing' ? (
                          <FileText className="w-6 h-6 text-blue-600" />
                        ) : (
                          <User className="w-6 h-6 text-purple-600" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold truncate">{report.target_name}</span>
                          <Badge className={STATUS_CONFIG[report.status]?.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {STATUS_CONFIG[report.status]?.label}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          <span className="font-medium text-orange-600">{report.reason_label}</span>
                          {report.description && (
                            <span className="ml-2">— {report.description}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Signalé par <span className="font-medium">{report.reporter_name}</span> le{' '}
                          {new Date(report.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        {report.target_type === 'listing' && (
                          <Link to={`/annonce/${report.target_id}`} target="_blank">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                          </Link>
                        )}
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedReport(report);
                            setAdminNotes(report.admin_notes || '');
                          }}
                          className="bg-accent hover:bg-accent/90"
                        >
                          Traiter
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Report Detail Dialog */}
        <Dialog open={!!selectedReport} onOpenChange={() => setSelectedReport(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Traiter le signalement</DialogTitle>
            </DialogHeader>
            {selectedReport && (
              <div className="space-y-4 mt-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Cible</div>
                  <div className="font-medium">{selectedReport.target_name}</div>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="text-sm text-muted-foreground mb-1">Raison</div>
                  <div className="font-medium text-orange-600">{selectedReport.reason_label}</div>
                  {selectedReport.description && (
                    <div className="text-sm mt-2">{selectedReport.description}</div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Notes administrateur</label>
                  <Textarea
                    placeholder="Notes internes sur ce signalement..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus('dismissed')}
                    disabled={updating}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                  <Button
                    onClick={() => handleUpdateStatus('resolved')}
                    disabled={updating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {updating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Résoudre
                  </Button>
                </div>
                {selectedReport.target_type === 'listing' && (
                  <p className="text-xs text-muted-foreground text-center">
                    ⚠️ Résoudre suspendra automatiquement l'annonce
                  </p>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
