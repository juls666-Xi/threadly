require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('./models/User');
const Post = require('./models/Post');
const Message = require('./models/Message');
const Friend = require('./models/Friend');
const authMiddleware = require('./middleware/auth');

// Helper function to transform user object for frontend compatibility
const transformUser = (user) => {
  if (!user) return null;
  const userObj = user.toObject ? user.toObject() : user;
  return {
    ...userObj,
    username: userObj.name,
  };
};

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join_user', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('send_message', async (data) => {
    try {
      const { senderId, receiverId, content } = data;
      const message = new Message({ senderId, receiverId, content });
      await message.save();
      
      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'name profilePicture');
      
      // Transform senderId to include username
      const transformedMessage = populatedMessage.toObject();
      if (transformedMessage.senderId) {
        transformedMessage.senderId = {
          ...transformedMessage.senderId,
          username: transformedMessage.senderId.name,
        };
      }
      
      io.to(receiverId).emit('new_message', transformedMessage);
      console.log('Message sent:', transformedMessage);
    } catch (err) {
      console.error('Error sending message via socket:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: 'Name and password are required' });
    }

    const existingUser = await User.findOne({ name });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, password: hashedPassword });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({ token, user: { id: user._id, name: user.name } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      return res.status(400).json({ message: 'Name and password are required' });
    }

    const user = await User.findOne({ name });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({ token, user: transformUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// User routes
app.get('/api/users/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(transformUser(user));
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(transformUser(user));
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users.map(transformUser));
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/search/:query', authMiddleware, async (req, res) => {
  try {
    const users = await User.find({
      name: { $regex: req.params.query, $options: 'i' },
    }).select('-password');
    res.json(users.map(transformUser));
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/users/profile', authMiddleware, async (req, res) => {
  try {
    const { profilePicture, bio, school, interests } = req.body;
    const user = await User.findByIdAndUpdate(
      req.userId,
      { profilePicture, bio, school, interests },
      { new: true }
    ).select('-password');
    res.json(transformUser(user));
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Post routes
app.post('/api/posts', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    const post = new Post({ userId: req.userId, content });
    await post.save();
    const populatedPost = await Post.findById(post._id).populate('userId', 'name profilePicture');
    
    // Transform userId to include username
    const transformedPost = populatedPost.toObject();
    if (transformedPost.userId) {
      transformedPost.userId = {
        ...transformedPost.userId,
        username: transformedPost.userId.name,
      };
    }
    
    res.status(201).json(transformedPost);
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/posts', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find().populate('userId', 'name profilePicture').sort({ createdAt: -1 });
    
    // Transform userId to include username
    const transformedPosts = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.userId) {
        postObj.userId = {
          ...postObj.userId,
          username: postObj.userId.name,
        };
      }
      return postObj;
    });
    
    res.json(transformedPosts);
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/posts/user/:userId', authMiddleware, async (req, res) => {
  try {
    const posts = await Post.find({ userId: req.params.userId })
      .populate('userId', 'name profilePicture')
      .sort({ createdAt: -1 });
    
    // Transform userId to include username
    const transformedPosts = posts.map(post => {
      const postObj = post.toObject();
      if (postObj.userId) {
        postObj.userId = {
          ...postObj.userId,
          username: postObj.userId.name,
        };
      }
      return postObj;
    });
    
    res.json(transformedPosts);
  } catch (err) {
    console.error('Get user posts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/posts/:id', authMiddleware, async (req, res) => {
  try {
    const post = await Post.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Friend routes
app.post('/api/friends/request', authMiddleware, async (req, res) => {
  try {
    const { recipientId } = req.body;
    if (recipientId === req.userId) {
      return res.status(400).json({ message: 'Cannot send request to yourself' });
    }

    const existingRequest = await Friend.findOne({
      $or: [
        { requester: req.userId, recipient: recipientId },
        { requester: recipientId, recipient: req.userId },
      ],
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'Friend request already exists' });
    }

    const friendRequest = new Friend({ requester: req.userId, recipient: recipientId });
    await friendRequest.save();

    res.status(201).json(friendRequest);
  } catch (err) {
    console.error('Send friend request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/friends/requests', authMiddleware, async (req, res) => {
  try {
    const requests = await Friend.find({ recipient: req.userId, status: 'pending' })
      .populate('requester', 'name profilePicture');
    
    // Transform requester to include username
    const transformedRequests = requests.map(request => {
      const requestObj = request.toObject();
      if (requestObj.requester) {
        requestObj.requester = {
          ...requestObj.requester,
          username: requestObj.requester.name,
        };
      }
      return requestObj;
    });
    
    res.json(transformedRequests);
  } catch (err) {
    console.error('Get friend requests error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/friends/accept/:requestId', authMiddleware, async (req, res) => {
  try {
    const friendRequest = await Friend.findOneAndUpdate(
      { _id: req.params.requestId, recipient: req.userId },
      { status: 'accepted' },
      { new: true }
    );

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    res.json(friendRequest);
  } catch (err) {
    console.error('Accept friend request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/friends/request/:requestId', authMiddleware, async (req, res) => {
  try {
    const friendRequest = await Friend.findOneAndDelete({
      _id: req.params.requestId,
      $or: [{ requester: req.userId }, { recipient: req.userId }],
    });

    if (!friendRequest) {
      return res.status(404).json({ message: 'Friend request not found' });
    }

    res.json({ message: 'Friend request removed' });
  } catch (err) {
    console.error('Remove friend request error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/friends', authMiddleware, async (req, res) => {
  try {
    const friendships = await Friend.find({
      $or: [{ requester: req.userId }, { recipient: req.userId }],
      status: 'accepted',
    });

    const friendIds = friendships.map((f) =>
      f.requester.toString() === req.userId ? f.recipient : f.requester
    );

    const friends = await User.find({ _id: { $in: friendIds } }).select('-password');
    res.json(friends.map(transformUser));
  } catch (err) {
    console.error('Get friends error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/friends/status/:userId', authMiddleware, async (req, res) => {
  try {
    const friendship = await Friend.findOne({
      $or: [
        { requester: req.userId, recipient: req.params.userId },
        { requester: req.params.userId, recipient: req.userId },
      ],
    });

    let status = 'none';
    let requestId = undefined;
    let isRequester = false;
    
    if (friendship) {
      requestId = friendship._id.toString();
      if (friendship.status === 'accepted') {
        status = 'accepted';
      } else if (friendship.requester.toString() === req.userId) {
        status = 'pending';
        isRequester = true;
      } else {
        status = 'pending';
        isRequester = false;
      }
    }

    res.json({ status, requestId, isRequester });
  } catch (err) {
    console.error('Get friend status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/friends/:friendId', authMiddleware, async (req, res) => {
  try {
    await Friend.deleteOne({
      $or: [
        { requester: req.userId, recipient: req.params.friendId },
        { requester: req.params.friendId, recipient: req.userId },
      ],
    });

    res.json({ message: 'Friend removed' });
  } catch (err) {
    console.error('Remove friend error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Message routes
app.post('/api/messages', authMiddleware, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const message = new Message({ senderId: req.userId, receiverId, content });
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('senderId', 'name profilePicture');

    // Transform senderId to include username
    const transformedMessage = populatedMessage.toObject();
    if (transformedMessage.senderId) {
      transformedMessage.senderId = {
        ...transformedMessage.senderId,
        username: transformedMessage.senderId.name,
      };
    }

    io.to(receiverId).emit('new_message', transformedMessage);
    res.status(201).json(transformedMessage);
  } catch (err) {
    console.error('Send message error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/messages/conversation/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { senderId: req.userId, receiverId: req.params.userId },
        { senderId: req.params.userId, receiverId: req.userId },
      ],
    })
      .populate('senderId', 'name profilePicture')
      .sort({ createdAt: 1 });

    // Transform senderId to include username
    const transformedMessages = messages.map(msg => {
      const msgObj = msg.toObject();
      if (msgObj.senderId) {
        msgObj.senderId = {
          ...msgObj.senderId,
          username: msgObj.senderId.name,
        };
      }
      return msgObj;
    });

    await Message.updateMany(
      { senderId: req.params.userId, receiverId: req.userId, isRead: false },
      { isRead: true }
    );

    res.json(transformedMessages);
  } catch (err) {
    console.error('Get conversation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/messages/inbox', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.aggregate([
      { $match: { receiverId: new mongoose.Types.ObjectId(req.userId) } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$senderId',
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: { $cond: ['$isRead', 0, 1] },
          },
        },
      },
    ]);

    const senderIds = messages.map((m) => m._id);
    const senders = await User.find({ _id: { $in: senderIds } }).select('-password');
    const senderMap = {};
    senders.forEach((s) => {
      const senderObj = s.toObject();
      senderMap[s._id.toString()] = {
        ...senderObj,
        username: senderObj.name,
      };
    });

    const conversations = messages.map((m) => ({
      sender: senderMap[m._id.toString()],
      lastMessage: m.lastMessage,
      unreadCount: m.unreadCount,
    }));

    res.json(conversations);
  } catch (err) {
    console.error('Get inbox error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/messages/unread-count', authMiddleware, async (req, res) => {
  try {
    const count = await Message.countDocuments({
      receiverId: req.userId,
      isRead: false,
    });
    res.json({ count });
  } catch (err) {
    console.error('Get unread count error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
