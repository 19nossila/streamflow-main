import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import Plyr from 'plyr';
import 'plyr/dist/plyr.css';

interface VideoPlayerProps {
  url: string;
  poster?: string | null;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, poster, autoPlay = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUsingProxy, setIsUsingProxy] = useState(false);

  useEffect(() => {
    setIsUsingProxy(false);
    setError(null);
  }, [url]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let playUrl = url;
    if (isUsingProxy) {
      playUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    } else if (window.location.protocol === 'https:' && url.startsWith('http:')) {
      playUrl = url.replace(/^http:/, 'https:');
    }

    const plyrOptions: Plyr.Options = {
      autoplay: autoPlay,
      controls: [
        'play-large',
        'play',
        'progress',
        'current-time',
        'mute',
        'volume',
        'captions',
        'settings',
        'pip',
        'airplay',
        'fullscreen',
      ],
      settings: ['quality', 'speed', 'loop'],
      quality: {
        default: 720,
        options: [4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240],
      },
    };

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 90
      });
      hlsRef.current = hls;

      hls.loadSource(playUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (!playerRef.current) {
          playerRef.current = new Plyr(video, plyrOptions);
        }
        if (autoPlay) {
          video.play().catch(e => console.warn('Autoplay blocked:', e));
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              if (data.response?.code === 0 && !isUsingProxy) {
                setIsUsingProxy(true);
              } else {
                setError("Network error: Stream unavailable.");
                hls.destroy();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              setError("Fatal stream error.");
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari support
      video.src = playUrl;
      if (!playerRef.current) {
        playerRef.current = new Plyr(video, plyrOptions);
      }
    } else {
      setError("HLS is not supported in this browser.");
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [url, autoPlay, isUsingProxy]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-lg group">
      {isUsingProxy && !error && (
        <div className="absolute top-4 right-4 bg-yellow-500/80 text-black text-[10px] font-bold px-2 py-1 rounded shadow-lg z-20">
          PROXY ACTIVE
        </div>
      )}

      {error ? (
        <div className="text-center p-8 bg-gray-900/90 rounded-2xl border border-red-500/30 backdrop-blur-md max-w-md mx-4 animate-in fade-in zoom-in duration-300">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-3xl text-red-500"></i>
          </div>
          <h3 className="text-white text-xl font-bold mb-2">Stream Error</h3>
          <p className="text-gray-400 text-sm mb-6">{error}</p>
          <button 
            onClick={() => setIsUsingProxy(!isUsingProxy)}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors mb-3"
          >
            Retry with {isUsingProxy ? 'Direct Connection' : 'Proxy'}
          </button>
          <button 
            onClick={() => window.open(url, '_blank')}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Open source URL directly
          </button>
        </div>
      ) : (
        <div className="w-full h-full">
          <video
            ref={videoRef}
            className="w-full h-full"
            poster={poster || undefined}
            playsInline
          />
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;