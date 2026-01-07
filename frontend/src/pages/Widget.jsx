import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Widget() {
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [baseUrl, setBaseUrl] = useState('');
  const [loading, setLoading] = useState(true);

  const theme = searchParams.get('theme') || 'light';
  const sellerId = searchParams.get('seller_id');
  const category = searchParams.get('category');

  useEffect(() => {
    fetchListings();
  }, [sellerId, category]);

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      if (sellerId) params.append('seller_id', sellerId);
      if (category) params.append('category', category);
      
      const response = await axios.get(`${API}/widget/listings?${params.toString()}`);
      setListings(response.data.listings || []);
      setBaseUrl(response.data.base_url || '');
    } catch (error) {
      console.error('Error fetching widget listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  if (loading) {
    return (
      <div className={`p-4 ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
        <div className="animate-pulse grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className={`h-48 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 font-sans ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <a 
          href={baseUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2"
        >
          <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            World Auto
          </span>
        </a>
        <a 
          href={`${baseUrl}/annonces`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-orange-500 hover:underline"
        >
          Voir toutes les annonces →
        </a>
      </div>

      {/* Grid */}
      {listings.length === 0 ? (
        <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          Aucune annonce disponible
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {listings.map((listing) => (
            <a
              key={listing.id}
              href={`${baseUrl}/annonce/${listing.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className={`block rounded-lg overflow-hidden border transition-shadow hover:shadow-lg ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={listing.images?.[0] || '/placeholder.jpg'}
                  alt={listing.title}
                  className="w-full h-full object-cover hover:scale-105 transition-transform"
                />
              </div>
              <div className="p-3">
                <h3 className={`font-medium text-sm line-clamp-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {listing.title}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-orange-500 font-bold">
                    {listing.price?.toFixed(2)} €
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    listing.condition === 'neuf' 
                      ? 'bg-green-100 text-green-700' 
                      : isDark 
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {listing.condition === 'neuf' ? 'Neuf' : 'Occasion'}
                  </span>
                </div>
                {listing.location && (
                  <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    📍 {listing.location}
                  </p>
                )}
              </div>
            </a>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className={`mt-4 pt-4 border-t text-center text-xs ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
        Propulsé par{' '}
        <a 
          href={baseUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-orange-500 hover:underline"
        >
          World Auto France
        </a>
      </div>
    </div>
  );
}
