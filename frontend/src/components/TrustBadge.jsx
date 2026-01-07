import { Shield, ShieldCheck, Award, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

export function VerificationBadge({ level, score }) {
  if (!level || level === 'none') return null;

  const config = {
    gold: {
      icon: ShieldCheck,
      label: 'Pièce Vérifiée Or',
      className: 'bg-amber-500 hover:bg-amber-600 text-white',
      description: 'Cette pièce a été vérifiée et répond à tous les critères de qualité'
    },
    silver: {
      icon: Shield,
      label: 'Pièce Vérifiée',
      className: 'bg-slate-400 hover:bg-slate-500 text-white',
      description: 'Cette pièce répond aux critères de vérification de base'
    }
  };

  const { icon: Icon, label, className, description } = config[level] || config.silver;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge className={`${className} flex items-center gap-1 cursor-help`}>
            <Icon className="w-3 h-3" />
            {label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{description}</p>
          {score && <p className="text-xs text-muted-foreground mt-1">Score: {score}/100</p>}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function WarrantyBadge({ duration, expiresAt }) {
  if (!duration) return null;

  const isExpired = expiresAt && new Date(expiresAt) < new Date();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge 
            className={`flex items-center gap-1 cursor-help ${
              isExpired 
                ? 'bg-gray-400 text-white' 
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            <Award className="w-3 h-3" />
            Garantie {duration} mois
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          {isExpired ? (
            <p>Garantie expirée</p>
          ) : (
            <>
              <p className="font-medium">Garantie World Auto</p>
              <p className="text-xs text-muted-foreground mt-1">
                Expire le {new Date(expiresAt).toLocaleDateString('fr-FR')}
              </p>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function PartOriginBadge({ origin }) {
  if (!origin) return null;

  const config = {
    casse: { label: 'Casse auto', className: 'bg-blue-100 text-blue-800' },
    particulier: { label: 'Particulier', className: 'bg-purple-100 text-purple-800' },
    professionnel: { label: 'Professionnel', className: 'bg-indigo-100 text-indigo-800' },
    neuf: { label: 'Pièce neuve', className: 'bg-green-100 text-green-800' }
  };

  const { label, className } = config[origin] || { label: origin, className: 'bg-gray-100 text-gray-800' };

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

export function TrustScore({ score, details = [] }) {
  const getScoreColor = (s) => {
    if (s >= 80) return 'text-green-500';
    if (s >= 60) return 'text-amber-500';
    return 'text-gray-400';
  };

  const detailLabels = {
    photos_multiples: '📷 Photos multiples',
    reference_oem: '🔧 Référence OEM',
    origine_renseignee: '📍 Origine renseignée',
    kilometrage_vehicule: '🚗 Kilométrage véhicule',
    vendeur_experimente: '⭐ Vendeur expérimenté'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Score de confiance:</span>
        <span className={`text-lg font-bold ${getScoreColor(score)}`}>{score}/100</span>
      </div>
      {details.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {details.map((detail) => (
            <span key={detail} className="text-xs bg-secondary px-2 py-1 rounded">
              {detailLabels[detail] || detail}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function SellerTrustInfo({ seller }) {
  if (!seller) return null;

  return (
    <div className="p-4 bg-secondary/50 rounded-lg space-y-3">
      <h4 className="font-medium flex items-center gap-2">
        <Shield className="w-4 h-4" />
        Informations vendeur
      </h4>
      
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
          <span>{seller.sales_count} ventes réalisées</span>
        </div>
        
        {seller.avg_rating > 0 && (
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span>{seller.avg_rating}/5 ({seller.reviews_count} avis)</span>
          </div>
        )}
        
        {seller.is_professional && (
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-500" />
            <span>Vendeur professionnel</span>
          </div>
        )}
        
        {seller.member_since && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>Membre depuis {new Date(seller.member_since).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default { VerificationBadge, WarrantyBadge, PartOriginBadge, TrustScore, SellerTrustInfo };
