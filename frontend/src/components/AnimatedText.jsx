import { useState, useEffect, useRef } from 'react';

// Animated Text component with multiple animation types
export default function AnimatedText({ 
  text, 
  animation = 'none', 
  className = '',
  delay = 0,
  speed = 50 // ms per character for typewriter
}) {
  const [displayText, setDisplayText] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Typewriter effect
  useEffect(() => {
    if (animation !== 'typewriter' || !isVisible) {
      setDisplayText(text);
      return;
    }

    setDisplayText('');
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, animation, isVisible, speed]);

  // Get animation classes based on type
  const getAnimationClasses = () => {
    if (!isVisible) return 'opacity-0';
    
    switch (animation) {
      case 'typewriter':
        return 'border-r-2 border-white animate-blink-caret';
      case 'fade':
        return 'animate-fade-in';
      case 'slide-up':
        return 'animate-slide-up';
      case 'slide-down':
        return 'animate-slide-down';
      case 'slide-left':
        return 'animate-slide-left';
      case 'slide-right':
        return 'animate-slide-right';
      case 'zoom':
        return 'animate-zoom-in';
      case 'bounce':
        return 'animate-bounce-in';
      case 'flip':
        return 'animate-flip-in';
      case 'glow':
        return 'animate-glow';
      case 'gradient':
        return 'animate-gradient-shift bg-gradient-to-r from-white via-accent to-white bg-clip-text text-transparent bg-[length:200%_auto]';
      case 'wave':
        return ''; // Handled separately with letter-by-letter animation
      default:
        return '';
    }
  };

  // Wave animation - letter by letter
  if (animation === 'wave' && isVisible) {
    return (
      <span className={className} ref={elementRef}>
        {text.split('').map((char, i) => (
          <span
            key={i}
            className="inline-block animate-wave"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </span>
    );
  }

  // Typewriter with cursor
  if (animation === 'typewriter') {
    return (
      <span className={className} ref={elementRef}>
        {displayText}
        {isVisible && displayText.length < text.length && (
          <span className="inline-block w-[3px] h-[1em] bg-white ml-1 animate-blink" />
        )}
      </span>
    );
  }

  return (
    <span 
      ref={elementRef}
      className={`${className} ${getAnimationClasses()} transition-all duration-700`}
    >
      {displayText}
    </span>
  );
}

// CSS to add in App.css or a style tag
export const animationStyles = `
@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-down {
  from { opacity: 0; transform: translateY(-30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-left {
  from { opacity: 0; transform: translateX(30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes slide-right {
  from { opacity: 0; transform: translateX(-30px); }
  to { opacity: 1; transform: translateX(0); }
}

@keyframes zoom-in {
  from { opacity: 0; transform: scale(0.8); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes bounce-in {
  0% { opacity: 0; transform: scale(0.3); }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.9); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes flip-in {
  from { opacity: 0; transform: perspective(400px) rotateX(90deg); }
  to { opacity: 1; transform: perspective(400px) rotateX(0); }
}

@keyframes glow {
  0%, 100% { text-shadow: 0 0 10px rgba(249, 115, 22, 0.5), 0 0 20px rgba(249, 115, 22, 0.3); }
  50% { text-shadow: 0 0 20px rgba(249, 115, 22, 0.8), 0 0 40px rgba(249, 115, 22, 0.5); }
}

@keyframes gradient-shift {
  0% { background-position: 0% center; }
  100% { background-position: 200% center; }
}

@keyframes wave {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.animate-blink {
  animation: blink 0.7s infinite;
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out forwards;
}

.animate-slide-up {
  animation: slide-up 0.8s ease-out forwards;
}

.animate-slide-down {
  animation: slide-down 0.8s ease-out forwards;
}

.animate-slide-left {
  animation: slide-left 0.8s ease-out forwards;
}

.animate-slide-right {
  animation: slide-right 0.8s ease-out forwards;
}

.animate-zoom-in {
  animation: zoom-in 0.6s ease-out forwards;
}

.animate-bounce-in {
  animation: bounce-in 0.8s ease-out forwards;
}

.animate-flip-in {
  animation: flip-in 0.8s ease-out forwards;
}

.animate-glow {
  animation: glow 2s ease-in-out infinite;
}

.animate-gradient-shift {
  animation: gradient-shift 3s linear infinite;
}

.animate-wave {
  animation: wave 1s ease-in-out infinite;
}
`;
