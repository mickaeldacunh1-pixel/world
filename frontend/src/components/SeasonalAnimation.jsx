import { useEffect, useState } from 'react';

const ANIMATIONS = {
  snow: {
    emoji: '❄️',
    count: 50,
    className: 'animate-fall-slow',
  },
  christmas: {
    emoji: '🎄',
    count: 15,
    className: 'animate-fall-slow',
    extras: ['🎅', '🎁', '⭐', '❄️']
  },
  confetti: {
    emoji: '🎉',
    count: 40,
    className: 'animate-fall-fast',
    extras: ['🎊', '✨', '🎈', '🥳']
  },
  halloween: {
    emoji: '🎃',
    count: 20,
    className: 'animate-float',
    extras: ['👻', '🦇', '🕷️', '💀']
  },
  autumn: {
    emoji: '🍂',
    count: 30,
    className: 'animate-fall-sway',
    extras: ['🍁', '🍃']
  },
  hearts: {
    emoji: '❤️',
    count: 25,
    className: 'animate-float',
    extras: ['💕', '💖', '💗', '💝']
  },
  summer: {
    emoji: '☀️',
    count: 15,
    className: 'animate-float',
    extras: ['🌴', '🏖️', '🌊', '🍉']
  },
  // NEW ANIMATIONS
  spring: {
    emoji: '🌸',
    count: 35,
    className: 'animate-fall-sway',
    extras: ['🦋', '🌷', '🌼', '🐝', '🌺']
  },
  newyear: {
    emoji: '🎆',
    count: 30,
    className: 'animate-firework',
    extras: ['🎇', '✨', '🥂', '🍾', '⭐']
  },
  racing: {
    emoji: '🏎️',
    count: 15,
    className: 'animate-zoom-across',
    extras: ['🏁', '🔧', '⚙️', '💨', '🛞']
  },
  sports: {
    emoji: '⚽',
    count: 20,
    className: 'animate-bounce-fall',
    extras: ['🏀', '🎾', '🏈', '🏆', '🥇']
  },
  rain: {
    emoji: '💧',
    count: 60,
    className: 'animate-rain',
    extras: ['🌧️', '💦']
  },
  stars: {
    emoji: '⭐',
    count: 40,
    className: 'animate-twinkle',
    extras: ['✨', '🌟', '💫']
  },
  money: {
    emoji: '💰',
    count: 25,
    className: 'animate-fall-slow',
    extras: ['💵', '💶', '💷', '🤑', '💸']
  },
  party: {
    emoji: '🥳',
    count: 30,
    className: 'animate-fall-fast',
    extras: ['🎂', '🎈', '🎁', '🍰', '🪅']
  },
  easter: {
    emoji: '🐰',
    count: 20,
    className: 'animate-bounce-fall',
    extras: ['🥚', '🐣', '🌷', '🐤', '🪺']
  },
  stpatrick: {
    emoji: '🍀',
    count: 35,
    className: 'animate-fall-sway',
    extras: ['☘️', '🌈', '💚', '🎩']
  }
};

export default function SeasonalAnimation({ type, enabled = true }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    if (!enabled || !type || !ANIMATIONS[type]) {
      setParticles([]);
      return;
    }

    const config = ANIMATIONS[type];
    const allEmojis = [config.emoji, ...(config.extras || [])];
    
    const newParticles = Array.from({ length: config.count }, (_, i) => ({
      id: i,
      emoji: allEmojis[Math.floor(Math.random() * allEmojis.length)],
      left: Math.random() * 100,
      delay: Math.random() * 10,
      duration: 8 + Math.random() * 8,
      size: 0.8 + Math.random() * 0.8,
    }));
    
    setParticles(newParticles);
  }, [type, enabled]);

  if (!enabled || !type || particles.length === 0) return null;

  return (
    <>
      {/* CSS Animations */}
      <style>{`
        @keyframes fall-slow {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0.3;
          }
        }
        
        @keyframes fall-fast {
          0% {
            transform: translateY(-10vh) rotate(0deg) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }
        
        @keyframes fall-sway {
          0% {
            transform: translateY(-10vh) translateX(0) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: translateY(25vh) translateX(20px) rotate(90deg);
          }
          50% {
            transform: translateY(50vh) translateX(-20px) rotate(180deg);
          }
          75% {
            transform: translateY(75vh) translateX(20px) rotate(270deg);
          }
          100% {
            transform: translateY(110vh) translateX(0) rotate(360deg);
            opacity: 0.3;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-20px) rotate(5deg);
          }
          50% {
            transform: translateY(0) rotate(0deg);
          }
          75% {
            transform: translateY(-10px) rotate(-5deg);
          }
        }
        
        .seasonal-particle {
          position: fixed;
          pointer-events: none;
          z-index: 9999;
          user-select: none;
        }
        
        .animate-fall-slow {
          animation: fall-slow linear infinite;
        }
        
        .animate-fall-fast {
          animation: fall-fast linear infinite;
        }
        
        .animate-fall-sway {
          animation: fall-sway linear infinite;
        }
        
        .animate-float {
          animation: float ease-in-out infinite;
        }
      `}</style>
      
      {/* Particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
        {particles.map((particle) => (
          <span
            key={particle.id}
            className={`seasonal-particle ${ANIMATIONS[type].className}`}
            style={{
              left: `${particle.left}%`,
              top: '-20px',
              fontSize: `${particle.size}rem`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          >
            {particle.emoji}
          </span>
        ))}
      </div>
    </>
  );
}

// Export animation types for admin panel
export const ANIMATION_OPTIONS = [
  { value: '', label: 'Aucune animation', emoji: '❌' },
  { value: 'snow', label: 'Neige', emoji: '❄️' },
  { value: 'christmas', label: 'Noël', emoji: '🎄' },
  { value: 'confetti', label: 'Confettis', emoji: '🎉' },
  { value: 'halloween', label: 'Halloween', emoji: '🎃' },
  { value: 'autumn', label: 'Automne', emoji: '🍂' },
  { value: 'hearts', label: 'Cœurs', emoji: '❤️' },
  { value: 'summer', label: 'Été', emoji: '☀️' },
];
