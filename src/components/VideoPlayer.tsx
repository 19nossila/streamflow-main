
import React, { useEffect, useRef, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import Hls from 'hls.js';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';
import { Loader2, RefreshCw, X } from 'lucide-react';

// --- Types --- //
interface VideoPlayerProps {
  url: string;
  onClose: () => void;
  poster?: string | null;
  autoPlay?: boolean;
}

export interface VideoPlayerHandle {
  enterFullscreen: () => void;
}

// --- Helper Functions --- //
const getProxyUrl = (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`;

// --- Main Component --- //
const VideoPlayer = forwardRef<VideoPlayerHandle, VideoPlayerProps>(({ url, onClose, poster, autoPlay = true }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [useProxy, setUseProxy] = useState(false);

  // --- Fullscreen & Cleanup --- //
  const enterFullscreen = useCallback(() => {
    if (playerRef.current?.fullscreen) {
        playerRef.current.fullscreen.enter();
    }
  }, []);
  
  useImperativeHandle(ref, () => ({ enterFullscreen }));

  const cleanup = useCallback(() => {
    hlsRef.current?.destroy();
    playerRef.current?.destroy();
    hlsRef.current = null;
    playerRef.current = null;
  }, []);

  // --- Core Player Logic --- //
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset state for new URL
    cleanup();
    setIsLoading(true);
    setUseProxy(false);
    
    const sourceUrl = useProxy ? getProxyUrl(url) : url;

    // Initialize Plyr
    const plyr = new Plyr(video, { 
        autoplay: autoPlay,
        controls: ['play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'],
        settings: ['quality', 'speed'],
        quality: { default: 0, options: [0], forced: true }, // Start with auto
    });
    playerRef.current = plyr;

    // --- HLS.js Integration --- //
    if (url.includes('.m3u8') && Hls.isSupported()) {
      const hls = new Hls({
        // Configs for better performance
        lowLatencyMode: true,
        backBufferLength: 90, 
      });
      hlsRef.current = hls;
      hls.loadSource(sourceUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
        const availableQualities = [0, ...data.levels.map(l => l.height).filter(Boolean)];
        plyr.config.quality.options = [...new Set(availableQualities)];
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error('HLS Error:', data);
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR && !useProxy) {
            console.warn('Network error, trying proxy...');
            setUseProxy(true); // Retry with proxy
          } else {
            onClose(); // Failsafe
          }
        }
      });
    } else {
      video.src = sourceUrl;
    }

    // --- Plyr Event Listeners --- //
    plyr.on('ready', () => {
        if (autoPlay) {
            plyr.play();
            enterFullscreen();
        }
    });
    plyr.on('playing', () => setIsLoading(false));
    plyr.on('waiting', () => setIsLoading(true));

    return cleanup;

  }, [url, useProxy, autoPlay, cleanup, enterFullscreen, onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
      {/* --- Close Button --- */}
      <button 
        onClick={onClose}
        className="absolute top-5 right-5 z-50 p-2 bg-black/50 rounded-full hover:bg-red-600 transition-all scale-125"
      >
        <X size={24} className="text-white" />
      </button>

      {/* --- Loading Spinner --- */}
      {isLoading && (
        <div className="absolute z-20 flex items-center justify-center">
          <Loader2 className="w-16 h-16 text-white animate-spin" />
        </div>
      )}
      
      {/* --- Video Element --- */}
      <div className="w-full h-full">
        <video ref={videoRef} className="w-full h-full" poster={poster || undefined} playsInline />
      </div>

      {/* --- Player Style Overrides --- */}
      <style>{`
        .plyr {
          --plyr-color-main: #e50914; /* Netflix Red */
          height: 100%;
          width: 100%;
        }
      `}</style>
    </div>
  );
});

export default VideoPlayer;
