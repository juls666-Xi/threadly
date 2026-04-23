import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { postAPI } from '@/services/api';
import PostCard from '@/components/PostCard';
import type { Post } from '@/types';
import { Loader2 } from 'lucide-react';
import Navbar from '@/components/Navbar';


export default function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      const fetchPost = async () => {
        try {
          // I need to add a getPost method to postAPI
          const fetchedPost = await postAPI.getPost(id);
          setPost(fetchedPost);
        } catch (error) {
          console.error('Failed to fetch post:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchPost();
    }
  }, [id]);

  return (
    <div>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                    </div>
                ) : post ? (
                    <PostCard post={post} />
                ) : (
                    <div className="text-center py-12 bg-card rounded-lg border border-border">
                        <p className="text-muted-foreground">Post not found.</p>
                    </div>
                )}
            </div>
        </main>
    </div>
  );
}