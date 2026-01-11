import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Settings, Send, ArrowLeft } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export default function TobiChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState(() => localStorage.getItem('tobi_session_id') || null);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    if (!messageText || isTyping) return;

    // Add user message
    const userMessage = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_URL}/api/tobi/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: messageText,
          session_id: sessionId
        })
      });

      if (!response.ok) throw new Error('API Error');

      const data = await response.json();
      
      if (data.session_id) {
        setSessionId(data.session_id);
        localStorage.setItem('tobi_session_id', data.session_id);
      }

      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('KIM Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Désolé, je rencontre un problème technique. 😅 Réessayez dans quelques instants !' 
      }]);
    }

    setIsTyping(false);
  };

  const newChat = () => {
    setMessages([]);
    setSessionId(null);
    localStorage.removeItem('tobi_session_id');
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

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col" data-testid="kim-chat-page">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-slate-400 hover:text-white p-1">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">K</span>
          </div>
          <div>
            <div className="text-white font-bold">KIM Agent</div>
            <div className="text-slate-400 text-xs">Propulsé par IA</div>
          </div>
        </div>
        <div className="flex gap-2">
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

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        {messages.length === 0 ? (
          /* Welcome Screen */
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mb-6 animate-bounce">
              <span className="text-5xl font-black text-white">K</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Bienvenue sur KIM Agent</h1>
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
                    <span className="text-white font-bold">K</span>
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
                  <span className="text-white font-bold">K</span>
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
              className="flex-1 bg-slate-700 border border-slate-600 rounded-2xl px-4 py-3 text-white placeholder-slate-400 resize-none focus:outline-none focus:border-blue-500 min-h-[50px] max-h-[150px]"
              rows={1}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isTyping}
              className="w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-2xl flex items-center justify-center transition-colors"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
          
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
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setShowSettings(false)}>
          <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">Paramètres</h2>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-700">
                <div>
                  <div className="text-white font-medium">Mode sombre</div>
                  <div className="text-slate-400 text-sm">Toujours actif</div>
                </div>
                <div className="w-12 h-7 bg-blue-600 rounded-full relative">
                  <div className="absolute right-1 top-1 w-5 h-5 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="py-3">
                <div className="text-white font-medium">Version</div>
                <div className="text-slate-400 text-sm">KIM Agent v1.0.0</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
