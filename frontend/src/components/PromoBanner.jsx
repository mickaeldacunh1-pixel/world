import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Sparkles, Check, ChevronDown, X, Crown, Percent, Truck, Shield, Loader2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Default promo config
const DEFAULT_PROMO = {
  enabled: true,
  title: "World Auto PRO",
  subtitle: "Vendez plus, payez moins",
  highlight: "Frais réduits de 10%, mise en avant prioritaire",
  benefits: [
    { icon: "percent", text: "10% de réduction sur tous les frais" },
    { icon: "crown", text: "Visibilité prioritaire" },
    { icon: "shield", text: "Jusqu'à 50 photos par annonce" },
  ],
  cta_text: "Essai gratuit 14 jours",
  cta_link: "/tarifs",
  badge_text: "-10%",
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

export default function PromoBanner({ 
  bgColor = '#1E3A5F', 
  textColor = '#FFFFFF',
  title,
  subtitle,
  badge,
  accentColor
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [promoConfig, setPromoConfig] = useState({
    ...DEFAULT_PROMO,
    bg_color: bgColor,
    title: title || DEFAULT_PROMO.title,
    subtitle: subtitle || DEFAULT_PROMO.subtitle,
    badge_text: badge || DEFAULT_PROMO.badge_text,
    accent_color: accentColor || DEFAULT_PROMO.accent_color,
  });
  const [dismissed, setDismissed] = useState(false);
  const [trialStatus, setTrialStatus] = useState(null);
  const [activating, setActivating] = useState(false);

  useEffect(() => {
    const fetchPromoConfig = async () => {
      try {
        // Fetch from hero settings which includes promo banner settings
        const response = await axios.get(`${API}/settings/hero`);
        if (response.data) {
          const data = response.data;
          // Récupérer les 3 avantages depuis les settings ou utiliser les défauts
          const benefits = [
            { icon: "percent", text: data.promo_benefit_1 || DEFAULT_PROMO.benefits[0].text },
            { icon: "crown", text: data.promo_benefit_2 || DEFAULT_PROMO.benefits[1].text },
            { icon: "shield", text: data.promo_benefit_3 || DEFAULT_PROMO.benefits[2].text },
          ];
          
          setPromoConfig({
            enabled: data.promo_banner_enabled !== false,
            title: data.promo_banner_title || DEFAULT_PROMO.title,
            subtitle: data.promo_banner_subtitle || DEFAULT_PROMO.subtitle,
            highlight: data.promo_banner_highlight || DEFAULT_PROMO.highlight,
            benefits: benefits,
            cta_text: data.promo_banner_cta || DEFAULT_PROMO.cta_text,
            cta_link: data.promo_banner_link || DEFAULT_PROMO.cta_link,
            badge_text: data.promo_banner_badge || DEFAULT_PROMO.badge_text,
            bg_color: data.promo_bg_color || bgColor,
            accent_color: data.promo_accent_color || DEFAULT_PROMO.accent_color,
            coupon_code: data.coupon_code || "",
            coupon_discount: data.coupon_discount || "",
          });
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
  }, [bgColor]);

  // Fetch trial status when user is logged in
  useEffect(() => {
    const fetchTrialStatus = async () => {
      if (user && token) {
        try {
          const response = await axios.get(`${API}/pro/trial/status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setTrialStatus(response.data);
        } catch (error) {
          console.log('Could not fetch trial status');
        }
      }
    };
    fetchTrialStatus();
  }, [user, token]);

  const handleActivateTrial = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      toast.info(t('pro.login_required'));
      navigate('/auth');
      return;
    }

    setActivating(true);
    try {
      const response = await axios.post(`${API}/pro/trial/activate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('pro.trial.success'));
      setTrialStatus({
        ...trialStatus,
        trial_active: true,
        trial_available: false,
        is_pro: true,
        trial_days_left: 14
      });
      setIsOpen(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || t('pro.trial.already_used'));
    } finally {
      setActivating(false);
    }
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    // Juste fermer le dropdown, ne pas masquer le bouton
    setIsOpen(false);
  };

  const handlePermanentDismiss = (e) => {
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
        <span className="text-xs sm:text-sm">{promoConfig.title}</span>
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

              {/* Trial Status Info */}
              {trialStatus?.trial_active && (
                <div 
                  className="mb-4 p-3 rounded-lg text-center"
                  style={{ backgroundColor: `${promoConfig.accent_color}20` }}
                >
                  <p className="text-white font-semibold">✨ {t('pro.trial.active')}</p>
                  <p className="text-white/80 text-sm">{t('pro.trial.days_left', { days: trialStatus.trial_days_left })}</p>
                </div>
              )}

              {trialStatus?.is_pro && !trialStatus?.trial_active && (
                <div 
                  className="mb-4 p-3 rounded-lg text-center"
                  style={{ backgroundColor: `${promoConfig.accent_color}20` }}
                >
                  <p className="text-white font-semibold">👑 {t('pro.status.is_pro')}</p>
                  <p className="text-white/80 text-sm">{t('pro.status.enjoy')}</p>
                </div>
              )}

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

              {/* CTA Button - Activate Trial or View Plans */}
              {trialStatus?.trial_available ? (
                <Button 
                  className="w-full h-11 text-base font-semibold text-white"
                  style={{ backgroundColor: promoConfig.accent_color }}
                  onClick={handleActivateTrial}
                  disabled={activating}
                >
                  {activating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t('pro.trial.activating')}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      {promoConfig.cta_text || t('pro.trial.cta')}
                    </>
                  )}
                </Button>
              ) : trialStatus?.is_pro ? (
                <Link to="/tableau-de-bord" onClick={() => setIsOpen(false)}>
                  <Button 
                    className="w-full h-11 text-base font-semibold text-white"
                    style={{ backgroundColor: promoConfig.accent_color }}
                  >
                    <Crown className="w-4 h-4 mr-2" />
                    {t('pro.status.my_space')}
                  </Button>
                </Link>
              ) : (
                <Link to={promoConfig.cta_link} onClick={() => setIsOpen(false)}>
                  <Button 
                    className="w-full h-11 text-base font-semibold text-white"
                    style={{ backgroundColor: promoConfig.accent_color }}
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    {trialStatus?.trial_used ? t('pro.status.view_plans') : (promoConfig.cta_text || t('pro.trial.cta'))}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
