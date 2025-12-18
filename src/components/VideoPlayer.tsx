import React, { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import 'plyr/dist/plyr.css';
import { Loader2, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';
import Plyr from 'plyr';

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
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  const cleanUp = useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (playerRef.current) {
      playerRef.current.destroy();
      playerRef.current = null;
    }
  }, []);

  useEffect(() => {
    setIsUsingProxy(false);
    setError(null);
    setIsLoading(true);
    setRetryCount(0);
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
        default: 0, // Auto
        options: [0, 4320, 2880, 2160, 1440, 1080, 720, 576, 480, 360, 240],
        forced: true,
        onChange: (newQuality: number) => {
          if (hlsRef.current) {
            if (newQuality === 0) {
              hlsRef.current.currentLevel = -1; // Auto
            } else {
              hlsRef.current.levels.forEach((level, index) => {
                if (level.height === newQuality) {
                  hlsRef.current!.currentLevel = index;
                }
              });
            }
          }
        }
      },
      tooltips: { controls: true, seek: true },
      displayDuration: true,
      keyboard: { focused: true, global: true },
    };

    const initializePlyr = () => {
        if (!playerRef.current) {
            playerRef.current = new Plyr(video, plyrOptions);
            
            // Sync Plyr with video events
            video.onplaying = () => setIsLoading(false);
            video.onwaiting = () => setIsLoading(true);
            video.onloadeddata = () => setIsLoading(false);
        }
    };

    if (Hls.isSupported()) {
      if (hlsRef.current) hlsRef.current.destroy();

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        backBufferLength: 60,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
        manifestLoadingTimeOut: 15000,
        manifestLoadingMaxRetry: 4,
        levelLoadingTimeOut: 15000,
        levelLoadingMaxRetry: 4,
        fragLoadingTimeOut: 20000,
        fragLoadingMaxRetry: 6,
        startLevel: -1, // Auto
        abrEwmaDefaultEstimate: 500000,
      });

      hlsRef.current = hls;
      hls.loadSource(playUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        // Build quality options for Plyr
        const availableQualities = [0, ...data.levels.map(l => l.height).filter(h => h > 0)];
        const uniqueQualities = Array.from(new Set(availableQualities)).sort((a, b) => b - a);
        
        // Update plyr options with actual available qualities
        if (playerRef.current) {
            // Plyr doesn't easily allow updating quality options after init, 
            // but we can try to set the internal config
            (playerRef.current as any).config.quality.options = uniqueQualities;
        }

        initializePlyr();
        if (autoPlay) {
          video.play().catch(e => console.warn('Autoplay blocked:', e));
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("HLS Network Error:", data);
              if (data.response?.code === 0 && !isUsingProxy) {
                console.log("CORS issue detected, trying proxy...");
                setIsUsingProxy(true);
              } else if (retryCount < 3) {
                setRetryCount(prev => prev + 1);
                hls.startLoad();
              } else {
                setError("Network error: The stream source is unreachable.");
                setIsLoading(false);
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("HLS Media Error, trying recovery...");
              hls.recoverMediaError();
              break;
            default:
              setError("An unrecoverable playback error occurred.");
              setIsLoading(false);
              cleanUp();
              break;
          }
        }
      });

      // Handle quality level changes
      hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
        const span = document.querySelector('.plyr__control--overlaid .current-quality');
        if (span) {
          const height = hls.levels[data.level].height;
          span.textContent = `${height}p`;
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Safari support
      video.src = playUrl;
      initializePlyr();
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        if (autoPlay) video.play().catch(() => {});
      });
      video.addEventListener('error', () => {
          if (!isUsingProxy) setIsUsingProxy(true);
          else {
              setError("Native player failed to load the stream.");
              setIsLoading(false);
          }
      });
    } else {
      setError("Your browser does not support HLS playback.");
      setIsLoading(false);
    }

    return cleanUp;
  }, [url, autoPlay, isUsingProxy, retryCount, cleanUp]);

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#000] flex items-center justify-center overflow-hidden rounded-2xl group shadow-2xl ring-1 ring-white/10">
      
      {/* Proxy & Status Indicators */}
      <div className="absolute top-4 left-4 z-20 flex gap-2">
        {isUsingProxy && (
          <div className="bg-amber-500 text-black text-[10px] font-black px-2 py-1 rounded shadow-lg flex items-center gap-1 animate-pulse">
            <RefreshCw size={10} /> PROXY ACTIVE
          </div>
        )}
        {retryCount > 0 && !error && (
          <div className="bg-white/10 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10">
            Retry {retryCount}/3
          </div>
        )}
      </div>

      {isLoading && !error && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
          <Loader2 className="w-12 h-12 text-red-600 animate-spin mb-4" />
          <p className="text-white text-xs font-bold uppercase tracking-[0.2em] animate-pulse">Buffering Stream</p>
        </div>
      )}

      {error ? (
        <div className="relative z-30 text-center p-10 bg-[#0f1117]/95 rounded-[32px] border border-white/5 backdrop-blur-xl max-w-md mx-4 shadow-2xl">
          <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="text-red-500" size={40} />
          </div>
          <h3 className="text-white text-2xl font-black mb-2 tracking-tight">Playback Failed</h3>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            {error} <br/>
            <span className="text-[10px] opacity-50 mt-2 block">Source: {url}</span>
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
                onClick={() => {
                    setIsUsingProxy(!isUsingProxy);
                    setError(null);
                    setIsLoading(true);
                    setRetryCount(0);
                }}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-2xl transition-all active:scale-95 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
            >
                <RefreshCw size={18} />
                Try {isUsingProxy ? 'Direct' : 'Proxy Mode'}
            </button>
            <button 
                onClick={() => window.open(url, '_blank')}
                className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-bold py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
                <ExternalLink size={16} />
                Open in External Player
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full h-full pointer-events-auto">
          <video
            ref={videoRef}
            className="w-full h-full"
            poster={poster || undefined}
            playsInline
            crossOrigin="anonymous"
          />
        </div>
      )}

      {/* Custom Plyr Theme Overrides */}
      <style>{`
        .plyr {
          --plyr-color-main: #dc2626;
          --plyr-video-background: #000;
          --plyr-menu-background: rgba(15, 17, 23, 0.95);
          --plyr-menu-color: #fff;
          border-radius: 1rem;
          height: 100%;
          width: 100%;
        }
        .plyr--full-ui input[type=range] {
          color: #dc2626;
        }
        .plyr__control--overlaid {
          background: rgba(220, 38, 38, 0.8);
        }
        .plyr__video-wrapper {
            background: #000;
        }
        .plyr__poster {
            background-size: contain;
        }
      `}</style>
    </div>
  );
};

export default VideoPlayer;