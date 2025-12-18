
import { Channel, PlaylistData } from '../types';

export const parseM3U = (m3uContent: string): PlaylistData => {
  const channels: Channel[] = [];
  const groups = new Set<string>();

  const lines = m3uContent.split(/\r\n|\n/);

  let currentChannel: Partial<Channel> = {};

  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const info = line.substring(8).trim();
      const attributesMatch = info.match(/(.+?)\s/);
      const nameMatch = info.match(/,(.+)$/);

      if (attributesMatch) {
        const attributesStr = info.split(',')[0];
        const tvgIdMatch = attributesStr.match(/tvg-id="(.*?)"/);
        const tvgLogoMatch = attributesStr.match(/tvg-logo="(.*?)"/);
        const groupTitleMatch = attributesStr.match(/group-title="(.*?)"/);

        currentChannel = {
          id: tvgIdMatch ? tvgIdMatch[1] : 'unknown',
          name: nameMatch ? nameMatch[1].trim() : 'Unknown Channel',
          logo: tvgLogoMatch ? tvgLogoMatch[1] : undefined,
          group: groupTitleMatch ? groupTitleMatch[1] : 'default',
        };
        
        if (currentChannel.group) {
          groups.add(currentChannel.group);
        }
      }
    } else if (line.trim().length > 0 && !line.startsWith('#')) {
      if (currentChannel.name) { 
        currentChannel.url = line.trim();
        channels.push(currentChannel as Channel);
      }
      currentChannel = {}; 
    }
  }

  return { channels, groups: Array.from(groups) };
};
