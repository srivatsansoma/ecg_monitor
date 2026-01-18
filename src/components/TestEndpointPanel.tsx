import React, { useEffect, useMemo, useState } from 'react';
import { Cloud, RefreshCw } from 'lucide-react';
import { CloudEndpoint } from '../types';

interface RecentItem {
  receivedAt: string;
  payload: any;
}

interface TestEndpointPanelProps {
  cloudEndpoint: CloudEndpoint | null;
}

const TestEndpointPanel: React.FC<TestEndpointPanelProps> = ({ cloudEndpoint }) => {
  const [recentUrl, setRecentUrl] = useState('http://localhost:4000/recent');
  const [items, setItems] = useState<RecentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const inferredRecentUrl = useMemo(() => {
    if (!cloudEndpoint?.url) {
      return null;
    }
    if (cloudEndpoint.url.endsWith('/ingest')) {
      return cloudEndpoint.url.replace(/\/ingest$/, '/recent');
    }
    return null;
  }, [cloudEndpoint]);

  useEffect(() => {
    if (inferredRecentUrl) {
      setRecentUrl(inferredRecentUrl);
    }
  }, [inferredRecentUrl]);

  const fetchRecent = async () => {
    if (!recentUrl.trim()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(recentUrl.trim());
      const json = await response.json();
      if (!response.ok) {
        setError(`HTTP ${response.status}`);
        setItems([]);
      } else if (Array.isArray(json.items)) {
        setItems(json.items);
      } else {
        setError('Unexpected response format');
        setItems([]);
      }
    } catch (err) {
      setError('Failed to fetch recent payloads');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }

    fetchRecent();
    const interval = setInterval(fetchRecent, 2000);
    return () => clearInterval(interval);
  }, [autoRefresh, recentUrl]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-lg">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-6 h-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">Test Endpoint Viewer</h2>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Recent Payloads URL
          </label>
          <input
            type="text"
            className="w-full bg-gray-700 text-white rounded px-3 py-2 border border-gray-600 focus:border-blue-500 focus:outline-none"
            value={recentUrl}
            onChange={(e) => setRecentUrl(e.target.value)}
            placeholder="http://localhost:4000/recent"
          />
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={fetchRecent}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded flex items-center gap-2 disabled:opacity-50"
            disabled={isLoading || !recentUrl.trim()}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            Auto-refresh (2s)
          </label>
        </div>

        {error && (
          <div className="p-3 bg-red-900 border border-red-600 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        <div className="bg-gray-900 rounded p-4 h-64 overflow-y-auto font-mono text-xs">
          {items.length === 0 ? (
            <p className="text-gray-500">No recent payloads yet.</p>
          ) : (
            items.slice(0, 25).map((item, index) => (
              <div key={`${item.receivedAt}-${index}`} className="mb-3 text-gray-200">
                <div className="text-gray-500">{new Date(item.receivedAt).toLocaleString()}</div>
                <div className="text-gray-300">
                  {JSON.stringify(item.payload, null, 2)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default TestEndpointPanel;

