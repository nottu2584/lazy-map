import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { seedHistoryService, type SeedHistoryEntry } from '../services/seedHistoryService';

interface MapHistoryProps {
  onLoadMap?: (seed: string, name: string) => void;
}

export function MapHistory({ onLoadMap }: MapHistoryProps) {
  const { user } = useAuth();
  const [history, setHistory] = useState<SeedHistoryEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<SeedHistoryEntry | null>(null);

  useEffect(() => {
    if (user) {
      // Load user's seed history
      const userHistory = seedHistoryService.getRecentSeeds(50);
      setHistory(userHistory);
    }
  }, [user]);

  const handleDelete = (id: string) => {
    seedHistoryService.removeEntry(id);
    setHistory(seedHistoryService.getRecentSeeds(50));
    if (selectedEntry?.id === id) {
      setSelectedEntry(null);
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all map history?')) {
      seedHistoryService.clearHistory();
      setHistory([]);
      setSelectedEntry(null);
    }
  };

  const handleLoadMap = (entry: SeedHistoryEntry) => {
    if (onLoadMap) {
      onLoadMap(String(entry.seed), entry.mapName);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to view your map history</h3>
          <p className="text-gray-600">
            Your generated maps will be saved here when you're logged in.
          </p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No maps generated yet</h3>
          <p className="text-gray-600">
            Start generating maps and they'll appear here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* History List */}
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                Your Map History ({history.length})
              </h2>
              {history.length > 5 && (
                <button
                  onClick={handleClearAll}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
            {history.map((entry) => (
              <div
                key={entry.id}
                className={`px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                  selectedEntry?.id === entry.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => setSelectedEntry(entry)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{entry.mapName}</h3>
                    <div className="mt-1 text-sm text-gray-600">
                      <p>Seed: <code className="bg-gray-100 px-1 rounded">{entry.seed}</code></p>
                      {entry.metadata?.dimensions && (
                        <p className="mt-1">
                          Size: {entry.metadata.dimensions.width} × {entry.metadata.dimensions.height}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-gray-500">
                        {new Date(entry.timestamp).toLocaleDateString()} at{' '}
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLoadMap(entry);
                      }}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Load
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(entry.id);
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selected Entry Details */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Map Details</h2>

          {selectedEntry ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Name</h3>
                <p className="mt-1 text-gray-900">{selectedEntry.mapName}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700">Seed</h3>
                <p className="mt-1 font-mono text-sm bg-gray-100 p-2 rounded break-all">
                  {selectedEntry.seed}
                </p>
              </div>

              {selectedEntry.metadata?.dimensions && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Dimensions</h3>
                  <p className="mt-1 text-gray-900">
                    {selectedEntry.metadata.dimensions.width} × {selectedEntry.metadata.dimensions.height} tiles
                  </p>
                </div>
              )}

              {selectedEntry.metadata?.cellSize && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Cell Size</h3>
                  <p className="mt-1 text-gray-900">{selectedEntry.metadata.cellSize}ft per tile</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700">Generated</h3>
                <p className="mt-1 text-gray-900">
                  {new Date(selectedEntry.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="pt-4 border-t">
                <button
                  onClick={() => handleLoadMap(selectedEntry)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Regenerate This Map
                </button>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Select a map from the list to view details
            </p>
          )}
        </div>
      </div>
    </div>
  );
}