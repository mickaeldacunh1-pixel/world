import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import AnimatedText from './AnimatedText';

// Tailles de titre
const TITLE_SIZE_CLASSES = {
  'xs': 'text-2xl md:text-3xl lg:text-4xl',
  'sm': 'text-3xl md:text-4xl lg:text-5xl',
  'md': 'text-4xl md:text-5xl lg:text-6xl',
  'lg': 'text-5xl md:text-6xl lg:text-7xl',
  'xl': 'text-6xl md:text-7xl lg:text-8xl',
  '2xl': 'text-7xl md:text-8xl lg:text-9xl'
};

// Tailles de description
const DESC_SIZE_CLASSES = {
  'sm': 'text-base md:text-lg',
  'md': 'text-lg md:text-xl',
  'lg': 'text-xl md:text-2xl'
};

// Ordre par défaut des éléments du Hero
const DEFAULT_ELEMENT_ORDER = [
  'badge',
  'title1',
  'title2', 
  'description',
  'cta_buttons',
  'premium_buttons',
  'shortcuts',
  'stats'
];

// Composant pour chaque élément du Hero
function HeroElement({ id, settings, autoTranslate, t, children }) {
  switch (id) {
    case 'badge':
      if (settings.hero_show_badge === false) return null;
      return (
        <div 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm animate-fade-in-up"
          style={{ 
            backgroundColor: settings.hero_badge_bg_color || 'rgba(249, 115, 22, 0.2)',
            borderColor: settings.hero_badge_border_color || 'rgba(249, 115, 22, 0.3)',
            borderWidth: '1px',
            borderStyle: 'solid'
          }}
        >
          <span>{settings.hero_badge_icon || '✨'}</span>
          <span className="text-sm font-medium" style={{ color: settings.hero_badge_text_color || '#F97316' }}>
            {autoTranslate(settings.hero_badge_text) || t('hero.badge')}
          </span>
        </div>
      );

    case 'title1':
      return (
        <h1 
          className={`font-heading ${TITLE_SIZE_CLASSES[settings.hero_title_line1_size || settings.hero_title_size] || 'text-4xl md:text-5xl lg:text-7xl'} font-black tracking-tight leading-none animate-fade-in-up stagger-2`}
          style={{ color: settings.hero_title_line1_color || '#FFFFFF' }}
        >
          <AnimatedText 
            text={autoTranslate(settings.hero_title_line1) || t('hero.titleLine1')} 
            animation={settings.hero_text_animation}
            className="block"
          />
        </h1>
      );

    case 'title2':
      return (
        <h2 
          className={`font-heading ${TITLE_SIZE_CLASSES[settings.hero_title_line2_size || settings.hero_title_size] || 'text-4xl md:text-5xl lg:text-7xl'} font-black tracking-tight leading-none animate-fade-in-up stagger-2 ${settings.hero_text_animation === 'glow' ? 'animate-text-glow' : ''}`}
          style={settings.hero_title_line2_gradient ? {
            backgroundImage: `linear-gradient(90deg, ${settings.hero_title_line2_gradient_from || '#F97316'}, ${settings.hero_title_line2_gradient_to || '#EA580C'})`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          } : { 
            color: settings.hero_title_line2_color || '#F97316' 
          }}
        >
          <AnimatedText 
            text={autoTranslate(settings.hero_title_line2) || t('hero.titleLine2')} 
            animation={settings.hero_text_animation}
            delay={settings.hero_text_animation === 'typewriter' ? (autoTranslate(settings.hero_title_line1) || t('hero.titleLine1')).length * 50 + 200 : 200}
          />
        </h2>
      );

    case 'description':
      return (
        <p 
          className={`${DESC_SIZE_CLASSES[settings.hero_description_size] || 'text-lg md:text-xl'} animate-fade-in-up stagger-3 ${
            settings.hero_text_align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-xl'
          }`}
          style={{ color: settings.hero_description_color || 'rgba(255, 255, 255, 0.8)' }}
        >
          {autoTranslate(settings.hero_description) || t('hero.description')}
        </p>
      );

    case 'cta_buttons':
    case 'premium_buttons':
    case 'shortcuts':
    case 'stats':
      // Ces éléments sont gérés par les children passés depuis Home.jsx
      return children || null;

    default:
      return null;
  }
}

export default function DynamicHeroContent({ settings, autoTranslate, t, renderElement }) {
  // Récupérer l'ordre des éléments (sauvegardé ou par défaut)
  const elementOrder = settings.hero_elements_order || DEFAULT_ELEMENT_ORDER;
  
  return (
    <div className={`flex flex-col gap-4 ${
      settings.hero_text_align === 'center' ? 'items-center text-center' : 
      settings.hero_text_align === 'right' ? 'items-end text-right' : 'items-start text-left'
    }`}>
      {elementOrder.map((elementId) => (
        <div key={elementId} className="w-full">
          {renderElement(elementId)}
        </div>
      ))}
    </div>
  );
}

export { HeroElement, DEFAULT_ELEMENT_ORDER, TITLE_SIZE_CLASSES, DESC_SIZE_CLASSES };
