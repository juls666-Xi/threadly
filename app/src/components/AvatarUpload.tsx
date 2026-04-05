import { useState } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, X, Check } from 'lucide-react';
import { userAPI } from '@/services/api';
import type { User } from '@/types';
import { toast } from 'sonner';

interface AvatarUploadProps {
  user: User;
  onAvatarUpdate: (updatedUser: User) => void;
  size?: 'sm' | 'md' | 'lg';
}

const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

function getAvatarUrl(path: string | undefined): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${API_URL}${path}`;
}

const sizeMap = { sm: 'h-12 w-12', md: 'h-24 w-24', lg: 'h-32 w-32' };

export default function AvatarUpload({ user, onAvatarUpdate, size = 'md' }: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>(user.profilePicture || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const currentAvatarUrl = getAvatarUrl(user.profilePicture);
  const previewUrl = avatarUrl || currentAvatarUrl;

  const handleSave = async () => {
    if (!avatarUrl.trim()) {
      toast.error('Please enter an avatar URL');
      return;
    }

    setIsUpdating(true);
    try {
      const result = await userAPI.updateAvatarUrl(avatarUrl);
      onAvatarUpdate(result.user);
      toast.success('Avatar updated successfully');
    } catch (error: unknown) {
      const message = extractErrorMessage(error);
      toast.error(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    setAvatarUrl(user.profilePicture || '');
  };

  function extractErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error) && error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Failed to update avatar';
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar Preview */}
      <div className="form-group">
        <label className="form-label">Avatar Preview</label>
        <Avatar className={`${sizeMap[size]} ring-2 ring-blue-200 dark:ring-blue-800 overflow-hidden`}>
          <AvatarImage src={previewUrl} alt={user.username} />
          <AvatarFallback className="bg-blue-100 dark:bg-neutral-700 text-blue-600 dark:text-blue-400 text-lg">
            {user.username?.charAt(0)?.toUpperCase() ?? 'U'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Avatar URL Input */}
      <div className="w-full max-w-xs">
        <label className="form-label" htmlFor="avatarUrl">Avatar URL</label>
        <input
          id="avatarUrl"
          type="url"
          className="form-input w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          placeholder="https://example.com/avatar.jpg"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
        />
        <small className="text-muted text-sm text-gray-500 dark:text-gray-400">
          Enter a URL to an image (optional)
        </small>
      </div>

      {/* Action Buttons */}
      {avatarUrl !== (user.profilePicture || '') && (
        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={isUpdating} size="sm" className="gap-1">
            {isUpdating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Save
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleCancel} size="sm" className="gap-1" disabled={isUpdating}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
