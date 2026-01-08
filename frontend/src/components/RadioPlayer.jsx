import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { 
  Radio, Play, Pause, Volume2, VolumeX, X, ChevronUp, ChevronDown,
  SkipBack, SkipForward, Music2
} from 'lucide-react';

// Liste des stations de radio françaises avec leurs flux de streaming
const RADIO_STATIONS = [
  {
    id: 'skyrock',
    name: 'Skyrock',
    genre: 'Rap & RnB',
    logo: '🎤',
    streamUrl: 'https://icecast.skyrock.net/s/natio_mp3_128k',
    color: '#000000'
  },
  {
    id: 'funradio',
    name: 'Fun Radio',
    genre: 'Dance',
    logo: '🎧',
    streamUrl: 'https://streaming.radio.funradio.fr/fun-1-44-128',
    color: '#FF6B00'
  },
  {
    id: 'rtl',
    name: 'RTL',
    genre: 'Généraliste',
    logo: '📻',
    streamUrl: 'https://streaming.radio.rtl.fr/rtl-1-44-128',
    color: '#E30613'
  },
  {
    id: 'rtl2',
    name: 'RTL2',
    genre: 'Pop Rock',
    logo: '🎸',
    streamUrl: 'https://streaming.radio.rtl2.fr/rtl2-1-44-128',
    color: '#00A0E4'
  },
  {
    id: 'nova',
    name: 'Radio Nova',
    genre: 'Éclectique',
    logo: '🌟',
    streamUrl: 'https://novazz.ice.infomaniak.ch/novazz-128.mp3',
    color: '#FF5500'
  },
  {
    id: 'beurfm',
    name: 'Beur FM',
    genre: 'Musique du monde',
    logo: '🌍',
    streamUrl: 'https://beurfm.ice.infomaniak.ch/beurfm-high.mp3',
    color: '#009933'
  },
  {
    id: 'franceinter',
    name: 'France Inter',
    genre: 'Généraliste',
    logo: '🇫🇷',
    streamUrl: 'https://icecast.radiofrance.fr/franceinter-midfi.mp3',
    color: '#E20074'
  },
  {
    id: 'franceinfo',
    name: 'France Info',
    genre: 'Info',
    logo: '📰',
    streamUrl: 'https://icecast.radiofrance.fr/franceinfo-midfi.mp3',
    color: '#0066CC'
  },
  {
    id: 'fip',
    name: 'FIP',
    genre: 'Jazz & Groove',
    logo: '🎹',
    streamUrl: 'https://icecast.radiofrance.fr/fip-midfi.mp3',
    color: '#E85D75'
  },
  {
    id: 'mouv',
    name: 'Mouv\'',
    genre: 'Urban',
    logo: '🔥',
    streamUrl: 'https://icecast.radiofrance.fr/mouv-midfi.mp3',
    color: '#00D4AA'
  },
  {
    id: 'francemusique',
    name: 'France Musique',
    genre: 'Classique',
    logo: '🎻',
    streamUrl: 'https://icecast.radiofrance.fr/francemusique-midfi.mp3',
    color: '#8B4513'
  },
  {
    id: 'franceculture',
    name: 'France Culture',
    genre: 'Culture',
    logo: '📚',
    streamUrl: 'https://icecast.radiofrance.fr/franceculture-midfi.mp3',
    color: '#9932CC'
  },
  {
    id: 'oui',
    name: 'OÜI FM',
    genre: 'Rock Indé',
    logo: '🤘',
    streamUrl: 'https://ouifm.ice.infomaniak.ch/ouifm-high.mp3',
    color: '#FF0000'
  },
  {
    id: 'tsfjazz',
    name: 'TSF Jazz',
    genre: 'Jazz',
    logo: '🎷',
    streamUrl: 'https://tsfjazz.ice.infomaniak.ch/tsfjazz-high.mp3',
    color: '#1E90FF'
  }
];

export default function RadioPlayer() {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [currentStation, setCurrentStation] = useState(RADIO_STATIONS[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialiser l'audio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume / 100;
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
    audio.src = station.streamUrl;
    
    if (wasPlaying) {
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
      audio.src = currentStation.streamUrl;
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
    const currentIndex = RADIO_STATIONS.findIndex(s => s.id === currentStation.id);
    const nextIndex = (currentIndex + 1) % RADIO_STATIONS.length;
    changeStation(RADIO_STATIONS[nextIndex]);
  };

  const prevStation = () => {
    const currentIndex = RADIO_STATIONS.findIndex(s => s.id === currentStation.id);
    const prevIndex = currentIndex === 0 ? RADIO_STATIONS.length - 1 : currentIndex - 1;
    changeStation(RADIO_STATIONS[prevIndex]);
  };

  // Bouton flottant quand fermé
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-4 z-50 w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center"
        title="Ouvrir la radio"
      >
        <Radio className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-24 left-4 z-50 transition-all duration-300 ${isExpanded ? 'w-80' : 'w-72'}`}>
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
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
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
              }}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
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
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-gradient-to-t from-purple-600 to-pink-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 100}%`,
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
              {RADIO_STATIONS.map((station) => (
                <button
                  key={station.id}
                  onClick={() => changeStation(station)}
                  className={`flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
                    currentStation.id === station.id
                      ? 'bg-primary/10 border border-primary/30'
                      : 'hover:bg-secondary'
                  }`}
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
