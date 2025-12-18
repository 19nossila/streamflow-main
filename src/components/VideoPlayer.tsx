
import React, { useRef, useState, useEffect } from 'react';
import ReactPlayer from 'react-player';
import styled from 'styled-components';

const PlayerWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
  user-select: none;
  background: #000;
`;

const PlayerOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  z-index: 1;
`;

const TopControls = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 20px;
  color: #fff;
  background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
`;

const BottomControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  color: #fff;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0) 100%);
`;

interface VideoPlayerProps {
  url: string;
  poster?: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, poster }) => {
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const handlePlayPause = () => setPlaying(!playing);
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };
  const handleMute = () => setMuted(!muted);
  const handleFullscreen = () => {
    if (playerRef.current) {
      const internalPlayer = playerRef.current.getInternalPlayer() as HTMLElement;
      if (document.fullscreenElement) {
        document.exitFullscreen();
        setFullscreen(false);
      } else {
        internalPlayer.requestFullscreen();
        setFullscreen(true);
      }
    }
  };

  return (
    <PlayerWrapper>
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        volume={volume}
        muted={muted}
        width="100%"
        height="100%"
        config={{
          file: {
            attributes: {
              poster: poster,
            },
          },
        }}
      />
      <PlayerOverlay>
        <TopControls>
          <div></div>
        </TopControls>
        <BottomControls>
          <button onClick={handlePlayPause}>{playing ? 'Pause' : 'Play'}</button>
          <input
            type="range"
            min={0}
            max={1}
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
          />
          <button onClick={handleMute}>{muted ? 'Unmute' : 'Mute'}</button>
          <button onClick={handleFullscreen}>Fullscreen</button>
        </BottomControls>
      </PlayerOverlay>
    </PlayerWrapper>
  );
};

export default VideoPlayer;
