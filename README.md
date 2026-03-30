# Social Network - MERN Stack Application

A full-stack social networking platform built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **User Authentication**: JWT-based register/login system
- **User Profiles**: Customizable profiles with bio, school, and interests
- **Wall/Posts**: Chronological feed with text-only posts (auto-limits to 50 posts)
- **Real-time Messaging**: One-to-one messaging with Socket.io
- **Friends System**: Add/remove friends, only friends can message
- **Online Status**: Real-time online/offline indicators

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io for real-time messaging
- JWT for authentication
- bcryptjs for password hashing

### Frontend
- React with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- shadcn/ui components
- Socket.io-client for real-time features
- React Router for navigation

## Project Structure

```
social-network/
├── backend/               # Node.js + Express backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── middleware/       # JWT auth middleware
│   ├── server.js         # Main server file
│   └── .env              # Environment variables
│
└── frontend/             # React frontend
    ├── src/
    │   ├── components/   # React components
    │   ├── pages/        # Page components
    │   ├── context/      # Auth context
    │   ├── services/     # API & Socket services
    │   └── types/        # TypeScript types
    └── dist/             # Build output
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd social-network-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/social-network
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:5173
```

4. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd social-network-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
VITE_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Users
- `GET /api/users/me` - Get current user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/profile` - Update profile
- `GET /api/users/search/:query` - Search users

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `GET /api/posts/user/:userId` - Get user's posts
- `DELETE /api/posts/:id` - Delete post

### Friends
- `GET /api/friends` - Get friends list
- `POST /api/friends/request` - Send friend request
- `PUT /api/friends/accept/:requestId` - Accept request
- `DELETE /api/friends/request/:requestId` - Reject/Cancel request
- `DELETE /api/friends/:friendId` - Remove friend

### Messages
- `GET /api/messages/inbox` - Get conversations
- `GET /api/messages/conversation/:userId` - Get messages
- `POST /api/messages` - Send message

## Design

- Clean blue-and-white color scheme
- Simple, nostalgic interface
- No complex animations
- Focus on real connections and chronological interaction

## License

MIT
