import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SimplifiedMapGenerator } from './components/map/MapGenerator';
import { MapHistory } from './components/MapHistory';
import { MinimalNavigation } from './components/MinimalNavigation';
import { OAuthCallback } from './components/OAuthCallback';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ErrorBoundary>
          <div className="min-h-screen bg-background">
            <MinimalNavigation />

            <main className="pt-16">
              <Routes>
              <Route
                path="/"
                element={<SimplifiedMapGenerator />}
              />

              <Route
                path="/history"
                element={
                  <div className="container mx-auto px-6 py-16">
                    <h1 className="text-section-title font-heading mb-8">Map History</h1>
                    <MapHistory />
                  </div>
                }
              />

              <Route
                path="/profile"
                element={
                  <div className="container mx-auto px-6 py-16">
                    <h1 className="text-section-title font-heading mb-8">Profile</h1>
                    <p className="text-body-large text-muted-foreground">
                      Manage your account and preferences.
                    </p>
                  </div>
                }
              />

              <Route path="/auth/callback" element={<OAuthCallback />} />

              <Route
                path="*"
                element={
                  <div className="text-center py-32 px-6">
                    <h1 className="text-hero font-heading mb-4">404</h1>
                    <p className="text-body-large text-muted-foreground">
                      The page you're looking for doesn't exist.
                    </p>
                  </div>
                }
              />
              </Routes>
            </main>
          </div>
        </ErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
