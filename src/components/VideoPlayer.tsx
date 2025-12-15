import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  url: string;
  poster?: string | null;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null); // Reset error on new URL

    // Determine the type of stream based on the URL
    const isMp4 = url.toLowerCase().endsWith('.mp4');
    const isM3u8 = url.toLowerCase().endsWith('.m3u8');

    let hls: Hls | null = null;

    if (isMp4) {
      // --- NATIVE MP4 PLAYBACK ---
      console.log("[VideoPlayer] Detected MP4 stream. Using native playback.");
      if (video.canPlayType('video/mp4')) {
        video.src = url;
        video.load();
        video.addEventListener('error', () => {
            setError('The browser could not play this video file.');
        });
      } else {
          setError('Your browser does not support MP4 playback.');
      }
    } else if (Hls.isSupported()) {
      // --- HLS.JS PLAYBACK for M3U8 and other streams ---
      console.log("[VideoPlayer] Detected HLS stream. Using hls.js.");
      hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);

      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
            let errorMessage = 'An unknown error occurred with HLS.js.';
            switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                    errorMessage = `Network error while loading stream: ${data.details}`;
                    if (data.details === 'manifestLoadError' || data.details === 'manifestParsingError') {
                        errorMessage = "Could not load the streaming manifest. The source may be offline or invalid.";
                    }
                    break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                    errorMessage = "A media error occurred: " + data.details;
                    break;
                default:
                    errorMessage = "An unexpected error occurred.";
                    break;
            }
            setError(errorMessage);
            console.error('HLS Fatal Error:', errorMessage, data);
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Fallback for Safari/iOS on HLS
        console.log("[VideoPlayer] HLS not supported by hls.js, but native HLS is available.");
        video.src = url;
        video.addEventListener('error', () => {
            setError('A native HLS playback error occurred.');
        });
    } else {
        setError("Your browser doesn't support HLS video playback.");
    }

    // Cleanup function
    return () => {
      if (hls) {
        console.log("[VideoPlayer] Destroying hls.js instance.");
        hls.destroy();
      }
      if (video) {
        video.src = ''; // Clear the source
        video.removeAttribute('src');
      }
    };

  }, [url]); // Re-run effect when the URL changes

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      {error ? (
        <div className="text-center p-8 bg-gray-900/80 rounded-xl border border-red-500/50 backdrop-blur-sm max-w-md mx-4">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p className="text-white text-lg font-medium mb-2">Stream Unavailable</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <button 
            onClick={() => window.open(url, '_blank')}
            className="mt-4 text-xs text-blue-400 hover:text-blue-300 underline"
          >
            Try opening stream directly
          </button>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          poster={poster || undefined}
          playsInline
          autoPlay // Start playing automatically
        />
      )}
    </div>
  );
};

export default VideoPlayer;
