import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { 
  Radio, Play, Pause, Volume2, VolumeX, X, ChevronUp, ChevronDown,
  SkipBack, SkipForward, Music2, Minimize2
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Default stations (fallback)
const DEFAULT_STATIONS = [
  { id: 'nostalgie', name: 'Nostalgie', genre: 'Oldies', logo: '💫', stream_url: 'https://n09a-eu.rcs.revma.com/ypqt40u0x1zuv', color: '#FFD700' },
  { id: 'fipreggae', name: 'FIP Reggae', genre: 'Reggae', logo: '🌴', stream_url: 'https://icecast.radiofrance.fr/fipreggae-midfi.mp3', color: '#2ECC71' },
  { id: 'fiprock', name: 'FIP Rock', genre: 'Rock', logo: '🤘', stream_url: 'https://icecast.radiofrance.fr/fiprock-midfi.mp3', color: '#E74C3C' },
  { id: 'fipgroove', name: 'FIP Groove', genre: 'Funk & Soul', logo: '🕺', stream_url: 'https://icecast.radiofrance.fr/fipgroove-midfi.mp3', color: '#FF6B35' },
  { id: 'skyrock', name: 'Skyrock', genre: 'Rap & RnB', logo: '🎤', stream_url: 'https://icecast.skyrock.net/s/natio_mp3_128k', color: '#000000' },
  { id: 'funradio', name: 'Fun Radio', genre: 'Dance', logo: '🎧', stream_url: 'https://streaming.radio.funradio.fr/fun-1-44-128', color: '#FF6B00' },
  { id: 'rtl2', name: 'RTL2', genre: 'Pop Rock', logo: '🎸', stream_url: 'https://streaming.radio.rtl2.fr/rtl2-1-44-128', color: '#00A0E4' },
  { id: 'nova', name: 'Radio Nova', genre: 'Éclectique', logo: '🌟', stream_url: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3', color: '#FF5500' },
  { id: 'fip', name: 'FIP', genre: 'Jazz & Groove', logo: '🎹', stream_url: 'https://icecast.radiofrance.fr/fip-midfi.mp3', color: '#E85D75' },
];

export default function RadioPlayer() {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMini, setIsMini] = useState(false); // Mode mini - juste un petit bouton
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [stations, setStations] = useState(DEFAULT_STATIONS);
  const [currentStation, setCurrentStation] = useState(DEFAULT_STATIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [settings, setSettings] = useState({
    enabled: true,
    position: 'bottom-left',
    auto_play: false,
    default_volume: 70
  });

  // Charger les stations et settings depuis l'API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [stationsRes, settingsRes] = await Promise.all([
          axios.get(`${API}/radio/stations`),
          axios.get(`${API}/radio/settings`)
        ]);
        
        if (stationsRes.data && stationsRes.data.length > 0) {
          setStations(stationsRes.data);
          setCurrentStation(stationsRes.data[0]);
        }
        
        if (settingsRes.data) {
          setSettings(settingsRes.data);
          setVolume(settingsRes.data.default_volume || 70);
        }
      } catch (err) {
        console.log('Using default radio stations');
      }
    };
    fetchData();
  }, []);

  // Écouter l'événement toggleRadio depuis le Hero
  // Cet événement force l'ouverture même si settings.enabled est false
  const [forceShow, setForceShow] = useState(false);
  
  useEffect(() => {
    const handleToggleRadio = () => {
      console.log('toggleRadio event received');
      setForceShow(true);
      setIsOpen(true);
      setIsExpanded(true);
    };
    
    window.addEventListener('toggleRadio', handleToggleRadio);
    return () => window.removeEventListener('toggleRadio', handleToggleRadio);
  }, []);

  // Initialiser l'audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume / 100;
      // Empêcher le préchargement automatique pour éviter que le navigateur reste en "chargement"
      audioRef.current.preload = 'none';
    }

    const audio = audioRef.current;

    const handleCanPlay = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleError = () => {
      setIsLoading(false);
      setError('Impossible de charger cette station');
      setIsPlaying(false);
    };

    const handleWaiting = () => {
      setIsLoading(true);
    };

    const handlePlaying = () => {
      setIsLoading(false);
    };

    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('playing', handlePlaying);

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('playing', handlePlaying);
    };
  }, []);

  // Changer de station
  const changeStation = (station) => {
    const audio = audioRef.current;
    const wasPlaying = isPlaying;
    
    if (wasPlaying) {
      audio.pause();
    }
    
    setCurrentStation(station);
    setError(null);
    
    // Ne charger le stream que si la radio était en lecture
    if (wasPlaying) {
      audio.src = station.stream_url;
      setIsLoading(true);
      audio.play().catch(() => {
        setError('Impossible de lire cette station');
        setIsPlaying(false);
        setIsLoading(false);
      });
    }
  };

  // Play/Pause
  const togglePlay = () => {
    const audio = audioRef.current;
    
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsLoading(true);
      audio.src = currentStation.stream_url;
      audio.play().then(() => {
        setIsPlaying(true);
        setIsLoading(false);
      }).catch(() => {
        setError('Impossible de lire cette station');
        setIsLoading(false);
      });
    }
  };

  // Volume
  const handleVolumeChange = (value) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Mute
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume / 100;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Station suivante/précédente
  const nextStation = () => {
    const currentIndex = stations.findIndex(s => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % stations.length;
    changeStation(stations[nextIndex]);
  };

  const prevStation = () => {
    const currentIndex = stations.findIndex(s => s.id === currentStation.id);
    const prevIndex = currentIndex === 0 ? stations.length - 1 : currentIndex - 1;
    changeStation(stations[prevIndex]);
  };

  // Si désactivé dans les settings ET pas forcé par le bouton Hero
  if (!settings.enabled && !forceShow) {
    return null;
  }

  // Position classes
  const positionClasses = settings.position === 'bottom-right' 
    ? 'right-4' 
    : 'left-4';

  // Bouton flottant quand fermé
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 sm:bottom-24 ${positionClasses} z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center`}
        title="Ouvrir la radio"
        data-testid="radio-open-btn"
      >
        <Radio className="w-5 h-5 sm:w-6 sm:h-6" />
      </button>
    );
  }

  // Mode mini - petit bouton discret avec station en cours
  if (isMini) {
    return (
      <div 
        className={`fixed bottom-20 sm:bottom-24 ${positionClasses} z-50 flex items-center gap-2`}
        data-testid="radio-player-mini"
      >
        {/* Bouton principal mini */}
        <div 
          className="flex items-center gap-1 bg-white dark:bg-gray-900 rounded-full shadow-lg border border-border px-2 py-1.5 cursor-pointer hover:shadow-xl transition-all"
          style={{ borderColor: currentStation.color }}
        >
          {/* Logo station - clic pour ouvrir le player complet */}
          <button
            onClick={() => setIsMini(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg hover:scale-110 transition-transform"
            style={{ backgroundColor: `${currentStation.color}20` }}
            title={`${currentStation.name} - Cliquer pour ouvrir`}
          >
            {currentStation.logo}
          </button>
          
          {/* Bouton Play/Pause */}
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ backgroundColor: currentStation.color, color: 'white' }}
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          {/* Indicateur de lecture */}
          {isPlaying && !isLoading && (
            <div className="flex items-end gap-0.5 h-4 px-1">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full"
                  style={{
                    backgroundColor: currentStation.color,
                    animation: `radioWave 0.5s ease-in-out infinite`,
                    animationDelay: `${i * 0.1}s`,
                    height: '100%'
                  }}
                />
              ))}
            </div>
          )}

          {/* Bouton station suivante */}
          <button
            onClick={nextStation}
            className="w-6 h-6 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            title="Station suivante"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bouton fermer */}
        <button
          onClick={() => {
            if (isPlaying) {
              audioRef.current?.pause();
              setIsPlaying(false);
            }
            setIsOpen(false);
            setIsMini(false);
          }}
          className="w-6 h-6 rounded-full bg-white dark:bg-gray-900 shadow border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
          title="Fermer la radio"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-20 sm:bottom-24 ${positionClasses} z-50 transition-all duration-300 ${isExpanded ? 'w-72 sm:w-80' : 'w-64 sm:w-72'}`} data-testid="radio-player">
      {/* Mini Player */}
      <div 
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-border overflow-hidden"
        style={{ borderTop: `3px solid ${currentStation.color}` }}
      >
        {/* Header */}
        <div 
          className="px-4 py-3 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${currentStation.color}20, transparent)` }}
        >
          <div className="flex items-center gap-2">
            <span className="text-2xl">{currentStation.logo}</span>
            <div>
              <h3 className="font-bold text-sm">{currentStation.name}</h3>
              <p className="text-xs text-muted-foreground">{currentStation.genre}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMini(true)}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
              title="Réduire en mini-lecteur"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
              title={isExpanded ? "Réduire" : "Voir les stations"}
            >
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                if (isPlaying) {
                  audioRef.current?.pause();
                  setIsPlaying(false);
                }
                setIsOpen(false);
                setIsMini(false);
              }}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
              title="Fermer la radio"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Visualisation */}
        <div className="px-4 py-2 flex items-center justify-center gap-1">
          {isPlaying && !isLoading ? (
            // Barres d'animation audio
            <div className="flex items-end gap-0.5 h-6">
              {[20, 60, 40, 80, 30, 70, 50, 90, 25, 65, 45, 85].map((height, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-purple-600 to-pink-500 rounded-full animate-pulse"
                  style={{
                    height: `${height}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: '0.5s'
                  }}
                />
              ))}
            </div>
          ) : isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Chargement...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Music2 className="w-4 h-4" />
              <span className="text-xs">En pause</span>
            </div>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <div className="px-4 py-2 text-xs text-red-500 text-center bg-red-50 dark:bg-red-900/20">
            {error}
          </div>
        )}

        {/* Contrôles principaux */}
        <div className="px-4 py-3 flex items-center justify-center gap-4">
          <button
            onClick={prevStation}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <SkipBack className="w-5 h-5" />
          </button>
          
          <button
            onClick={togglePlay}
            disabled={isLoading}
            className="w-12 h-12 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 disabled:opacity-50"
            style={{ backgroundColor: currentStation.color }}
            data-testid="radio-play-btn"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-0.5" />
            )}
          </button>
          
          <button
            onClick={nextStation}
            className="p-2 hover:bg-secondary rounded-full transition-colors"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Volume */}
        <div className="px-4 py-2 flex items-center gap-3">
          <button onClick={toggleMute} className="p-1 hover:bg-secondary rounded transition-colors">
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </button>
          <Slider
            value={[isMuted ? 0 : volume]}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
            className="flex-1"
          />
          <span className="text-xs text-muted-foreground w-8">{isMuted ? 0 : volume}%</span>
        </div>

        {/* Liste des stations (expanded) */}
        {isExpanded && (
          <div className="border-t max-h-60 overflow-y-auto">
            <div className="p-2 grid grid-cols-2 gap-1">
              {stations.map((station) => (
                <button
                  key={station.id}
                  onClick={() => changeStation(station)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
                    currentStation.id === station.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-secondary'
                  }`}
                  data-testid={`radio-station-${station.id}`}
                >
                  <span className="text-lg">{station.logo}</span>
                  <div className="min-w-0">
                    <p className={`text-xs font-medium truncate ${
                      currentStation.id === station.id ? 'text-primary' : ''
                    }`}>
                      {station.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">{station.genre}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
