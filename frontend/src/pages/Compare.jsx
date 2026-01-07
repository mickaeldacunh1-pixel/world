import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCompare } from '../context/CompareContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  X, ArrowLeft, Trash2, MapPin, Calendar, Eye, 
  CheckCircle, XCircle, ShoppingCart, MessageSquare,
  Scale
} from 'lucide-react';
import SEO from '../components/SEO';

const conditionLabels = {
  neuf: 'Neuf',
  occasion: 'Occasion',
  reconditionne: 'Reconditionné',
};

const categoryLabels = {
  pieces: 'Pièces',
  voitures: 'Voitures',
  motos: 'Motos',
  utilitaires: 'Utilitaires',
  engins: 'Engins',
  accessoires: 'Accessoires',
};

export default function Compare() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { compareItems, removeFromCompare, clearCompare } = useCompare();

  // Comparison attributes
  const attributes = [
    { key: 'price', label: 'Prix', format: (v) => v ? `${v.toLocaleString('fr-FR')} €` : '-' },
    { key: 'condition', label: 'État', format: (v) => conditionLabels[v] || v || '-' },
    { key: 'category', label: 'Catégorie', format: (v) => categoryLabels[v] || v || '-' },
    { key: 'brand', label: 'Marque', format: (v) => v || '-' },
    { key: 'model', label: 'Modèle', format: (v) => v || '-' },
    { key: 'year', label: 'Année', format: (v) => v || '-' },
    { key: 'mileage', label: 'Kilométrage', format: (v) => v ? `${v.toLocaleString('fr-FR')} km` : '-' },
    { key: 'location', label: 'Localisation', format: (v) => v || '-' },
    { key: 'views', label: 'Vues', format: (v) => v || 0 },
    { key: 'warranty', label: 'Garantie', format: (v) => v ? '✓ Oui' : '✗ Non' },
    { key: 'shipping_available', label: 'Livraison', format: (v) => v ? '✓ Disponible' : '✗ Non' },
  ];

  // Find best value for numeric fields
  const getBestValue = (key) => {
    if (compareItems.length < 2) return null;
    const values = compareItems.map(item => item[key]).filter(v => v !== undefined && v !== null);
    if (values.length === 0) return null;
    
    if (key === 'price' || key === 'mileage') {
      return Math.min(...values);
    }
    if (key === 'year') {
      return Math.max(...values);
    }
    return null;
  };

  if (compareItems.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <SEO title="Comparateur" description="Comparez vos annonces favorites" />
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="text-center">
            <Scale className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Comparateur vide</h1>
            <p className="text-muted-foreground mb-6">
              Ajoutez des annonces au comparateur pour les comparer côte à côte
            </p>
            <Button onClick={() => navigate('/annonces')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Parcourir les annonces
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SEO title="Comparateur" description="Comparez vos annonces favorites" />
      
      {/* Header */}
      <div className="bg-primary text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                <Scale className="w-8 h-8" />
                Comparateur
              </h1>
              <p className="text-white/80 mt-1">
                {compareItems.length} annonce{compareItems.length > 1 ? 's' : ''} à comparer
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20" onClick={clearCompare}>
                <Trash2 className="w-4 h-4 mr-2" />
                Vider
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            {/* Header with images */}
            <thead>
              <tr>
                <th className="w-48 p-4 text-left bg-secondary/50 rounded-tl-lg">
                  <span className="font-semibold text-sm text-muted-foreground">Caractéristiques</span>
                </th>
                {compareItems.map((item, index) => (
                  <th key={item.id} className={`p-4 bg-secondary/50 ${index === compareItems.length - 1 ? 'rounded-tr-lg' : ''}`}>
                    <div className="relative">
                      {/* Remove button */}
                      <button
                        onClick={() => removeFromCompare(item.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-white rounded-full flex items-center justify-center hover:bg-destructive/90 z-10"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      
                      {/* Image */}
                      <Link to={`/annonce/${item.id}`}>
                        <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-3">
                          <img
                            src={item.images?.[0] || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop'}
                            alt={item.title}
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                          {item.is_promoted && (
                            <Badge className="absolute top-2 left-2 bg-accent">Premium</Badge>
                          )}
                        </div>
                      </Link>
                      
                      {/* Title */}
                      <Link to={`/annonce/${item.id}`} className="hover:text-primary">
                        <h3 className="font-semibold text-sm line-clamp-2 text-left">{item.title}</h3>
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body with attributes */}
            <tbody>
              {attributes.map((attr, rowIndex) => {
                const bestValue = getBestValue(attr.key);
                
                return (
                  <tr key={attr.key} className={rowIndex % 2 === 0 ? 'bg-secondary/20' : ''}>
                    <td className="p-4 font-medium text-sm">{attr.label}</td>
                    {compareItems.map((item) => {
                      const value = item[attr.key];
                      const isBest = bestValue !== null && value === bestValue && compareItems.length > 1;
                      
                      return (
                        <td 
                          key={item.id} 
                          className={`p-4 text-center ${isBest ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
                        >
                          <span className={`${isBest ? 'text-green-600 dark:text-green-400 font-semibold' : ''}`}>
                            {attr.format(value)}
                            {isBest && attr.key === 'price' && (
                              <span className="ml-1 text-xs">✓ Meilleur prix</span>
                            )}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Action row */}
              <tr className="border-t">
                <td className="p-4 font-medium text-sm">Actions</td>
                {compareItems.map((item) => (
                  <td key={item.id} className="p-4">
                    <div className="flex flex-col gap-2">
                      <Link to={`/annonce/${item.id}`}>
                        <Button className="w-full" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          Voir l'annonce
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => {
                        const cart = JSON.parse(localStorage.getItem('worldauto_cart') || '[]');
                        if (!cart.find(c => c.id === item.id)) {
                          cart.push({
                            id: item.id,
                            title: item.title,
                            price: item.price,
                            image: item.images?.[0],
                            seller_id: item.seller_id
                          });
                          localStorage.setItem('worldauto_cart', JSON.stringify(cart));
                          window.dispatchEvent(new Event('cartUpdated'));
                          import('sonner').then(m => m.toast.success('Ajouté au panier'));
                        }
                      }}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Ajouter au panier
                      </Button>
                    </div>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">💡 Conseils</h3>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Les cellules en vert indiquent la meilleure valeur pour cette caractéristique</li>
            <li>• Vous pouvez comparer jusqu'à 4 annonces simultanément</li>
            <li>• Cliquez sur une image pour voir les détails complets de l'annonce</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
