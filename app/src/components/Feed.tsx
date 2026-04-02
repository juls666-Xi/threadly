import { useEffect, useState } from 'react';
import { postAPI } from '@/services/api';
import CreatePost from './CreatePost';
import PostCard from './PostCard';
import { Loader2 } from 'lucide-react';
import type { Post } from '@/types';

export default function Feed() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = async () => {
    try {
      const data = await postAPI.getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div>
      <CreatePost onPostCreated={fetchPosts} />

      {posts.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border border-border">
          <p className="text-muted-foreground">No posts yet. Be the first to post!</p>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onDelete={fetchPosts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
