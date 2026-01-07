import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCompare } from '../context/CompareContext';
import { Button } from './ui/button';
import { Scale, X, ChevronUp, ChevronDown } from 'lucide-react';

// Bouton pour ajouter/retirer du comparateur
export function CompareButton({ listing, size = 'icon', showLabel = false }) {
  const { t } = useTranslation();
  const { addToCompare, removeFromCompare, isInCompare } = useCompare();
  const inCompare = isInCompare(listing.id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(listing.id);
    } else {
      addToCompare(listing);
    }
  };

  if (showLabel) {
    return (
      <Button
        variant={inCompare ? 'default' : 'outline'}
        size={size}
        onClick={handleClick}
        className={inCompare ? 'bg-primary' : ''}
      >
        <Scale className="w-4 h-4 mr-2" />
        {inCompare ? t('compare.in_compare') : t('compare.compare_btn')}
      </Button>
    );
  }

  return (
    <Button
      variant={inCompare ? 'default' : 'ghost'}
      size="icon"
      onClick={handleClick}
      title={inCompare ? t('compare.remove') : t('compare.add')}
      className={`${inCompare ? 'bg-primary text-white' : 'bg-white/95 backdrop-blur-sm text-primary hover:bg-white shadow-lg'}`}
    >
      <Scale className="w-4 h-4" />
    </Button>
  );
}

// Widget flottant du comparateur
export function CompareWidget() {
  const { t } = useTranslation();
  const { compareItems, removeFromCompare, clearCompare, MAX_ITEMS } = useCompare();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(compareItems.length > 0);
  }, [compareItems]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Expanded view */}
      {isExpanded && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border mb-2 w-80 max-h-96 overflow-hidden animate-fade-in">
          <div className="p-3 bg-primary text-white flex items-center justify-between">
            <span className="font-semibold flex items-center gap-2">
              <Scale className="w-4 h-4" />
              {t('compare.title')} ({compareItems.length}/{MAX_ITEMS})
            </span>
            <button onClick={() => setIsExpanded(false)} className="hover:bg-white/20 rounded p-1">
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {compareItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 p-3 border-b hover:bg-secondary/50">
                <img
                  src={item.images?.[0] || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=100&h=100&fit=crop'}
                  alt={item.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.title}</p>
                  <p className="text-xs text-accent font-bold">{item.price?.toLocaleString('fr-FR')} €</p>
                </div>
                <button
                  onClick={() => removeFromCompare(item.id)}
                  className="text-muted-foreground hover:text-destructive p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="p-3 border-t flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={clearCompare}>
              {t('compare.clear')}
            </Button>
            <Link to="/comparer" className="flex-1">
              <Button size="sm" className="w-full">
                {t('compare.compare_btn')}
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Collapsed button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-primary hover:bg-primary/90 text-white rounded-full px-4 py-3 shadow-lg flex items-center gap-2 transition-all"
      >
        <Scale className="w-5 h-5" />
        <span className="font-semibold">{compareItems.length}</span>
        {!isExpanded && <span className="text-sm">Comparer</span>}
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
      </button>
    </div>
  );
}
