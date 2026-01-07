import { useState } from 'react';
import { Button } from './ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from './ui/dropdown-menu';
import { Share2, Facebook, MessageCircle, Twitter, Link2, Check, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareButtons({ url, title, description, price, image }) {
  const [copied, setCopied] = useState(false);
  
  const shareUrl = url || window.location.href;
  const shareTitle = title || 'Découvrez cette annonce';
  const shareText = description ? `${shareTitle} - ${price}€ - ${description.substring(0, 100)}...` : shareTitle;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareTitle)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${shareTitle} - ${price}€\n${shareUrl}`)}`,
    email: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`Regardez cette annonce :\n\n${shareTitle}\nPrix: ${price}€\n\n${shareUrl}`)}`
  };

  const handleShare = async (platform) => {
    if (platform === 'copy') {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Lien copié !');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        toast.error('Impossible de copier le lien');
      }
      return;
    }

    if (platform === 'native' && navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        // User cancelled or error, fall through to dropdown
      }
    }

    // Open share link
    if (shareLinks[platform]) {
      window.open(shareLinks[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="h-10 w-10">
          <Share2 className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare('facebook')} className="cursor-pointer">
          <Facebook className="w-4 h-4 mr-2 text-blue-600" />
          Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('whatsapp')} className="cursor-pointer">
          <MessageCircle className="w-4 h-4 mr-2 text-green-500" />
          WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('twitter')} className="cursor-pointer">
          <Twitter className="w-4 h-4 mr-2 text-sky-500" />
          Twitter / X
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('email')} className="cursor-pointer">
          <Mail className="w-4 h-4 mr-2 text-gray-600" />
          Email
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare('copy')} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="w-4 h-4 mr-2 text-green-500" />
              Copié !
            </>
          ) : (
            <>
              <Link2 className="w-4 h-4 mr-2" />
              Copier le lien
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
