import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2, X, Check } from 'lucide-react';
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
const iconSizeMap = { sm: 'h-3 w-3', md: 'h-4 w-4', lg: 'h-5 w-5' };

export default function AvatarUpload({ user, onAvatarUpdate, size = 'md' }: AvatarUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentAvatarUrl = getAvatarUrl(user.profilePicture);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, []);

  // Cleanup object URL on unmount or file change
  useState(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const { user } = await userAPI.uploadAvatar(selectedFile);
      onAvatarUpdate(user);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      toast.success('Avatar updated successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to upload avatar';
      toast.error(message);
      console.error('Avatar upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCancel = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [previewUrl]);

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative group">
        <Avatar className={`${sizeMap[size]} ring-2 ring-blue-200 dark:ring-blue-800 overflow-hidden`}>
          <AvatarImage src={displayUrl} alt={user.username} />
          <AvatarFallback className="bg-blue-100 dark:bg-neutral-700 text-blue-600 dark:text-blue-400 text-lg">
            {user.username?.charAt(0)?.toUpperCase() ?? 'U'}
          </AvatarFallback>
        </Avatar>

        {/* Camera overlay button */}
        {!isUploading && !selectedFile && (
          <label
            htmlFor="avatar-upload"
            className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1.5 cursor-pointer shadow-md transition-all opacity-0 group-hover:opacity-100"
          >
            <Camera className={iconSizeMap[size === 'sm' ? 'sm' : 'md']} />
          </label>
        )}

        {/* Uploading overlay */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        id="avatar-upload"
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {/* Preview + action buttons */}
      {selectedFile && (
        <div className="flex items-center gap-2">
          <Button onClick={handleUpload} disabled={isUploading} size="sm" className="gap-1">
            {isUploading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                Save
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleCancel} size="sm" className="gap-1" disabled={isUploading}>
            <X className="h-3.5 w-3.5" />
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
