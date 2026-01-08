import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { 
  Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, 
  Eye, MapPin, ExternalLink, Flame, Video
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function VideoShowcase() {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef(null);
  const autoPlayTimerRef = useRef(null);

  useEffect(() => {
    fetchFeaturedVideos();
    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Reset video when index changes
    if (videoRef.current && videos.length > 0) {
      videoRef.current.load();
      if (isPlaying) {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [currentIndex, videos]);

  const fetchFeaturedVideos = async () => {
    try {
      const response = await axios.get(`${API}/videos/homepage-showcase`);
      setVideos(response.data || []);
    } catch (error) {
      console.error('Error fetching showcase videos:', error);
      // Fallback: try to get any videos with video_url
      try {
        const fallback = await axios.get(`${API}/listings/videos?limit=5`);
        setVideos(fallback.data.listings || []);
      } catch (e) {
        console.error('Fallback also failed:', e);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVideoEnd = () => {
    // Auto-advance to next video
    if (videos.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % videos.length);
    } else {
      // Loop single video
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const percentage = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(percentage);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
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

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + videos.length) % videos.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % videos.length);
  };

  if (loading) {
    return (
      <section className="py-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-muted rounded mb-6" />
            <div className="aspect-video bg-muted rounded-xl" />
          </div>
        </div>
      </section>
    );
  }

  if (videos.length === 0) {
    return null; // Don't show section if no videos
  }

  const currentVideo = videos[currentIndex];

  return (
    <section className="py-12 bg-gradient-to-b from-secondary/50 to-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent/10 rounded-lg">
              <Video className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Vidéos à la une</h2>
              <p className="text-sm text-muted-foreground">
                Découvrez nos annonces en vidéo
              </p>
            </div>
          </div>
          <Link to="/videos">
            <Button variant="outline" size="sm" className="gap-2">
              Voir toutes les vidéos
              <ExternalLink className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* Main Video Player */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video */}
          <div className="lg:col-span-2">
            <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
              <video
                ref={videoRef}
                src={currentVideo?.video_url}
                className="w-full h-full object-cover"
                muted={isMuted}
                playsInline
                autoPlay
                onEnded={handleVideoEnd}
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
              />

              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Boost badge */}
              {currentVideo?.video_boost_active && (
                <div className="absolute top-4 left-4 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm rounded-full flex items-center gap-1.5 shadow-lg">
                  <Flame className="w-4 h-4" />
                  Sponsorisé
                </div>
              )}

              {/* PRO badge */}
              {currentVideo?.user?.is_professional && (
                <Badge className="absolute top-4 right-4 bg-purple-600 shadow-lg">PRO</Badge>
              )}

              {/* Controls overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                {/* Progress bar */}
                <div className="w-full h-1 bg-white/30 rounded-full mb-4 cursor-pointer group">
                  <div 
                    className="h-full bg-accent rounded-full transition-all relative"
                    style={{ width: `${progress}%` }}
                  >
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-accent rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={togglePlay}
                      className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white ml-0.5" />
                      )}
                    </button>
                    <button 
                      onClick={toggleMute}
                      className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                    >
                      {isMuted ? (
                        <VolumeX className="w-5 h-5 text-white" />
                      ) : (
                        <Volume2 className="w-5 h-5 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Navigation */}
                  {videos.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={goToPrevious}
                        className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-white" />
                      </button>
                      <span className="text-white text-sm px-2">
                        {currentIndex + 1} / {videos.length}
                      </span>
                      <button 
                        onClick={goToNext}
                        className="w-10 h-10 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-full transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Current video info */}
            <div className="mt-4 flex items-start justify-between">
              <div>
                <Link to={`/annonce/${currentVideo?.id}`} className="group">
                  <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                    {currentVideo?.title}
                  </h3>
                </Link>
                <p className="text-2xl font-bold text-accent mt-1">
                  {currentVideo?.price?.toLocaleString('fr-FR')} €
                </p>
                <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {currentVideo?.location || 'France'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {currentVideo?.views || 0} vues
                  </span>
                </div>
              </div>
              <Link to={`/annonce/${currentVideo?.id}`}>
                <Button className="bg-accent hover:bg-accent/90">
                  Voir l'annonce
                </Button>
              </Link>
            </div>
          </div>

          {/* Playlist */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-xl border overflow-hidden">
              <div className="p-4 border-b bg-secondary/30">
                <h3 className="font-semibold">Playlist ({videos.length})</h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                {videos.map((video, index) => (
                  <button
                    key={video.id}
                    onClick={() => setCurrentIndex(index)}
                    className={`w-full flex gap-3 p-3 text-left hover:bg-secondary/50 transition-colors ${
                      index === currentIndex ? 'bg-accent/10 border-l-4 border-accent' : ''
                    }`}
                  >
                    <div className="relative w-24 h-14 flex-shrink-0 rounded overflow-hidden bg-muted">
                      <img 
                        src={video.images?.[0] || '/placeholder-car.jpg'}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      {index === currentIndex && isPlaying && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <div className="flex gap-0.5">
                            <div className="w-1 h-4 bg-white animate-pulse" />
                            <div className="w-1 h-4 bg-white animate-pulse delay-75" />
                            <div className="w-1 h-4 bg-white animate-pulse delay-150" />
                          </div>
                        </div>
                      )}
                      {video.video_boost_active && (
                        <div className="absolute top-1 left-1">
                          <Flame className="w-3 h-3 text-orange-500" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground line-clamp-2">
                        {video.title}
                      </p>
                      <p className="text-sm font-bold text-accent mt-0.5">
                        {video.price?.toLocaleString('fr-FR')} €
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
