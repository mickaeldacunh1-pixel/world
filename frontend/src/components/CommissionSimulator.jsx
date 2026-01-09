import { useState, useEffect } from 'react';
import { Calculator, Info, TrendingUp, Coins } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

// Commission constants (must match backend)
const COMMISSION_PERCENT = 5;
const COMMISSION_MIN = 1.50;
const COMMISSION_MAX = 15.00;

function calculateCommission(amount) {
  if (!amount || amount <= 0) return { commission: 0, sellerReceives: 0 };
  
  let fee = amount * COMMISSION_PERCENT / 100;
  fee = Math.max(fee, COMMISSION_MIN); // Apply minimum
  fee = Math.min(fee, COMMISSION_MAX); // Apply maximum
  fee = Math.round(fee * 100) / 100; // Round to 2 decimals
  
  return {
    commission: fee,
    sellerReceives: Math.round((amount - fee) * 100) / 100
  };
}

export default function CommissionSimulator({ price, shippingCost = 0, compact = false }) {
  const [result, setResult] = useState({ commission: 0, sellerReceives: 0 });
  
  const totalAmount = parseFloat(price || 0) + parseFloat(shippingCost || 0);
  
  useEffect(() => {
    setResult(calculateCommission(totalAmount));
  }, [totalAmount]);
  
  if (!price || parseFloat(price) <= 0) {
    return null;
  }
  
  // Compact version for inline display
  if (compact) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Coins className="w-4 h-4 text-green-600" />
        <span className="text-muted-foreground">Vous recevrez :</span>
        <span className="font-semibold text-green-600">{result.sellerReceives.toFixed(2)} €</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Info className="w-3 h-3 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent>
              <p>Commission : {result.commission.toFixed(2)} € (5%, min 1,50€, max 15€)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    );
  }
  
  // Full version
  return (
    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg space-y-3">
      <div className="flex items-center gap-2">
        <Calculator className="w-5 h-5 text-green-600" />
        <h4 className="font-medium text-green-800 dark:text-green-300">Simulateur de commission</h4>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-sm">
        {/* Prix de vente */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-muted-foreground text-xs mb-1">Prix de vente</p>
          <p className="font-bold text-lg">{parseFloat(price).toFixed(2)} €</p>
        </div>
        
        {/* Commission */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-3 text-center">
          <p className="text-muted-foreground text-xs mb-1 flex items-center justify-center gap-1">
            Commission
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-3 h-3" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-medium mb-1">Formule : 5% (min 1,50€, max 15€)</p>
                  <ul className="text-xs space-y-1">
                    <li>• Pièce à 20€ → 1,50€ (minimum)</li>
                    <li>• Pièce à 100€ → 5€</li>
                    <li>• Pièce à 500€ → 15€ (maximum)</li>
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </p>
          <p className="font-bold text-lg text-orange-600">-{result.commission.toFixed(2)} €</p>
        </div>
        
        {/* Vous recevez */}
        <div className="bg-green-100 dark:bg-green-900/40 rounded-lg p-3 text-center">
          <p className="text-green-700 dark:text-green-400 text-xs mb-1 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" />
            Vous recevez
          </p>
          <p className="font-bold text-lg text-green-700 dark:text-green-400">{result.sellerReceives.toFixed(2)} €</p>
        </div>
      </div>
      
      {/* Frais de port info */}
      {parseFloat(shippingCost) > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          + {parseFloat(shippingCost).toFixed(2)} € de frais de port (reversés intégralement)
        </p>
      )}
      
      {/* Avantage plafond */}
      {result.commission === COMMISSION_MAX && (
        <div className="flex items-center justify-center gap-2 text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 rounded px-2 py-1">
          <span>🎉</span>
          <span>Commission plafonnée à 15€ ! Vous économisez {((totalAmount * 0.05) - COMMISSION_MAX).toFixed(2)} €</span>
        </div>
      )}
    </div>
  );
}

// Export the calculation function for use elsewhere
export { calculateCommission, COMMISSION_PERCENT, COMMISSION_MIN, COMMISSION_MAX };
