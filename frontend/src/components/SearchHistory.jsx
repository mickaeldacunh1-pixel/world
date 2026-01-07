import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { History, Search, X, Trash2, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function SearchHistory({ onSelect }) {
  const { user } = useAuth();
  const [searches, setSearches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchHistory();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/search-history?limit=10`);
      setSearches(response.data);
    } catch (error) {
      console.error('Error fetching search history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (searchId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await axios.delete(`${API}/search-history/${searchId}`);
      setSearches(prev => prev.filter(s => s.id !== searchId));
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Effacer tout l\'historique ?')) return;
    
    try {
      await axios.delete(`${API}/search-history`);
      setSearches([]);
      toast.success('Historique effacé');
    } catch (error) {
      toast.error('Erreur lors de l\'effacement');
    }
  };

  const buildSearchUrl = (search) => {
    const params = new URLSearchParams();
    if (search.query) params.set('search', search.query);
    if (search.category) params.set('category', search.category);
    if (search.brand) params.set('brand', search.brand);
    if (search.model) params.set('model', search.model);
    if (search.region) params.set('region', search.region);
    if (search.min_price) params.set('min_price', search.min_price);
    if (search.max_price) params.set('max_price', search.max_price);
    return `/annonces?${params.toString()}`;
  };

  const formatSearchLabel = (search) => {
    const parts = [];
    if (search.query) parts.push(`"${search.query}"`);
    if (search.category) parts.push(search.category);
    if (search.brand) parts.push(search.brand);
    if (search.model) parts.push(search.model);
    if (search.region) parts.push(search.region);
    if (search.min_price || search.max_price) {
      const priceRange = [];
      if (search.min_price) priceRange.push(`${search.min_price}€`);
      if (search.max_price) priceRange.push(`${search.max_price}€`);
      parts.push(priceRange.join(' - '));
    }
    return parts.join(' • ') || 'Recherche';
  };

  if (!user) return null;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-4 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (searches.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <History className="w-4 h-4" />
            Recherches récentes
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-7"
            onClick={handleClearAll}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Tout effacer
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-1">
          {searches.map((search) => (
            <Link
              key={search.id}
              to={buildSearchUrl(search)}
              onClick={() => onSelect && onSelect(search)}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-secondary/50 group transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm truncate">{formatSearchLabel(search)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {new Date(search.created_at).toLocaleDateString('fr-FR')}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                  onClick={(e) => handleDelete(search.id, e)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Hook pour sauvegarder automatiquement les recherches
export function useSaveSearch() {
  const { user } = useAuth();

  const saveSearch = async (params) => {
    if (!user) return;
    
    // Ne sauvegarder que si au moins un paramètre est défini
    const hasParams = params.query || params.category || params.brand || 
                      params.model || params.region || params.min_price || params.max_price;
    
    if (!hasParams) return;

    try {
      await axios.post(`${API}/search-history`, params);
    } catch (error) {
      console.error('Error saving search:', error);
    }
  };

  return saveSearch;
}
