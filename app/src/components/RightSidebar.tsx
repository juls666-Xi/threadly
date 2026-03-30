import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, MessageCircle, Loader2 } from 'lucide-react';
import { friendAPI } from '@/services/api';
import { socketService } from '@/services/socket';
import type { User as UserType } from '@/types';

export default function RightSidebar() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [onlineFriendIds, setOnlineFriendIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await friendAPI.getFriends();
        setFriends(data);
        // Set initially online friends
        setOnlineFriendIds(new Set(data.filter(f => f.isOnline).map(f => f.id)));
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriends();

    // Listen for online/offline status updates
    const unsubscribeOnline = socketService.onUserOnline((userId) => {
      setOnlineFriendIds(prev => new Set([...prev, userId]));
    });

    const unsubscribeOffline = socketService.onUserOffline((userId) => {
      setOnlineFriendIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    });

    return () => {
      unsubscribeOnline();
      unsubscribeOffline();
    };
  }, []);

  const onlineFriends = friends.filter(f => onlineFriendIds.has(f.id));
  const offlineFriends = friends.filter(f => !onlineFriendIds.has(f.id));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
          Online Friends ({onlineFriends.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
          </div>
        ) : friends.length === 0 ? (
          <p className="text-center text-gray-500 py-4">No friends yet</p>
        ) : (
          <div className="space-y-3">
            {/* Online Friends */}
            {onlineFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer"
                onClick={() => navigate(`/messages/${friend.id}`)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {friend.profilePicture ? (
                        <img
                          src={friend.profilePicture}
                          alt={friend.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <span className="font-medium text-sm">{friend.username}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MessageCircle className="h-4 w-4 text-blue-600" />
                </Button>
              </div>
            ))}

            {/* Offline Friends */}
            {offlineFriends.map((friend) => (
              <div
                key={friend.id}
                className="flex items-center justify-between p-2 hover:bg-blue-50 rounded-lg cursor-pointer opacity-60"
                onClick={() => navigate(`/messages/${friend.id}`)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {friend.profilePicture ? (
                        <img
                          src={friend.profilePicture}
                          alt={friend.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-gray-400 border-2 border-white rounded-full"></div>
                  </div>
                  <span className="font-medium text-sm">{friend.username}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MessageCircle className="h-4 w-4 text-gray-400" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
