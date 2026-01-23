import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { 
  Users, Search, Filter, Building, User, Mail, Phone,
  Calendar, Shield, ShieldOff, Eye, Ban, CheckCircle,
  Loader2, ChevronLeft, ChevronRight, MoreVertical
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all'); // all, pro, particulier, banned
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, [page, filter]);

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/admin/users/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20);
      if (filter && filter !== 'all') params.append('filter', filter);
      if (search) params.append('search', search);

      const response = await axios.get(`${API}/admin/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setUsers(response.data.users || []);
      setTotalPages(response.data.total_pages || 1);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const toggleBan = async (userId, currentlyBanned) => {
    setActionLoading(true);
    try {
      await axios.post(`${API}/admin/users/${userId}/${currentlyBanned ? 'unban' : 'ban'}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(currentlyBanned ? 'Utilisateur débanni' : 'Utilisateur banni');
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_banned: !currentlyBanned });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleAdmin = async (userId, currentlyAdmin) => {
    setActionLoading(true);
    try {
      await axios.post(`${API}/admin/users/${userId}/${currentlyAdmin ? 'remove-admin' : 'make-admin'}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(currentlyAdmin ? 'Droits admin retirés' : 'Droits admin accordés');
      fetchUsers();
      if (selectedUser?.id === userId) {
        setSelectedUser({ ...selectedUser, is_admin: !currentlyAdmin });
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    } finally {
      setActionLoading(false);
    }
  };

  const viewUser = (user) => {
    setSelectedUser(user);
    setShowDetail(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground">Gérez les comptes utilisateurs de la plateforme</p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total || 0}</p>
                  <p className="text-xs text-muted-foreground">Total utilisateurs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pro || 0}</p>
                  <p className="text-xs text-muted-foreground">Professionnels</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <User className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.particuliers || 0}</p>
                  <p className="text-xs text-muted-foreground">Particuliers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <Ban className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.banned || 0}</p>
                  <p className="text-xs text-muted-foreground">Bannis</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <form onSubmit={handleSearch} className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit">Rechercher</Button>
            </form>
            <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filtrer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="pro">Professionnels</SelectItem>
                <SelectItem value="particulier">Particuliers</SelectItem>
                <SelectItem value="banned">Bannis</SelectItem>
                <SelectItem value="admin">Administrateurs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-accent" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${user.is_pro ? 'bg-purple-100' : 'bg-gray-100'}`}>
                            {user.is_pro ? (
                              <Building className="w-4 h-4 text-purple-600" />
                            ) : (
                              <User className="w-4 h-4 text-gray-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{user.company_name || user.name || 'Sans nom'}</p>
                            {user.is_admin && (
                              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                Admin
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.is_pro ? "default" : "secondary"}>
                          {user.is_pro ? 'Pro' : 'Particulier'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
                      </TableCell>
                      <TableCell>
                        {user.is_banned ? (
                          <Badge variant="destructive">Banni</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            Actif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" onClick={() => viewUser(user)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant={user.is_banned ? "outline" : "destructive"}
                            onClick={() => toggleBan(user.id, user.is_banned)}
                          >
                            {user.is_banned ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Précédent
          </Button>
          <span className="flex items-center px-4">Page {page} / {totalPages}</span>
          <Button 
            variant="outline" 
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Suivant
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* User Detail Modal */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de l'utilisateur</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${selectedUser.is_pro ? 'bg-purple-100' : 'bg-gray-100'}`}>
                  {selectedUser.is_pro ? (
                    <Building className="w-8 h-8 text-purple-600" />
                  ) : (
                    <User className="w-8 h-8 text-gray-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{selectedUser.company_name || selectedUser.name || 'Sans nom'}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant={selectedUser.is_pro ? "default" : "secondary"}>
                      {selectedUser.is_pro ? 'Professionnel' : 'Particulier'}
                    </Badge>
                    {selectedUser.is_admin && <Badge className="bg-yellow-500">Admin</Badge>}
                    {selectedUser.is_banned && <Badge variant="destructive">Banni</Badge>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Téléphone</p>
                  <p className="font-medium">{selectedUser.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Inscription</p>
                  <p className="font-medium">
                    {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('fr-FR') : '-'}
                  </p>
                </div>
                {selectedUser.is_pro && (
                  <>
                    <div>
                      <p className="text-muted-foreground">SIRET</p>
                      <p className="font-medium">{selectedUser.siret || '-'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">N° TVA</p>
                      <p className="font-medium">{selectedUser.vat_number || '-'}</p>
                    </div>
                  </>
                )}
                <div className="col-span-2">
                  <p className="text-muted-foreground">Adresse</p>
                  <p className="font-medium">
                    {[selectedUser.address, selectedUser.postal_code, selectedUser.city].filter(Boolean).join(', ') || '-'}
                  </p>
                </div>
                {selectedUser.iban && (
                  <div className="col-span-2">
                    <p className="text-muted-foreground">IBAN</p>
                    <p className="font-medium font-mono text-xs">{selectedUser.iban}</p>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2">
                <Button
                  variant={selectedUser.is_banned ? "outline" : "destructive"}
                  onClick={() => toggleBan(selectedUser.id, selectedUser.is_banned)}
                  disabled={actionLoading}
                >
                  {selectedUser.is_banned ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Débannir
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4 mr-2" />
                      Bannir
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => toggleAdmin(selectedUser.id, selectedUser.is_admin)}
                  disabled={actionLoading}
                >
                  {selectedUser.is_admin ? (
                    <>
                      <ShieldOff className="w-4 h-4 mr-2" />
                      Retirer admin
                    </>
                  ) : (
                    <>
                      <Shield className="w-4 h-4 mr-2" />
                      Rendre admin
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
