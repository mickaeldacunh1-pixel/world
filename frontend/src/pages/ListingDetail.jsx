import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { MapPin, Eye, Calendar, User, MessageSquare, Phone, ChevronLeft, ChevronRight, Share2, Heart, ShoppingCart, CreditCard, Shield, ShieldCheck, Loader2, Flag, AlertTriangle, Video, Award } from 'lucide-react';
import SEO, { createProductSchema, createBreadcrumbSchema } from '../components/SEO';
import ShareButtons from '../components/ShareButtons';
import { VerificationBadge, WarrantyBadge, PartOriginBadge } from '../components/TrustBadge';
import QuestionsAnswers from '../components/QuestionsAnswers';
import ShippingEstimator from '../components/ShippingEstimator';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Labels now handled via translation

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, token } = useAuth();
  
  // Dynamic labels from translations
  const conditionLabels = {
    neuf: t('createListing.condition_neuf'),
    occasion: t('createListing.condition_occasion'),
    reconditionne: t('createListing.condition_reconditionne'),
  };

  const categoryLabels = {
    pieces: t('createListing.category_pieces'),
    voitures: t('createListing.category_voitures'),
    motos: t('createListing.category_motos'),
    utilitaires: t('createListing.category_utilitaires'),
    accessoires: t('createListing.category_accessoires'),
  };
  
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [message, setMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [buyLoading, setBuyLoading] = useState(false);
  const [sellerStripeConnected, setSellerStripeConnected] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [videoCallLoading, setVideoCallLoading] = useState(false);

  const REPORT_REASONS = [
    { value: 'spam', label: t('listingDetail.report_reason_spam') },
    { value: 'scam', label: t('listingDetail.report_reason_scam') },
    { value: 'inappropriate', label: t('listingDetail.report_reason_inappropriate') },
    { value: 'counterfeit', label: t('listingDetail.report_reason_counterfeit') },
    { value: 'wrong_category', label: t('listingDetail.report_reason_wrong_category') },
    { value: 'duplicate', label: t('listingDetail.report_reason_duplicate') },
    { value: 'other', label: t('listingDetail.report_reason_other') }
  ];

  const handleVideoCall = async () => {
    if (!user) {
      toast.error(t('listingDetail.login_to_video'));
      navigate('/auth');
      return;
    }

    setVideoCallLoading(true);
    try {
      const response = await axios.post(`${API}/video-call/request?listing_id=${listing.id}`);
      const { whatsapp_link, seller_name } = response.data;
      
      toast.success(`${t('listingDetail.opening_whatsapp')} ${seller_name}`);
      window.open(whatsapp_link, '_blank');
    } catch (error) {
      if (error.response?.data?.detail?.includes('pas de numéro')) {
        toast.error(t('listingDetail.seller_no_phone'));
      } else {
        toast.error(t('listingDetail.video_call_error'));
      }
    } finally {
      setVideoCallLoading(false);
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id]);

  useEffect(() => {
    if (user && listing) {
      checkFavorite();
    }
  }, [user, listing]);

  const fetchListing = async () => {
    try {
      const response = await axios.get(`${API}/listings/${id}`);
      setListing(response.data);
      // Check if seller has Stripe connected
      if (response.data.seller_stripe_connected) {
        setSellerStripeConnected(true);
      }
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error(t('listingDetail.listing_not_found'));
      navigate('/annonces');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error(t('listingDetail.login_to_buy'));
      navigate('/auth');
      return;
    }

    setBuyLoading(true);
    try {
      const response = await axios.post(`${API}/stripe/connect/checkout`, {
        listing_id: id,
        quantity: 1
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      const message = error.response?.data?.detail || t('listingDetail.payment_error');
      toast.error(message);
    } finally {
      setBuyLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const response = await axios.get(`${API}/favorites/check/${id}`);
      setIsFavorite(response.data.is_favorite);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast.error(t('listingDetail.login_to_favorite'));
      navigate('/auth');
      return;
    }

    setFavoriteLoading(true);
    try {
      if (isFavorite) {
        await axios.delete(`${API}/favorites/${id}`);
        setIsFavorite(false);
        toast.success(t('listingDetail.removed_from_favorites'));
      } else {
        await axios.post(`${API}/favorites/${id}`);
        setIsFavorite(true);
        toast.success(t('listingDetail.added_to_favorites'));
      }
    } catch (error) {
      toast.error('Error');
    } finally {
      setFavoriteLoading(false);
    }
  };

  const handleReport = async () => {
    if (!user) {
      toast.error(t('listingDetail.login_to_report'));
      navigate('/auth');
      return;
    }

    if (!reportReason) {
      toast.error(t('listingDetail.select_reason'));
      return;
    }

    setReportLoading(true);
    try {
      await axios.post(`${API}/reports`, {
        target_type: 'listing',
        target_id: listing.id,
        reason: reportReason,
        description: reportDescription || null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(t('listingDetail.report_success'));
      setReportDialogOpen(false);
      setReportReason('');
      setReportDescription('');
    } catch (error) {
      if (error.response?.data?.detail?.includes('déjà signalé')) {
        toast.error(t('listingDetail.report_already'));
      } else {
        toast.error(t('listingDetail.report_error'));
      }
    } finally {
      setReportLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user) {
      toast.error(t('listingDetail.login_to_message'));
      navigate('/auth');
      return;
    }

    if (!message.trim()) {
      toast.error(t('listingDetail.write_message'));
      return;
    }

    setSendingMessage(true);
    try {
      await axios.post(`${API}/messages`, {
        listing_id: listing.id,
        receiver_id: listing.seller_id,
        content: message,
      });
      toast.success(t('listingDetail.message_sent'));
      setMessage('');
      setMessageDialogOpen(false);
    } catch (error) {
      toast.error(t('listingDetail.message_error'));
    } finally {
      setSendingMessage(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing.title,
        text: listing.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(t('listingDetail.link_copied'));
    }
  };

  const handleAddToCart = () => {
    const savedCart = localStorage.getItem('worldauto_cart');
    let cart = savedCart ? JSON.parse(savedCart) : [];
    
    // Check if item already in cart
    if (cart.some(item => item.id === listing.id)) {
      toast.info(t('listingDetail.already_in_cart'));
      return;
    }
    
    // Add to cart
    cart.push({
      id: listing.id,
      title: listing.title,
      price: listing.price,
      images: listing.images,
      category: listing.category,
      condition: listing.condition,
    });
    
    localStorage.setItem('worldauto_cart', JSON.stringify(cart));
    
    // Déclencher l'événement pour mettre à jour la navbar
    window.dispatchEvent(new Event('cartUpdated'));
    
    toast.success(t('listingDetail.added_to_cart'));
  };

  const images = listing?.images?.length > 0 
    ? listing.images 
    : ['https://images.unsplash.com/photo-1767339736233-f4b02c41ee4a?w=800&h=600&fit=crop'];

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" data-testid="listing-detail-loading">
        <div className="grid lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-2xl" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  // SEO: Build breadcrumb items
  const breadcrumbItems = [
    { name: t('listingDetail.breadcrumb_home'), url: '/' },
    { name: t('listingDetail.breadcrumb_listings'), url: '/annonces' },
    { name: categoryLabels[listing.category], url: `/annonces/${listing.category}` },
    { name: listing.title, url: `/annonce/${listing.id}` }
  ];

  return (
    <div className="min-h-screen bg-background" data-testid="listing-detail-page">
      <SEO
        title={listing.title}
        description={`${listing.title} - ${listing.price?.toLocaleString('fr-FR')} € - ${conditionLabels[listing.condition] || listing.condition}. ${listing.description?.substring(0, 150)}...`}
        keywords={`${listing.title}, ${listing.category}, ${listing.brand || ''}, pièce auto, occasion`}
        url={`/annonce/${listing.id}`}
        image={listing.images?.[0]}
        type="product"
        structuredData={[createProductSchema(listing), createBreadcrumbSchema(breadcrumbItems)]}
      />
      {/* Breadcrumb */}
      <div className="bg-secondary/30 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground">{t('listingDetail.breadcrumb_home')}</Link>
            <span>/</span>
            <Link to="/annonces" className="hover:text-foreground">{t('listingDetail.breadcrumb_listings')}</Link>
            <span>/</span>
            <Link to={`/annonces/${listing.category}`} className="hover:text-foreground">
              {categoryLabels[listing.category]}
            </Link>
            <span>/</span>
            <span className="text-foreground truncate max-w-[200px]">{listing.title}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="relative rounded-2xl overflow-hidden bg-secondary group">
              <img
                src={images[currentImage]}
                alt={listing.title}
                className="w-full h-80 md:h-96 lg:h-[500px] object-contain bg-secondary cursor-zoom-in"
                data-testid="listing-main-image"
                onClick={() => window.open(images[currentImage], '_blank')}
                title="Cliquez pour voir en taille réelle"
              />
              
              {/* Zoom hint */}
              <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                {t('listingDetail.zoom_hint')}
              </div>
              
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentImage((prev) => (prev === 0 ? images.length - 1 : prev - 1)); }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    data-testid="prev-image-btn"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setCurrentImage((prev) => (prev === images.length - 1 ? 0 : prev + 1)); }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors"
                    data-testid="next-image-btn"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {listing.seller_is_pro && (
                <span className="absolute top-4 left-4 badge-pro text-sm">PRO</span>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      currentImage === index ? 'border-accent' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Video */}
            {listing.video_url && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  {t('listingDetail.video_presentation')}
                </p>
                <div className="rounded-xl overflow-hidden bg-black">
                  <video
                    src={listing.video_url}
                    controls
                    className="w-full max-h-80"
                    poster={images[0]}
                  >
                    {t('listingDetail.video_not_supported')}
                  </video>
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary">{categoryLabels[listing.category]}</Badge>
                  <Badge variant="outline">{conditionLabels[listing.condition]}</Badge>
                  {listing.is_verified && (
                    <VerificationBadge level={listing.verification_level} score={listing.verification_score} />
                  )}
                  {listing.has_warranty && (
                    <WarrantyBadge duration={listing.warranty_duration} expiresAt={listing.warranty_expires} />
                  )}
                  {listing.part_origin && (
                    <PartOriginBadge origin={listing.part_origin} />
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={toggleFavorite}
                  disabled={favoriteLoading}
                  className={isFavorite ? 'text-red-500 border-red-500 hover:bg-red-50' : ''}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                </Button>
              </div>
              <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight mb-2" data-testid="listing-title">
                {listing.title}
              </h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                {listing.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {listing.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {listing.views} vues
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(listing.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>

            <div className="text-4xl font-heading font-black text-accent" data-testid="listing-price">
              {listing.price?.toLocaleString('fr-FR')} €
            </div>

            {/* Social proof badges */}
            <div className="flex flex-wrap gap-2 mt-2">
              {(listing?.quantity || 0) === 1 && (
                <Badge variant="outline" className="border-red-400 text-red-600 bg-red-50 animate-pulse">
                  ⚠️ Dernière pièce disponible !
                </Badge>
              )}
              {(listing?.quantity || 0) > 1 && (listing?.quantity || 0) <= 3 && (
                <Badge variant="outline" className="border-amber-400 text-amber-600 bg-amber-50">
                  📦 Plus que {listing.quantity} en stock
                </Badge>
              )}
              {(listing?.views || 0) >= 10 && (
                <Badge variant="outline" className="border-orange-400 text-orange-600 bg-orange-50">
                  🔥 Populaire • {listing.views} vues
                </Badge>
              )}
              {(listing?.views || 0) < 10 && (listing?.views || 0) > 0 && (
                <Badge variant="outline" className="border-gray-300 text-gray-600">
                  👀 {listing.views} vues
                </Badge>
              )}
            </div>

            {/* Shipping info */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">📦 {t('listingDetail.shipping_label')} :</span>
              {listing.shipping_cost === 0 ? (
                <span className="font-semibold text-green-600">{t('listingDetail.shipping_free')}</span>
              ) : listing.shipping_cost ? (
                <span className="font-semibold">{listing.shipping_cost?.toLocaleString('fr-FR')} €</span>
              ) : (
                <span className="text-muted-foreground">{t('listingDetail.shipping_tbd')}</span>
              )}
              {listing.shipping_info && (
                <span className="text-muted-foreground">• {listing.shipping_info}</span>
              )}
            </div>

            {/* Shipping Estimator - Estimation des frais via Boxtal */}
            <ShippingEstimator 
              listing={listing} 
              sellerPostalCode={listing.seller_postal_code}
            />

            <Card className="p-6">
              <h2 className="font-heading font-bold text-lg mb-4">Description</h2>
              <p className="text-muted-foreground whitespace-pre-line" data-testid="listing-description">
                {listing.description}
              </p>
            </Card>

            {/* Vehicle details if applicable */}
            {(listing.brand || listing.model || listing.year || listing.mileage) && (
              <Card className="p-6">
                <h2 className="font-heading font-bold text-lg mb-4">Caractéristiques</h2>
                <div className="grid grid-cols-2 gap-4">
                  {listing.brand && (
                    <div>
                      <span className="text-muted-foreground text-sm">Marque</span>
                      <p className="font-medium">{listing.brand}</p>
                    </div>
                  )}
                  {listing.model && (
                    <div>
                      <span className="text-muted-foreground text-sm">Modèle</span>
                      <p className="font-medium">{listing.model}</p>
                    </div>
                  )}
                  {listing.year && (
                    <div>
                      <span className="text-muted-foreground text-sm">Année</span>
                      <p className="font-medium">{listing.year}</p>
                    </div>
                  )}
                  {listing.mileage && (
                    <div>
                      <span className="text-muted-foreground text-sm">Kilométrage</span>
                      <p className="font-medium">{listing.mileage?.toLocaleString('fr-FR')} km</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Compatibility Info */}
            {(listing.compatible_brands?.length > 0 || listing.oem_reference || listing.aftermarket_reference || listing.compatible_years) && (
              <Card className="p-6 border-blue-100 bg-blue-50/50">
                <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <span className="text-blue-600">🔧</span>
                  {t('listingDetail.compatibility_title')}
                </h2>
                <div className="space-y-4">
                  {listing.compatible_brands?.length > 0 && (
                    <div>
                      <span className="text-muted-foreground text-sm block mb-2">{t('listingDetail.compatible_brands')}</span>
                      <div className="flex flex-wrap gap-2">
                        {listing.compatible_brands.map((brand) => (
                          <span key={brand} className="bg-white px-3 py-1 rounded-full text-sm font-medium border">
                            {brand}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.compatible_models?.length > 0 && (
                    <div>
                      <span className="text-muted-foreground text-sm block mb-2">{t('listingDetail.compatible_models')}</span>
                      <div className="flex flex-wrap gap-2">
                        {listing.compatible_models.map((model) => (
                          <span key={model} className="bg-white px-3 py-1 rounded-full text-sm font-medium border">
                            {model}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {listing.compatible_years && (
                    <div>
                      <span className="text-muted-foreground text-sm">{t('listingDetail.compatible_years')}</span>
                      <p className="font-medium">{listing.compatible_years}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    {listing.oem_reference && (
                      <div>
                        <span className="text-muted-foreground text-sm">{t('listingDetail.oem_ref')}</span>
                        <p className="font-mono font-bold text-blue-600">{listing.oem_reference}</p>
                      </div>
                    )}
                    {listing.aftermarket_reference && (
                      <div>
                        <span className="text-muted-foreground text-sm">{t('listingDetail.aftermarket_ref')}</span>
                        <p className="font-mono font-bold">{listing.aftermarket_reference}</p>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Traçabilité & Confiance */}
            {(listing.part_origin || listing.vehicle_mileage || listing.is_verified || listing.has_warranty) && (
              <Card className="p-6 border-green-100 bg-green-50/50 dark:bg-green-950/20">
                <h2 className="font-heading font-bold text-lg mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                  {t('listingDetail.traceability_title')}
                </h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {listing.part_origin && (
                      <div>
                        <span className="text-muted-foreground text-sm">{t('listingDetail.part_origin')}</span>
                        <p className="font-medium capitalize">
                          {listing.part_origin === 'casse' ? `🏭 ${t('listingDetail.origin_casse')}` :
                           listing.part_origin === 'particulier' ? `👤 ${t('listingDetail.origin_particulier')}` :
                           listing.part_origin === 'professionnel' ? `🏢 ${t('listingDetail.origin_professionnel')}` :
                           listing.part_origin === 'neuf' ? `✨ ${t('listingDetail.origin_neuf')}` : listing.part_origin}
                        </p>
                      </div>
                    )}
                    {listing.vehicle_mileage && (
                      <div>
                        <span className="text-muted-foreground text-sm">{t('listingDetail.vehicle_mileage')}</span>
                        <p className="font-medium">{listing.vehicle_mileage.toLocaleString('fr-FR')} km</p>
                      </div>
                    )}
                  </div>
                  
                  {listing.is_verified && (
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-card rounded-lg">
                      <Award className={`w-8 h-8 ${listing.verification_level === 'gold' ? 'text-amber-500' : 'text-slate-400'}`} />
                      <div>
                        <p className="font-medium">
                          {listing.verification_level === 'gold' ? t('listingDetail.certification_gold') : t('listingDetail.certification_silver')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('listingDetail.trust_score')}: {listing.verification_score}/100
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {listing.has_warranty && (
                    <div className="flex items-center gap-3 p-3 bg-white dark:bg-card rounded-lg">
                      <Shield className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="font-medium text-green-700 dark:text-green-400">
                          {t('listingDetail.warranty_title')} - {listing.warranty_duration} mois
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('listingDetail.warranty_expires')} {new Date(listing.warranty_expires).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Seller Info */}
            <Card className="p-6">
              <h2 className="font-heading font-bold text-lg mb-4">{t('listingDetail.seller_title')}</h2>
              <Link to={`/vendeur/${listing.seller_id}`} className="flex items-center gap-4 group">
                <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                  <User className="w-6 h-6 text-muted-foreground group-hover:text-accent" />
                </div>
                <div className="flex-1">
                  <p className="font-medium flex items-center gap-2 group-hover:text-accent transition-colors">
                    {listing.seller_name}
                    {listing.seller_is_pro && <span className="badge-pro">PRO</span>}
                    {listing.seller_is_verified && (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                        <Shield className="w-3 h-3" />
                        {t('listingDetail.verified_seller')}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {t('listingDetail.view_seller_profile')}
                  </p>
                </div>
              </Link>
            </Card>

            {/* Questions & Answers */}
            <QuestionsAnswers listingId={listing.id} sellerId={listing.seller_id} />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {user?.id !== listing.seller_id ? (
                <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="flex-1 h-12 bg-accent hover:bg-accent/90 text-accent-foreground btn-primary" data-testid="contact-seller-btn">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      {t('listingDetail.contact_seller')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{t('listingDetail.send_message_title')}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <p className="text-sm text-muted-foreground">
                        {t('listingDetail.about_listing')} : <span className="font-medium text-foreground">{listing.title}</span>
                      </p>
                      <Textarea
                        placeholder={t('listingDetail.message_placeholder')}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        data-testid="message-textarea"
                      />
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={sendingMessage}
                        className="w-full bg-accent hover:bg-accent/90"
                        data-testid="send-message-btn"
                      >
                        {sendingMessage ? t('listingDetail.sending') : t('listingDetail.send_message')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : (
                <Link to={`/annonce/${listing.id}/modifier`} className="flex-1">
                  <Button className="w-full h-12" variant="outline">
                    {t('listingDetail.edit_listing')}
                  </Button>
                </Link>
              )}
              
              <ShareButtons 
                url={window.location.href}
                title={listing.title}
                description={listing.description}
                price={listing.price}
              />

              {user?.id !== listing.seller_id && (
                <Button variant="outline" className="h-12" onClick={handleAddToCart} data-testid="add-to-cart-btn">
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  {t('listingDetail.add_to_cart')}
                </Button>
              )}

              {/* Video Call Button */}
              {user?.id !== listing.seller_id && (
                <Button 
                  variant="outline" 
                  className="h-12 border-green-500 text-green-600 hover:bg-green-50" 
                  onClick={handleVideoCall}
                  disabled={videoCallLoading}
                >
                  {videoCallLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Video className="w-5 h-5 mr-2" />
                      {t('listingDetail.video_call')}
                    </>
                  )}
                </Button>
              )}
            </div>

            {/* Secure Payment Button */}
            {user?.id !== listing.seller_id && listing.seller_stripe_connected && (
              <div className="mt-4 space-y-3">
                <Button 
                  onClick={handleBuyNow}
                  disabled={buyLoading}
                  className="w-full h-14 bg-green-600 hover:bg-green-700 text-white text-lg font-semibold"
                >
                  {buyLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5 mr-2" />
                  )}
                  {t('listingDetail.buy_now')} - {listing.price + (listing.shipping_cost || 0)}€
                </Button>
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-green-600" />
                  {t('listingDetail.secure_payment_info')}
                </div>
              </div>
            )}

            {/* Report Button */}
            {user?.id !== listing.seller_id && (
              <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full mt-4 text-muted-foreground hover:text-red-500">
                    <Flag className="w-4 h-4 mr-2" />
                    {t('listingDetail.report_listing')}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      {t('listingDetail.report_title')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <p className="text-sm text-muted-foreground">
                      {t('listingDetail.report_intro')}
                    </p>
                    <div className="space-y-2">
                      {REPORT_REASONS.map((reason) => (
                        <label
                          key={reason.value}
                          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                            reportReason === reason.value 
                              ? 'border-accent bg-accent/10' 
                              : 'border-border hover:border-accent/50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="report-reason"
                            value={reason.value}
                            checked={reportReason === reason.value}
                            onChange={(e) => setReportReason(e.target.value)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            reportReason === reason.value ? 'border-accent' : 'border-muted-foreground'
                          }`}>
                            {reportReason === reason.value && (
                              <div className="w-2 h-2 rounded-full bg-accent" />
                            )}
                          </div>
                          <span className="text-sm">{reason.label}</span>
                        </label>
                      ))}
                    </div>
                    <Textarea
                      placeholder={t('listingDetail.report_details')}
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      rows={3}
                    />
                    <Button 
                      onClick={handleReport}
                      disabled={reportLoading || !reportReason}
                      className="w-full bg-red-500 hover:bg-red-600"
                    >
                      {reportLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Flag className="w-4 h-4 mr-2" />
                      )}
                      {t('listingDetail.send_report')}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
