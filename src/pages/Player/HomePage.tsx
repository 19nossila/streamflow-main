
import React, { useState, useMemo } from 'react';
import { ContentItem, PlaylistData, User } from '../../types';
import Sidebar from '../../components/Sidebar';
import ContentGrid from '../../components/ContentGrid';
import { Menu, X, ArrowLeft } from 'lucide-react';

interface HomePageProps {
  playlistData: PlaylistData;
  currentUser: User;
  onLogout: () => void;
  onBackToMenu: () => void;
  onSwitchToDashboard: () => void;
  onSelectItem: (item: ContentItem) => void;
}

const HomePage: React.FC<HomePageProps> = ({ 
  playlistData, 
  currentUser, 
  onLogout, 
  onBackToMenu,
  onSwitchToDashboard,
  onSelectItem
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    let items = playlistData.items;
    if (selectedGroup) {
      items = items.filter(i => i.group === selectedGroup);
    }
    if (searchQuery) {
      items = items.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return items;
  }, [playlistData.items, selectedGroup, searchQuery]);

  const handleSelectItem = (item: ContentItem) => {
    onSelectItem(item);
    if (window.innerWidth < 768) {
      setMobileMenuOpen(false);
    }
  };

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
            itemCount={filteredItems.length}
            onBackToMenu={onBackToMenu}
            onLogout={onLogout}
            onGoToDashboard={onSwitchToDashboard}
            isAdmin={currentUser.role === 'admin'}
          />
        </div>
        {mobileMenuOpen && <div className="fixed inset-0 bg-black/60 md:hidden z-30" onClick={() => setMobileMenuOpen(false)} />} 

        {/* Main Content */}
        <main className="flex-1 flex flex-col w-full h-full overflow-y-auto scrollbar-hide bg-[#07080a]">
          <ContentGrid 
              items={filteredItems}
              onSelectItem={handleSelectItem}
          />
        </main>
      </div>
    </div>
  );
};

export default HomePage;
