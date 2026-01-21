import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from './LoginModal';
import { Button } from '@/components/ui/button';

export function MinimalNavigation() {
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="text-2xl font-heading font-black tracking-tight">
            LAZY MAP
          </div>
          <div>
            {user ? (
              <Button variant="ghost" onClick={logout} size="sm">
                Sign Out
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setShowLoginModal(true)} size="sm">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </>
  );
}
