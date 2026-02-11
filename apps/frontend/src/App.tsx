import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AnimatedBackground } from './components/AnimatedBackground';
import { ErrorBoundary } from './components/ErrorBoundary';
import { MapGenerator } from './components/map/MapGenerator';
import { MapHistory } from './components/MapHistory';
import { MinimalNavigation } from './components/MinimalNavigation';
import { OAuthCallback } from './components/OAuthCallback';
import { Toaster } from './components/ui/sonner';
import { TooltipProvider } from './components/ui/tooltip';
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <>
      <AnimatedBackground />
      <AuthProvider>
        <TooltipProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <div className="min-h-screen relative z-10">
                <MinimalNavigation />

                <main className="pt-16">
                  <Routes>
                    <Route path="/" element={<MapGenerator />} />

                    <Route
                      path="/history"
                      element={
                        <div className="container mx-auto px-6 py-16">
                          <h2 className="scroll-m-20 mb-8">
                            Map History
                          </h2>
                          <MapHistory />
                        </div>
                      }
                    />

                    <Route
                      path="/profile"
                      element={
                        <div className="container mx-auto px-6 py-16">
                          <h2 className="scroll-m-20 mb-8">
                            Profile
                          </h2>
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
                          <h1 className="scroll-m-20 mb-4">
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
      <Toaster />
    </>
  );
}

export default App;
