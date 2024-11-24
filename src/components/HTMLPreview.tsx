import React, { useEffect, useState } from 'react';
import { App } from '../db';
import { ArrowsPointingInIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface HTMLPreviewProps {
  app: App;
  onClose: () => void;
}

export default function HTMLPreview({ app, onClose }: HTMLPreviewProps) {
  const [html, setHtml] = useState<string>('');
  const [viewportSize, setViewportSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setHtml(e.target?.result as string);
    };
    reader.readAsText(app.file);
  }, [app]);

  const getViewportWidth = () => {
    switch (viewportSize) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'max-w-6xl';
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 ${
      isFullscreen ? 'p-0' : 'p-4'
    }`}>
      <div className={`bg-white rounded-lg flex flex-col ${
        isFullscreen ? 'w-full h-full rounded-none' : 'w-full h-[80vh]'
      }`}>
        <div className="p-4 border-b flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h3 className="text-xl font-semibold">{app.name} - Preview</h3>
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={() => setViewportSize('mobile')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  viewportSize === 'mobile'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Mobile
              </button>
              <button
                onClick={() => setViewportSize('tablet')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  viewportSize === 'tablet'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Tablet
              </button>
              <button
                onClick={() => setViewportSize('desktop')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  viewportSize === 'desktop'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                Desktop
              </button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
              title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
            >
              {isFullscreen ? (
                <ArrowsPointingInIcon className="w-5 h-5" />
              ) : (
                <ArrowsPointingOutIcon className="w-5 h-5" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden bg-gray-100 p-4">
          <div className={`mx-auto h-full transition-all duration-300 ${getViewportWidth()}`}>
            <iframe
              srcDoc={html}
              className="w-full h-full bg-white rounded-lg shadow-lg transition-all duration-300"
              sandbox="allow-scripts"
              title={`Preview of ${app.name}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}