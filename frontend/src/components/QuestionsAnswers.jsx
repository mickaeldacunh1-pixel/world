import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { MessageCircleQuestion, Send, Loader2, User, CheckCircle, Trash2 } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function QuestionsAnswers({ listingId, sellerId }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newQuestion, setNewQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [answeringId, setAnsweringId] = useState(null);
  const [answerText, setAnswerText] = useState('');

  const isOwner = user?.id === sellerId;

  useEffect(() => {
    fetchQuestions();
  }, [listingId]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API}/questions/listing/${listingId}`);
      setQuestions(response.data);
    } catch (error) {
      console.error('Error fetching questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!newQuestion.trim() || !user) return;

    setSending(true);
    try {
      await axios.post(`${API}/questions`, {
        listing_id: listingId,
        question: newQuestion.trim()
      });
      setNewQuestion('');
      fetchQuestions();
      toast.success('Question envoyée ! Le vendeur sera notifié.');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de l\'envoi');
    } finally {
      setSending(false);
    }
  };

  const handleSubmitAnswer = async (questionId) => {
    if (!answerText.trim()) return;

    try {
      await axios.post(`${API}/questions/${questionId}/answer`, {
        answer: answerText.trim()
      });
      setAnsweringId(null);
      setAnswerText('');
      fetchQuestions();
      toast.success('Réponse envoyée !');
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    }
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('Supprimer cette question ?')) return;

    try {
      await axios.delete(`${API}/questions/${questionId}`);
      fetchQuestions();
      toast.success('Question supprimée');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircleQuestion className="w-5 h-5" />
          Questions ({questions.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Liste des questions */}
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            Aucune question pour le moment
          </p>
        ) : (
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q.id} className="border rounded-lg p-4 space-y-3">
                {/* Question */}
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{q.asker_name}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(q.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm mt-1">{q.question}</p>
                  </div>
                  {(user?.id === q.asker_id || isOwner) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(q.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>

                {/* Réponse */}
                {q.answer ? (
                  <div className="ml-11 p-3 bg-accent/10 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Réponse du vendeur</span>
                    </div>
                    <p className="text-sm">{q.answer}</p>
                  </div>
                ) : isOwner && (
                  answeringId === q.id ? (
                    <div className="ml-11 space-y-2">
                      <Textarea
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Votre réponse..."
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSubmitAnswer(q.id)}>
                          Envoyer
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setAnsweringId(null)}>
                          Annuler
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-11"
                      onClick={() => {
                        setAnsweringId(q.id);
                        setAnswerText('');
                      }}
                    >
                      Répondre
                    </Button>
                  )
                )}
              </div>
            ))}
          </div>
        )}

        {/* Formulaire nouvelle question */}
        {user && user.id !== sellerId && (
          <form onSubmit={handleSubmitQuestion} className="pt-4 border-t">
            <Textarea
              value={newQuestion}
              onChange={(e) => setNewQuestion(e.target.value)}
              placeholder="Poser une question au vendeur..."
              rows={2}
              disabled={sending}
            />
            <Button
              type="submit"
              className="mt-2"
              disabled={sending || !newQuestion.trim()}
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Envoyer
            </Button>
          </form>
        )}

        {!user && (
          <p className="text-center text-sm text-muted-foreground pt-4 border-t">
            <a href="/auth" className="text-accent hover:underline">Connectez-vous</a> pour poser une question
          </p>
        )}
      </CardContent>
    </Card>
  );
}
