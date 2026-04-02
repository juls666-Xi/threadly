import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { socketService } from '@/services/socket';
import Navbar from '@/components/Navbar';
import LeftSidebar from '@/components/LeftSidebar';
import RightSidebar from '@/components/RightSidebar';
import Feed from '@/components/Feed';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Home as HomeIcon, User, Users, MessageCircle, MessageSquare, Moon, Sun } from 'lucide-react';

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);
    }

    return () => {
      socketService.disconnect();
    };
  }, [user?.id]);

  const MobileSidebar = () => (
    <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <SheetContent side="left" className="w-64 bg-background p-0">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle className="flex items-center space-x-2">
            <div className="bg-blue-600 p-1.5 rounded-lg">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold text-foreground">SocialNet</span>
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
            <HomeIcon className="mr-3 h-5 w-5" />
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
          <div className="border-t border-border my-2"></div>
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

  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      <MobileSidebar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <LeftSidebar />
            </div>
          </div>

          {/* Main Feed */}
          <div className="col-span-1 lg:col-span-2">
            <Feed />
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <RightSidebar />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
