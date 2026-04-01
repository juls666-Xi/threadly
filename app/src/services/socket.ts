import { io, Socket } from 'socket.io-client';
import type { Message } from '@/types';

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

class SocketService {
  private socket: Socket | null = null;
  private messageListeners: ((message: Message) => void)[] = [];
  private typingListeners: ((userId: string) => void)[] = [];
  private stopTypingListeners: ((userId: string) => void)[] = [];
  private userOnlineListeners: ((userId: string) => void)[] = [];
  private userOfflineListeners: ((userId: string) => void)[] = [];

  connect(userId: string) {
    if (this.socket) {
      this.disconnect();
    }

    this.socket = io(SOCKET_URL);

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.socket?.emit('join', userId);
    });

    this.socket.on('newMessage', (message: Message) => {
      this.messageListeners.forEach(listener => listener(message));
    });

    this.socket.on('messageSent', (message: Message) => {
      this.messageListeners.forEach(listener => listener(message));
    });

    this.socket.on('userTyping', ({ userId }: { userId: string }) => {
      this.typingListeners.forEach(listener => listener(userId));
    });

    this.socket.on('userStoppedTyping', ({ userId }: { userId: string }) => {
      this.stopTypingListeners.forEach(listener => listener(userId));
    });

    this.socket.on('userOnline', (userId: string) => {
      this.userOnlineListeners.forEach(listener => listener(userId));
    });

    this.socket.on('userOffline', (userId: string) => {
      this.userOfflineListeners.forEach(listener => listener(userId));
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  sendMessage(receiverId: string, content: string) {
    if (this.socket) {
      this.socket.emit('sendMessage', { receiverId, content });
    }
  }

  startTyping(receiverId: string) {
    if (this.socket) {
      this.socket.emit('typing', { receiverId });
    }
  }

  stopTyping(receiverId: string) {
    if (this.socket) {
      this.socket.emit('stopTyping', { receiverId });
    }
  }

  onMessage(callback: (message: Message) => void) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== callback);
    };
  }

  onTyping(callback: (userId: string) => void) {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter(l => l !== callback);
    };
  }

  onStopTyping(callback: (userId: string) => void) {
    this.stopTypingListeners.push(callback);
    return () => {
      this.stopTypingListeners = this.stopTypingListeners.filter(l => l !== callback);
    };
  }

  onUserOnline(callback: (userId: string) => void) {
    this.userOnlineListeners.push(callback);
    return () => {
      this.userOnlineListeners = this.userOnlineListeners.filter(l => l !== callback);
    };
  }

  onUserOffline(callback: (userId: string) => void) {
    this.userOfflineListeners.push(callback);
    return () => {
      this.userOfflineListeners = this.userOfflineListeners.filter(l => l !== callback);
    };
  }
}

export const socketService = new SocketService();
