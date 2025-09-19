import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentView: 'generator' | 'gallery' | 'profile';
  onViewChange: (view: 'generator' | 'gallery' | 'profile') => void;
}

export function Navigation({ currentView, onViewChange }: NavigationProps) {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-xl font-bold text-gray-900">Lazy Map</h1>

            {user && (
              <div className="flex space-x-6">
                <button
                  onClick={() => onViewChange('generator')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'generator'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Generator
                </button>
                <button
                  onClick={() => onViewChange('gallery')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'gallery'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Gallery
                </button>
                <button
                  onClick={() => onViewChange('profile')}
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    currentView === 'profile'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Profile
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">
                  Welcome, {user.username}
                </span>
                <button
                  onClick={logout}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Sign in to generate maps
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}