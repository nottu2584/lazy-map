import { useState } from 'react';
import { User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from './LoginModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-2xl font-heading font-black tracking-tight">LAZY MAP</div>
          <div>
            {user ? (
              <Button variant="outline" onClick={logout} size="sm" className="gap-2">
                <Avatar className="h-6 w-6">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.username} />}
                  <AvatarFallback className="text-[10px]">
                    <User className="h-3.5 w-3.5" />
                  </AvatarFallback>
                </Avatar>
                Sign Out
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowLoginModal(true)}
                size="sm"
                className="gap-2"
              >
                <User className="h-4 w-4" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
    </>
  );
}
