import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Button } from './ui/button';
import { Sparkles, Check, ChevronDown, X, Crown, Percent, Truck, Shield } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Default promo config
const DEFAULT_PROMO = {
  enabled: true,
  title: "Compte Premium",
  subtitle: "Économisez encore plus",
  highlight: "dès aujourd'hui avec WORLD AUTO PLUS",
  benefits: [
    { icon: "percent", text: "10% de réduction sur les frais de service" },
    { icon: "truck", text: "Livraison prioritaire" },
    { icon: "shield", text: "Garantie étendue offerte" },
  ],
  cta_text: "Essai gratuit 14 jours",
  cta_link: "/premium",
  badge_text: "NOUVEAU",
  bg_color: "#1E3A5F",
  accent_color: "#F97316",
  coupon_code: "",
  coupon_discount: "",
};

const ICON_MAP = {
  percent: Percent,
  truck: Truck,
  shield: Shield,
  check: Check,
  crown: Crown,
  sparkles: Sparkles,
};

export default function PromoBanner() {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [promoConfig, setPromoConfig] = useState(DEFAULT_PROMO);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const fetchPromoConfig = async () => {
      try {
        const response = await axios.get(`${API}/settings/promo-banner`);
        if (response.data) {
          setPromoConfig({ ...DEFAULT_PROMO, ...response.data });
        }
      } catch (error) {
        // Use defaults if no config exists
        console.log('Using default promo config');
      }
    };
    fetchPromoConfig();

    // Check if user dismissed the banner
    const wasDismissed = sessionStorage.getItem('promo_banner_dismissed');
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  const handleDismiss = (e) => {
    e.stopPropagation();
    setDismissed(true);
    setIsOpen(false);
    sessionStorage.setItem('promo_banner_dismissed', 'true');
  };

  if (!promoConfig.enabled || dismissed) {
    return null;
  }

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90"
        style={{ backgroundColor: promoConfig.bg_color }}
      >
        <Crown className="w-4 h-4" style={{ color: promoConfig.accent_color }} />
        <span className="hidden lg:inline">{promoConfig.title}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        {promoConfig.badge_text && (
          <span 
            className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full text-white"
            style={{ backgroundColor: promoConfig.accent_color }}
          >
            {promoConfig.badge_text}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Panel */}
          <div 
            className="absolute top-full left-0 mt-2 w-80 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{ backgroundColor: promoConfig.bg_color }}
          >
            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-5">
              {/* Header */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-5 h-5" style={{ color: promoConfig.accent_color }} />
                  <span className="text-white/80 text-sm">{promoConfig.subtitle}</span>
                </div>
                <h3 className="text-white text-xl font-bold leading-tight">
                  {promoConfig.highlight}
                </h3>
              </div>

              {/* Benefits */}
              <ul className="space-y-3 mb-5">
                {promoConfig.benefits.map((benefit, idx) => {
                  const IconComponent = ICON_MAP[benefit.icon] || Check;
                  return (
                    <li key={idx} className="flex items-start gap-3 text-white/90">
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                        style={{ backgroundColor: `${promoConfig.accent_color}30` }}
                      >
                        <IconComponent className="w-3.5 h-3.5" style={{ color: promoConfig.accent_color }} />
                      </div>
                      <span className="text-sm">{benefit.text}</span>
                    </li>
                  );
                })}
              </ul>

              {/* Coupon Code */}
              {promoConfig.coupon_code && (
                <div 
                  className="mb-4 p-3 rounded-lg border border-dashed text-center"
                  style={{ borderColor: promoConfig.accent_color, backgroundColor: `${promoConfig.accent_color}15` }}
                >
                  <p className="text-white/70 text-xs mb-1">Code promo</p>
                  <p className="font-mono font-bold text-lg text-white">{promoConfig.coupon_code}</p>
                  {promoConfig.coupon_discount && (
                    <p className="text-sm mt-1" style={{ color: promoConfig.accent_color }}>
                      {promoConfig.coupon_discount}
                    </p>
                  )}
                </div>
              )}

              {/* CTA Button */}
              <Link to={promoConfig.cta_link} onClick={() => setIsOpen(false)}>
                <Button 
                  className="w-full h-11 text-base font-semibold text-white"
                  style={{ backgroundColor: promoConfig.accent_color }}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {promoConfig.cta_text}
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
