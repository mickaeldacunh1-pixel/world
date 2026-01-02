import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { MessageSquare, Send, ArrowLeft, User } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Messages() {
  const { listingId, userId } = useParams();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedConv, setSelectedConv] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

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

  const handleSelectConversation = (conv) => {
    setSelectedConv(conv);
    fetchMessages(conv.listing_id, conv.other_user_id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConv) return;

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
            <div className="p-4 border-b">
              <h2 className="font-heading font-bold">Conversations</h2>
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
                  <div>
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
                  <Input
                    placeholder="Écrire un message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
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
