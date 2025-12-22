import { LiveChannel } from '../types';

// Define a interface para a resposta da API Xtream
interface XtreamResponse {
  user_info: {
    username: string;
    status: string;
  };
  server_info: {
    url: string;
    port: string;
  };
}

// Define a interface para os canais da API Xtream
interface XtreamChannel {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  epg_channel_id: string | null;
  added: string;
  category_id: string;
  custom_sid: string | null;
  tv_archive: number;
  direct_source: string;
  plus_player_license: string | null;
}

export const xtreamService = {
  // Conecta-se a um servidor Xtream e busca a lista de canais
  async getChannels(serverUrl: string, username: string, password?: string): Promise<LiveChannel[]> {
    try {
      const response = await fetch(`${serverUrl}/player_api.php?username=${username}&password=${password || ''}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      await response.json(); // Don't need the data from this response

      const liveCategoriesResponse = await fetch(`${serverUrl}/player_api.php?username=${username}&password=${password || ''}&action=get_live_categories`);
      const liveCategories = await liveCategoriesResponse.json();

      const channels: LiveChannel[] = [];
      for (const category of liveCategories) {
        const categoryChannelsResponse = await fetch(`${serverUrl}/player_api.php?username=${username}&password=${password || ''}&action=get_live_streams&category_id=${category.category_id}`);
        const categoryChannels: XtreamChannel[] = await categoryChannelsResponse.json();

        for (const channel of categoryChannels) {
          channels.push({
            id: channel.stream_id.toString(),
            title: channel.name,
            logo: channel.stream_icon,
            group: category.category_name,
            url: `${serverUrl}/live/${username}/${password || ''}/${channel.stream_id}.ts`,
            type: 'live',
          });
        }
      }

      return channels;
    } catch (error) {
      console.error('Error fetching channels from Xtream server:', error);
      return [];
    }
  },
};
