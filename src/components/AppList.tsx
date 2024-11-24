import React, { useEffect, useState, useCallback } from 'react';
import { getAllApps, getAppsByCategory, deleteApp, type App, CATEGORIES } from '../db';
import HTMLPreview from './HTMLPreview';
import MediaPreview from './MediaPreview';
import toast from 'react-hot-toast';
import { TrashIcon, PlayCircleIcon, MusicalNoteIcon, VideoCameraIcon, DocumentIcon } from '@heroicons/react/24/outline';
import { getUserId } from '../auth';

export default function AppList() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [apps, setApps] = useState<App[]>([]);
  const [previewApp, setPreviewApp] = useState<App | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUserId = getUserId();

  const loadApps = useCallback(async () => {
    if (loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let loadedApps: App[];
      if (selectedCategory === 'All') {
        loadedApps = await getAllApps();
      } else {
        loadedApps = await getAppsByCategory(selectedCategory as App['category']);
      }
      setApps(loadedApps.reverse());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load apps';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, loading]);

  useEffect(() => {
    let mounted = true;

    const fetchApps = async () => {
      if (!mounted) return;
      await loadApps();
    };

    fetchApps();
    const interval = setInterval(fetchApps, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [loadApps]);

  const handleDownload = useCallback((app: App) => {
    const url = URL.createObjectURL(app.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = app.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const handlePreview = useCallback((app: App) => {
    if (app.fileType === 'text/html' || 
        app.fileType.startsWith('audio/') || 
        app.fileType.startsWith('video/')) {
      setPreviewApp(app);
    }
  }, []);

  const handleDelete = useCallback(async (app: App) => {
    if (!app.id) return;
    
    if (!confirm('Are you sure you want to delete this app?')) {
      return;
    }
    
    try {
      await deleteApp(app.id);
      await loadApps();
      toast.success('App deleted successfully');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete app';
      toast.error(message);
    }
  }, [loadApps]);

  const getIconUrl = useCallback((app: App) => {
    if (app.icon) {
      return URL.createObjectURL(app.icon);
    }
    return null;
  }, []);

  const getFileTypeIcon = useCallback((fileType: string) => {
    if (fileType.startsWith('audio/')) {
      return <MusicalNoteIcon className="h-8 w-8 text-blue-500" />;
    } else if (fileType.startsWith('video/')) {
      return <VideoCameraIcon className="h-8 w-8 text-blue-500" />;
    } else {
      return <DocumentIcon className="h-8 w-8 text-blue-500" />;
    }
  }, []);

  return (
    <div className="max-w-6xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Browse Apps</h2>
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedCategory('All')}
            className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
              selectedCategory === 'All'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          {CATEGORIES.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {loading && apps.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Loading apps...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 text-lg">{error}</p>
          <button
            onClick={loadApps}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      ) : apps.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            No apps found in this category. Be the first to upload one!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {apps.map((app) => {
            const iconUrl = getIconUrl(app);
            const canPreview = app.fileType === 'text/html' || 
                             app.fileType.startsWith('audio/') || 
                             app.fileType.startsWith('video/');
            
            return (
              <div key={app.id} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex items-start space-x-4 mb-4">
                  <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                    {iconUrl ? (
                      <img
                        src={iconUrl}
                        alt={`${app.name} icon`}
                        className="w-full h-full object-cover"
                        onLoad={() => URL.revokeObjectURL(iconUrl)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50">
                        {getFileTypeIcon(app.fileType)}
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-semibold text-gray-800">{app.name}</h3>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {app.category}
                      </span>
                    </div>
                    <p className="text-gray-600 mt-2 line-clamp-2">{app.description}</p>
                  </div>
                </div>
                <div className="text-sm text-gray-500 mb-4 space-y-1">
                  <p>Size: {(app.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                  <p>Type: {app.fileType}</p>
                  <p>Uploaded: {new Date(app.uploadDate).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleDownload(app)}
                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                  >
                    Download
                  </button>
                  {canPreview && (
                    <button
                      onClick={() => handlePreview(app)}
                      className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <PlayCircleIcon className="h-5 w-5" />
                      Preview
                    </button>
                  )}
                  {app.ownerId === currentUserId && (
                    <button
                      onClick={() => handleDelete(app)}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                      title="Delete app"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {previewApp && (
        previewApp.fileType === 'text/html' ? (
          <HTMLPreview app={previewApp} onClose={() => setPreviewApp(null)} />
        ) : (
          <MediaPreview app={previewApp} onClose={() => setPreviewApp(null)} />
        )
      )}
    </div>
  );
}