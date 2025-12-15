import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  url: string;
  poster?: string | null;
}

// Get the backend URL from environment variables, with a fallback for local development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, poster }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(null); // Reset error on new URL

    const isMp4 = url.toLowerCase().endsWith('.mp4');
    let hls: Hls | null = null;

    if (isMp4) {
        // --- MP4 PLAYBACK VIA PROXY ---
        console.log("[VideoPlayer] Detected MP4 stream. Using server proxy.");
        const proxyUrl = `${API_URL}/api/proxy?url=${encodeURIComponent(url)}`;
        console.log(`[VideoPlayer] Proxy URL: ${proxyUrl}`);

        video.src = proxyUrl;
        video.load();
        video.addEventListener('error', (e) => {
            console.error("[VideoPlayer] Error playing proxied MP4:", e);
            setError('The server proxy could not play this video file.');
        });

    } else if (Hls.isSupported()) {
        // --- HLS.JS PLAYBACK (direct) ---
        console.log("[VideoPlayer] Detected HLS stream. Using hls.js.");
        hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        // (Error handling for HLS is the same as before)
        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                let errorMessage = 'An unknown error occurred with HLS.js.';
                switch (data.type) {
                    case Hls.ErrorTypes.NETWORK_ERROR:
                        errorMessage = `Network error: ${data.details}`;
                        break;
                    case Hls.ErrorTypes.MEDIA_ERROR:
                        errorMessage = `Media error: ${data.details}`;
                        break;
                    default:
                        errorMessage = "An unexpected error occurred.";
                        break;
                }
                setError(errorMessage);
            }
        });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        console.log("[VideoPlayer] Native HLS playback.");
        video.src = url;
    } else {
        setError("Your browser doesn't support video playback.");
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      if (video) {
        video.src = '';
        video.removeAttribute('src');
      }
    };
  }, [url]);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      {error ? (
        <div className="text-center p-8 bg-gray-900/80 rounded-xl border border-red-500/50">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p className="text-white text-lg font-medium mb-2">Stream Unavailable</p>
          <p className="text-gray-400 text-sm">{error}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          controls
          poster={poster || undefined}
          playsInline
          autoPlay
        />
      )}
    </div>
  );
};

export default VideoPlayer;
