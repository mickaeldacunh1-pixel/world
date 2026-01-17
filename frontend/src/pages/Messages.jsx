import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { MessageSquare, Send, ArrowLeft, User, Smile, Wifi, WifiOff } from 'lucide-react';
import useNotifications, { showAppNotification, NotificationTypes } from '../hooks/useNotifications';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const WS_URL = process.env.REACT_APP_BACKEND_URL?.replace('https://', 'wss://').replace('http://', 'ws://');

// Emoji categories
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😜', '🤪', '😎', '🤩', '🥳', '😏', '😒', '🙄', '😬', '🤔', '🤫', '🤭', '😱', '😢'],
  'Gestes': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤙', '👋', '🤚', '✋', '🖐️', '👏', '🙌', '🤝', '🙏', '💪', '👊', '✊', '🤛', '🤜'],
  'Cœurs': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objets': ['🚗', '🚙', '🏎️', '🚕', '🔧', '🔩', '⚙️', '🛠️', '💰', '💵', '📦', '📱', '💻', '📧', '✅', '❌', '⚠️', '🔔', '🎉', '🎊']
};

// Sound for new messages
const playNotificationSound = () => {
  try {
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2JkJeLfXBwfYeQj4d6cHB8houNhnpwcnuEi4yHe3Fyd4OJi4Z7cXN2gYiKhXtxc3aAh4mEe3FzdoCHiYR7cXN2gIeJhHtxc3aAh4mEe3FzdoCHiYR7');
    audio.volume = 0.3;
    audio.play();
  } catch (e) {}
};

export default function Messages() {
  const { listingId, userId } = useParams();
  const { user, token } = useAuth();
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  
  const { showNotification, requestPermission } = useNotifications();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Request notification permission on mount
  useEffect(() => {
    requestPermission();
  }, [requestPermission]);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!token || !user) return;
    
    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    const ws = new WebSocket(`${WS_URL}/ws/chat/${token}`);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case 'connected':
          console.log('WS: Connected as', data.user_id);
          break;
          
        case 'new_message':
          // Add new message to list
          const msg = data.message;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          
          // Update conversation list
          fetchConversations();
          
          // Play sound if message is from someone else
          if (msg.sender_id !== user?.id) {
            playNotificationSound();
            // Show push notification if page is not focused
            if (document.hidden) {
              showAppNotification(NotificationTypes.NEW_MESSAGE, {
                senderName: msg.sender_name || 'Quelqu\'un',
                messageId: msg.id
              }, showNotification);
            }
            // Clear typing indicator
            setOtherUserTyping(false);
          }
          break;
          
        case 'typing':
          if (selectedConv && data.user_id === selectedConv.other_user_id && data.listing_id === selectedConv.listing_id) {
            setOtherUserTyping(true);
          }
          break;
          
        case 'stop_typing':
          if (data.user_id === selectedConv?.other_user_id) {
            setOtherUserTyping(false);
          }
          break;
          
        case 'messages_read':
          // Could update read status in UI
          break;
          
        case 'pong':
          // Keep-alive response
          break;
          
        default:
          console.log('WS message:', data);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      
      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket();
      }, 3000);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    wsRef.current = ws;
  }, [token, user, selectedConv]);

  // Connect WebSocket on mount
  useEffect(() => {
    if (token && user) {
      connectWebSocket();
    }
    
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [token, user, connectWebSocket]);

  // Keep-alive ping every 30 seconds
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ action: 'ping' }));
      }
    }, 30000);
    
    return () => clearInterval(pingInterval);
  }, []);

  // Fallback polling (less frequent since we have WebSocket)
  useEffect(() => {
    fetchConversations();
    
    // Fallback poll every 30 seconds (instead of 5)
    const pollInterval = setInterval(() => {
      fetchConversations();
      if (selectedConv && !wsConnected) {
        fetchMessagesQuiet(selectedConv.listing_id, selectedConv.other_user_id);
      }
    }, 30000);
    
    return () => clearInterval(pollInterval);
  }, [selectedConv, wsConnected]);

  useEffect(() => {
    if (listingId && userId) {
      setSelectedConv({ listing_id: listingId, other_user_id: userId });
      fetchMessages(listingId, userId);
    }
  }, [listingId, userId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const response = await axios.get(`${API}/messages/conversations`);
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (lid, uid) => {
    try {
      const response = await axios.get(`${API}/messages/${lid}/${uid}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Quiet fetch for polling (no loading state change, check for new messages)
  const fetchMessagesQuiet = async (lid, uid) => {
    try {
      const response = await axios.get(`${API}/messages/${lid}/${uid}`);
      const newMessages = response.data;
      
      // Check if there are new messages
      if (newMessages.length > messages.length) {
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage.sender_id !== user?.id) {
          // Play notification sound for new messages from others
          playNotificationSound();
        }
        setMessages(newMessages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Handle typing indicator
  const handleTyping = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN && selectedConv) {
      wsRef.current.send(JSON.stringify({
        action: 'typing',
        receiver_id: selectedConv.other_user_id,
        listing_id: selectedConv.listing_id
      }));
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Stop typing after 2 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN && selectedConv) {
          wsRef.current.send(JSON.stringify({
            action: 'stop_typing',
            receiver_id: selectedConv.other_user_id,
            listing_id: selectedConv.listing_id
          }));
        }
      }, 2000);
    }
  };

  const handleSelectConversation = (conv) => {
    setSelectedConv(conv);
    setOtherUserTyping(false);
    fetchMessages(conv.listing_id, conv.other_user_id);
    
    // Mark messages as read via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'mark_read',
        listing_id: conv.listing_id,
        other_user_id: conv.other_user_id
      }));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

    // Try WebSocket first
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: 'send_message',
        receiver_id: selectedConv.other_user_id,
        listing_id: selectedConv.listing_id,
        content: newMessage
      }));
      setNewMessage('');
      return;
    }

    // Fallback to HTTP
    setSending(true);
    try {
      const response = await axios.post(`${API}/messages`, {
        listing_id: selectedConv.listing_id,
        receiver_id: selectedConv.other_user_id,
        content: newMessage,
      });
      setMessages([...messages, response.data]);
      setNewMessage('');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi du message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30" data-testid="messages-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-heading text-3xl font-bold mb-6">Messagerie</h1>

        <div className="grid md:grid-cols-3 gap-6 h-[600px]">
          {/* Conversations List */}
          <Card className="md:col-span-1 flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="font-heading font-bold">Conversations</h2>
              {/* WebSocket status indicator */}
              <div className="flex items-center gap-1" title={wsConnected ? 'Connecté en temps réel' : 'Reconnexion...'}>
                {wsConnected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-orange-500 animate-pulse" />
                )}
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loading ? (
                <p className="p-4 text-muted-foreground">Chargement...</p>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Aucune conversation</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={`${conv.listing_id}-${conv.other_user_id}`}
                      onClick={() => handleSelectConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-secondary transition-colors ${
                        selectedConv?.listing_id === conv.listing_id &&
                        selectedConv?.other_user_id === conv.other_user_id
                          ? 'bg-secondary'
                          : ''
                      }`}
                      data-testid={`conversation-${conv.listing_id}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{conv.other_user_name}</p>
                          <p className="text-sm text-muted-foreground truncate">
                            {conv.listing_title}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {conv.last_message}
                          </p>
                        </div>
                        {conv.unread_count > 0 && (
                          <span className="bg-accent text-accent-foreground text-xs px-2 py-0.5 rounded-full">
                            {conv.unread_count}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Messages Area */}
          <Card className="md:col-span-2 flex flex-col">
            {selectedConv ? (
              <>
                {/* Header */}
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => setSelectedConv(null)}
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex-1">
                    <p className="font-medium">
                      {selectedConv.other_user_name || 'Conversation'}
                    </p>
                    {selectedConv.listing_title && (
                      <Link
                        to={`/annonce/${selectedConv.listing_id}`}
                        className="text-sm text-accent hover:underline"
                      >
                        {selectedConv.listing_title}
                      </Link>
                    )}
                    {/* Typing indicator */}
                    {otherUserTyping && (
                      <p className="text-xs text-muted-foreground italic animate-pulse">
                        {selectedConv.other_user_name || 'L\'utilisateur'} est en train d'écrire...
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_id === user?.id ? 'justify-end' : 'justify-start'
                        }`}
                        data-testid={`message-${msg.id}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            msg.sender_id === user?.id
                              ? 'bg-accent text-accent-foreground rounded-br-sm'
                              : 'bg-secondary rounded-bl-sm'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              msg.sender_id === user?.id
                                ? 'text-accent-foreground/70'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="icon" className="shrink-0">
                        <Smile className="w-5 h-5 text-muted-foreground hover:text-accent" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-2" align="start">
                      <div className="space-y-3">
                        {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                          <div key={category}>
                            <p className="text-xs font-medium text-muted-foreground mb-1">{category}</p>
                            <div className="flex flex-wrap gap-1">
                              {emojis.map((emoji) => (
                                <button
                                  key={emoji}
                                  type="button"
                                  className="text-xl hover:bg-secondary rounded p-1 transition-colors"
                                  onClick={() => setNewMessage(prev => prev + emoji)}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Input
                    placeholder="Écrire un message..."
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTyping();
                    }}
                    className="flex-1"
                    data-testid="message-input"
                  />
                  <Button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="bg-accent hover:bg-accent/90"
                    data-testid="send-message-btn"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-heading font-bold text-xl mb-2">
                    Sélectionnez une conversation
                  </h3>
                  <p className="text-muted-foreground">
                    Choisissez une conversation dans la liste pour voir les messages
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
