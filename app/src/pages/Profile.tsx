import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { userAPI, postAPI, friendAPI } from '@/services/api';
import { socketService } from '@/services/socket';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  User,
  MapPin,
  Heart,
  Edit2,
  Check,
  X,
  UserPlus,
  UserCheck,
  Clock,
  MessageCircle,
  Loader2,
  Home,
  Users,
  Sun,
  Moon,
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import Navbar from '@/components/Navbar';
import AvatarUpload from '@/components/AvatarUpload';
import type { User as UserType, Post, FriendStatus } from '@/types';

export default function Profile() {
  const { id } = useParams<{ id?: string }>();
  const { user: currentUser, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserType | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [friendStatus, setFriendStatus] = useState<FriendStatus>({ status: 'none' });
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editData, setEditData] = useState({
    bio: '',
    school: '',
    interests: [] as string[],
  });
  const [newInterest, setNewInterest] = useState('');

  const isOwnProfile = !id || id === currentUser?.id;
  const userId = id || currentUser?.id;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return;

      setIsLoading(true);
      try {
        const [profileData, postsData] = await Promise.all([
          userAPI.getUser(userId),
          postAPI.getUserPosts(userId),
        ]);

        setProfile(profileData);
        setPosts(postsData);
        setEditData({
          bio: profileData.bio || '',
          school: profileData.school || '',
          interests: profileData.interests || [],
        });

        // Check friend status if viewing another user's profile
        if (!isOwnProfile && currentUser?.id) {
          const status = await friendAPI.getStatus(userId);
          setFriendStatus(status);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId, isOwnProfile, currentUser?.id]);

  // Listen for avatar updates from other users via socket
  useEffect(() => {
    const handleAvatarUpdated = (data: { userId: string; avatar: string }) => {
      if (data.userId === userId && profile) {
        setProfile({ ...profile, profilePicture: data.avatar });
      }
    };

    socketService.onAvatarUpdated(handleAvatarUpdated);

    return () => {
      socketService.offAvatarUpdated(handleAvatarUpdated);
    };
  }, [userId, profile]);

  const handleAvatarUpdate = (updatedUser: UserType) => {
    setProfile(updatedUser);
    // Also update the AuthContext if this is the current user
    if (isOwnProfile) {
      updateUser(updatedUser);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await userAPI.updateProfile(editData);
      setProfile(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleAddInterest = () => {
    if (newInterest.trim() && !editData.interests.includes(newInterest.trim())) {
      setEditData({
        ...editData,
        interests: [...editData.interests, newInterest.trim()],
      });
      setNewInterest('');
    }
  };

  const handleRemoveInterest = (interest: string) => {
    setEditData({
      ...editData,
      interests: editData.interests.filter(i => i !== interest),
    });
  };

  const handleSendFriendRequest = async () => {
    if (!userId) return;
    try {
      await friendAPI.sendRequest(userId);
      const status = await friendAPI.getStatus(userId);
      setFriendStatus(status);
    } catch (error) {
      console.error('Failed to send friend request:', error);
    }
  };

  const handleAcceptFriendRequest = async () => {
    if (!friendStatus.requestId) return;
    try {
      await friendAPI.acceptRequest(friendStatus.requestId);
      const status = await friendAPI.getStatus(userId!);
      setFriendStatus(status);
    } catch (error) {
      console.error('Failed to accept friend request:', error);
    }
  };

  const handleRemoveFriend = async () => {
    if (!userId) return;
    try {
      if (friendStatus.status === 'pending' && friendStatus.requestId) {
        await friendAPI.removeRequest(friendStatus.requestId);
      } else {
        await friendAPI.removeFriend(userId);
      }
      setFriendStatus({ status: 'none' });
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const MobileSidebar = () => (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-64 bg-white dark:bg-neutral-900 p-0">
        <SheetHeader className="border-b border-blue-100 dark:border-neutral-700 p-4">
          <SheetTitle className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <MessageCircle className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-blue-900 dark:text-gray-200">SocialNet</span>
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col p-4 space-y-2">
          <Button
            variant="ghost"
            className="justify-start w-full"
            onClick={() => {
              navigate('/');
              setSidebarOpen(false);
            }}
          >
            <Home className="mr-3 h-5 w-5" />
            Home
          </Button>
          <Button
            variant="ghost"
            className="justify-start w-full"
            onClick={() => {
              navigate('/profile');
              setSidebarOpen(false);
            }}
          >
            <User className="mr-3 h-5 w-5" />
            Profile
          </Button>
          <Button
            variant="ghost"
            className="justify-start w-full"
            onClick={() => {
              navigate('/friends');
              setSidebarOpen(false);
            }}
          >
            <Users className="mr-3 h-5 w-5" />
            Friends
          </Button>
          <Button
            variant="ghost"
            className="justify-start w-full"
            onClick={() => {
              navigate('/messages');
              setSidebarOpen(false);
            }}
          >
            <MessageCircle className="mr-3 h-5 w-5" />
            Messages
          </Button>
          <div className="border-t border-blue-100 dark:border-neutral-700 my-2"></div>
          <Button
            variant="ghost"
            className="justify-start w-full"
            onClick={() => {
              toggleTheme();
            }}
          >
            {theme === 'dark' ? (
              <Sun className="mr-3 h-5 w-5" />
            ) : (
              <Moon className="mr-3 h-5 w-5" />
            )}
            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );

  const renderFriendButton = () => {
    if (isOwnProfile) return null;

    return (
      <div className="flex flex-col space-y-2">
        <Button variant="outline" onClick={() => navigate(`/messages/${userId}`)}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Message
        </Button>
        {friendStatus.status === 'accepted' && (
          <Button variant="outline" onClick={handleRemoveFriend}>
            <UserCheck className="mr-2 h-4 w-4" />
            Friends
          </Button>
        )}
        {friendStatus.status === 'none' && (
          <Button onClick={handleSendFriendRequest}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Friend
          </Button>
        )}
        {friendStatus.status === 'pending' && (
          friendStatus.isRequester ? (
            <Button variant="outline" onClick={handleRemoveFriend}>
              <Clock className="mr-2 h-4 w-4" />
              Request Sent
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button onClick={handleAcceptFriendRequest}>
                <Check className="mr-2 h-4 w-4" />
                Accept
              </Button>
              <Button variant="outline" onClick={handleRemoveFriend}>
                <X className="mr-2 h-4 w-4" />
                Decline
              </Button>
            </div>
          )
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-neutral-900">
        <Navbar />
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-neutral-900">
        <Navbar />
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-neutral-900">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Profile Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
              {/* Avatar Upload (only on own profile) */}
              {isOwnProfile && profile ? (
                <AvatarUpload
                  user={profile}
                  onAvatarUpdate={handleAvatarUpdate}
                  size="lg"
                />
              ) : (
                <div className="w-24 h-24 bg-blue-100 dark:bg-neutral-700 rounded-full flex items-center justify-center overflow-hidden">
                  {profile.profilePicture ? (
                    <img
                      src={profile.profilePicture.startsWith('http')
                        ? profile.profilePicture
                        : `${import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000'}${profile.profilePicture}`}
                      alt={profile.username}
                      className="w-24 h-24 rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                  )}
                </div>
              )}

              <div className="flex-1 text-center md:text-left">
                <h1 className="text-2xl font-bold text-blue-900 dark:text-gray-100">{profile.username}</h1>

                {profile.school && (
                  <div className="flex items-center justify-center md:justify-start text-gray-600 dark:text-gray-400 mt-1">
                    <MapPin className="h-4 w-4 mr-1" />
                    {profile.school}
                  </div>
                )}
                
                {profile.bio && !isEditing && (
                  <p className="text-gray-700 dark:text-gray-300 mt-3">{profile.bio}</p>
                )}

                {isEditing && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <Label>Bio</Label>
                      <Textarea
                        value={editData.bio}
                        onChange={(e) => setEditData({ ...editData, bio: e.target.value })}
                        maxLength={200}
                      />
                    </div>
                    <div>
                      <Label>School</Label>
                      <Input
                        value={editData.school}
                        onChange={(e) => setEditData({ ...editData, school: e.target.value })}
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label>Interests</Label>
                      <div className="flex space-x-2 mb-2">
                        <Input
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          placeholder="Add an interest"
                          onKeyPress={(e) => e.key === 'Enter' && handleAddInterest()}
                        />
                        <Button type="button" onClick={handleAddInterest}>
                          Add
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {editData.interests.map((interest) => (
                          <Badge key={interest} variant="secondary" className="cursor-pointer" onClick={() => handleRemoveInterest(interest)}>
                            {interest} ×
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={handleSaveProfile}>Save</Button>
                      <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                    </div>
                  </div>
                )}

                {profile.interests && profile.interests.length > 0 && !isEditing && (
                  <div className="flex flex-wrap gap-2 mt-3 justify-center md:justify-start">
                    {profile.interests.map((interest) => (
                      <Badge key={interest} variant="secondary">
                        <Heart className="h-3 w-3 mr-1" />
                        {interest}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2">
                {isOwnProfile ? (
                  <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                    <Edit2 className="mr-2 h-4 w-4" />
                    {isEditing ? 'Cancel' : 'Edit Profile'}
                  </Button>
                ) : (
                  renderFriendButton()
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        <Tabs defaultValue="posts">
          <TabsList className="mb-4">
            <TabsTrigger value="posts">Posts ({posts.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts">
            {posts.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-lg border border-blue-100 dark:border-neutral-700">
                <p className="text-gray-500 dark:text-gray-400">No posts yet</p>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} onDelete={() => postAPI.getUserPosts(userId!).then(setPosts)} />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
