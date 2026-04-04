import axios from 'axios';
import type { User, Post, Message, Conversation, FriendRequest, FriendStatus } from '@/types';

const API_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000';

if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn('VITE_API_BASE_URL is not set; using localhost:5000. Set VITE_API_BASE_URL in production.');
}

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log response errors for debugging
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error)) {
      console.error(`API Error [${error.config?.method?.toUpperCase()} ${error.config?.url}]:`, {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: async (name: string, password: string) => {
    const response = await api.post('/auth/register', { name, password });
    return response.data;
  },

  login: async (name: string, password: string) => {
    const response = await api.post('/auth/login', { name, password });
    return response.data;
  },

  logout: async (userId: string) => {
    const response = await api.post('/auth/logout', { userId });
    return response.data;
  },
};

// User API
export const userAPI = {
  getMe: async (): Promise<User> => {
    const response = await api.get('/users/me');
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  uploadAvatar: async (file: File): Promise<{ message: string; user: User }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/users/upload-avatar', formData);
    return response.data;
  },

  searchUsers: async (query: string): Promise<User[]> => {
    const response = await api.get(`/users/search/${query}`);
    return response.data;
  },

  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users');
    return response.data;
  },
};

// Post API
export const postAPI = {
  createPost: async (content: string, file?: File): Promise<Post> => {
    if (file) {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('image', file);

      const response = await api.post('/posts', formData);
      return response.data;
    } else {
      const response = await api.post('/posts', { content });
      return response.data;
    }
  },
  
  getPosts: async (): Promise<Post[]> => {
    const response = await api.get('/posts');
    return response.data;
  },
  
  getUserPosts: async (userId: string): Promise<Post[]> => {
    const response = await api.get(`/posts/user/${userId}`);
    return response.data;
  },
  
  deletePost: async (postId: string) => {
    const response = await api.delete(`/posts/${postId}`);
    return response.data;
  },

  upvotePost: async (postId: string): Promise<Post> => {
    const response = await api.post(`/posts/${postId}/upvote`);
    return response.data;
  },

  addComment: async (postId: string, content: string): Promise<Post> => {
    const response = await api.post(`/posts/${postId}/comments`, { content });
    return response.data;
  },

  deleteComment: async (postId: string, commentId: string): Promise<Post> => {
    const response = await api.delete(`/posts/${postId}/comments/${commentId}`);
    return response.data;
  },
};

// Friend API
export const friendAPI = {
  sendRequest: async (recipientId: string) => {
    const response = await api.post('/friends/request', { recipientId });
    return response.data;
  },
  
  acceptRequest: async (requestId: string) => {
    const response = await api.put(`/friends/accept/${requestId}`);
    return response.data;
  },
  
  removeRequest: async (requestId: string) => {
    const response = await api.delete(`/friends/request/${requestId}`);
    return response.data;
  },
  
  removeFriend: async (friendId: string) => {
    const response = await api.delete(`/friends/${friendId}`);
    return response.data;
  },
  
  getFriends: async (): Promise<User[]> => {
    const response = await api.get('/friends');
    return response.data;
  },
  
  getRequests: async (): Promise<FriendRequest[]> => {
    const response = await api.get('/friends/requests');
    return response.data;
  },
  
  getStatus: async (userId: string): Promise<FriendStatus> => {
    const response = await api.get(`/friends/status/${userId}`);
    return response.data;
  },
};

// Message API
export const messageAPI = {
  sendMessage: async (receiverId: string, content: string, file?: File): Promise<Message> => {
    if (file) {
      const formData = new FormData();
      formData.append('receiverId', receiverId);
      formData.append('content', content);
      formData.append('attachment', file);

      const response = await api.post('/messages', formData);
      return response.data;
    } else {
      const response = await api.post('/messages', { receiverId, content });
      return response.data;
    }
  },
  
  getConversation: async (userId: string): Promise<Message[]> => {
    const response = await api.get(`/messages/conversation/${userId}`);
    return response.data;
  },
  
  getInbox: async (): Promise<Conversation[]> => {
    const response = await api.get('/messages/inbox');
    return response.data;
  },
  
  getUnreadCount: async (): Promise<number> => {
    const response = await api.get('/messages/unread-count');
    return response.data.count;
  },
};

export default api;
