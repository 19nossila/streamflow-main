
import React, { useState, useMemo } from 'react';
import { Channel, PlaylistData, User } from '../../types';
import VideoPlayer from '../../components/VideoPlayer';
import Sidebar from '../../components/Sidebar';
import { Menu, X, ArrowLeft, LogOut, LayoutDashboard, Tv } from 'lucide-react';

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
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(playlistData.channels[0] || null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

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

  const handleChannelSelect = (channel: Channel) => {
    setCurrentChannel(channel);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-[#07080a] overflow-hidden text-white font-sans">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#0f1117] px-4 py-3 border-b border-white/5 flex justify-between items-center z-50 shadow-lg">
        <div className="font-bold text-red-600 flex items-center gap-2 tracking-tighter text-lg">
          STREAMFLOW
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-400 p-1 hover:text-white transition-colors">
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <div className={`absolute md:static inset-0 z-40 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 flex`}>
          <Sidebar 
            channels={filteredChannels} 
            currentChannel={currentChannel}
            onSelectChannel={handleChannelSelect}
            groups={playlistData.groups}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedGroup={selectedGroup}
            setSelectedGroup={setSelectedGroup}
          />
          {/* Overlay for mobile when sidebar is open */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-black/60 md:hidden -z-10 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col w-full h-full relative">
          {/* Player Header */}
          <div className="h-16 bg-[#0f1117]/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-10">
            <div className="flex items-center gap-4 overflow-hidden">
              {currentChannel?.logo && (
                <div className="w-10 h-10 bg-black/50 rounded-lg p-1 border border-white/10 shrink-0">
                  <img src={currentChannel.logo} className="w-full h-full object-contain" alt="" />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-base font-bold truncate leading-tight">{currentChannel?.name || 'Select a Channel'}</h2>
                {currentChannel?.group && (
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-0.5 truncate">{currentChannel.group}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={onBackToMenu} 
                className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all group flex items-center gap-2"
                title="Back to Playlists"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="hidden lg:inline text-xs font-bold uppercase tracking-wider">Back</span>
              </button>
              {currentUser.role === 'admin' && (
                <button 
                  onClick={onSwitchToDashboard}
                  className="p-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white transition-all"
                  title="Dashboard"
                >
                  <LayoutDashboard size={20} />
                </button>
              )}
              <button 
                onClick={onLogout}
                className="p-2.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-500 transition-all"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Video Player Section */}
          <div className="flex-1 bg-black relative flex items-center justify-center p-0 md:p-4 lg:p-6 overflow-hidden">
            <div className="w-full h-full max-w-6xl mx-auto shadow-2xl shadow-red-900/10 rounded-xl overflow-hidden bg-black ring-1 ring-white/5">
              {currentChannel ? (
                <VideoPlayer url={currentChannel.url} poster={currentChannel.logo} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-600 bg-[#07080a]">
                  <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Tv size={48} className="opacity-20" />
                  </div>
                  <p className="text-lg font-medium">Ready to broadcast</p>
                  <p className="text-sm opacity-50 mt-1 text-center max-w-xs px-4">Select a channel or movie from the sidebar to start your experience.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
