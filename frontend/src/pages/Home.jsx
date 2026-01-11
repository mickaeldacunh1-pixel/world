import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Card } from '../components/ui/card';
import { Search, Car, Wrench, Bike, Truck, Settings, ArrowRight, Shield, Users, Clock, MapPin, Eye, Sparkles, Gavel, Gift, UserPlus, Copy, Check, Stethoscope, Tractor, Menu, Star, Video, Camera } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import SEO, { createOrganizationSchema, createWebsiteSchema } from '../components/SEO';
import SeasonalAnimation from '../components/SeasonalAnimation';
import AITools from '../components/AITools';
import PlateScanner from '../components/PlateScanner';
import VoiceSearch from '../components/VoiceSearch';
import AnimatedText from '../components/AnimatedText';
import SellerOfTheWeek from '../components/SellerOfTheWeek';
import VideoShowcase from '../components/VideoShowcase';
import Stories from '../components/Stories';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { slug: 'pieces', icon: Wrench, image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop', count: 0, color: 'from-orange-500 to-red-500' },
  { slug: 'voitures', icon: Car, image: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop', count: 0, color: 'from-blue-500 to-indigo-500' },
  { slug: 'motos', icon: Bike, image: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=400&fit=crop', count: 0, color: 'from-green-500 to-teal-500' },
  { slug: 'utilitaires', icon: Truck, image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&h=400&fit=crop', count: 0, color: 'from-purple-500 to-pink-500' },
  { slug: 'engins', icon: Tractor, image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&h=400&fit=crop', count: 0, color: 'from-amber-600 to-yellow-500' },
  { slug: 'accessoires', icon: Settings, image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop', count: 0, color: 'from-slate-500 to-gray-600' },
  { slug: 'recherche', icon: Search, image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=600&h=400&fit=crop', count: 0, color: 'from-cyan-500 to-blue-500' },
  { slug: 'rare', icon: Star, image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=600&h=400&fit=crop', count: 0, color: 'from-yellow-500 to-amber-600' },
];

const DEFAULT_HERO = {
  // Badge
  hero_show_badge: true,
  hero_badge_text: "La référence automobile en France",
  hero_badge_icon: "✨",
  hero_badge_bg_color: "rgba(249, 115, 22, 0.2)",
  hero_badge_text_color: "#F97316",
  
  // Titles
  hero_title_line1: "La marketplace auto",
  hero_title_line1_color: "#FFFFFF",
  hero_title_line1_size: "large",
  hero_title_line2: "pour tous",
  hero_title_line2_color: "#F97316",
  hero_title_line2_size: "large",
  hero_title_line2_gradient: false,
  hero_title_line2_gradient_from: "#F97316",
  hero_title_line2_gradient_to: "#EA580C",
  
  // Description
  hero_description: "Achetez et vendez des pièces détachées, voitures, motos et utilitaires. Pour particuliers et professionnels.",
  hero_description_color: "rgba(255, 255, 255, 0.8)",
  hero_description_size: "medium",
  
  // CTA Buttons
  hero_cta1_enabled: true,
  hero_cta1_text: "Déposer une annonce",
  hero_cta1_link: "/deposer",
  hero_cta1_icon: "📝",
  hero_cta1_bg_color: "#F97316",
  hero_cta1_text_color: "#FFFFFF",
  hero_cta1_style: "filled",
  
  hero_cta2_enabled: true,
  hero_cta2_text: "Enchères en direct",
  hero_cta2_link: "/encheres",
  hero_cta2_icon: "⚡",
  hero_cta2_bg_color: "transparent",
  hero_cta2_text_color: "#FFFFFF",
  hero_cta2_border_color: "rgba(255, 255, 255, 0.3)",
  hero_cta2_style: "outline",
  
  // CTA3 - Premium Button 1
  hero_cta3_enabled: false,
  hero_cta3_text: "",
  hero_cta3_link: "",
  hero_cta3_icon: "🎯",
  hero_cta3_bg_color: "#EAB308",
  hero_cta3_text_color: "#FFFFFF",
  hero_cta3_border_color: "rgba(234, 179, 8, 0.5)",
  hero_cta3_style: "filled",
  hero_cta3_size: "medium",
  hero_cta3_border_radius: "medium",
  hero_cta3_hover_effect: "none",
  
  // CTA4 - Premium Button 2
  hero_cta4_enabled: false,
  hero_cta4_text: "",
  hero_cta4_link: "",
  hero_cta4_icon: "💎",
  hero_cta4_bg_color: "#8B5CF6",
  hero_cta4_text_color: "#FFFFFF",
  hero_cta4_border_color: "rgba(139, 92, 246, 0.5)",
  hero_cta4_style: "filled",
  hero_cta4_size: "medium",
  hero_cta4_border_radius: "medium",
  hero_cta4_hover_effect: "none",
  
  // Background
  hero_image: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=2832&auto=format&fit=crop",
  hero_overlay_enabled: true,
  hero_overlay_color: "#000000",
  hero_overlay_opacity: 50,
  hero_overlay_gradient: true,
  
  // Layout
  hero_height: "large",
  hero_text_align: "left",
  hero_text_animation: "none",
  
  // Elements visibility
  hero_show_search: true,
  hero_show_plate_scanner: true,
  hero_show_voice_search: true,
  hero_show_stats: true,
  hero_show_ai_tools: true,
  hero_show_categories: true,
  
  // Search
  hero_search_placeholder: "Rechercher une pièce, un véhicule...",
  hero_search_button_text: "Rechercher",
  
  // Stats
  hero_stat1_number: "100+",
  hero_stat1_label: "annonces actives",
  hero_stat1_icon: "📦",
  hero_stat2_number: "5",
  hero_stat2_label: "catégories",
  hero_stat2_icon: "📂",
  hero_stat3_enabled: false,
  hero_stats_number_color: "#FFFFFF",
  hero_stats_color: "rgba(255, 255, 255, 0.7)",
  
  // Announcement bar
  seasonal_animation: "",
  announcement_enabled: false,
  announcement_text: "",
  announcement_link: "",
  announcement_bg_color: "#e74c3c",
  announcement_text_color: "#ffffff",
  
  // Category images
  category_pieces_image: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop",
  category_voitures_image: "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop",
  category_motos_image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&h=400&fit=crop",
  category_utilitaires_image: "https://images.unsplash.com/photo-1532581140115-3e355d1ed1de?w=600&h=400&fit=crop",
  category_accessoires_image: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&h=400&fit=crop",
};

// Title size classes
const TITLE_SIZE_CLASSES = {
  small: 'text-2xl md:text-3xl lg:text-4xl',
  medium: 'text-3xl md:text-4xl lg:text-5xl',
  large: 'text-4xl md:text-5xl lg:text-7xl',
  xlarge: 'text-5xl md:text-6xl lg:text-8xl',
};

// Description size classes
const DESC_SIZE_CLASSES = {
  small: 'text-sm md:text-base',
  medium: 'text-base md:text-lg',
  large: 'text-lg md:text-xl',
};

// Hero height classes
const HERO_HEIGHT_CLASSES = {
  small: 'min-h-[400px]',
  medium: 'min-h-[500px]',
  large: 'min-h-[600px] md:min-h-[700px]',
  full: 'min-h-screen',
};

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [oemSearch, setOemSearch] = useState('');
  const [categoryStats, setCategoryStats] = useState({});
  const [recentListings, setRecentListings] = useState([]);
  const [heroSettings, setHeroSettings] = useState(DEFAULT_HERO);
  const [referralData, setReferralData] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [liveStats, setLiveStats] = useState(null);
  const [subcatImages, setSubcatImages] = useState({});

  // Initial data fetch on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      const cacheBuster = `?_t=${Date.now()}`;
      
      // Fetch hero settings
      try {
        const response = await axios.get(`${API}/settings/hero${cacheBuster}`);
        if (isMounted && response.data) {
          let settings = { ...DEFAULT_HERO, ...response.data };
          
          // Apply schedule logic
          if (settings.hero_schedule_enabled) {
            const now = new Date();
            const hour = now.getHours();
            const day = now.getDay(); // 0 = Sunday, 6 = Saturday
            const isWeekend = day === 0 || day === 6;
            const isNight = hour >= 20 || hour < 8;
            
            // Check for event first (highest priority)
            if (settings.hero_event_start && settings.hero_event_end) {
              const eventStart = new Date(settings.hero_event_start);
              const eventEnd = new Date(settings.hero_event_end);
              if (now >= eventStart && now <= eventEnd) {
                if (settings.hero_event_title) settings.hero_title_line1 = settings.hero_event_title;
                if (settings.hero_event_badge) settings.hero_badge_text = settings.hero_event_badge;
                if (settings.hero_event_image) settings.hero_image = settings.hero_event_image;
              }
            }
            // Weekend mode
            else if (isWeekend && settings.hero_weekend_enabled) {
              if (settings.hero_weekend_title) settings.hero_title_line1 = settings.hero_weekend_title;
              if (settings.hero_weekend_badge) settings.hero_badge_text = settings.hero_weekend_badge;
            }
            // Night mode
            else if (isNight && settings.hero_night_enabled) {
              if (settings.hero_night_title) settings.hero_title_line1 = settings.hero_night_title;
              if (settings.hero_night_image) settings.hero_image = settings.hero_night_image;
            }
          }
          
          setHeroSettings(settings);
        }
      } catch (error) {
        console.error('Error fetching hero settings:', error);
      }

      // Fetch live stats for counter
      try {
        const response = await axios.get(`${API}/stats/live${cacheBuster}`);
        if (isMounted) setLiveStats(response.data);
      } catch (error) {
        console.error('Error fetching live stats:', error);
      }

      // Fetch category stats
      try {
        const response = await axios.get(`${API}/categories/stats${cacheBuster}`);
        if (isMounted) setCategoryStats(response.data);
      } catch (error) {
        console.error('Error fetching category stats:', error);
      }

      // Fetch recent listings
      try {
        const response = await axios.get(`${API}/listings?limit=6&_t=${Date.now()}`);
        if (isMounted) setRecentListings(response.data.listings || []);
      } catch (error) {
        console.error('Error fetching recent listings:', error);
      }

      // Fetch subcategory images
      try {
        const response = await axios.get(`${API}/subcategory-images`);
        if (isMounted) setSubcatImages(response.data || {});
      } catch (error) {
        console.error('Error fetching subcategory images:', error);
      }
    };
    
    loadData();
    
    // Auto-refresh when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Fetch referral data if user is logged in
  useEffect(() => {
    if (user) {
      const fetchReferralData = async () => {
        try {
          const response = await axios.get(`${API}/referral/me?_t=${Date.now()}`);
          setReferralData(response.data);
        } catch (error) {
          console.error('Error fetching referral data:', error);
        }
      };
      fetchReferralData();
    }
  }, [user]);

  const copyReferralCode = () => {
    if (referralData?.referral_code) {
      navigator.clipboard.writeText(referralData.referral_code);
      setCopiedCode(true);
      toast.success('Code copié !');
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const shareReferral = async () => {
    if (navigator.share && referralData) {
      try {
        await navigator.share({
          title: 'Rejoins World Auto Pro Pro !',
          text: `Utilise mon code ${referralData.referral_code} et reçois 50 points de bienvenue !`,
          url: referralData.referral_link
        });
      } catch (error) {
        copyReferralCode();
      }
    } else {
      copyReferralCode();
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    navigate(`/annonces?${params.toString()}`);
  };

  const handleOemSearch = (e) => {
    e.preventDefault();
    if (oemSearch.trim()) {
      navigate(`/annonces/pieces?oem_reference=${encodeURIComponent(oemSearch.trim())}`);
    }
  };

  // Auto-translation system for Hero dynamic texts
  const heroTranslations = {
    // Badge
    'La référence automobile en France': t('hero.badge'),
    // Title lines
    'La marketplace auto': t('hero.titleLine1'),
    'pour tous': t('hero.titleLine2'),
    // Description
    'Achetez et vendez des pièces détachées, voitures, motos et utilitaires. Pour particuliers et professionnels.': t('hero.description'),
    // Button texts
    'Scanner ma plaque': t('search.scan_plate'),
    'Déposer une annonce': t('hero.postAd'),
    'Enchères en direct': t('hero.liveAuctions'),
    'Voir les annonces': t('common.see_all') + ' ' + t('nav.listings'),
    'Commencer': t('common.search'),
    'Rechercher': t('hero.searchButton'),
    // Search placeholder
    'Rechercher une pièce, un véhicule...': t('hero.searchPlaceholder'),
    // Stats labels
    'annonces actives': t('hero.activeListings'),
    'annonces': t('hero.listings'),
    'catégories': t('hero.categories'),
    'catégorie': t('hero.categories'),
    'membres': t('hero.members'),
    'membre': t('hero.members'),
    'ventes réalisées': t('hero.sales'),
    'ventes': t('hero.sales'),
    // Other common texts
    'Outils IA': t('home.ai_diagnostic'),
    'Voir tout': t('common.see_all'),
    'Voir plus': t('common.see_more'),
  };

  // Function to auto-translate French texts if not in French
  const autoTranslate = (text) => {
    if (!text) return text;
    const currentLang = localStorage.getItem('i18nextLng') || 'fr';
    if (currentLang === 'fr' || currentLang.startsWith('fr')) return text;
    return heroTranslations[text] || text;
  };

  const conditionLabels = {
    neuf: 'Neuf',
    occasion: 'Occasion',
    reconditionne: 'Reconditionné',
  };

  return (
    <div className="animate-fade-in" data-testid="home-page">
      {/* Seasonal Animation */}
      <SeasonalAnimation type={heroSettings.seasonal_animation} enabled={!!heroSettings.seasonal_animation} />
      
      {/* Announcement Bar */}
      {heroSettings.announcement_enabled && heroSettings.announcement_text && (
        <div 
          className="w-full py-3 px-4 text-center font-medium text-sm md:text-base"
          style={{ 
            backgroundColor: heroSettings.announcement_bg_color || '#e74c3c', 
            color: heroSettings.announcement_text_color || '#ffffff' 
          }}
        >
          {heroSettings.announcement_link ? (
            <a 
              href={heroSettings.announcement_link} 
              className="hover:opacity-80 transition-opacity"
            >
              {heroSettings.announcement_text}
            </a>
          ) : (
            <span>{heroSettings.announcement_text}</span>
          )}
        </div>
      )}
      
      <SEO
        title="Accueil"
        description="World Auto Pro Pro - La marketplace automobile pour acheter et vendre des pièces détachées, voitures, motos et utilitaires d&apos;occasion. Particuliers et professionnels."
        keywords="pièces détachées auto, voiture occasion, moto occasion, utilitaire occasion, marketplace automobile, France"
        url="/"
        structuredData={[createOrganizationSchema(), createWebsiteSchema()]}
      />

      {/* NOUVEAUTES BANNER - Visible en haut */}
      <section className="bg-gradient-to-r from-accent via-orange-500 to-amber-500 py-3">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link 
            to="/nouveautes" 
            className="flex items-center justify-center gap-3 group"
            data-testid="updates-banner"
          >
            <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
              <Sparkles className="w-4 h-4 text-white animate-pulse" />
              <span className="text-white text-sm font-bold">{t('home.whats_new', 'NOUVEAUTÉS')}</span>
            </div>
            <span className="text-white text-sm md:text-base font-medium group-hover:underline">
              {t('home.updates_cta', 'Boxtal, nouvelles catégories, marge frais de port...')}
            </span>
            <ArrowRight className="w-4 h-4 text-white group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Hero Section - Full Customization */}
      <section className={`relative ${HERO_HEIGHT_CLASSES[heroSettings.hero_height] || 'min-h-[600px] md:min-h-[700px]'} flex items-center overflow-hidden ${heroSettings.hero_mobile_height === 'small' ? 'md:min-h-[600px] min-h-[300px]' : heroSettings.hero_mobile_height === 'medium' ? 'md:min-h-[600px] min-h-[400px]' : heroSettings.hero_mobile_height === 'large' ? 'md:min-h-[600px] min-h-[500px]' : heroSettings.hero_mobile_height === 'full' ? 'md:min-h-[600px] min-h-screen' : ''}`}>
        {/* Background - Video or Image */}
        <div className="absolute inset-0">
          {heroSettings.hero_video_enabled && heroSettings.hero_video_url ? (
            <video 
              autoPlay 
              loop={heroSettings.hero_video_loop !== false}
              muted={heroSettings.hero_video_muted !== false}
              playsInline
              poster={heroSettings.hero_video_poster || heroSettings.hero_image}
              className="w-full h-full object-cover"
            >
              <source src={heroSettings.hero_video_url} type="video/mp4" />
            </video>
          ) : (
            <img 
              src={heroSettings.hero_image} 
              alt="Hero background" 
              className="w-full h-full object-cover"
            />
          )}
          {heroSettings.hero_overlay_enabled !== false && (
            <div 
              className={`absolute inset-0 ${heroSettings.hero_overlay_gradient ? 'bg-gradient-to-r from-black/90 to-black/50' : ''}`}
              style={{ 
                backgroundColor: heroSettings.hero_overlay_gradient ? undefined : heroSettings.hero_overlay_color || '#000000',
                opacity: (heroSettings.hero_overlay_opacity || 50) / 100 
              }}
            />
          )}
        </div>
        
        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 w-full">
          <div 
            className={`animate-fade-in-up flex flex-col ${
              heroSettings.hero_text_align === 'center' ? 'mx-auto text-center max-w-4xl items-center' : 
              heroSettings.hero_text_align === 'right' ? 'ml-auto text-right max-w-3xl items-end' : 
              'max-w-3xl items-start'
            }`}
          >
            {/* Fonction pour obtenir l'ordre d'un élément */}
            {(() => {
              const defaultOrder = ['badge', 'title1', 'title2', 'description', 'search', 'cta_buttons', 'premium_buttons', 'shortcuts', 'stats'];
              const savedOrder = heroSettings.hero_elements_order || defaultOrder;
              const getOrder = (id) => {
                const idx = savedOrder.indexOf(id);
                return idx >= 0 ? idx : 99;
              };
              
              return null;
            })()}
            
            {/* Badge - Customizable */}
            {heroSettings.hero_show_badge !== false && (
              <div 
                className={`inline-flex items-center gap-2 backdrop-blur-sm px-4 py-2 rounded-full mb-6 animate-fade-in-up stagger-1 ${
                  heroSettings.hero_text_align === 'center' ? 'mx-auto' : ''
                }`}
                style={{ 
                  backgroundColor: heroSettings.hero_badge_bg_color || 'rgba(249, 115, 22, 0.2)',
                  borderColor: heroSettings.hero_badge_border_color || 'rgba(249, 115, 22, 0.3)',
                  borderWidth: '1px',
                  borderStyle: 'solid',
                  order: (heroSettings.hero_elements_order || []).indexOf('badge') >= 0 ? (heroSettings.hero_elements_order || []).indexOf('badge') : 0
                }}
              >
                <span>{heroSettings.hero_badge_icon || '✨'}</span>
                <span className="text-sm font-medium" style={{ color: heroSettings.hero_badge_text_color || '#F97316' }}>
                  {autoTranslate(heroSettings.hero_badge_text) || t('hero.badge')}
                </span>
              </div>
            )}
            
            {/* Title Line 1 */}
            <h1 
              className={`font-heading ${TITLE_SIZE_CLASSES[heroSettings.hero_title_line1_size || heroSettings.hero_title_size] || 'text-4xl md:text-5xl lg:text-7xl'} font-black tracking-tight leading-none mb-2 animate-fade-in-up stagger-2`}
              style={{ 
                color: heroSettings.hero_title_line1_color || '#FFFFFF',
                order: (heroSettings.hero_elements_order || []).indexOf('title1') >= 0 ? (heroSettings.hero_elements_order || []).indexOf('title1') : 1 
              }}
            >
              <AnimatedText 
                text={autoTranslate(heroSettings.hero_title_line1) || t('hero.titleLine1')} 
                animation={heroSettings.hero_text_animation}
                className="block"
              />
            </h1>
            
            {/* Title Line 2 - with optional gradient */}
            <h2 
              className={`font-heading ${TITLE_SIZE_CLASSES[heroSettings.hero_title_line2_size || heroSettings.hero_title_size] || 'text-4xl md:text-5xl lg:text-7xl'} font-black tracking-tight leading-none mb-6 animate-fade-in-up stagger-2 ${heroSettings.hero_text_animation === 'glow' ? 'animate-text-glow' : ''}`}
              style={{
                ...(heroSettings.hero_title_line2_gradient ? {
                  backgroundImage: `linear-gradient(90deg, ${heroSettings.hero_title_line2_gradient_from || '#F97316'}, ${heroSettings.hero_title_line2_gradient_to || '#EA580C'})`,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                } : { 
                  color: heroSettings.hero_title_line2_color || '#F97316' 
                }),
                order: (heroSettings.hero_elements_order || []).indexOf('title2') >= 0 ? (heroSettings.hero_elements_order || []).indexOf('title2') : 2
              }}
            >
              <AnimatedText 
                text={autoTranslate(heroSettings.hero_title_line2) || t('hero.titleLine2')} 
                animation={heroSettings.hero_text_animation}
                delay={heroSettings.hero_text_animation === 'typewriter' ? (autoTranslate(heroSettings.hero_title_line1) || t('hero.titleLine1')).length * 50 + 200 : 200}
              />
            </h2>
            
            {/* Description */}
            <p 
              className={`${DESC_SIZE_CLASSES[heroSettings.hero_description_size] || 'text-lg md:text-xl'} mb-10 animate-fade-in-up stagger-3 ${
                heroSettings.hero_text_align === 'center' ? 'max-w-2xl mx-auto' : 'max-w-xl'
              }`}
              style={{ 
                color: heroSettings.hero_description_color || 'rgba(255, 255, 255, 0.8)',
                order: (heroSettings.hero_elements_order || []).indexOf('description') >= 0 ? (heroSettings.hero_elements_order || []).indexOf('description') : 3
              }}
            >
              {autoTranslate(heroSettings.hero_description) || t('hero.description')}
            </p>

            {/* Search Form - Glass effect */}
            {heroSettings.hero_show_search !== false && (
              <form 
                onSubmit={handleSearch} 
                className={`flex flex-col sm:flex-row gap-3 animate-fade-in-up stagger-4 glass p-2 rounded-2xl w-full ${
                  heroSettings.hero_text_align === 'center' ? 'max-w-3xl mx-auto' : ''
                }`}
                data-testid="search-form"
                style={{ order: (heroSettings.hero_elements_order || []).indexOf('search') >= 0 ? (heroSettings.hero_elements_order || []).indexOf('search') : 4 }}
              >
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    placeholder={autoTranslate(heroSettings.hero_search_placeholder) || t('hero.searchPlaceholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-12 h-14 bg-transparent border-0 text-lg focus-ring rounded-xl"
                    data-testid="search-input"
                  />
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="w-full sm:w-52 h-14 bg-transparent border-0 text-base rounded-xl focus-ring" data-testid="category-select">
                    <SelectValue placeholder={t('nav.categories')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pieces">{t('categories.pieces')}</SelectItem>
                    <SelectItem value="voitures">{t('categories.voitures')}</SelectItem>
                    <SelectItem value="motos">{t('categories.motos')}</SelectItem>
                    <SelectItem value="utilitaires">{t('categories.utilitaires')}</SelectItem>
                    <SelectItem value="accessoires">{t('categories.accessoires')}</SelectItem>
                    <SelectItem value="engins">{t('categories.engins', 'Engins & Agricole')}</SelectItem>
                    <SelectItem value="rares">{t('categories.rares', 'Rares & Collections')}</SelectItem>
                  </SelectContent>
                </Select>
                {heroSettings.hero_show_voice_search !== false && (
                  <VoiceSearch onSearch={(q) => navigate(`/annonces?search=${encodeURIComponent(q)}`)} />
                )}
                <Button 
                  type="submit" 
                  className="h-14 px-8 btn-primary rounded-xl text-base font-semibold" 
                  data-testid="search-btn"
                  style={{ backgroundColor: heroSettings.hero_search_button_bg }}
                >
                  <Search className="w-5 h-5 mr-2" />
                  {autoTranslate(heroSettings.hero_search_button_text) || t('common.search')}
                </Button>
              </form>
            )}

            {/* CTA Buttons - Fully Customizable */}
            <div 
              className={`flex flex-wrap items-center gap-4 mt-6 animate-fade-in-up stagger-4 w-full ${
                heroSettings.hero_text_align === 'center' ? 'justify-center' : 
                heroSettings.hero_text_align === 'right' ? 'justify-end' : ''
              }`}
              style={{ order: (heroSettings.hero_elements_order || []).indexOf('cta_buttons') >= 0 ? (heroSettings.hero_elements_order || []).indexOf('cta_buttons') : 5 }}
            >
              {/* Dropdown Catégories */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20">
                    <Menu className="w-4 h-4" />
                    {t('nav.categories')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  {categories.map((cat) => (
                    <DropdownMenuItem key={cat.slug} asChild>
                      <Link to={`/annonces/${cat.slug}`} className="flex items-center gap-2 cursor-pointer">
                        <cat.icon className="w-4 h-4" />
                        {t(`categories.${cat.slug}`)}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Plate Scanner */}
              {heroSettings.hero_show_plate_scanner !== false && (
                <PlateScanner onVehicleSelect={(v) => {
                  navigate(`/annonces?brand=${encodeURIComponent(v.brand)}&model=${encodeURIComponent(v.model)}&year=${v.year}`);
                }} />
              )}
              
              {/* CTA Button 1 */}
              {heroSettings.hero_cta1_enabled !== false && heroSettings.hero_cta1_text && (
                <Link to={heroSettings.hero_cta1_link || '/deposer'}>
                  <Button 
                    className={`gap-2 ${heroSettings.hero_cta1_style === 'outline' ? 'bg-transparent border-2' : heroSettings.hero_cta1_style === 'ghost' ? 'bg-transparent' : ''}`}
                    style={{ 
                      backgroundColor: heroSettings.hero_cta1_style === 'filled' ? (heroSettings.hero_cta1_bg_color || '#F97316') : 'transparent',
                      color: heroSettings.hero_cta1_text_color || '#FFFFFF',
                      borderColor: heroSettings.hero_cta1_style === 'outline' ? (heroSettings.hero_cta1_bg_color || '#F97316') : undefined
                    }}
                  >
                    {heroSettings.hero_cta1_icon && <span>{heroSettings.hero_cta1_icon}</span>}
                    {autoTranslate(heroSettings.hero_cta1_text)}
                  </Button>
                </Link>
              )}
              
              {/* CTA Button 2 */}
              {heroSettings.hero_cta2_enabled && heroSettings.hero_cta2_text && (
                <Link to={heroSettings.hero_cta2_link || '/encheres'}>
                  <Button 
                    variant="outline" 
                    className="gap-2"
                    style={{ 
                      backgroundColor: heroSettings.hero_cta2_style === 'filled' ? (heroSettings.hero_cta2_bg_color || 'transparent') : 'transparent',
                      color: heroSettings.hero_cta2_text_color || '#FFFFFF',
                      borderColor: heroSettings.hero_cta2_border_color || 'rgba(255, 255, 255, 0.3)'
                    }}
                  >
                    {heroSettings.hero_cta2_icon && <span>{heroSettings.hero_cta2_icon}</span>}
                    {autoTranslate(heroSettings.hero_cta2_text)}
                  </Button>
                </Link>
              )}

              {/* CTA Button 3 - Premium */}
              {heroSettings.hero_cta3_enabled && heroSettings.hero_cta3_text && (
                <Link to={heroSettings.hero_cta3_link || '#'}>
                  <Button 
                    className={`gap-2 ${heroSettings.hero_cta3_hover_effect === 'scale' ? 'hover:scale-105' : heroSettings.hero_cta3_hover_effect === 'glow' ? 'hover:shadow-lg hover:shadow-amber-500/50' : heroSettings.hero_cta3_hover_effect === 'shake' ? 'hover:animate-pulse' : ''} transition-all duration-300`}
                    style={{ 
                      backgroundColor: heroSettings.hero_cta3_style === 'filled' ? (heroSettings.hero_cta3_bg_color || '#EAB308') : 'transparent',
                      color: heroSettings.hero_cta3_text_color || '#FFFFFF',
                      borderColor: heroSettings.hero_cta3_border_color || 'rgba(234, 179, 8, 0.5)',
                      borderWidth: heroSettings.hero_cta3_style === 'outline' ? '2px' : undefined,
                      borderStyle: heroSettings.hero_cta3_style === 'outline' ? 'solid' : undefined,
                      borderRadius: heroSettings.hero_cta3_border_radius === 'none' ? '0' : heroSettings.hero_cta3_border_radius === 'small' ? '4px' : heroSettings.hero_cta3_border_radius === 'large' ? '12px' : heroSettings.hero_cta3_border_radius === 'full' ? '9999px' : '6px'
                    }}
                  >
                    {heroSettings.hero_cta3_icon && <span>{heroSettings.hero_cta3_icon}</span>}
                    {autoTranslate(heroSettings.hero_cta3_text)}
                  </Button>
                </Link>
              )}

              {/* CTA Button 4 - Premium */}
              {heroSettings.hero_cta4_enabled && heroSettings.hero_cta4_text && (
                <Link to={heroSettings.hero_cta4_link || '#'}>
                  <Button 
                    className={`gap-2 ${heroSettings.hero_cta4_hover_effect === 'scale' ? 'hover:scale-105' : heroSettings.hero_cta4_hover_effect === 'glow' ? 'hover:shadow-lg hover:shadow-purple-500/50' : heroSettings.hero_cta4_hover_effect === 'shake' ? 'hover:animate-pulse' : ''} transition-all duration-300`}
                    style={{ 
                      backgroundColor: heroSettings.hero_cta4_style === 'filled' ? (heroSettings.hero_cta4_bg_color || '#8B5CF6') : 'transparent',
                      color: heroSettings.hero_cta4_text_color || '#FFFFFF',
                      borderColor: heroSettings.hero_cta4_border_color || 'rgba(139, 92, 246, 0.5)',
                      borderWidth: heroSettings.hero_cta4_style === 'outline' ? '2px' : undefined,
                      borderStyle: heroSettings.hero_cta4_style === 'outline' ? 'solid' : undefined,
                      borderRadius: heroSettings.hero_cta4_border_radius === 'none' ? '0' : heroSettings.hero_cta4_border_radius === 'small' ? '4px' : heroSettings.hero_cta4_border_radius === 'large' ? '12px' : heroSettings.hero_cta4_border_radius === 'full' ? '9999px' : '6px'
                    }}
                  >
                    {heroSettings.hero_cta4_icon && <span>{heroSettings.hero_cta4_icon}</span>}
                    {autoTranslate(heroSettings.hero_cta4_text)}
                  </Button>
                </Link>
              )}

              {/* Diagnostic IA Button */}
              <Link to="/diagnostic">
                <Button 
                  variant="outline" 
                  className="gap-2 bg-gradient-to-r from-green-500/20 to-teal-500/20 backdrop-blur-sm border-green-400/50 text-white hover:from-green-500/30 hover:to-teal-500/30"
                >
                  <Stethoscope className="w-4 h-4" />
                  {t('home.ai_diagnostic')}
                </Button>
              </Link>
            </div>

            {/* Quick Links - Raccourcis stylés (configurable avec ordre) */}
            {heroSettings.hero_shortcuts_enabled !== false && (
              <div 
                className={`flex flex-wrap items-center gap-3 mt-5 animate-fade-in-up stagger-4 w-full ${
                  heroSettings.hero_text_align === 'center' ? 'justify-center' : 
                  heroSettings.hero_text_align === 'right' ? 'justify-end' : ''
                } ${heroSettings.hero_mobile_hide_shortcuts ? 'hidden md:flex' : ''}`}
                style={{ order: (heroSettings.hero_elements_order || []).indexOf('shortcuts') >= 0 ? (heroSettings.hero_elements_order || []).indexOf('shortcuts') : 6 }}
              >
                {(() => {
                  const defaultOrder = ['videos', 'stories', 'loyalty', 'kim'];
                  const order = heroSettings.hero_shortcuts_order || defaultOrder;
                  
                  const shortcutComponents = {
                    videos: heroSettings.hero_shortcut_videos !== false && (
                      <Link key="videos" to="/videos" className="group">
                        <div className={`flex items-center gap-2 bg-white/10 hover:bg-red-500/30 backdrop-blur-sm px-4 py-2 ${heroSettings.hero_shortcuts_style === 'square' ? 'rounded-none' : heroSettings.hero_shortcuts_style === 'rounded' ? 'rounded-lg' : 'rounded-full'} border border-white/20 hover:border-red-400/50 transition-all`}>
                          <Video className="w-4 h-4 text-red-400" />
                          {heroSettings.hero_shortcuts_style !== 'icon-only' && <span className="text-white/90 text-sm font-medium">{t('nav.videos', 'Vidéos')}</span>}
                        </div>
                      </Link>
                    ),
                    stories: heroSettings.hero_shortcut_stories !== false && (
                      <Link key="stories" to="/stories" className="group">
                        <div className={`flex items-center gap-2 bg-white/10 hover:bg-pink-500/30 backdrop-blur-sm px-4 py-2 ${heroSettings.hero_shortcuts_style === 'square' ? 'rounded-none' : heroSettings.hero_shortcuts_style === 'rounded' ? 'rounded-lg' : 'rounded-full'} border border-white/20 hover:border-pink-400/50 transition-all`}>
                          <Camera className="w-4 h-4 text-pink-400" />
                          {heroSettings.hero_shortcuts_style !== 'icon-only' && <span className="text-white/90 text-sm font-medium">{t('nav.stories', 'Stories')}</span>}
                        </div>
                      </Link>
                    ),
                    loyalty: heroSettings.hero_shortcut_loyalty !== false && (
                      <Link key="loyalty" to="/fidelite" className="group">
                        <div className={`flex items-center gap-2 bg-white/10 hover:bg-yellow-500/30 backdrop-blur-sm px-4 py-2 ${heroSettings.hero_shortcuts_style === 'square' ? 'rounded-none' : heroSettings.hero_shortcuts_style === 'rounded' ? 'rounded-lg' : 'rounded-full'} border border-white/20 hover:border-yellow-400/50 transition-all`}>
                          <Gift className="w-4 h-4 text-yellow-400" />
                          {heroSettings.hero_shortcuts_style !== 'icon-only' && <span className="text-white/90 text-sm font-medium">{t('nav.loyalty', 'Fidélité')}</span>}
                        </div>
                      </Link>
                    ),
                    kim: heroSettings.hero_shortcut_kim !== false && (
                      <Link key="kim" to="/kim-agent" className="group">
                        <div className={`flex items-center gap-2 bg-white/10 hover:bg-blue-500/30 backdrop-blur-sm px-4 py-2 ${heroSettings.hero_shortcuts_style === 'square' ? 'rounded-none' : heroSettings.hero_shortcuts_style === 'rounded' ? 'rounded-lg' : 'rounded-full'} border border-white/20 hover:border-blue-400/50 transition-all`}>
                          <Sparkles className="w-4 h-4 text-blue-400" />
                          {heroSettings.hero_shortcuts_style !== 'icon-only' && <span className="text-white/90 text-sm font-medium">KIM Agent</span>}
                        </div>
                      </Link>
                    ),
                  };
                  
                  return order.map(id => shortcutComponents[id]).filter(Boolean);
                })()}
              </div>
            )}

            {/* Quick stats - Customizable with Live Counter */}
            {heroSettings.hero_show_stats !== false && (
              <div 
                className={`flex flex-wrap items-center gap-6 mt-8 animate-fade-in-up stagger-5 w-full ${
                  heroSettings.hero_text_align === 'center' ? 'justify-center' : 
                  heroSettings.hero_text_align === 'right' ? 'justify-end' : ''
                } ${heroSettings.hero_mobile_hide_stats ? 'hidden md:flex' : ''}`}
                style={{ order: (heroSettings.hero_elements_order || []).indexOf('stats') >= 0 ? (heroSettings.hero_elements_order || []).indexOf('stats') : 7 }}
              >
                {/* Stat 1 - Annonces (Live si activé) */}
                <div style={{ color: heroSettings.hero_stats_color || 'rgba(255, 255, 255, 0.7)' }}>
                  {heroSettings.hero_stat1_icon && <span className="mr-1">{heroSettings.hero_stat1_icon}</span>}
                  <span className="text-2xl font-bold" style={{ color: heroSettings.hero_stats_number_color || '#FFFFFF' }}>
                    {heroSettings.hero_use_live_counter && liveStats 
                      ? liveStats.listings_count 
                      : (heroSettings.hero_stat1_number || Object.values(categoryStats).reduce((a, b) => a + b, 0) || '100+')}
                  </span>
                  <span className="ml-2 text-sm">{autoTranslate(heroSettings.hero_stat1_label) || t('hero.activeListings')}</span>
                  {heroSettings.hero_use_live_counter && <span className="ml-1 text-xs">🔴</span>}
                </div>
                
                {/* Stat 2 - Utilisateurs (Live si activé) */}
                <div style={{ color: heroSettings.hero_stats_color || 'rgba(255, 255, 255, 0.7)' }}>
                  {heroSettings.hero_stat2_icon && <span className="mr-1">{heroSettings.hero_stat2_icon}</span>}
                  <span className="text-2xl font-bold" style={{ color: heroSettings.hero_stats_number_color || '#FFFFFF' }}>
                    {heroSettings.hero_use_live_counter && liveStats 
                      ? liveStats.users_count 
                      : (heroSettings.hero_stat2_number || '5')}
                  </span>
                  <span className="ml-2 text-sm">
                    {heroSettings.hero_use_live_counter 
                      ? t('hero.members') 
                      : (autoTranslate(heroSettings.hero_stat2_label) || t('hero.categories'))}
                  </span>
                </div>
                
                {/* Stat 3 - Ventes (Live) ou personnalisé */}
                {(heroSettings.hero_use_live_counter && liveStats) ? (
                  <div style={{ color: heroSettings.hero_stats_color || 'rgba(255, 255, 255, 0.7)' }}>
                    <span className="mr-1">🏆</span>
                    <span className="text-2xl font-bold" style={{ color: heroSettings.hero_stats_number_color || '#FFFFFF' }}>
                      {liveStats.sales_count}
                    </span>
                    <span className="ml-2 text-sm">{t('hero.sales')}</span>
                  </div>
                ) : heroSettings.hero_stat3_enabled && heroSettings.hero_stat3_number && (
                  <div style={{ color: heroSettings.hero_stats_color || 'rgba(255, 255, 255, 0.7)' }}>
                    {heroSettings.hero_stat3_icon && <span className="mr-1">{heroSettings.hero_stat3_icon}</span>}
                    <span className="text-2xl font-bold" style={{ color: heroSettings.hero_stats_number_color || '#FFFFFF' }}>
                      {heroSettings.hero_stat3_number}
                    </span>
                    <span className="ml-2 text-sm">{autoTranslate(heroSettings.hero_stat3_label)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Seller of the Week */}
      <section className="py-8 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SellerOfTheWeek />
        </div>
      </section>

      {/* Video Showcase - Under Hero, before categories */}
      <VideoShowcase />

      {/* Categories Bento Grid - Improved */}
      {heroSettings.hero_show_categories !== false && (
      <section className="py-16 md:py-24 bg-gradient-to-b from-secondary/50 to-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('categories.title')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('categories.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
            {categories.map((cat, index) => {
              // Get customized image from settings if available
              const categoryImageMap = {
                pieces: heroSettings.category_pieces_image,
                voitures: heroSettings.category_voitures_image,
                motos: heroSettings.category_motos_image,
                utilitaires: heroSettings.category_utilitaires_image,
                engins: heroSettings.category_engins_image,
                accessoires: heroSettings.category_accessoires_image,
              };
              const categoryImage = categoryImageMap[cat.slug] || cat.image;
              
              return (
                <Link
                  key={cat.slug}
                  to={`/annonces/${cat.slug}`}
                  className={`group relative overflow-hidden rounded-2xl hover-lift animate-fade-in-up stagger-${index + 1} ${
                    index === 0 ? 'col-span-2 row-span-2' : ''
                  }`}
                  data-testid={`category-${cat.slug}`}
                >
                  <div className={`relative ${index === 0 ? 'h-80 md:h-[420px]' : 'h-44 md:h-52'}`}>
                    <img
                      src={categoryImage}
                      alt={cat.name}
                      loading="lazy"
                      className="absolute inset-0 w-full h-full object-cover img-zoom"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                    
                    {/* Content */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center shadow-lg`}>
                          <cat.icon className="w-5 h-5 text-white" />
                        </div>
                        <span className="text-white font-heading font-bold text-lg md:text-xl drop-shadow-lg">
                          {t(`categories.${cat.slug}`)}
                        </span>
                      </div>
                      <p className="text-white/80 text-sm font-medium">
                        {categoryStats[cat.slug] || 0} {t('hero.listings')}
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {/* Search by Brand Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('home.search_by_brand')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('home.search_by_brand_desc')}
            </p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-10 gap-4 md:gap-6">
            {[
              { name: 'Renault', logo: 'https://www.carlogos.org/car-logos/renault-logo.png' },
              { name: 'Peugeot', logo: 'https://www.carlogos.org/car-logos/peugeot-logo.png' },
              { name: 'Citroën', logo: 'https://www.carlogos.org/car-logos/citroen-logo.png' },
              { name: 'Volkswagen', logo: 'https://www.carlogos.org/car-logos/volkswagen-logo.png' },
              { name: 'BMW', logo: 'https://www.carlogos.org/car-logos/bmw-logo.png' },
              { name: 'Mercedes', logo: 'https://www.carlogos.org/car-logos/mercedes-benz-logo.png' },
              { name: 'Audi', logo: 'https://www.carlogos.org/car-logos/audi-logo.png' },
              { name: 'Ford', logo: 'https://www.carlogos.org/car-logos/ford-logo.png' },
              { name: 'Opel', logo: 'https://www.carlogos.org/car-logos/opel-logo.png' },
              { name: 'Toyota', logo: 'https://www.carlogos.org/car-logos/toyota-logo.png' },
              { name: 'Nissan', logo: 'https://www.carlogos.org/car-logos/nissan-logo.png' },
              { name: 'Honda', logo: 'https://www.carlogos.org/car-logos/honda-logo.png' },
              { name: 'Fiat', logo: 'https://www.carlogos.org/car-logos/fiat-logo.png' },
              { name: 'Seat', logo: 'https://www.carlogos.org/car-logos/seat-logo.png' },
              { name: 'Skoda', logo: 'https://www.carlogos.org/car-logos/skoda-logo.png' },
              { name: 'Hyundai', logo: 'https://www.carlogos.org/car-logos/hyundai-logo.png' },
              { name: 'Kia', logo: 'https://www.carlogos.org/car-logos/kia-logo.png' },
              { name: 'Dacia', logo: 'https://www.carlogos.org/car-logos/dacia-logo.png' },
              { name: 'Volvo', logo: 'https://www.carlogos.org/car-logos/volvo-logo.png' },
              { name: 'Mazda', logo: 'https://www.carlogos.org/car-logos/mazda-logo.png' },
            ].map((brand, index) => (
              <Link
                key={brand.name}
                to={`/annonces?brand=${encodeURIComponent(brand.name)}`}
                className="group flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-border hover:border-accent hover:shadow-lg transition-all duration-300 hover-lift"
                title={`Voir les annonces ${brand.name}`}
              >
                <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center">
                  <img
                    src={brand.logo}
                    alt={brand.name}
                    loading="lazy"
                    className="w-full h-full object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<div class="w-12 h-12 md:w-14 md:h-14 bg-accent/10 rounded-full flex items-center justify-center"><span class="text-accent font-bold text-lg">${brand.name.charAt(0)}</span></div>`;
                    }}
                  />
                </div>
                <span className="mt-2 text-xs md:text-sm font-medium text-muted-foreground group-hover:text-accent transition-colors">
                  {brand.name}
                </span>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              to="/marques" 
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium transition-colors"
            >
              {t('common.see_all')} {t('nav.brands')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Search by Part Category Section */}
      <section className="py-16 md:py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('home.search_by_part')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('home.search_by_part_desc')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {[
              { nameKey: 'home.parts.headlights', subcategory: 'optique', image: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=200&h=150&fit=crop' },
              { nameKey: 'home.parts.bumpers', subcategory: 'carrosserie', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&h=150&fit=crop' },
              { nameKey: 'home.parts.engines', subcategory: 'moteur', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=200&h=150&fit=crop' },
              { nameKey: 'home.parts.braking', subcategory: 'freinage', image: 'https://images.unsplash.com/photo-1558618047-f4e68a95a13b?w=200&h=150&fit=crop' },
              { nameKey: 'home.parts.transmission', subcategory: 'transmission', image: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=200&h=150&fit=crop' },
              { nameKey: 'home.parts.electronics', subcategory: 'electricite', image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=200&h=150&fit=crop' },
              { nameKey: 'home.parts.bodywork', subcategory: 'carrosserie', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=150&fit=crop' },
              { nameKey: 'home.parts.suspension', subcategory: 'suspension', image: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=200&h=150&fit=crop' },
              { nameKey: 'home.parts.exhaust', subcategory: 'echappement', image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=200&h=150&fit=crop' },
              { nameKey: 'home.parts.interior', subcategory: 'interieur', image: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200&h=150&fit=crop' },
            ].map((part) => {
              // Use custom image from DB if available
              const customImage = subcatImages[`pieces_${part.subcategory}`];
              const displayImage = customImage || part.image;
              
              return (
              <Link
                key={part.nameKey}
                to={`/annonces/pieces?subcategory=${part.subcategory}`}
                className="group relative overflow-hidden rounded-xl bg-white border border-border hover:border-accent hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={displayImage}
                    alt={t(part.nameKey)}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = part.image;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="font-heading font-bold text-white text-lg group-hover:text-accent transition-colors">
                    {t(part.nameKey)}
                  </h3>
                </div>
              </Link>
            );
            })}
          </div>

          <div className="text-center mt-8">
            <Link 
              to="/annonces/pieces" 
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium transition-colors"
            >
              {t('home.see_all_categories')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* OEM Reference Search Section */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-primary to-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-accent/20 backdrop-blur-sm text-white px-4 py-2 rounded-full mb-4">
              <span className="text-lg">🔍</span>
              <span className="text-sm font-medium">{t('home.pro_search')}</span>
            </div>
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4 text-white">
              {t('home.oem_search')}
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              {t('home.oem_search_desc')}
            </p>
          </div>

          <form 
            onSubmit={handleOemSearch}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 md:p-8 border border-white/20"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder={t('home.oem_placeholder')}
                  value={oemSearch}
                  onChange={(e) => setOemSearch(e.target.value)}
                  className="w-full h-14 px-5 bg-white rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent font-mono text-lg"
                />
              </div>
              <Button 
                type="submit"
                disabled={!oemSearch.trim()}
                className="h-14 px-8 btn-primary rounded-xl text-base font-semibold whitespace-nowrap"
              >
                <Search className="w-5 h-5 mr-2" />
                {t('common.search')}
              </Button>
            </div>
            
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <span className="text-white/60 text-sm">{t('home.oem_examples')} :</span>
              {['7701474426', '1K0615301M', '30735878', '04E115561H'].map((ref) => (
                <button
                  key={ref}
                  type="button"
                  onClick={() => setOemSearch(ref)}
                  className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-white/80 text-sm font-mono transition-colors"
                >
                  {ref}
                </button>
              ))}
            </div>
          </form>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl mb-2">🏭</div>
              <p className="text-white/80 text-sm">{t('home.oem_manufacturer')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl mb-2">🔧</div>
              <p className="text-white/80 text-sm">{t('home.oem_supplier')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl mb-2">✅</div>
              <p className="text-white/80 text-sm">{t('home.oem_compatibility')}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <div className="text-2xl mb-2">⚡</div>
              <p className="text-white/80 text-sm">{t('home.oem_instant')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Search by Region Section */}
      <section className="py-16 md:py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10 animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('home.search_by_region')}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('home.search_by_region_desc')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {[
              { name: 'Île-de-France', code: 'ile-de-france' },
              { name: 'Auvergne-Rhône-Alpes', code: 'auvergne-rhone-alpes' },
              { name: 'Nouvelle-Aquitaine', code: 'nouvelle-aquitaine' },
              { name: 'Occitanie', code: 'occitanie' },
              { name: 'Hauts-de-France', code: 'hauts-de-france' },
              { name: 'Provence-Alpes-Côte d\'Azur', code: 'paca' },
              { name: 'Grand Est', code: 'grand-est' },
              { name: 'Pays de la Loire', code: 'pays-de-la-loire' },
              { name: 'Bretagne', code: 'bretagne' },
              { name: 'Normandie', code: 'normandie' },
              { name: 'Bourgogne-Franche-Comté', code: 'bourgogne-franche-comte' },
              { name: 'Centre-Val de Loire', code: 'centre-val-de-loire' },
            ].map((region) => (
              <Link
                key={region.code}
                to={`/annonces?region=${region.code}`}
                className="group flex items-center justify-center p-4 bg-white rounded-xl border border-border hover:border-accent hover:shadow-lg hover:bg-accent/5 transition-all duration-300 text-center"
              >
                <div>
                  <MapPin className="w-5 h-5 mx-auto mb-2 text-muted-foreground group-hover:text-accent transition-colors" />
                  <span className="text-sm font-medium text-foreground group-hover:text-accent transition-colors line-clamp-2">
                    {region.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link 
              to="/annonces" 
              className="inline-flex items-center gap-2 text-accent hover:text-accent/80 font-medium transition-colors"
            >
              {t('home.see_all_regions')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stories Section */}
      <section className="py-8 md:py-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-4">
            <h3 className="font-heading text-lg font-semibold text-muted-foreground">
              {t('home.stories_title', 'Stories vendeurs')}
            </h3>
          </div>
          <Stories />
        </div>
      </section>

      {/* Recent Listings - Improved cards */}
      {recentListings.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-12">
              <div className="animate-slide-in-left">
                <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2">
                  {t('home.recent_listings')}
                </h2>
                <p className="text-muted-foreground">
                  {t('categories.subtitle')}
                </p>
              </div>
              <Link to="/annonces" className="animate-slide-in-right">
                <Button variant="outline" className="hidden sm:flex items-center gap-2 hover:bg-accent hover:text-white hover:border-accent transition-all" data-testid="view-all-btn">
                  {t('common.see_all')}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentListings.map((listing, index) => (
                <Link
                  key={listing.id}
                  to={`/annonce/${listing.id}`}
                  className={`group animate-fade-in-up stagger-${(index % 5) + 1}`}
                  data-testid={`listing-card-${listing.id}`}
                >
                  <Card className="overflow-hidden card-hover border-0 shadow-md">
                    <div className="relative h-52 overflow-hidden">
                      <img
                        src={listing.images?.[0] || 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400&h=300&fit=crop'}
                        alt={listing.title}
                        loading="lazy"
                        className="w-full h-full object-cover img-zoom"
                      />
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {listing.seller_is_pro && (
                          <span className="badge-pro">PRO</span>
                        )}
                      </div>
                      <span className="absolute top-3 right-3 badge-condition">
                        {t(`listing.${listing.condition}`) || listing.condition}
                      </span>
                      
                      {/* Quick view button */}
                      <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                        <span className="bg-white/95 backdrop-blur-sm text-primary px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
                          {t('listing.view_listing')} →
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-heading font-bold text-lg mb-2 line-clamp-1 group-hover:text-accent transition-colors">
                        {listing.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {listing.description}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-border/50">
                        <span className="font-heading font-bold text-2xl price-tag">
                          {listing.price?.toLocaleString('fr-FR')} €
                        </span>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {listing.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {listing.location}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {listing.views || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link to="/annonces">
                <Button variant="outline" className="w-full">
                  {t('common.see_all')} {t('nav.listings')}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* DIAGNOSTIC IA BANNER - Section mise en avant */}
      <section className="py-12 md:py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left - Content */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 bg-accent/20 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                {t('home.new_ai')}
              </div>
              
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
                {t('home.diagnostic_title')}<br />
                <span className="text-accent">{t('home.diagnostic_by_tobi')}</span>
              </h2>
              
              <p className="text-slate-300 text-lg md:text-xl mb-6 max-w-xl">
                {t('home.diagnostic_desc')}
              </p>

              {/* Features list */}
              <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                    <Stethoscope className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm">{t('home.symptom_analysis')}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                    <Car className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm">{t('home.all_brands')}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Gift className="w-4 h-4 text-green-400" />
                  </div>
                  <span className="text-sm">{t('home.free_with_ad')}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                  </div>
                  <span className="text-sm">{t('home.instant_response')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/diagnostic">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-white h-12 px-8 text-lg gap-2">
                    <Stethoscope className="w-5 h-5" />
                    {t('home.start_diagnostic')}
                  </Button>
                </Link>
                <Link to="/deposer">
                  <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-12 px-8">
                    {t('home.post_ad_free')}
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right - Visual / Demo card */}
            <div className="w-full lg:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-sm mx-auto">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-orange-500 rounded-xl flex items-center justify-center">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white">{t('home.tobi_diagnostic')}</h4>
                    <p className="text-sm text-slate-400">{t('home.ai_assistant')}</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-white/5 rounded-lg p-3">
                    <p className="text-sm text-slate-300">🚗 &quot;Ma voiture fait un bruit au freinage...&quot;</p>
                  </div>
                  <div className="bg-accent/20 rounded-lg p-3 border-l-2 border-accent">
                    <p className="text-sm text-white font-medium mb-1">⚠️ {t('home.tobi_analysis')} :</p>
                    <p className="text-xs text-slate-300">
                      Causes probables : Plaquettes usées, disques voilés. 
                      <strong className="text-accent"> {t('home.urgency')} : {t('home.medium')}</strong>
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-white/10 text-center">
                  <p className="text-xs text-slate-400">
                    💡 <strong className="text-white">0.99€</strong> {t('home.per_diagnostic')} <strong className="text-green-400">{t('home.free')}</strong> {t('home.with_ad')}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Improved */}
      <section className="py-16 md:py-24 bg-gradient-to-b from-background to-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t('home.why_choose_us')}
            </h2>
            <p className="text-muted-foreground text-lg">
              {t('footer.description')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: Shield, titleKey: 'home.secure_payment', descKey: 'home.secure_payment_desc' },
              { icon: Users, titleKey: 'home.trusted_sellers', descKey: 'home.trusted_sellers_desc' },
              { icon: Clock, titleKey: 'home.fast_shipping', descKey: 'home.fast_shipping_desc' },
            ].map((feature, index) => (
              <Card key={feature.titleKey} className={`p-8 text-center card-hover border-0 shadow-md animate-fade-in-up stagger-${index + 1}`}>
                <div className="w-16 h-16 bg-gradient-to-br from-accent/20 to-orange-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 text-accent" />
                </div>
                <h3 className="font-heading font-bold text-xl mb-3">{t(feature.titleKey)}</h3>
                <p className="text-muted-foreground leading-relaxed">{t(feature.descKey)}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* REFERRAL BANNER - Grande bannière de parrainage */}
      <section className="py-16 md:py-20 bg-gradient-to-r from-accent via-orange-500 to-amber-500 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
            {/* Left side - Icon and text */}
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl mb-6">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4">
                {t('home.referral_title')}<br />
                <span className="text-yellow-200">{t('home.referral_desc')}</span>
              </h2>
              <p className="text-white/90 text-lg md:text-xl max-w-xl mb-6">
                {t('home.referral_invite_desc')}
              </p>

              {/* Benefits badges */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-8">
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-yellow-200" />
                  <span className="text-white font-medium">{t('home.pts_per_referral')}</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                  <Gift className="w-5 h-5 text-yellow-200" />
                  <span className="text-white font-medium">{t('home.pts_for_them')}</span>
                </div>
                <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-yellow-200" />
                  <span className="text-white font-medium">{t('home.unlimited')}</span>
                </div>
              </div>
            </div>

            {/* Right side - Referral code card */}
            <div className="w-full lg:w-auto">
              {user && referralData ? (
                <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 min-w-[320px] md:min-w-[380px]">
                  <div className="text-center mb-6">
                    <p className="text-muted-foreground text-sm mb-2">{t('home.your_referral_code')}</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono text-3xl md:text-4xl font-black text-primary tracking-wider">
                        {referralData.referral_code}
                      </span>
                      <button 
                        onClick={copyReferralCode}
                        className="p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
                      >
                        {copiedCode ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-secondary/50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-primary">{referralData.referral_count || 0}</p>
                      <p className="text-sm text-muted-foreground">{t('home.referrals')}</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{referralData.total_points_earned || 0}</p>
                      <p className="text-sm text-muted-foreground">{t('home.points_earned')}</p>
                    </div>
                  </div>

                  <Button 
                    onClick={shareReferral}
                    className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold text-lg gap-2"
                  >
                    <UserPlus className="w-5 h-5" />
                    {t('home.invite_friends')}
                  </Button>

                  <Link to="/fidelite" className="block mt-4 text-center text-accent hover:underline text-sm font-medium">
                    {t('home.see_all_referrals')} →
                  </Link>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 min-w-[320px] md:min-w-[380px] text-center">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserPlus className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="font-heading text-xl font-bold mb-2">{t('home.join_program')}</h3>
                  <p className="text-muted-foreground mb-6">
                    {t('home.create_account_referral')}
                  </p>
                  <Link to="/auth?mode=register">
                    <Button className="w-full h-12 bg-accent hover:bg-accent/90 text-white font-semibold text-lg">
                      {t('home.create_account')}
                    </Button>
                  </Link>
                  <p className="mt-4 text-sm text-muted-foreground">
                    {t('home.have_code')} <Link to="/auth?mode=register" className="text-accent hover:underline">{t('home.register_here')}</Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Improved */}
      <section className="py-20 md:py-28 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-slate-800" />
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1920')] bg-cover bg-center" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-fade-in-up">
            <h2 className="font-heading text-3xl md:text-5xl font-bold text-white mb-6">
              {t('home.ready_to_sell')}
            </h2>
            <p className="text-white/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
              {t('home.cta_desc')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/deposer">
                <Button size="lg" className="btn-primary text-lg h-14 px-10" data-testid="cta-create-listing">
                  <Sparkles className="w-5 h-5 mr-2" />
                  {t('hero.postAd')}
                </Button>
              </Link>
              <Link to="/tarifs">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 h-14 px-10 text-lg" data-testid="cta-pricing">
                  {t('home.see_pricing')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
