import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { messageAPI, userAPI, friendAPI } from '@/services/api';
import { socketService } from '@/services/socket';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User, Send, ArrowLeft, Loader2, MessageSquare, Paperclip, X } from 'lucide-react';
import Navbar from '@/components/Navbar';
import type { Message, User as UserType, Conversation } from '@/types';

interface ExtendedConversation extends Conversation {
  friend: UserType;
  lastMessage?: Message;
  unreadCount: number;
}

export default function Messages() {
  const { userId } = useParams<{ userId?: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [conversations, setConversations] = useState<ExtendedConversation[]>([]);
  const [friends, setFriends] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch conversations (inbox) and friends
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inboxData, friendsData] = await Promise.all([
          messageAPI.getInbox(),
          friendAPI.getFriends(),
        ]);
        setConversations(inboxData);
        setFriends(friendsData);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Load selected conversation
  useEffect(() => {
    const loadConversation = async () => {
      if (!userId) {
        setSelectedUser(null);
        setMessages([]);
        return;
      }

      try {
        const [userData, messagesData] = await Promise.all([
          userAPI.getUser(userId),
          messageAPI.getConversation(userId),
        ]);
        setSelectedUser(userData);
        setMessages(messagesData);
      } catch (error) {
        console.error('Failed to load conversation:', error);
      }
    };

    loadConversation();
  }, [userId]);

  // Listen for new messages
  useEffect(() => {
    const unsubscribe = socketService.onMessage((message) => {
      // Check if message belongs to current conversation
      const senderId = typeof message.senderId === 'string' 
        ? message.senderId 
        : message.senderId._id || message.senderId.id;
      
      const isRelevant = senderId === userId || senderId === currentUser?.id;

      if (isRelevant) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some(m => m._id === message._id)) return prev;
          return [...prev, message];
        });
      }

      // Update conversations and friends
      Promise.all([
        messageAPI.getInbox(),
        friendAPI.getFriends(),
      ]).then(([inboxData, friendsData]) => {
        setConversations(inboxData);
        setFriends(friendsData);
      });
    });

    return () => unsubscribe();
  }, [userId, currentUser?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !userId) return;

    try {
      // Send via API for persistence
      const sentMessage = await messageAPI.sendMessage(userId, newMessage.trim(), selectedFile || undefined);

      // Add message to local state
      setMessages((prev) => [...prev, sentMessage]);
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Also emit via socket for real-time delivery
      socketService.sendMessage(userId, newMessage.trim());

      // Update conversations and friends
      Promise.all([
        messageAPI.getInbox(),
        friendAPI.getFriends(),
      ]).then(([inboxData, friendsData]) => {
        setConversations(inboxData);
        setFriends(friendsData);
      });
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  const handleTyping = () => {
    if (!userId) return;

    socketService.startTyping(userId);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketService.stopTyping(userId);
    }, 1000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Merge friends with conversations
  const getAllConversations = (): ExtendedConversation[] => {
    const conversationMap = new Map<string, ExtendedConversation>();
    
    // Add existing conversations
    conversations.forEach(conv => {
      conversationMap.set(conv.friend.id, conv);
    });
    
    // Add friends without conversations
    friends.forEach(friend => {
      if (!conversationMap.has(friend.id)) {
        conversationMap.set(friend.id, {
          friend,
          lastMessage: undefined,
          unreadCount: 0,
        });
      }
    });
    
    return Array.from(conversationMap.values()).sort((a, b) => {
      // Sort by last message date (most recent first), then by username
      if (a.lastMessage && b.lastMessage) {
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      }
      if (a.lastMessage) return -1;
      if (b.lastMessage) return 1;
      return a.friend.username.localeCompare(b.friend.username);
    });
  };

  const allConversations = getAllConversations();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-blue-50">
        <Navbar />
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 border-b border-blue-100">
                <h2 className="font-semibold text-lg text-blue-900">Messages</h2>
              </div>
              <ScrollArea className="h-[calc(100%-60px)]">
                {allConversations.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No friends yet. Find friends to start messaging!
                  </div>
                ) : (
                  allConversations.map((conv) => (
                    <div
                      key={conv.friend.id}
                      className={`p-4 border-b border-blue-50 cursor-pointer hover:bg-blue-50 transition-colors ${
                        userId === conv.friend.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => navigate(`/messages/${conv.friend.id}`)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          navigate(`/messages/${conv.friend.id}`);
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {conv.friend.profilePicture ? (
                              <img
                                src={conv.friend.profilePicture}
                                alt={conv.friend.username}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          {conv.friend.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm truncate ${userId === conv.friend.id ? 'text-black' : ''}`}>{conv.friend.username}</h4>
                          {conv.lastMessage ? (
                            <p className="text-xs text-gray-500 truncate">
                              {typeof conv.lastMessage.senderId === 'string'
                                ? conv.lastMessage.content
                                : conv.lastMessage.senderId._id === currentUser?.id
                                ? `You: ${conv.lastMessage.content}`
                                : conv.lastMessage.content}
                            </p>
                          ) : (
                            <p className="text-xs text-gray-400">Start a conversation</p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <div className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conv.unreadCount}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2 flex flex-col overflow-hidden">
            {selectedUser ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-blue-100 flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                    onClick={() => navigate('/messages')}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="relative">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {selectedUser.profilePicture ? (
                        <img
                          src={selectedUser.profilePicture}
                          alt={selectedUser.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    {selectedUser.isOnline && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedUser.username}</h3>
                    <p className="text-xs text-gray-500">
                      {selectedUser.isOnline ? 'Online' : 'Offline'}
                    </p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {messages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      No messages yet. Start a conversation!
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message, index) => {
                        const isOwn = typeof message.senderId === 'string'
                          ? message.senderId === currentUser?.id
                          : message.senderId._id === currentUser?.id;
                        
                        const showDate = index === 0 || 
                          formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);

                        return (
                          <div key={message._id}>
                            {showDate && (
                              <div className="text-center my-4">
                                <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                                  {formatDate(message.createdAt)}
                                </span>
                              </div>
                            )}
                            <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                  isOwn
                                    ? 'bg-blue-600 text-white rounded-br-none'
                                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                                }`}
                              >
                                {/* Attachment display */}
                                {message.attachment && (() => {
                                  const attachment = message.attachment;
                                  return (
                                    <div className="mb-2">
                                      {attachment.mimeType.startsWith('image/') ? (
                                        <img
                                          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${attachment.url}`}
                                          alt={attachment.filename}
                                          className="max-w-full rounded-lg cursor-pointer hover:opacity-90"
                                          onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${attachment.url}`, '_blank')}
                                        />
                                      ) : attachment.mimeType.startsWith('video/') ? (
                                        <video
                                          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${attachment.url}`}
                                          controls
                                          className="max-w-full rounded-lg"
                                        />
                                      ) : attachment.mimeType.startsWith('audio/') ? (
                                        <audio
                                          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${attachment.url}`}
                                          controls
                                          className="w-full"
                                        />
                                      ) : (
                                        <a
                                          href={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${attachment.url}`}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`flex items-center space-x-2 p-2 rounded-lg ${isOwn ? 'bg-blue-700' : 'bg-gray-200'} hover:opacity-80`}
                                        >
                                          <Paperclip className="h-4 w-4" />
                                          <span className="text-sm truncate">{attachment.filename}</span>
                                          <span className="text-xs opacity-75">({formatFileSize(attachment.size)})</span>
                                        </a>
                                      )}
                                    </div>
                                  );
                                })()}
                                <p>{message.content}</p>
                                <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-500'}`}>
                                  {formatTime(message.createdAt)}
                                  {isOwn && message.isRead && ' • Read'}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input Area */}
                <div className="p-4 border-t border-blue-100">
                  {/* File preview */}
                  {selectedFile && (
                    <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-center justify-between">
                      <div className="flex items-center space-x-3 min-w-0 flex-1">
                        <Paperclip className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">{selectedFile.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={removeSelectedFile}
                        className="flex-shrink-0 h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex space-x-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-shrink-0"
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      onInput={handleTyping}
                      placeholder="Type a message..."
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() && !selectedFile}
                      className="bg-blue-600 hover:bg-blue-700 flex-shrink-0"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-blue-300" />
                  <p>Select a conversation to start messaging</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
