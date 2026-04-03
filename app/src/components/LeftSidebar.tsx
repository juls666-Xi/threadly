import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { User, Users, MessageCircle, Home, Loader2, Moon, Sun } from 'lucide-react';
import { userAPI } from '@/services/api';
import type { User as UserType } from '@/types';

export default function LeftSidebar() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await userAPI.getMe();
        setCurrentUser(data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Users, label: 'Friends', path: '/friends' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
  ];

  return (
    <div className="space-y-4">
      {/* Profile Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="text-center">
              <div
                className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center cursor-pointer"
                onClick={() => navigate('/profile')}
              >
                {currentUser?.profilePicture ? (
                  <img
                    src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${currentUser.profilePicture}`}
                    alt={currentUser.username}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <User className="h-10 w-10 text-blue-600" />
                )}
              </div>
              <h3 className="font-semibold text-lg text-foreground">{currentUser?.username}</h3>
              {currentUser?.school && (
                <p className="text-sm text-muted-foreground">{currentUser.school}</p>
              )}
              {currentUser?.bio && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{currentUser.bio}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Menu */}
      <Card className="bg-card border-border">
        <CardContent className="p-2">
          <nav className="space-y-1">
            {menuItems.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => navigate(item.path)}
              >
                <item.icon className="mr-3 h-5 w-5 text-blue-600" />
                {item.label}
              </Button>
            ))}
            <div className="border-t border-border my-2"></div>
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={toggleTheme}
            >
              {theme === 'dark' ? (
                <Sun className="mr-3 h-5 w-5" />
              ) : (
                <Moon className="mr-3 h-5 w-5" />
              )}
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
          </nav>
        </CardContent>
      </Card>
    </div>
  );
}
