import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';
import { App } from '../db';
import toast from 'react-hot-toast';
import { PlayIcon, PauseIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from '@heroicons/react/24/solid';

interface MediaPreviewProps {
  app: App;
  onClose: () => void;
}

export default function MediaPreview({ app, onClose }: MediaPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const soundRef = useRef<Howl | null>(null);
  const seekBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const url = URL.createObjectURL(app.file);
      setMediaUrl(url);

      if (app.fileType.startsWith('audio/')) {
        const sound = new Howl({
          src: [url],
          html5: true,
          format: [app.fileType.split('/')[1]],
          onload: () => {
            setIsLoading(false);
            setDuration(sound.duration());
          },
          onplay: () => setIsPlaying(true),
          onpause: () => setIsPlaying(false),
          onstop: () => setIsPlaying(false),
          onend: () => {
            setIsPlaying(false);
            setCurrentTime(0);
          },
          onloaderror: () => {
            handleError(new Error('Failed to load audio file'));
          },
          onplayerror: () => {
            handleError(new Error('Failed to play audio file'));
          }
        });

        soundRef.current = sound;

        // Update current time during playback
        const updateInterval = setInterval(() => {
          if (sound.playing()) {
            setCurrentTime(sound.seek());
          }
        }, 100);

        return () => {
          clearInterval(updateInterval);
          sound.unload();
          URL.revokeObjectURL(url);
        };
      }

      return () => URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to create media URL:', err);
      handleError(err);
    }
  }, [app.file, app.fileType]);

  const handleError = (err: any) => {
    const errorMessage = err?.message || 'Failed to load media file';
    console.error('Media error:', errorMessage);
    setError(`Failed to load media file: ${errorMessage}. Please try downloading instead.`);
    setIsLoading(false);
    toast.error('Media playback failed. Try downloading the file instead.');
  };

  const togglePlay = () => {
    if (!soundRef.current) return;
    
    if (isPlaying) {
      soundRef.current.pause();
    } else {
      soundRef.current.play();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!soundRef.current) return;
    const time = parseFloat(e.target.value);
    soundRef.current.seek(time);
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (!soundRef.current) return;
    if (isMuted) {
      soundRef.current.volume(volume);
      setIsMuted(false);
    } else {
      soundRef.current.volume(0);
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!soundRef.current) return;
    const newVolume = parseFloat(e.target.value);
    soundRef.current.volume(newVolume);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderAudioPlayer = () => {
    return (
      <div className="max-w-2xl mx-auto bg-gray-100 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={togglePlay}
            className="w-12 h-12 flex items-center justify-center bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            disabled={isLoading}
          >
            {isPlaying ? (
              <PauseIcon className="h-6 w-6" />
            ) : (
              <PlayIcon className="h-6 w-6" />
            )}
          </button>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className="p-2 text-gray-600 hover:text-gray-800"
            >
              {isMuted ? (
                <SpeakerXMarkIcon className="h-6 w-6" />
              ) : (
                <SpeakerWaveIcon className="h-6 w-6" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-24"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <input
            ref={seekBarRef}
            type="range"
            min="0"
            max={duration}
            step="0.01"
            value={currentTime}
            onChange={handleSeek}
            className="w-full"
            disabled={isLoading}
          />
        </div>
      </div>
    );
  };

  const renderVideo = () => {
    return (
      <div className="relative">
        <video
          controls
          className="w-full max-h-[70vh] bg-black"
          src={mediaUrl}
          onLoadStart={() => setIsLoading(true)}
          onLoadedData={() => setIsLoading(false)}
          onError={(e) => handleError(e.currentTarget.error)}
          controlsList="nodownload"
          playsInline
        >
          Your browser does not support the video tag.
        </video>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white">Loading...</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold">{app.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-4">
          {error ? (
            <div className="text-center py-4">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          ) : (
            app.fileType.startsWith('audio/') ? renderAudioPlayer() : renderVideo()
          )}
        </div>
      </div>
    </div>
  );
}