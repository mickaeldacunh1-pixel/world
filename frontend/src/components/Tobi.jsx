import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { 
  MessageCircle, X, Send, Bot, User, Sparkles, Loader2, Trash2, 
  Minimize2, Mic, MicOff, Lock, CreditCard, Package, Coins, ArrowRight,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Tobi() {
  const { user, token } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Bonjour ! 👋 Je suis **Tobi**, votre assistant automobile IA.\n\nJe peux vous aider à :\n- 🔍 Trouver des pièces compatibles\n- 🚗 Vérifier la compatibilité véhicule\n- 💡 Donner des conseils d'entretien\n- 🔧 Diagnostiquer des problèmes\n- 📦 Expliquer le fonctionnement de la plateforme\n\nComment puis-je vous aider ?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [accessInfo, setAccessInfo] = useState(null);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Axios instance avec token
  const authAxios = axios.create({
    baseURL: API,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  // Initialize speech recognition
  useEffect(() => {
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
        setInput(text);

        if (result.isFinal) {
          setIsListening(false);
          setTimeout(() => {
            const form = document.querySelector('[data-tobi-form]');
            if (form) form.requestSubmit();
          }, 300);
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

  // Fetch access info when user logs in or opens chat
  useEffect(() => {
    if (user && isOpen) {
      fetchAccessInfo();
    }
  }, [user, isOpen, token]);

  const fetchAccessInfo = async () => {
    if (!token) return;
    setLoadingAccess(true);
    try {
      const response = await authAxios.get('/tobi/access');
      setAccessInfo(response.data);
    } catch (error) {
      console.error('Error fetching access info:', error);
    } finally {
      setLoadingAccess(false);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error('La reconnaissance vocale n\'est pas supportée par votre navigateur');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setInput('');
      recognitionRef.current.start();
      setIsListening(true);
      toast.info('🎙️ Parlez à Tobi...', { duration: 2000 });
    }
  };

  // Generate session ID on mount
  useEffect(() => {
    if (user) {
      const storedSessionId = localStorage.getItem(`tobi_session_${user.id}`);
      if (storedSessionId) {
        setSessionId(storedSessionId);
        loadHistory(storedSessionId);
      } else {
        const newSessionId = `tobi_${user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        setSessionId(newSessionId);
        localStorage.setItem(`tobi_session_${user.id}`, newSessionId);
      }
    }
  }, [user]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized && user) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized, user]);

  const loadHistory = async (sid) => {
    if (!token) return;
    try {
      const response = await authAxios.get(`/tobi/history/${sid}`);
      if (response.data.length > 0) {
        const history = response.data.flatMap(item => [
          { role: 'user', content: item.user_message },
          { role: 'assistant', content: item.assistant_response }
        ]);
        setMessages(prev => [...prev, ...history]);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const sendMessage = async (e, useCredits = false) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || !token) return;

    // Check if user has access
    if (!accessInfo?.has_free_access && accessInfo?.diagnostic_credits <= 0 && !useCredits) {
      setShowPaymentOptions(true);
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);
    setShowPaymentOptions(false);

    try {
      const response = await authAxios.post('/tobi/chat', {
        message: userMessage,
        session_id: sessionId,
        use_credits: useCredits || (!accessInfo?.has_free_access && accessInfo?.diagnostic_credits > 0)
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.data.response 
      }]);

      // Update session ID if new one was created
      if (response.data.session_id !== sessionId) {
        setSessionId(response.data.session_id);
        localStorage.setItem(`tobi_session_${user.id}`, response.data.session_id);
      }

      // Update access info
      if (response.data.credits_remaining !== undefined) {
        setAccessInfo(prev => ({
          ...prev,
          diagnostic_credits: response.data.credits_remaining
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.status === 402) {
        setShowPaymentOptions(true);
        // Remove the user message since it wasn't processed
        setMessages(prev => prev.slice(0, -1));
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: "Désolé, une erreur s'est produite. Veuillez réessayer. 😔" 
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePurchase = async (pack) => {
    try {
      const response = await authAxios.post(`/ai/diagnostic/purchase?pack=${pack}`);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error('Erreur lors de la création du paiement');
    }
  };

  const handleUsePoints = async () => {
    try {
      await authAxios.post('/ai/diagnostic/use-points');
      toast.success('Crédit ajouté !');
      await fetchAccessInfo();
      setShowPaymentOptions(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const clearConversation = async () => {
    if (sessionId && token) {
      try {
        await authAxios.delete(`/tobi/session/${sessionId}`);
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    }
    
    const newSessionId = `tobi_${user?.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setSessionId(newSessionId);
    if (user) {
      localStorage.setItem(`tobi_session_${user.id}`, newSessionId);
    }
    setMessages([{
      role: 'assistant',
      content: "Conversation effacée ! 🧹\n\nComment puis-je vous aider ?"
    }]);
  };

  const formatMessage = (content) => {
    return content
      .split('\n')
      .map((line, i) => {
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        if (line.startsWith('- ')) {
          return `<li key=${i} class="ml-4">${line.substring(2)}</li>`;
        }
        return `<p key=${i} class="mb-1">${line}</p>`;
      })
      .join('');
  };

  const suggestions = [
    "🔧 J'ai un problème avec ma voiture",
    "Comment trouver une pièce ?",
    "C'est quoi une référence OEM ?",
    "Comment fonctionne le paiement sécurisé ?"
  ];

  // Bouton flottant (fermé)
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-50 bg-gradient-to-r from-accent to-orange-500 hover:from-accent/90 hover:to-orange-500/90 text-white p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 group"
        aria-label="Ouvrir Tobi"
        data-testid="tobi-open-btn"
      >
        <div className="relative">
          <Bot className="w-7 h-7" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse" />
        </div>
        <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white text-foreground px-3 py-2 rounded-lg shadow-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          💬 Besoin d'aide ?
        </span>
      </button>
    );
  }

  // Bouton minimisé
  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-24 right-6 z-50 bg-gradient-to-r from-accent to-orange-500 text-white px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 hover:scale-105 transition-transform"
        data-testid="tobi-minimized-btn"
      >
        <Bot className="w-5 h-5" />
        <span className="font-medium">Tobi</span>
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      </button>
    );
  }

  // Écran de connexion requise
  if (!user) {
    return (
      <Card className="fixed bottom-24 right-6 z-50 w-[380px] flex flex-col shadow-2xl border-0 overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-accent to-orange-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold flex items-center gap-2">
                Tobi
                <Sparkles className="w-4 h-4" />
              </h3>
              <p className="text-xs text-white/80">Assistant IA</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Contenu */}
        <div className="p-6 text-center">
          <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-bold mb-2">Connexion requise</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Connectez-vous pour discuter avec Tobi et bénéficier de conseils personnalisés.
          </p>
          <div className="space-y-2">
            <Link to="/auth" onClick={() => setIsOpen(false)}>
              <Button className="w-full bg-accent hover:bg-accent/90">
                Se connecter
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground">
              💡 Publiez une annonce pour un accès gratuit illimité !
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed bottom-24 right-6 z-50 w-[380px] h-[550px] flex flex-col shadow-2xl border-0 overflow-hidden animate-fade-in-up">
      {/* Header */}
      <div className="bg-gradient-to-r from-accent to-orange-500 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold flex items-center gap-2">
              Tobi
              <Sparkles className="w-4 h-4" />
            </h3>
            <p className="text-xs text-white/80">Assistant IA • En ligne</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={clearConversation}
            title="Nouvelle conversation"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => setIsMinimized(true)}
            title="Minimiser"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-8 w-8"
            onClick={() => setIsOpen(false)}
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Access Status Badge */}
      {!loadingAccess && accessInfo && (
        <div className="px-4 py-2 bg-secondary/50 border-b flex items-center justify-between">
          {accessInfo.has_free_access ? (
            <Badge className="bg-green-100 text-green-700 gap-1">
              <CheckCircle className="w-3 h-3" />
              Accès gratuit illimité
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1">
              <CreditCard className="w-3 h-3" />
              {accessInfo.diagnostic_credits} crédit(s)
            </Badge>
          )}
          {!accessInfo.has_free_access && accessInfo.diagnostic_credits === 0 && (
            <Button 
              variant="link" 
              size="sm" 
              className="text-accent h-auto p-0 text-xs"
              onClick={() => setShowPaymentOptions(true)}
            >
              Acheter
            </Button>
          )}
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-primary text-white' 
                  : 'bg-gradient-to-r from-accent to-orange-500 text-white'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-white rounded-br-md'
                  : 'bg-secondary rounded-bl-md'
              }`}>
                <div 
                  className="text-sm leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-accent to-orange-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Tobi réfléchit...
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Payment Options */}
      {showPaymentOptions && !accessInfo?.has_free_access && (
        <div className="p-4 border-t bg-secondary/30 space-y-3">
          <p className="text-sm font-medium text-center">Accédez à Tobi :</p>
          
          {/* Points fidélité */}
          {accessInfo?.can_use_points && (
            <Button 
              variant="outline" 
              className="w-full justify-between"
              onClick={handleUsePoints}
            >
              <span className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-yellow-500" />
                Utiliser {accessInfo.pricing.points_cost} points
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}

          {/* Acheter crédits */}
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => handlePurchase('single')}
            >
              <CreditCard className="w-3 h-3 mr-1" />
              1 crédit • {accessInfo?.pricing?.single || 0.99}€
            </Button>
            <Button 
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handlePurchase('pack_5')}
            >
              <Package className="w-3 h-3 mr-1" />
              5 crédits • {accessInfo?.pricing?.pack_5 || 3.99}€
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            💡 <Link to="/deposer" className="text-accent hover:underline" onClick={() => setIsOpen(false)}>Publiez une annonce</Link> pour un accès gratuit !
          </p>
        </div>
      )}

      {/* Quick Suggestions */}
      {messages.length <= 2 && !showPaymentOptions && (
        <div className="px-4 pb-2">
          <p className="text-xs text-muted-foreground mb-2">Suggestions :</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => {
                  setInput(suggestion);
                  inputRef.current?.focus();
                }}
                className="text-xs bg-secondary hover:bg-secondary/80 px-3 py-1.5 rounded-full transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={sendMessage} data-tobi-form className="p-4 border-t bg-background">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "🎙️ Écoute en cours..." : "Posez votre question..."}
            disabled={isLoading || showPaymentOptions}
            className={`flex-1 ${isListening ? 'border-red-500 animate-pulse' : ''}`}
            data-testid="tobi-input"
          />
          <Button
            type="button"
            variant={isListening ? "destructive" : "outline"}
            size="icon"
            onClick={toggleListening}
            disabled={isLoading || showPaymentOptions}
            className={`flex-shrink-0 ${isListening ? 'animate-pulse' : ''}`}
            title={isListening ? "Arrêter" : "Parler à Tobi"}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim() || showPaymentOptions}
            className="bg-accent hover:bg-accent/90 flex-shrink-0"
            data-testid="tobi-send-btn"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Propulsé par IA • World Auto Pro
        </p>
      </form>
    </Card>
  );
}
