import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '../components/ui/dialog';
import { 
  Plus, X, ChevronLeft, ChevronRight, Eye, Clock, 
  Heart, Camera, Video, Pause, Play, Volume2, VolumeX,
  ShieldCheck, Trash2, Users, TrendingUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import SEO from '../components/SEO';

const API = process.env.REACT_APP_BACKEND_URL;

// Story viewer component
function StoryViewer({ stories, initialIndex = 0, onClose }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);
  const progressInterval = useRef(null);

  const currentStory = stories[currentIndex];
  const storyDuration = currentStory?.type === 'video' ? 30000 : 5000;

  const goNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  useEffect(() => {
    if (isPaused) return;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + (100 / (storyDuration / 100));
      });
    }, 100);

    return () => clearInterval(progressInterval.current);
  }, [currentIndex, isPaused, goNext, storyDuration]);

  if (!currentStory) return null;

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        if (x < rect.width / 3) goPrev();
        else if (x > rect.width * 2 / 3) goNext();
      }}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
            <div 
              className="h-full bg-white transition-all duration-100"
              style={{ 
                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex items-center justify-between px-4 z-10">
        <Link to={`/vendeur/${currentStory.user_id}`} className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-accent to-orange-400 p-0.5">
            <div className="w-full h-full rounded-full bg-gray-800 flex items-center justify-center text-white font-bold">
              {currentStory.user_name?.charAt(0) || '?'}
            </div>
          </div>
          <div>
            <p className="text-white font-medium text-sm flex items-center gap-1">
              {currentStory.user_name}
              {currentStory.user_verified && <ShieldCheck className="w-3 h-3 text-blue-400" />}
            </p>
            <p className="text-white/60 text-xs">
              {formatDistanceToNow(new Date(currentStory.created_at), { addSuffix: true, locale: fr })}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {currentStory.type === 'video' && (
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }}
              className="p-2 text-white/80 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={(e) => { e.stopPropagation(); setIsPaused(!isPaused); }}
            className="p-2 text-white/80 hover:text-white"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-2 text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center">
        {currentStory.type === 'video' ? (
          <video
            ref={videoRef}
            src={currentStory.media_url}
            className="max-h-full max-w-full object-contain"
            autoPlay
            loop
            muted={isMuted}
            playsInline
          />
        ) : (
          <img 
            src={currentStory.media_url} 
            alt="Story"
            className="max-h-full max-w-full object-contain"
          />
        )}
      </div>

      {/* Caption */}
      {currentStory.caption && (
        <div className="absolute bottom-20 left-0 right-0 px-4">
          <p className="text-white text-center bg-black/50 rounded-lg px-4 py-2">
            {currentStory.caption}
          </p>
        </div>
      )}

      {/* Navigation arrows (desktop) */}
      <button 
        onClick={(e) => { e.stopPropagation(); goPrev(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white hidden md:block"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); goNext(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white hidden md:block"
      >
        <ChevronRight className="w-8 h-8" />
      </button>

      {/* Views count */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 text-white/60 text-sm">
        <Eye className="w-4 h-4" />
        {currentStory.views || 0} vues
      </div>
    </div>
  );
}

// Story circle component
function StoryCircle({ story, onClick, isOwn = false }) {
  const hasUnviewed = !story.viewed;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 shrink-0 group"
    >
      <div className={`w-20 h-20 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
        hasUnviewed 
          ? 'bg-gradient-to-r from-accent via-pink-500 to-purple-500' 
          : 'bg-gray-300 dark:bg-gray-600'
      }`}>
        <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 p-0.5">
          {story.user_avatar ? (
            <img 
              src={story.user_avatar} 
              alt={story.user_name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-xl">
              {story.user_name?.charAt(0) || '?'}
            </div>
          )}
        </div>
      </div>
      <span className="text-sm font-medium truncate w-20 text-center">
        {isOwn ? 'Votre story' : story.user_name?.split(' ')[0] || 'Vendeur'}
      </span>
      {story.stories_count > 1 && (
        <span className="text-xs text-muted-foreground">
          {story.stories_count} stories
        </span>
      )}
    </button>
  );
}

export default function StoriesPage() {
  const { t } = useTranslation();
  const { token, user } = useAuth();
  const [stories, setStories] = useState([]);
  const [myStories, setMyStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerStories, setViewerStories] = useState([]);
  const [viewerInitialIndex, setViewerInitialIndex] = useState(0);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const fetchStories = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/api/stories`);
      
      // Group stories by user
      const grouped = {};
      response.data.forEach(story => {
        if (!grouped[story.user_id]) {
          grouped[story.user_id] = {
            user_id: story.user_id,
            user_name: story.user_name,
            user_avatar: story.user_avatar,
            user_verified: story.user_verified,
            stories: [],
            viewed: true,
            stories_count: 0
          };
        }
        grouped[story.user_id].stories.push(story);
        grouped[story.user_id].stories_count++;
        if (!story.viewed) {
          grouped[story.user_id].viewed = false;
        }
      });

      // Separate own stories
      if (user && grouped[user.id]) {
        setMyStories(grouped[user.id].stories);
        delete grouped[user.id];
      }

      setStories(Object.values(grouped));
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStories();
  }, [fetchStories]);

  const openStoryViewer = (userStories, initialIndex = 0) => {
    setViewerStories(userStories);
    setViewerInitialIndex(initialIndex);
    setViewerOpen(true);

    // Mark as viewed
    userStories.forEach(story => {
      if (!story.viewed && token) {
        axios.post(`${API}/api/stories/${story.id}/view`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => {});
      }
    });
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');

    if (!isImage && !isVideo) {
      toast.error('Seules les images et vidéos sont acceptées');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Fichier trop volumineux (max 50 Mo)');
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const uploadStory = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadRes = await axios.post(`${API}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      await axios.post(`${API}/api/stories`, {
        media_url: uploadRes.data.url,
        type: selectedFile.type.startsWith('video/') ? 'video' : 'image',
        caption: caption
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Story publiée !');
      setShowAddDialog(false);
      setSelectedFile(null);
      setPreview(null);
      setCaption('');
      fetchStories();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erreur lors de la publication');
    } finally {
      setUploading(false);
    }
  };

  const deleteStory = async (storyId) => {
    try {
      await axios.delete(`${API}/api/stories/${storyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Story supprimée');
      fetchStories();
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30 py-8">
      <SEO
        title="Stories Vendeurs"
        description="Découvrez les dernières stories des vendeurs sur World Auto Pro - Photos et vidéos éphémères de pièces automobiles"
        url="/stories"
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold mb-2">{t('stories.title', 'Stories Vendeurs')}</h1>
          <p className="text-muted-foreground">{t('stories.description', 'Découvrez les dernières actualités de nos vendeurs')}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center">
                <Camera className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stories.reduce((acc, s) => acc + s.stories_count, 0) + myStories.length}</p>
                <p className="text-xs text-muted-foreground">{t('stories.active_stories', 'Stories actives')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stories.length + (myStories.length > 0 ? 1 : 0)}</p>
                <p className="text-xs text-muted-foreground">{t('stories.active_sellers', 'Vendeurs actifs')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">24h</p>
                <p className="text-xs text-muted-foreground">{t('stories.lifetime', 'Durée de vie')}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-500/10 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{myStories.length}</p>
                <p className="text-xs text-muted-foreground">{t('stories.your_stories', 'Vos stories')}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add Story Button (if logged in) */}
        {user && (
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-heading font-semibold text-lg mb-1">{t('stories.share_update', 'Partagez votre actualité')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {t('stories.share_description', 'Postez une photo ou vidéo pour promouvoir vos pièces (visible 24h)')}
                  </p>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-accent hover:bg-accent/90 gap-2">
                      <Plus className="w-4 h-4" />
                      {t('stories.new_story', 'Nouvelle story')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">{t('stories.new_story', 'Nouvelle story')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('stories.share_description', 'Partagez une photo ou vidéo de vos pièces. Elle sera visible pendant 24h.')}
                      </p>

                      {preview ? (
                        <div className="relative aspect-[9/16] max-h-[300px] bg-black rounded-lg overflow-hidden">
                          {selectedFile?.type.startsWith('video/') ? (
                            <video src={preview} className="w-full h-full object-contain" controls />
                          ) : (
                            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                          )}
                          <button
                            onClick={() => { setSelectedFile(null); setPreview(null); }}
                            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-[9/16] max-h-[300px] border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-secondary/50 transition-colors"
                        >
                          <div className="flex gap-4">
                            <div className="p-4 bg-accent/10 rounded-full">
                              <Camera className="w-8 h-8 text-accent" />
                            </div>
                            <div className="p-4 bg-accent/10 rounded-full">
                              <Video className="w-8 h-8 text-accent" />
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{t('stories.click_to_add', 'Cliquez pour ajouter')}</p>
                        </div>
                      )}

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*"
                        className="hidden"
                        onChange={handleFileSelect}
                      />

                      <input
                        type="text"
                        placeholder={t('stories.add_caption', 'Ajouter une légende...')}
                        value={caption}
                        onChange={(e) => setCaption(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg bg-transparent"
                        maxLength={100}
                      />

                      <Button
                        onClick={uploadStory}
                        disabled={!selectedFile || uploading}
                        className="w-full bg-accent hover:bg-accent/90"
                      >
                        {uploading ? t('stories.publishing', 'Publication...') : t('stories.publish', 'Publier la story')}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        )}

        {/* My Stories */}
        {myStories.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                {t('stories.your_stories', 'Vos stories')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {myStories.map((story, index) => (
                  <div key={story.id} className="relative group shrink-0">
                    <button
                      onClick={() => openStoryViewer(myStories, index)}
                      className="w-24 h-32 rounded-lg overflow-hidden"
                    >
                      <img 
                        src={story.media_url} 
                        alt="Story" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-1 left-1 flex items-center gap-1 text-white text-xs bg-black/50 px-1 rounded">
                        <Eye className="w-3 h-3" />
                        {story.views}
                      </div>
                    </button>
                    <button
                      onClick={() => deleteStory(story.id)}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Stories */}
        <Card>
          <CardHeader>
            <CardTitle>Toutes les stories</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex gap-6 overflow-x-auto pb-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
                ))}
              </div>
            ) : stories.length === 0 && myStories.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="font-heading text-lg font-semibold mb-2">Aucune story pour le moment</h3>
                <p className="text-muted-foreground mb-6">
                  Soyez le premier à partager votre actualité !
                </p>
                {user && (
                  <Button onClick={() => setShowAddDialog(true)} className="bg-accent hover:bg-accent/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Publier une story
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex gap-6 overflow-x-auto pb-4">
                {stories.map(userGroup => (
                  <StoryCircle
                    key={userGroup.user_id}
                    story={userGroup}
                    onClick={() => openStoryViewer(userGroup.stories)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Story viewer */}
        {viewerOpen && (
          <StoryViewer
            stories={viewerStories}
            initialIndex={viewerInitialIndex}
            onClose={() => setViewerOpen(false)}
          />
        )}
      </div>
    </div>
  );
}
