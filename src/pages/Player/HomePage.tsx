
import React, { useState, useMemo, useRef } from 'react';
import { Channel, PlaylistData, User } from '../../types';
import VideoPlayer, { VideoPlayerHandle } from '../../components/VideoPlayer';
import Sidebar from '../../components/Sidebar';
import ContentGrid from '../../components/ContentGrid';
import { Menu, X, ArrowLeft, LogOut, LayoutDashboard, Play } from 'lucide-react';

interface HomePageProps {
  playlistData: PlaylistData;
  currentUser: User;
  onLogout: () => void;
  onBackToMenu: () => void;
  onSwitchToDashboard: () => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  playlistData, 
  currentUser, 
  onLogout, 
  onBackToMenu,
  onSwitchToDashboard
}) => {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const playerRef = useRef<VideoPlayerHandle>(null);

  const filteredChannels = useMemo(() => {
    let channels = playlistData.channels;
    if (selectedGroup) {
      channels = channels.filter(c => c.group === selectedGroup);
    }
    if (searchQuery) {
      channels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return channels;
  }, [playlistData.channels, selectedGroup, searchQuery]);

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setSearchQuery('');
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  const handlePlay = () => {
    if (selectedChannel) {
      setShowPlayer(true);
      // Wait for the player to mount, then trigger fullscreen
      setTimeout(() => {
        playerRef.current?.enterFullscreen();
      }, 150);
    }
  };
  
  const handleClosePlayer = () => {
    // If the user exits fullscreen, we can bring them back to the details page
    if (document.fullscreenElement) {
        document.exitFullscreen();
    }
    setShowPlayer(false);
  }

  const handleBackToGrid = () => {
    setSelectedChannel(null);
  }

  // 1. Player View
  if (showPlayer && selectedChannel) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col text-white">
        {/* We can hide the controls when in fullscreen, or show them for a moment */}
        <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10 opacity-0 hover:opacity-100 transition-opacity">
           <div className="flex items-center justify-between">
             <h2 className="text-lg font-bold truncate">{selectedChannel.name}</h2>
             <button onClick={handleClosePlayer} className="px-4 py-2 bg-red-600/80 font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2">
               <ArrowLeft size={18}/> Back to Details
              </button>
           </div>
        </div>
        <div className="flex-1 bg-black">
          <VideoPlayer ref={playerRef} url={selectedChannel.url} poster={selectedChannel.logo} />
        </div>
      </div>
    );
  }

  // 2. Main View (Sidebar + Content)
  return (
    <div className="flex flex-col h-screen bg-[#07080a] overflow-hidden text-white font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#0f1117] px-4 py-3 border-b border-white/5 flex justify-between items-center z-50 shadow-lg">
        <div className="font-bold text-red-600 flex items-center gap-2 tracking-tighter text-lg">STREAMFLOW</div>
        <div className="flex items-center"> 
          <button onClick={onBackToMenu} className="p-2 text-gray-400"><ArrowLeft size={22} /></button>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-gray-400">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className={`absolute md:static inset-0 z-40 transform transition-transform duration-300 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:w-64 flex-shrink-0`}>
          <Sidebar 
            groups={playlistData.groups}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
            channelCount={filteredChannels.length}
            onBackToMenu={onBackToMenu}
          />
        </div>
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/60 md:hidden z-30" onClick={() => setMobileMenuOpen(false)} />} 

        {/* Main Content: Switches between Details View and Grid View */}
        <main className="flex-1 flex flex-col w-full h-full overflow-y-auto scrollbar-hide bg-[#07080a]">
          {selectedChannel ? (
            // 2a. Details View
            <div className="relative flex-1 flex flex-col justify-between">
                <img src={selectedChannel.logo || ''} alt="background" className="absolute inset-0 w-full h-full object-cover opacity-40 blur-lg"/>
                <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] via-[#07080a]/10 to-transparent"></div>
                <div className="relative p-8 flex-1 flex flex-col justify-end">
                  <p className="text-red-500 font-semibold">{selectedChannel.group}</p>
                  <h1 className="text-5xl font-bold mt-2">{selectedChannel.name}</h1>
                  <div className="mt-8 flex gap-4">
                    <button onClick={handlePlay} className="px-8 py-3 bg-red-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors">
                        <Play size={20} />
                        Reproduzir
                    </button>
                    <button onClick={handleBackToGrid} className="px-8 py-3 bg-white/10 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-white/20 transition-colors">
                        <ArrowLeft size={20} />
                        Voltar
                    </button>
                  </div>
                </div>
            </div>
          ) : (
            // 2b. Grid View
            <ContentGrid 
                channels={filteredChannels}
                groups={playlistData.groups}
                onSelectChannel={handleSelectChannel}
                selectedGroup={selectedGroup}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default HomePage;
