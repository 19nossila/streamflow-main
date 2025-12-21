
import React, { useState, useMemo, useEffect } from 'react';
import { Channel, PlaylistData, User } from '../../types';
import VideoPlayer from '../../components/VideoPlayer';
import Sidebar from '../../components/Sidebar';
import ContentGrid from '../../components/ContentGrid';
import { Menu, X, ArrowLeft, LogOut, LayoutDashboard, Play } from 'lucide-react';

// Helper to get a random item
const getRandomItem = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];

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
  const [featuredChannel, setFeaturedChannel] = useState<Channel | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    // Set a random featured channel on initial load
    const moviesOrSeries = playlistData.channels.filter(c => c.group?.toLowerCase().includes('movie') || c.group?.toLowerCase().includes('series'));
    setFeaturedChannel(getRandomItem(moviesOrSeries.length > 0 ? moviesOrSeries : playlistData.channels));
  }, [playlistData.channels]);


  const filteredChannels = useMemo(() => {
    let channels = playlistData.channels;
    // If a group is selected, filter by it
    if (selectedGroup) {
      channels = channels.filter(c => c.group === selectedGroup);
    }
    // Then, if there is a search query, filter by it
    if (searchQuery) {
      channels = channels.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return channels;
  }, [playlistData.channels, selectedGroup, searchQuery]);

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    // On mobile, automatically close the sidebar to show the content
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

  const handlePlay = (channel: Channel) => {
    setSelectedChannel(channel);
    setShowPlayer(true);
  };
  
  const handleClosePlayer = () => {
    setShowPlayer(false);
    setSelectedChannel(null);
  }

  if (showPlayer && selectedChannel) {
    return (
      <div className="h-screen w-screen bg-black flex flex-col">
        <div className="flex-shrink-0 p-4 bg-black flex items-center justify-between">
           <h2 className="text-lg font-bold text-white">{selectedChannel.name}</h2>
           <button onClick={handleClosePlayer} className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Close</button>
        </div>
        <div className="flex-1">
          <VideoPlayer url={selectedChannel.url} poster={selectedChannel.logo} />
        </div>
      </div>
    );
  }

  const displayChannel = selectedChannel || featuredChannel;

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
          />
        </div>
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/60 md:hidden z-30" onClick={() => setMobileMenuOpen(false)} />} 

        {/* Main Content */}
        <main className="flex-1 flex flex-col w-full h-full overflow-y-auto scrollbar-hide">
          {/* Hero Section */}
          {displayChannel && !searchQuery && !selectedGroup && (
            <div className="relative w-full h-96 flex-shrink-0 bg-black">
              <img src={displayChannel.logo || ''} alt={displayChannel.name} className="w-full h-full object-cover opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#07080a] to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-8 text-white">
                  <p className="text-red-500 font-semibold text-sm">{selectedChannel ? 'Selected' : 'Featured'}</p>
                  <h1 className="text-4xl font-bold mt-2">{displayChannel.name}</h1>
                  <p className="text-gray-400 text-sm mt-2 max-w-lg">{displayChannel.group}</p>
                  <button onClick={() => handlePlay(displayChannel)} className="mt-6 px-6 py-3 bg-red-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors">
                      <Play size={20} />
                      Reproduzir
                  </button>
              </div>
            </div>
          )}
          
          {/* Grid View */}
          <div className="flex-1">
            <ContentGrid 
                channels={filteredChannels}
                groups={playlistData.groups}
                onSelectChannel={handleSelectChannel}
                selectedGroup={selectedGroup}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default HomePage;
