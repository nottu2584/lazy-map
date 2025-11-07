import { useState } from 'react';
import { MapGenerator } from './components/MapGenerator';
import { MapHistory } from './components/MapHistory';
import { Navigation } from './components/Navigation';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<'generator' | 'history' | 'profile'>('generator');

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Navigation currentView={currentView} onViewChange={setCurrentView} />

        <main className="container mx-auto px-4 py-8">
          {currentView === 'generator' && (
            <div>
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-gray-900 mb-3">
                  Tactical Battlemap Generator
                </h1>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Generate unique tactical maps for your tabletop RPG sessions.
                  Each map is procedurally generated with realistic terrain, vegetation, and structures.
                </p>
              </div>
              <MapGenerator />
            </div>
          )}

          {currentView === 'history' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Map History</h1>
              <MapHistory />
            </div>
          )}

          {currentView === 'profile' && (
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>
              <p className="text-gray-600">Manage your account and preferences.</p>
            </div>
          )}
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
