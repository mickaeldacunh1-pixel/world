import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { ScrollArea } from '../components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { MessageSquare, Send, ArrowLeft, User, Smile } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Emoji categories
const EMOJI_CATEGORIES = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '😉', '😌', '😍', '🥰', '😘', '😋', '😜', '🤪', '😎', '🤩', '🥳', '😏', '😒', '🙄', '😬', '🤔', '🤫', '🤭', '😱', '😢'],
  'Gestes': ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤙', '👋', '🤚', '✋', '🖐️', '👏', '🙌', '🤝', '🙏', '💪', '👊', '✊', '🤛', '🤜'],
  'Cœurs': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objets': ['🚗', '🚙', '🏎️', '🚕', '🔧', '🔩', '⚙️', '🛠️', '💰', '💵', '📦', '📱', '💻', '📧', '✅', '❌', '⚠️', '🔔', '🎉', '🎊']
};

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

  // Auto-refresh for real-time feel
  useEffect(() => {
    fetchConversations();
    
    // Poll for new messages every 5 seconds
    const pollInterval = setInterval(() => {
      fetchConversations();
      if (selectedConv) {
        fetchMessagesQuiet(selectedConv.listing_id, selectedConv.other_user_id);
      }
    }, 5000);
    
    return () => clearInterval(pollInterval);
  }, [selectedConv]);

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

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleQoAMojs6K9sFQBU8fWynkkAADfw/cJcABp66gm4MwBjnfkNkgsAluP0E28JAKHk8BheAwCX3vwLUgoAld70Em8MAKH37gpYDQCO2f8LXhUAjd/zEW0YAI7c/whYFQCU4fMOXhUAj+D0Dm0YAI3f+QhYFQCR4PMObhgAktzzCFcTAJLg8gxrFACQ3/kIWBMAk9/xDGkTAJHe+AhXEgCT3/ENaREAk932CVgRAJXf8QtnEACT3vcJWA8Ald7xC2YNAJXZ9wpZDQCW2/IMZAsAltf4C1kLAJfZ8g1iCgCW1/gLWAoAmNjzDGAJAJjX+AtYCQCY2PQLXggAmNf4C1cIAJnX8wxbBwCZ1/kLVgYAmdj0C1oFAJrX+QtVBQCZ1/QLWAQAmtf5C1UDAJrX8wtXAgCa1vkLVAIAmtfzC1YBAJvW+QtTAACa1/QLVgAAm9b6C1MAAJvX9AtVAACb1vsLUgAAm9b0C1QAAJzW+wtRAAub1vQLUwABnNb7C1EAAZvW9AtTAAGc1vsLUQABnNb0C1IAAZzW+wtRAAGc1vQLUgABnNb7C1EAAZzW9AtRAAKc1vsLUAABnNb0C1EAApzW+wtQAAKc1fQLUAACnNb7Ck8AApzV9AtQAAKc1vsKTwACnNX0C1AAApzV+wpPAAKc1fQLUAACnNX7Ck8AApzV9ApPAAKc1fsKTwACnNX0Ck8AApzV+wpOAAKc1fQKTwACnNX7Ck4AAp3V9ApOAAOc1fsKTgACnNX0Ck4AA5zV+wpNAAKc1fQKTgADnNX7Ck0AA5zV9ApOAAOc1fsKTQADnNX0Ck0AA5zV+wpNAAOd1fQKTQADnNX7Ck0AA5zV9ApNAAOc1fsKTAADnNX0CkwAA5zV+wpMAAOd1fQKTAADnNT7CkwAA53U9ApMAAOc1PsKSwADndT0CkwAA5zU+wpLAAOd1PQKSwADnNT7CksAA53U9ApLAAOd1PsKSwADndT0CksAA5zU+wpLAAOd1PQKSwADndT7CksAA53U9ApKAAOd1PsKSwADndT0CkoAA53U+wpKAAOd1PQKSgADndT7CkoAA53U9ApKAAOd1PsKSgADndT0CkoAA53U+wpKAAOd0/QKSgADndP7CkoAA53T9ApJAAOd0/sKSgADndP0CkkAA53T+wpJAAOe0/QKSQADntP7CkkAA57T9ApJAAOe0/sKSQADntP0CkkAA57T+wpJAAOe0/QKSQADntP7CkkAA57T9ApIAAOe0/sKSQADntP0CkgAA57T+wpIAAOe0/QKSAADntP7CkgAA57S9ApIAAOe0vsKSAAEntL0CkgABJ7S+wpIAAOe0vQKSAAEntL7CkgABJ7S9ApHAAWe0vsKRwAEntL0CkcABZ7S+wpHAAWe0vQKRwAFntL7CkcABZ7S9ApHAAWe0vsKRwAFntL0CkcABZ7S+wpGAAWe0vQKRwAFn9L7CkYABp7S9ApGAAaf0vsKRgAGntL0CkYABp/S+wpGAAae0vQKRgAGn9L7CkYABp7S9ApGAAaf0vsKRgAGntL0CkYABp/S+wpFAAae0vQKRgAGn9L7CkUABp7S9ApFAAaf0vwKRQAGntL0CkUABp/S+wpFAAaf0vQKRQAGn9L7CkUABp/S9ApFAAaf0vsKRQAGn9L0CkUABp/S+wpFAAaf0vQKRQAGn9L7CkUABp/S9ApFAAaf0vsKRQAGn9L0CkUABp/S+wpFAAag0vQKRQAGn9L7CkQABqDS9ApFAAag0vsKRAAGoNL0CkQABqDS+wpEAAag0vQKRAAGoNL7CkQABqDS9ApEAAag0vsKRAAGoNL0CkQABqDS+wpEAAah0vQKRAAGoNL7CkQABqHS9ApEAAah0vsKRAAGoNL0CkQABqHS+wpEAAah0vQKRAAGoNL7Cg==');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio can't play
    } catch (error) {
      // Ignore audio errors
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
