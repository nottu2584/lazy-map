import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LoginModal } from './LoginModal';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const { user, logout } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:text-foreground'
    }`;

  return (
    <>
      <nav className="bg-card shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold">🗺️ Lazy Map</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <NavLink to="/" className={navLinkClass}>
                Generator
              </NavLink>

              {user && (
                <>
                  <NavLink to="/history" className={navLinkClass}>
                    Map History
                  </NavLink>
                  <NavLink to="/profile" className={navLinkClass}>
                    Profile
                  </NavLink>
                </>
              )}
            </div>

            {/* Desktop Auth Section */}
            <div className="hidden md:flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-muted-foreground">
                    Welcome, <span className="font-medium">{user.username}</span>
                  </span>
                  <Button variant="outline" onClick={logout} size="sm">
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground hidden lg:inline">
                    Save your maps
                  </span>
                  <Button onClick={() => setShowLoginModal(true)} size="sm">
                    Sign In
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t">
              <div className="flex flex-col space-y-3">
                <NavLink
                  to="/"
                  className={({ isActive }) =>
                    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                    }`
                  }
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Generator
                </NavLink>

                {user && (
                  <>
                    <NavLink
                      to="/history"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                        }`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Map History
                    </NavLink>
                    <NavLink
                      to="/profile"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground'
                        }`
                      }
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Profile
                    </NavLink>
                  </>
                )}

                <div className="pt-3 border-t">
                  {user ? (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground px-3">
                        Welcome, <span className="font-medium">{user.username}</span>
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="w-full"
                      >
                        Sign Out
                      </Button>
                    </div>
                  ) : (
                    <Button
                      onClick={() => {
                        setShowLoginModal(true);
                        setMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      Sign In
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </>
  );
}
