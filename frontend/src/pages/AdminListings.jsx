import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { ArrowLeft, Search, Package, Eye, Edit, Loader2, RefreshCw } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STATUS_OPTIONS = [
  { value: 'active', label: 'En stock', color: 'bg-green-500' },
  { value: 'reserved', label: 'Réservé', color: 'bg-yellow-500' },
  { value: 'sold', label: 'Vendu', color: 'bg-blue-500' },
  { value: 'inactive', label: 'Inactif', color: 'bg-gray-500' },
];

export default function AdminListings() {
  const { user, token } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedListing, setSelectedListing] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [updating, setUpdating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isAdmin = user?.email === 'contact@worldautofrance.com' || 
                  user?.email === 'admin@worldautofrance.com' || 
                  user?.is_admin;

  useEffect(() => {
    if (isAdmin) {
      fetchListings();
    }
  }, [isAdmin, statusFilter]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API}/admin/listings`, {
        params: { status: statusFilter !== 'all' ? statusFilter : undefined },
        headers: { Authorization: `Bearer ${token}` }
      });
      setListings(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement des annonces');
    } finally {
      setLoading(false);
    }
  };

  const openStatusDialog = (listing) => {
    setSelectedListing(listing);
    setNewStatus(listing.status);
    setDialogOpen(true);
  };

  const updateStatus = async () => {
    if (!selectedListing || !newStatus) return;
    
    setUpdating(true);
    try {
      await axios.put(`${API}/admin/listings/${selectedListing.id}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      toast.success(`Statut modifié en "${STATUS_OPTIONS.find(s => s.value === newStatus)?.label}"`);
      setDialogOpen(false);
      fetchListings();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la modification');
    } finally {
      setUpdating(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      listing.title?.toLowerCase().includes(searchLower) ||
      listing.id?.toLowerCase().includes(searchLower) ||
      listing.seller_name?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status) => {
    const statusOption = STATUS_OPTIONS.find(s => s.value === status);
    return (
      <Badge className={`${statusOption?.color || 'bg-gray-500'} text-white`}>
        {statusOption?.label || status}
      </Badge>
    );
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-secondary/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-xl font-bold mb-2">Accès refusé</h2>
          <p className="text-muted-foreground">Cette page est réservée aux administrateurs.</p>
          <Link to="/">
            <Button className="mt-4">Retour à l&apos;accueil</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link to="/admin" className="text-muted-foreground hover:text-foreground flex items-center gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Retour au dashboard admin
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-heading text-3xl font-bold">Gestion des annonces</h1>
              <p className="text-muted-foreground">{listings.length} annonce(s) trouvée(s)</p>
            </div>
            <Button onClick={fetchListings} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par titre, ID ou vendeur..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {STATUS_OPTIONS.map(status => (
                  <SelectItem key={status.value} value={status.value}>{status.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Listings Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : filteredListings.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Aucune annonce trouvée</h2>
            <p className="text-muted-foreground">Modifiez vos filtres de recherche</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="p-4">
                <div className="flex items-center gap-4">
                  {/* Image */}
                  <div className="w-20 h-20 bg-secondary rounded-lg overflow-hidden flex-shrink-0">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Package className="w-8 h-8" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{listing.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      ID: {listing.id?.slice(0, 8)}... • Vendeur: {listing.seller_name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {listing.price?.toLocaleString('fr-FR')} € • {listing.views || 0} vues
                    </p>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-3">
                    {getStatusBadge(listing.status)}
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      <Link to={`/annonce/${listing.id}`} target="_blank">
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openStatusDialog(listing)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Status Change Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier le statut</DialogTitle>
              <DialogDescription>
                Annonce: {selectedListing?.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button 
                onClick={updateStatus} 
                disabled={updating || newStatus === selectedListing?.status}
                className="bg-accent hover:bg-accent/90"
              >
                {updating ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
