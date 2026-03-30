export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  school?: string;
  interests?: string[];
  isOnline?: boolean;
  lastActive?: string;
  createdAt?: string;
}

export interface Post {
  _id: string;
  userId: User | string;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Message {
  _id: string;
  senderId: User | string;
  receiverId: User | string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface Conversation {
  friend: User;
  lastMessage?: Message;
  unreadCount: number;
}

export interface FriendRequest {
  _id: string;
  requester: User;
  recipient: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface FriendStatus {
  status: 'none' | 'pending' | 'accepted';
  requestId?: string;
  isRequester?: boolean;
}
