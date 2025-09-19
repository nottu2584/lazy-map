import { useState } from 'react';
import { MapGenerator } from './components/MapGenerator';
import { Navigation } from './components/Navigation';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'generator' | 'gallery' | 'profile'>('generator');

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />

        <main className="container mx-auto px-4 py-8">
          {currentView === 'generator' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Battlemap Generator</h1>
              <MapGenerator />
            </div>
          )}

          {currentView === 'gallery' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Map Gallery</h1>
              <p className="text-gray-600">Your generated maps will appear here.</p>
            </div>
          )}

          {currentView === 'profile' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
              <p className="text-gray-600">User profile and settings.</p>
            </div>
          )}
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
