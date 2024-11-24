import React, { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { addApp, CATEGORIES } from '../db';
import { getUserId } from '../auth';

export default function AppUpload() {
  const [appName, setAppName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [file, setFile] = useState<File | null>(null);
  const [icon, setIcon] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [iconPreview, setIconPreview] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedIcon = e.target.files?.[0];
    if (selectedIcon) {
      if (selectedIcon.type.startsWith('image/')) {
        setIcon(selectedIcon);
        const reader = new FileReader();
        reader.onload = (e) => setIconPreview(e.target?.result as string);
        reader.readAsDataURL(selectedIcon);
      } else {
        toast.error('Please select an image file for the icon');
      }
    }
  };

  const resetForm = useCallback(() => {
    setAppName('');
    setDescription('');
    setCategory(CATEGORIES[0]);
    setFile(null);
    setIcon(null);
    setIconPreview(null);
    setUploadProgress(0);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      await addApp({
        name: appName,
        description,
        category: category as any,
        file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadDate: new Date().toISOString(),
        ownerId: getUserId(),
        icon: icon || undefined,
        iconType: icon?.type
      });

      clearInterval(progressInterval);
      setUploadProgress(100);
      toast.success('App uploaded successfully!');
      resetForm();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Upload failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-lg">
      <div className="flex items-center space-x-3 mb-6">
        <CloudArrowUpIcon className="h-8 w-8 text-blue-500" />
        <h2 className="text-2xl font-bold text-gray-800">Upload New App</h2>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-4">
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
              {iconPreview ? (
                <img
                  src={iconPreview}
                  alt="App icon preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <PhotoIcon className="w-12 h-12 text-gray-400" />
                </div>
              )}
              <input
                type="file"
                onChange={handleIconChange}
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">App Icon</p>
          </div>
          <div className="flex-grow">
            <label className="block text-sm font-medium text-gray-700 mb-2">App Name</label>
            <input
              type="text"
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              placeholder="Enter app name"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows={4}
            required
            placeholder="Describe your app"
          />
        </div>
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            required
          />
          <div className="space-y-2">
            <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400" />
            <div className="text-gray-600">
              {file ? (
                <span className="text-blue-500 font-medium">{file.name}</span>
              ) : (
                <>
                  <span className="font-medium text-blue-500">Click to upload</span> or drag and drop
                </>
              )}
            </div>
            <p className="text-sm text-gray-500">Any file up to 100MB</p>
          </div>
        </div>
        
        {uploadProgress > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full"
              style={{ width: `${uploadProgress}%` }}
            />
            <div className="text-center mt-2 text-sm text-gray-600">
              {uploadProgress}% uploaded
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Uploading...' : 'Publish App'}
        </button>
      </form>
    </div>
  );
}