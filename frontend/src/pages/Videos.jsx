import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Search, Filter, 
  Eye, MapPin, Clock, Star, ChevronLeft, ChevronRight, X,
  Video, Flame, TrendingUp, Sparkles
} from 'lucide-react';
import SEO from '../components/SEO';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Video Card Component with hover play
const VideoCard = ({ listing, onPlay }) => {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);
  const [duration, setDuration] = useState(0);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.muted = true;
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card 
      className="group relative overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-300"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onPlay(listing)}
    >
      {/* Video/Thumbnail */}
      <div className="relative aspect-video bg-black">
        {isHovered ? (
          <video
            ref={videoRef}
            src={listing.video_url}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
          />
        ) : (
          <img
            src={listing.images?.[0] || '/placeholder-car.jpg'}
            alt={listing.title}
            className="w-full h-full object-cover"
          />
        )}

        {/* Play overlay */}
        <div className={`absolute inset-0 flex items-center justify-center bg-black/30 transition-opacity ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
          <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play className="w-8 h-8 text-accent ml-1" fill="currentColor" />
          </div>
        </div>

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded">
          {formatDuration(duration || listing.video_duration || 0)}
        </div>

        {/* Boost badge */}
        {listing.video_boost_active && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs rounded-full flex items-center gap-1">
            <Flame className="w-3 h-3" />
            Mise en avant
          </div>
        )}

        {/* PRO badge */}
        {listing.user?.is_professional && (
          <Badge className="absolute top-2 right-2 bg-purple-600">PRO</Badge>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-accent transition-colors">
          {listing.title}
        </h3>
        <p className="text-2xl font-bold text-accent mt-1">
          {listing.price?.toLocaleString('fr-FR')} €
        </p>
        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {listing.location || 'France'}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {listing.views || 0}
          </span>
        </div>
      </div>
    </Card>
  );
};

// Video Player Modal
const VideoPlayerModal = ({ listing, onClose }) => {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setProgress((videoRef.current.currentTime / videoRef.current.duration) * 100);
    }
  };

  const handleSeek = (e) => {
    if (videoRef.current) {
      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      videoRef.current.currentTime = percentage * videoRef.current.duration;
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-5xl" onClick={e => e.stopPropagation()}>
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute -top-12 right-0 text-white hover:text-accent transition-colors"
        >
          <X className="w-8 h-8" />
        </button>

        {/* Video */}
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={listing.video_url}
            className="w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={(e) => setDuration(e.target.duration)}
            onEnded={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress bar */}
            <div 
              className="w-full h-1 bg-white/30 rounded-full cursor-pointer mb-3"
              onClick={handleSeek}
            >
              <div 
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={togglePlay} className="text-white hover:text-accent transition-colors">
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button onClick={toggleMute} className="text-white hover:text-accent transition-colors">
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                </button>
                <span className="text-white text-sm">
                  {formatTime(videoRef.current?.currentTime || 0)} / {formatTime(duration)}
                </span>
              </div>
              <button 
                onClick={() => videoRef.current?.requestFullscreen()}
                className="text-white hover:text-accent transition-colors"
              >
                <Maximize className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Listing info */}
        <div className="mt-4 bg-card rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-foreground">{listing.title}</h2>
              <p className="text-3xl font-bold text-accent mt-1">
                {listing.price?.toLocaleString('fr-FR')} €
              </p>
            </div>
            <Link to={`/annonce/${listing.id}`}>
              <Button className="bg-accent hover:bg-accent/90">
                Voir l'annonce
              </Button>
            </Link>
          </div>
          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {listing.location || 'France'}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              {listing.views || 0} vues
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {new Date(listing.created_at).toLocaleDateString('fr-FR')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Videos() {
  const { t } = useTranslation();
  const [listings, setListings] = useState([]);
  const [featuredVideos, setFeaturedVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [filters, setFilters] = useState({
    category: 'all',
    sort: 'recent',
    search: ''
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchVideos();
    fetchFeaturedVideos();
  }, [filters, page]);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: filters.sort,
        ...(filters.category !== 'all' && { category: filters.category }),
        ...(filters.search && { search: filters.search })
      });
      
      const response = await axios.get(`${API}/listings/videos?${params}`);
      
      if (page === 1) {
        setListings(response.data.listings || []);
      } else {
        setListings(prev => [...prev, ...(response.data.listings || [])]);
      }
      setHasMore(response.data.has_more || false);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFeaturedVideos = async () => {
    try {
      const response = await axios.get(`${API}/videos/featured`);
      setFeaturedVideos(response.data || []);
    } catch (error) {
      console.error('Error fetching featured videos:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return (
    <>
      <SEO 
        title="Vidéos d'annonces - World Auto"
        description="Découvrez les annonces en vidéo sur World Auto. Visualisez les véhicules et pièces avant d'acheter."
      />

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative py-16 bg-gradient-to-br from-accent/20 via-background to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-full text-accent mb-4">
                <Video className="w-5 h-5" />
                <span className="font-medium">Galerie Vidéos</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Annonces en <span className="text-accent">Vidéo</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Découvrez nos annonces en vidéo pour mieux visualiser les véhicules et pièces avant d'acheter
              </p>
            </div>
          </div>
        </section>

        {/* Featured Videos Carousel */}
        {featuredVideos.length > 0 && (
          <section className="py-8 bg-secondary/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-2 mb-6">
                <Flame className="w-6 h-6 text-orange-500" />
                <h2 className="text-2xl font-bold">Vidéos à la une</h2>
                <Badge variant="secondary" className="ml-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Sponsorisé
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredVideos.slice(0, 3).map(listing => (
                  <VideoCard 
                    key={listing.id} 
                    listing={listing} 
                    onPlay={setSelectedVideo}
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Filters */}
        <section className="py-6 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>

                {/* Category */}
                <Select value={filters.category} onValueChange={(v) => handleFilterChange('category', v)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes</SelectItem>
                    <SelectItem value="voitures">Voitures</SelectItem>
                    <SelectItem value="motos">Motos</SelectItem>
                    <SelectItem value="pieces">Pièces</SelectItem>
                    <SelectItem value="utilitaires">Utilitaires</SelectItem>
                    <SelectItem value="engins">Engins</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={filters.sort} onValueChange={(v) => handleFilterChange('sort', v)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Trier par" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Plus récentes</SelectItem>
                    <SelectItem value="popular">Plus vues</SelectItem>
                    <SelectItem value="price_asc">Prix croissant</SelectItem>
                    <SelectItem value="price_desc">Prix décroissant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-muted-foreground">
                {listings.length} vidéo{listings.length > 1 ? 's' : ''} trouvée{listings.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </section>

        {/* Videos Grid */}
        <section className="py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {loading && page === 1 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="aspect-video bg-muted" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-6 bg-muted rounded w-1/2" />
                      <div className="h-3 bg-muted rounded w-1/3" />
                    </div>
                  </Card>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-20">
                <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucune vidéo trouvée</h3>
                <p className="text-muted-foreground">
                  Modifiez vos filtres ou revenez plus tard
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {listings.map(listing => (
                    <VideoCard 
                      key={listing.id} 
                      listing={listing} 
                      onPlay={setSelectedVideo}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center mt-10">
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={() => setPage(prev => prev + 1)}
                      disabled={loading}
                    >
                      {loading ? 'Chargement...' : 'Voir plus de vidéos'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-accent to-orange-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Vendez plus vite avec une vidéo !
            </h2>
            <p className="text-white/80 text-lg mb-6">
              Les annonces avec vidéo reçoivent 3x plus de vues et se vendent 2x plus vite
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/deposer">
                <Button size="lg" variant="secondary" className="font-semibold">
                  <Video className="w-5 h-5 mr-2" />
                  Déposer une annonce vidéo
                </Button>
              </Link>
              <Link to="/tarifs">
                <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/10">
                  Voir les forfaits vidéo
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* Video Player Modal */}
      {selectedVideo && (
        <VideoPlayerModal 
          listing={selectedVideo} 
          onClose={() => setSelectedVideo(null)} 
        />
      )}
    </>
  );
}
