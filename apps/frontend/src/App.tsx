import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MapGenerator } from './components/map/MapGenerator';
import { MapHistory } from './components/MapHistory';
import { MinimalNavigation } from './components/MinimalNavigation';
import { OAuthCallback } from './components/OAuthCallback';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './contexts/AuthContext';
import { TooltipProvider } from './components/ui/tooltip';

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <div className="min-h-screen bg-background">
              <MinimalNavigation />

            <main className="pt-16">
              <Routes>
              <Route
                path="/"
                element={<MapGenerator />}
              />

              <Route
                path="/history"
                element={
                  <div className="container mx-auto px-6 py-16">
                    <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight mb-8">
                      Map History
                    </h1>
                    <MapHistory />
                  </div>
                }
              />

              <Route
                path="/profile"
                element={
                  <div className="container mx-auto px-6 py-16">
                    <h1 className="scroll-m-20 text-3xl font-semibold tracking-tight mb-8">
                      Profile
                    </h1>
                    <p className="text-lg text-muted-foreground">
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
                    <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight mb-4">
                      404
                    </h1>
                    <p className="text-lg text-muted-foreground">
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
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
