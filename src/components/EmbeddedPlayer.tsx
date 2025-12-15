
import React, { useEffect, useRef } from 'react';

interface EmbeddedPlayerProps {
  url: string;
  poster?: string | null;
  autoPlay?: boolean;
}

const EmbeddedPlayer: React.FC<EmbeddedPlayerProps> = ({ url, poster, autoPlay = true }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.src = url;
      if (autoPlay) {
        video.play().catch(e => console.warn('Autoplay was prevented.', e));
      }
    }
  }, [url, autoPlay]);

  return (
    <div className="w-full h-full bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        controls
        poster={poster || undefined}
        playsInline
      />
    </div>
  );
};

export default EmbeddedPlayer;
