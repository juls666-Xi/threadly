import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, MoreHorizontal, Trash2, Clock } from 'lucide-react';
import { postAPI } from '@/services/api';
import type { Post } from '@/types';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);

  const postUser = typeof post.userId === 'string' ? null : post.userId;
  const isOwnPost = postUser?._id === user?.id || post.userId === user?.id;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return diffInDays === 1 ? 'Yesterday' : `${diffInDays}d ago`;
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    setIsDeleting(true);
    try {
      await postAPI.deletePost(post._id);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUserClick = () => {
    if (postUser?._id) {
      navigate(`/profile/${postUser._id}`);
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex space-x-3">
            <div 
              className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer"
              onClick={handleUserClick}
            >
              {postUser?.profilePicture ? (
                <img
                  src={postUser.profilePicture}
                  alt={postUser.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <h4 
                className="font-semibold text-blue-900 cursor-pointer hover:underline"
                onClick={handleUserClick}
              >
                {postUser?.username || 'Unknown User'}
              </h4>
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(post.createdAt)}
              </div>
            </div>
          </div>
          
          {isOwnPost && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        <p className="mt-4 text-gray-800 whitespace-pre-wrap">{post.content}</p>
      </CardContent>
    </Card>
  );
}
