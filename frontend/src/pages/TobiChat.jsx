import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { Plus, Settings, Send, ArrowLeft, Lock, CreditCard, Package, Coins, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function TobiChat() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [accessInfo, setAccessInfo] = useState(null);
  const [loadingAccess, setLoadingAccess] = useState(true);
  const [showPaymentOptions, setShowPaymentOptions] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Axios instance avec token
  const authAxios = axios.create({
    baseURL: API_URL,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Charger les infos d'accès
  useEffect(() => {
    if (user && token) {
      fetchAccessInfo();
      // Récupérer la session de l'utilisateur
      const storedSession = localStorage.getItem(`tobi_session_${user.id}`);
      if (storedSession) {
        setSessionId(storedSession);
      }
    } else {
      setLoadingAccess(false);
    }
  }, [user, token]);

  const fetchAccessInfo = async () => {
    try {
      const response = await authAxios.get('/api/tobi/access');
      setAccessInfo(response.data);
    } catch (error) {
      console.error('Error fetching access:', error);
    } finally {
      setLoadingAccess(false);
    }
  };

  const capabilities = [
    { icon: '🚗', title: 'Recherche auto', desc: 'Prix, conseils d\'achat, comparatifs', prompt: 'Quel est le prix moyen d\'une Peugeot 308 d\'occasion ?' },
    { icon: '🔧', title: 'Diagnostic', desc: 'Identifier les pannes et solutions', prompt: 'Ma voiture fait un bruit bizarre au freinage, que faire ?' },
    { icon: '📖', title: 'Tutoriels', desc: 'Guides de réparation pas à pas', prompt: 'Comment changer les plaquettes de frein sur une Clio 4 ?' },
    { icon: '💡', title: 'Conseils', desc: 'Recommandations personnalisées', prompt: 'Quels sont les meilleurs SUV familiaux ?' },
  ];

  const quickActions = [
    { icon: '🔍', text: 'Trouver une pièce', prompt: 'Aide-moi à trouver une pièce' },
    { icon: '🔧', text: 'Diagnostic', prompt: 'Diagnostic de ma voiture' },
    { icon: '💰', text: 'Estimation', prompt: 'Estimation du prix d\'une réparation' },
  ];

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || isTyping || !token) return;

    // Vérifier l'accès
    if (!accessInfo?.has_free_access && accessInfo?.diagnostic_credits <= 0) {
      setShowPaymentOptions(true);
      return;
    }

    // Add user message
    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setShowPaymentOptions(false);

    try {
      const response = await authAxios.post('/api/tobi/chat', {
        message: messageText,
        session_id: sessionId,
        use_credits: !accessInfo?.has_free_access && accessInfo?.diagnostic_credits > 0
      });

      if (response.data.session_id) {
        setSessionId(response.data.session_id);
        localStorage.setItem(`tobi_session_${user.id}`, response.data.session_id);
      }

      // Mettre à jour les crédits
      if (response.data.credits_remaining !== undefined) {
        setAccessInfo(prev => ({
          ...prev,
          diagnostic_credits: response.data.credits_remaining
        }));
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (error) {
      console.error('Tobi Error:', error);
      if (error.response?.status === 402) {
        setShowPaymentOptions(true);
        // Retirer le message utilisateur
        setMessages(prev => prev.slice(0, -1));
      } else if (error.response?.status === 401) {
        toast.error('Veuillez vous reconnecter');
        navigate('/auth');
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Désolé, je rencontre un problème technique. 😅 Réessayez dans quelques instants !' 
        }]);
      }
    }

    setIsTyping(false);
  };

  const handlePurchase = async (pack) => {
    try {
      const response = await authAxios.post(`/api/ai/diagnostic/purchase?pack=${pack}`);
      window.location.href = response.data.checkout_url;
    } catch (error) {
      toast.error('Erreur lors de la création du paiement');
    }
  };

  const handleUsePoints = async () => {
    try {
      await authAxios.post('/api/ai/diagnostic/use-points');
      toast.success('Crédit ajouté !');
      await fetchAccessInfo();
      setShowPaymentOptions(false);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur');
    }
  };

  const newChat = async () => {
    if (sessionId && token) {
      try {
        await authAxios.delete(`/api/tobi/session/${sessionId}`);
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    }
    setMessages([]);
    const newSessionId = `tobi_${user?.id}_${Date.now()}`;
    setSessionId(newSessionId);
    if (user) {
      localStorage.setItem(`tobi_session_${user.id}`, newSessionId);
    }
  };

  const formatMessage = (content) => {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-slate-700 px-1 rounded text-sm">$1</code>')
      .replace(/\n/g, '<br/>');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Écran de connexion requise
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 bg-slate-800 border-slate-700 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Connexion requise</h1>
          <p className="text-slate-400 mb-6">
            Connectez-vous pour discuter avec Tobi et bénéficier de conseils personnalisés.
          </p>
          <div className="space-y-3">
            <Link to="/auth">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Se connecter
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full border-slate-600 text-slate-300 hover:bg-slate-700">
                Retour à l'accueil
              </Button>
            </Link>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            💡 Publiez une annonce pour un accès gratuit illimité !
          </p>
        </Card>
      </div>
    );
  }

  // Écran de chargement
  if (loadingAccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col" data-testid="kim-chat-page">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-white p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">T</span>
          </div>
          <div>
            <div className="text-white font-bold">Tobi</div>
            <div className="text-slate-400 text-xs">Propulsé par IA</div>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          {/* Badge d'accès */}
          {accessInfo?.has_free_access ? (
            <Badge className="bg-green-600 text-white gap-1">
              <CheckCircle className="w-3 h-3" />
              Accès illimité
            </Badge>
          ) : (
            <Badge variant="outline" className="border-slate-600 text-slate-300 gap-1">
              <CreditCard className="w-3 h-3" />
              {accessInfo?.diagnostic_credits || 0} crédit(s)
            </Badge>
          )}
          <button 
            onClick={newChat}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
            title="Nouvelle conversation"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
            title="Paramètres"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Options de paiement */}
      {showPaymentOptions && (
        <div className="bg-slate-800 border-b border-slate-700 p-4">
          <div className="max-w-2xl mx-auto">
            <p className="text-white text-center mb-3 font-medium">
              🔒 Accédez à Tobi
            </p>
            
            {accessInfo?.can_use_points && (
              <Button 
                variant="outline" 
                className="w-full mb-2 border-slate-600 text-slate-300 justify-between"
                onClick={handleUsePoints}
              >
                <span className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  Utiliser {accessInfo.pricing?.points_cost || 100} points
                </span>
              </Button>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline" 
                size="sm"
                className="border-slate-600 text-slate-300"
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

            <p className="text-xs text-center text-slate-500 mt-2">
              💡 <Link to="/deposer" className="text-blue-400 hover:underline">Publiez une annonce</Link> pour un accès gratuit illimité !
            </p>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
              <span className="text-5xl font-black text-white">T</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Bienvenue sur Tobi</h1>
            <p className="text-slate-400 mb-8 max-w-md">
              Votre assistant IA personnel. Posez-moi vos questions sur l'automobile, la mécanique, ou tout autre sujet !
            </p>
            
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
              {capabilities.map((cap, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(cap.prompt)}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-blue-500 rounded-2xl p-4 text-left transition-all"
                >
                  <div className="text-2xl mb-2">{cap.icon}</div>
                  <div className="text-white font-semibold">{cap.title}</div>
                  <div className="text-slate-400 text-sm">{cap.desc}</div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'assistant' 
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
                    : 'bg-slate-700'
                }`}>
                  {msg.role === 'assistant' ? (
                    <span className="text-white font-bold">T</span>
                  ) : (
                    <span className="text-slate-300">👤</span>
                  )}
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-800 text-slate-100'
                }`}>
                  <div 
                    className="leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                  />
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-bold">T</span>
                </div>
                <div className="bg-slate-800 rounded-2xl px-4 py-3">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="bg-slate-800 border-t border-slate-700 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Posez votre question..."
              disabled={showPaymentOptions}
              className="flex-1 bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-400 resize-none focus:outline-none focus:border-blue-500 min-h-[50px] max-h-[150px] disabled:opacity-50"
              rows={1}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping || showPaymentOptions}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
          
          {!showPaymentOptions && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.prompt)}
                  className="bg-slate-700 hover:bg-blue-600 border border-slate-600 hover:border-blue-500 rounded-full px-4 py-2 text-sm text-slate-300 hover:text-white transition-all flex items-center gap-2"
                >
                  <span>{action.icon}</span>
                  {action.text}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-white mb-4">Paramètres</h2>
            <div className="space-y-4">
              <div className="bg-slate-700 rounded-xl p-4">
                <h3 className="text-white font-semibold mb-2">Mon accès</h3>
                {accessInfo?.has_free_access ? (
                  <p className="text-green-400 text-sm">✓ Accès gratuit illimité (annonce active)</p>
                ) : (
                  <p className="text-slate-400 text-sm">Crédits restants : {accessInfo?.diagnostic_credits || 0}</p>
                )}
              </div>
              <button
                onClick={() => {
                  newChat();
                  setShowSettings(false);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white rounded-xl py-3 font-medium"
              >
                Effacer la conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
