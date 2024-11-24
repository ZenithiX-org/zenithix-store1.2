import React, { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import AppUpload from './components/AppUpload';
import AppList from './components/AppList';

function App() {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-blue-600">ZenithiX App Store</h1>
            <button
              onClick={() => setShowUpload(!showUpload)}
              className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {showUpload ? 'Browse Apps' : 'Upload App'}
            </button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        {showUpload ? <AppUpload /> : <AppList />}
      </main>
      
      <Toaster position="bottom-right" />
    </div>
  );
}

export default App;