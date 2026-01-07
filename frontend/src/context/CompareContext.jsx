import { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

const CompareContext = createContext();

export function CompareProvider({ children }) {
  const [compareItems, setCompareItems] = useState([]);
  const MAX_ITEMS = 4;

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('worldauto_compare');
    if (saved) {
      try {
        setCompareItems(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading compare items:', e);
      }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    localStorage.setItem('worldauto_compare', JSON.stringify(compareItems));
    // Dispatch event for other components
    window.dispatchEvent(new Event('compareUpdated'));
  }, [compareItems]);

  const addToCompare = (listing) => {
    if (compareItems.find(item => item.id === listing.id)) {
      toast.info('Cette annonce est déjà dans le comparateur');
      return;
    }
    if (compareItems.length >= MAX_ITEMS) {
      toast.error(`Maximum ${MAX_ITEMS} annonces dans le comparateur`);
      return;
    }
    setCompareItems([...compareItems, listing]);
    toast.success('Ajouté au comparateur');
  };

  const removeFromCompare = (listingId) => {
    setCompareItems(compareItems.filter(item => item.id !== listingId));
    toast.info('Retiré du comparateur');
  };

  const clearCompare = () => {
    setCompareItems([]);
    toast.info('Comparateur vidé');
  };

  const isInCompare = (listingId) => {
    return compareItems.some(item => item.id === listingId);
  };

  return (
    <CompareContext.Provider value={{
      compareItems,
      addToCompare,
      removeFromCompare,
      clearCompare,
      isInCompare,
      MAX_ITEMS
    }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
}
