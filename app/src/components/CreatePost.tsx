import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { User, Send, Loader2 } from 'lucide-react';
import { postAPI } from '@/services/api';

interface CreatePostProps {
  onPostCreated: () => void;
}

export default function CreatePost({ onPostCreated }: CreatePostProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setIsSubmitting(true);
    try {
      await postAPI.createPost(content.trim());
      setContent('');
      onPostCreated();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="mb-6 bg-card border-border">
      <CardContent className="p-4">
        <div className="flex space-x-4">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            {user?.profilePicture ? (
              <img
                src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${user.profilePicture}`}
                alt={user.username}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <User className="h-5 w-5 text-blue-600" />
            )}
          </div>
          <div className="flex-1">
            <Textarea
              placeholder="What's on your mind?"
              className="resize-none border-border focus:border-blue-300 bg-background"
              rows={3}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={500}
            />
            <div className="flex justify-between items-center mt-3">
              <span className="text-xs text-muted-foreground">
                {content.length}/500
              </span>
              <Button
                onClick={handleSubmit}
                disabled={!content.trim() || isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Post
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
