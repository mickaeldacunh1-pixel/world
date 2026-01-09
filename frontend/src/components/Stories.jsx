import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTrigger } from './ui/dialog';
import { 
  Plus, X, ChevronLeft, ChevronRight, Eye, Clock, 
  Heart, Send, Camera, Video, Pause, Play, Volume2, VolumeX,
  ShieldCheck, MoreHorizontal, Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

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
  const STORY_DURATION = currentStory?.type === 'video' ? 30000 : 5000; // 30s for video, 5s for image

  useEffect(() => {
    if (isPaused) return;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + (100 / (STORY_DURATION / 100));
      });
    }, 100);

    return () => clearInterval(progressInterval.current);
  }, [currentIndex, isPaused]);

  const goNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setProgress(0);
    }
  };

  const handleTouchStart = (e) => {
    const touchX = e.touches[0].clientX;
    const screenWidth = window.innerWidth;
    
    if (touchX < screenWidth / 3) {
      goPrev();
    } else if (touchX > screenWidth * 2 / 3) {
      goNext();
    } else {
      setIsPaused(true);
    }
  };

  const handleTouchEnd = () => {
    setIsPaused(false);
  };

  if (!currentStory) return null;

  return (
    <div 
      className="fixed inset-0 bg-black z-50 flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
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
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 text-white/80 hover:text-white"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}
          <button 
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 text-white/80 hover:text-white"
          >
            {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </button>
          <button onClick={onClose} className="p-2 text-white/80 hover:text-white">
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
        onClick={goPrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/50 hover:text-white hidden md:block"
      >
        <ChevronLeft className="w-8 h-8" />
      </button>
      <button 
        onClick={goNext}
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
      className="flex flex-col items-center gap-1 shrink-0"
    >
      <div className={`w-16 h-16 rounded-full p-0.5 ${
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
            <div className="w-full h-full rounded-full bg-gradient-to-br from-accent to-orange-400 flex items-center justify-center text-white font-bold text-lg">
              {story.user_name?.charAt(0) || '?'}
            </div>
          )}
        </div>
      </div>
      <span className="text-xs font-medium truncate w-16 text-center">
        {isOwn ? 'Votre story' : story.user_name?.split(' ')[0] || 'Vendeur'}
      </span>
    </button>
  );
}

// Add story button
function AddStoryButton({ onAdd }) {
  return (
    <button
      onClick={onAdd}
      className="flex flex-col items-center gap-1 shrink-0"
    >
      <div className="w-16 h-16 rounded-full border-2 border-dashed border-accent flex items-center justify-center bg-accent/10 hover:bg-accent/20 transition-colors">
        <Plus className="w-6 h-6 text-accent" />
      </div>
      <span className="text-xs font-medium text-accent">Ajouter</span>
    </button>
  );
}

// Main Stories component
export default function Stories() {
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

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
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
            viewed: true
          };
        }
        grouped[story.user_id].stories.push(story);
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
  };

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

    // Validate
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

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const uploadStory = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', selectedFile);

      const uploadRes = await axios.post(`${API}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      // Create story
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

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2 px-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse shrink-0" />
        ))}
      </div>
    );
  }

  if (stories.length === 0 && myStories.length === 0 && !user) {
    return null;
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-2 px-1 scrollbar-hide">
        {/* Add story button (if logged in) */}
        {user && (
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <div>
                {myStories.length > 0 ? (
                  <div className="relative">
                    <StoryCircle 
                      story={{ 
                        user_name: 'Votre story', 
                        user_avatar: user.avatar,
                        viewed: true 
                      }}
                      onClick={() => openStoryViewer(myStories)}
                      isOwn
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowAddDialog(true); }}
                      className="absolute bottom-4 right-0 w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-xs border-2 border-white dark:border-gray-900"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <AddStoryButton onAdd={() => setShowAddDialog(true)} />
                )}
              </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Nouvelle story</h3>
                <p className="text-sm text-muted-foreground">
                  Partagez une photo ou vidéo de vos pièces. Elle sera visible pendant 24h.
                </p>

                {/* Preview */}
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
                    <p className="text-sm text-muted-foreground">Cliquez pour ajouter</p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />

                {/* Caption */}
                <input
                  type="text"
                  placeholder="Ajouter une légende..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-transparent"
                  maxLength={100}
                />

                {/* Submit */}
                <Button
                  onClick={uploadStory}
                  disabled={!selectedFile || uploading}
                  className="w-full bg-accent hover:bg-accent/90"
                >
                  {uploading ? 'Publication...' : 'Publier la story'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Other users' stories */}
        {stories.map(userGroup => (
          <StoryCircle
            key={userGroup.user_id}
            story={userGroup}
            onClick={() => openStoryViewer(userGroup.stories)}
          />
        ))}
      </div>

      {/* Story viewer */}
      {viewerOpen && (
        <StoryViewer
          stories={viewerStories}
          initialIndex={viewerInitialIndex}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </>
  );
}
