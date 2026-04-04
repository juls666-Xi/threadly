import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { friendAPI, userAPI } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Search, 
  MessageCircle,
  Check,
  X,
  Loader2
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import type { User as UserType, FriendRequest } from '@/types';

export default function Friends() {
  const navigate = useNavigate();
  
  const [friends, setFriends] = useState<UserType[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchResults, setSearchResults] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        friendAPI.getFriends(),
        friendAPI.getRequests(),
      ]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Failed to fetch friends data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await userAPI.searchUsers(searchQuery.trim());
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      await friendAPI.acceptRequest(requestId);
      fetchData();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      await friendAPI.removeRequest(requestId);
      fetchData();
    } catch (error) {
      console.error('Failed to reject request:', error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Are you sure you want to remove this friend?')) return;
    
    try {
      await friendAPI.removeFriend(friendId);
      fetchData();
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await friendAPI.sendRequest(userId);
      handleSearch(); // Refresh search results
    } catch (error) {
      console.error('Failed to send request:', error);
    }
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

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-neutral-900">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="friends">
          <TabsList className="mb-6">
            <TabsTrigger value="friends">
              <UserCheck className="h-4 w-4 mr-2" />
              Friends ({friends.length})
            </TabsTrigger>
            <TabsTrigger value="requests">
              <UserPlus className="h-4 w-4 mr-2" />
              Requests ({requests.length})
            </TabsTrigger>
            <TabsTrigger value="find">
              <Search className="h-4 w-4 mr-2" />
              Find Friends
            </TabsTrigger>
          </TabsList>

          <TabsContent value="friends">
            <Card>
              <CardHeader>
                <CardTitle>Your Friends</CardTitle>
              </CardHeader>
              <CardContent>
                {friends.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <UserX className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>You don't have any friends yet</p>
                    <Button 
                      variant="link" 
                      onClick={() => document.querySelector('[value="find"]')?.dispatchEvent(new Event('click'))}
                    >
                      Find friends
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="flex items-center justify-between p-4 border border-blue-100 dark:border-neutral-700 rounded-lg hover:bg-blue-50 dark:hover:bg-neutral-800"
                      >
                        <div
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() => navigate(`/profile/${friend.id}`)}
                        >
                          <div className="relative">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                              {friend.profilePicture ? (
                                <img
                                  src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${friend.profilePicture}`}
                                  alt={friend.username}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                              )}
                            </div>
                            {friend.isOnline && (
                              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{friend.username}</h4>
                            <p className="text-sm text-gray-500">
                              {friend.isOnline ? 'Online' : 'Offline'}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => navigate(`/messages/${friend.id}`)}
                          >
                            <MessageCircle className="h-5 w-5 text-blue-600" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => handleRemoveFriend(friend.id)}
                          >
                            <UserX className="h-5 w-5 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests">
            <Card>
              <CardHeader>
                <CardTitle>Friend Requests</CardTitle>
              </CardHeader>
              <CardContent>
                {requests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <UserPlus className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>No pending friend requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {requests.map((request) => (
                      <div
                        key={request._id}
                        className="flex items-center justify-between p-4 border border-blue-100 dark:border-neutral-700 rounded-lg"
                      >
                        <div
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() => navigate(`/profile/${request.requester._id}`)}
                        >
                          <div className="w-12 h-12 bg-blue-100 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                            {request.requester.profilePicture ? (
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${request.requester.profilePicture}`}
                                alt={request.requester.username}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{request.requester.username}</h4>
                            <p className="text-sm text-gray-500">Wants to be your friend</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => handleAcceptRequest(request._id)}
                            size="sm"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Accept
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => handleRejectRequest(request._id)}
                            size="sm"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="find">
            <Card>
              <CardHeader>
                <CardTitle>Find Friends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-6">
                  <Input
                    placeholder="Search by username or school..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button 
                    onClick={handleSearch}
                    disabled={isSearching || !searchQuery.trim()}
                  >
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border border-blue-100 dark:border-neutral-700 rounded-lg"
                      >
                        <div
                          className="flex items-center space-x-3 cursor-pointer"
                          onClick={() => navigate(`/profile/${user.id}`)}
                        >
                          <div className="w-12 h-12 bg-blue-100 dark:bg-neutral-700 rounded-full flex items-center justify-center">
                            {user.profilePicture ? (
                              <img
                                src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${user.profilePicture}`}
                                alt={user.username}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold">{user.username}</h4>
                            {user.school && (
                              <p className="text-sm text-gray-500">{user.school}</p>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => handleSendRequest(user.id)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : searchQuery && !isSearching ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Search className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                    <p>No users found</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
