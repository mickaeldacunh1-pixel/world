import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Mic, MicOff, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function VoiceSearch({ onSearch, className = '' }) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [processing, setProcessing] = useState(false);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event) => {
        const current = event.resultIndex;
        const result = event.results[current];
        const text = result[0].transcript;
        setTranscript(text);

        if (result.isFinal) {
          handleVoiceCommand(text);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Veuillez autoriser l\'accès au microphone');
        }
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  const handleVoiceCommand = async (text) => {
    setProcessing(true);
    const lowerText = text.toLowerCase().trim();
    
    // Detect intent
    if (lowerText.includes('cherche') || lowerText.includes('trouve') || lowerText.includes('recherche')) {
      // Extract search term
      const searchTerms = lowerText
        .replace(/cherche|trouve|recherche|moi|un|une|des|pour|je|veux/gi, '')
        .trim();
      
      if (searchTerms) {
        toast.success(`Recherche : "${searchTerms}"`);
        if (onSearch) {
          onSearch(searchTerms);
        } else {
          navigate(`/annonces?search=${encodeURIComponent(searchTerms)}`);
        }
      }
    } else if (lowerText.includes('accueil') || lowerText.includes('maison')) {
      navigate('/');
      toast.success('Retour à l\'accueil');
    } else if (lowerText.includes('mes annonces') || lowerText.includes('mon compte')) {
      navigate('/mes-annonces');
      toast.success('Mes annonces');
    } else if (lowerText.includes('déposer') || lowerText.includes('vendre') || lowerText.includes('nouvelle annonce')) {
      navigate('/deposer');
      toast.success('Déposer une annonce');
    } else if (lowerText.includes('message') || lowerText.includes('messagerie')) {
      navigate('/messages');
      toast.success('Messagerie');
    } else if (lowerText.includes('panier')) {
      navigate('/panier');
      toast.success('Mon panier');
    } else if (lowerText.includes('aide') || lowerText.includes('tobi') || lowerText.includes('assistant')) {
      // Open Tobi
      const tobiButton = document.querySelector('[data-tobi-trigger]');
      if (tobiButton) tobiButton.click();
      toast.success('Ouverture de l\'assistant Tobi');
    } else {
      // Default: search
      if (lowerText.length > 2) {
        toast.success(`Recherche : "${lowerText}"`);
        if (onSearch) {
          onSearch(lowerText);
        } else {
          navigate(`/annonces?search=${encodeURIComponent(lowerText)}`);
        }
      } else {
        toast.info('Dites par exemple : "Cherche un alternateur Renault"');
      }
    }
    
    setProcessing(false);
    setTranscript('');
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('La recherche vocale n\'est pas supportée par votre navigateur');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
      toast.info('🎙️ Parlez maintenant...', { duration: 2000 });
    }
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        variant={isListening ? 'default' : 'outline'}
        size="icon"
        onClick={toggleListening}
        className={`relative ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : ''}`}
        title="Recherche vocale"
      >
        {processing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>
      
      {/* Transcript display */}
      {(isListening || transcript) && (
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-3 min-w-[200px] max-w-[300px] z-50">
          {isListening && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              Écoute en cours...
            </div>
          )}
          {transcript && (
            <p className="text-sm font-medium">"{transcript}"</p>
          )}
        </div>
      )}
    </div>
  );
}
