import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, MoreHorizontal, Trash2, Clock, ThumbsUp, MessageCircle, Send } from 'lucide-react';
import { postAPI } from '@/services/api';
import type { Post, Comment } from '@/types';

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export default function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [localPost, setLocalPost] = useState<Post>(post);

  const postUser = typeof localPost.userId === 'string' ? null : localPost.userId;
  const isOwnPost = postUser?._id === user?.id || localPost.userId === user?.id;
  const isUpvoted = localPost.upvotes.some(u => u.id === user?.id || u._id === user?.id);

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
      await postAPI.deletePost(localPost._id);
      onDelete?.();
    } catch (error) {
      console.error('Failed to delete post:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpvote = async () => {
    if (isUpvoting) return;

    setIsUpvoting(true);
    try {
      const updatedPost = await postAPI.upvotePost(localPost._id);
      setLocalPost(updatedPost);
    } catch (error) {
      console.error('Failed to upvote post:', error);
    } finally {
      setIsUpvoting(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || isAddingComment) return;

    setIsAddingComment(true);
    try {
      const updatedPost = await postAPI.addComment(localPost._id, newComment.trim());
      setLocalPost(updatedPost);
      setNewComment('');
      setShowComments(true);
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      const updatedPost = await postAPI.deleteComment(localPost._id, commentId);
      setLocalPost(updatedPost);
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleUserClick = () => {
    if (postUser?._id) {
      navigate(`/profile/${postUser._id}`);
    }
  };

  const handleCommentUserClick = (comment: Comment) => {
    if (comment.userId && typeof comment.userId !== 'string' && comment.userId.id) {
      navigate(`/profile/${comment.userId.id}`);
    }
  };

  return (
    <Card className="mb-4 bg-card border-border">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex space-x-3">
            <div
              className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer"
              onClick={handleUserClick}
            >
              {postUser?.profilePicture ? (
                <img
                  src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${postUser.profilePicture}`}
                  alt={postUser.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5 text-blue-600" />
              )}
            </div>
            <div>
              <h4
                className="font-semibold text-foreground cursor-pointer hover:underline"
                onClick={handleUserClick}
              >
                {postUser?.username || 'Unknown User'}
              </h4>
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                {formatDate(localPost.createdAt)}
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

        <p className="mt-4 text-foreground whitespace-pre-wrap">{localPost.content}</p>

        {/* Post Image */}
        {localPost.image && (
          <div className="mt-4">
            <img
              src={localPost.image.url.startsWith('http') ? localPost.image.url : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${localPost.image.url}`}
              alt={localPost.image.filename}
              className="max-h-96 w-auto rounded-lg object-contain border border-border cursor-pointer hover:opacity-95"
              onClick={() => window.open(localPost.image!.url.startsWith('http') ? localPost.image!.url : `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${localPost.image!.url}`, '_blank')}
            />
          </div>
        )}

        {/* Upvote and Comment Actions */}
        <div className="mt-4 flex items-center space-x-4 border-t border-border pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUpvote}
            disabled={isUpvoting}
            className={`flex items-center space-x-1 ${isUpvoted ? 'text-blue-600' : 'text-muted-foreground'}`}
          >
            <ThumbsUp className={`h-4 w-4 ${isUpvoted ? 'fill-current' : ''}`} />
            <span>{localPost.upvoteCount || 0}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-1 text-muted-foreground"
          >
            <MessageCircle className="h-4 w-4" />
            <span>{localPost.comments?.length || 0}</span>
          </Button>
        </div>

        {/* Comments Section */}
        {showComments && (
          <div className="mt-4 border-t border-border pt-3">
            {/* Add Comment */}
            <div className="flex space-x-2 mb-4">
              <Input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                placeholder="Write a comment..."
                className="flex-1"
                disabled={isAddingComment}
              />
              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim() || isAddingComment}
                size="icon"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            {/* Comments List */}
            {localPost.comments && localPost.comments.length > 0 && (
              <div className="space-y-3">
                {localPost.comments.map((comment) => {
                  const isOwnComment = comment.userId?.id === user?.id;
                  return (
                    <div key={comment.id} className="flex space-x-2">
                      <div
                        className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center cursor-pointer flex-shrink-0"
                        onClick={() => handleCommentUserClick(comment)}
                      >
                        {comment.userId && typeof comment.userId !== 'string' && comment.userId.profilePicture ? (
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${comment.userId.profilePicture}`}
                            alt={comment.userId.username}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <User className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="bg-muted rounded-lg px-3 py-2">
                          <div className="flex items-center justify-between">
                            <span
                              className="font-medium text-sm text-foreground cursor-pointer hover:underline"
                              onClick={() => handleCommentUserClick(comment)}
                            >
                              {comment.userId && typeof comment.userId !== 'string'
                                ? comment.userId.username
                                : 'Unknown User'}
                            </span>
                            {isOwnComment && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-red-600 hover:text-red-700"
                                onClick={() => handleDeleteComment(comment.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <p className="text-sm text-foreground">{comment.content}</p>
                        </div>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
