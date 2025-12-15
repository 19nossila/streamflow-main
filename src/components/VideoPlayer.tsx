import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

interface VideoPlayerProps {
  url: string;
  poster?: string | null;
  autoPlay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, poster, autoPlay = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    setError(null);
    const video = videoRef.current;
    if (!video) return;

    // All requests go through our backend proxy
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(url)}`;
    const isMp4 = url.toLowerCase().endsWith('.mp4');

    // Stop any existing playback
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    video.removeAttribute('src');
    video.load();

    if (isMp4) {
      // For MP4 files, we set the src directly to our proxy.
      // The server will respond with a redirect, which the browser handles automatically.
      console.log('[Player] Playing MP4 via proxy redirect...');
      video.src = proxyUrl;

      const onCanPlay = () => {
        if (autoPlay) {
          video.play().catch(e => console.warn('Autoplay was prevented for MP4:', e));
        }
      };

      const onError = (e: Event) => {
        console.error('Native video player error:', e);
        setError('The video could not be loaded. It may be offline or in an unsupported format.');
      };

      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('error', onError);

      return () => {
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('error', onError);
      };

    } else if (Hls.isSupported()) {
      // For HLS streams, we use hls.js with the proxy URL.
      // The server will pipe the stream to avoid CORS issues.
      console.log('[Player] Playing HLS via proxy pipe...');
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
        manifestLoadingTimeOut: 20000,
        manifestLoadingMaxRetry: 2,
        fragLoadingTimeOut: 20000,
      });
      hlsRef.current = hls;

      hls.loadSource(proxyUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) {
          video.play().catch((e) => console.warn('Autoplay blocked for HLS:', e));
        }
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          console.error('HLS Fatal Error:', data);
          setError(`Stream error: ${data.details}`);
          hls.destroy();
        }
      });

      return () => {
        hls.destroy();
      };

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // For native HLS support (e.g., Safari)
      console.log('[Player] Playing HLS with native support via proxy...');
      video.src = proxyUrl;
      const onLoadedMetadata = () => {
        if (autoPlay) {
          video.play().catch(e => console.warn('Autoplay blocked for native HLS:', e));
        }
      };
      video.addEventListener('loadedmetadata', onLoadedMetadata);
      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
      };
    } else {
      setError('This browser does not support HLS streaming.');
    }

  }, [url, autoPlay]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-lg shadow-2xl">
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
        />
      )}
    </div>
  );
};

export default VideoPlayer;
