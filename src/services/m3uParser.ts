
import { ContentItem, PlaylistData, LiveChannel, Movie, Series, Season, Episode } from '../types';

// Enhanced regex to capture series, season, and episode numbers
// Supports formats like S01E01, s01e01, 1x01, S01 EP01
const seriesRegex = /(.*?)(?:s|season|temporada)?(\d{1,2})(?:e|x|ep|episode|episodio)?(\d{1,3})/i;

// Function to parse raw M3U content into our structured PlaylistData
export const parseM3U = (m3uContent: string): PlaylistData => {
    const lines = m3uContent.split(/\r?\n/).filter(line => line.trim() !== '');
    const items: (LiveChannel | Movie | Episode)[] = [];
    const groups = new Set<string>();

    let currentChannel: Partial<LiveChannel | Movie | Episode> = {};

    for (const line of lines) {
        if (line.startsWith('#EXTINF:')) {
            const info = line.substring(8).trim();
            const tvgIdMatch = info.match(/tvg-id="(.*?)"/);
            const tvgLogoMatch = info.match(/tvg-logo="(.*?)"/);
            const groupTitleMatch = info.match(/group-title="(.*?)"/);
            const nameMatch = info.match(/,(.*)/);

            const name = nameMatch ? nameMatch[1].trim() : 'Unnamed';
            const group = groupTitleMatch ? groupTitleMatch[1].trim() : 'Uncategorized';
            groups.add(group);

            currentChannel = {
                id: name + group, // Simple initial ID
                name,
                logo: tvgLogoMatch ? tvgLogoMatch[1] : null,
                group,
                description: '', // Placeholder
                rating: '', // Placeholder
            };

            const seriesMatch = name.match(seriesRegex);
            if (seriesMatch && group.toLowerCase().includes('series')) {
                const [, seriesName, seasonNum, episodeNum] = seriesMatch;
                currentChannel = {
                    ...currentChannel,
                    type: 'episode',
                    name: seriesName.trim(),
                    seasonNumber: parseInt(seasonNum, 10),
                    episodeNumber: parseInt(episodeNum, 10),
                } as Omit<Episode, 'url'>;
            } else if (group.toLowerCase().includes('movies') || group.toLowerCase().includes('filmes')) {
                currentChannel.type = 'movie';
            } else {
                currentChannel.type = 'live';
            }

        } else if (!line.startsWith('#') && currentChannel.name) {
            (currentChannel as any).url = line.trim();
            items.push(currentChannel as (LiveChannel | Movie | Episode));
            currentChannel = {}; // Reset for the next entry
        }
    }
    
    return processAndGroupContent(items, Array.from(groups));
};

// This function takes the flat list of items and groups episodes into series
const processAndGroupContent = (items: (LiveChannel | Movie | Episode)[], groups: string[]): PlaylistData => {
    const seriesMap = new Map<string, Series>();
    const finalItems: ContentItem[] = [];

    for (const item of items) {
        if (item.type === 'episode') {
            const seriesKey = `${item.name.toLowerCase().trim()}_${item.group}`;
            
            // Find or create the series object
            let series = seriesMap.get(seriesKey);
            if (!series) {
                series = {
                    id: `series_${seriesKey}`,
                    type: 'series',
                    name: item.name,
                    logo: item.logo, // Use the logo from the first found episode
                    group: item.group,
                    seasons: [],
                    description: '', // Placeholder
                    rating: '',
                    year: ''
                };
                seriesMap.set(seriesKey, series);
            }

            // Find or create the season
            let season = series.seasons.find(s => s.seasonNumber === item.seasonNumber);
            if (!season) {
                season = {
                    seasonNumber: item.seasonNumber,
                    episodes: [],
                };
                series.seasons.push(season);
            }

            // Add the episode to the season
            season.episodes.push(item as Episode);
            season.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);

        } else {
            // Movies and Live channels are added directly
            finalItems.push(item as LiveChannel | Movie);
        }
    }

    // Add the fully formed series to the final list
    seriesMap.forEach(series => {
        // Sort seasons before adding
        series.seasons.sort((a, b) => a.seasonNumber - b.seasonNumber);
        finalItems.push(series);
    });

    // Sort the final list for consistent display (e.g., series, then movies, then live)
    finalItems.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
        }
        return a.name.localeCompare(b.name);
    });

    return { items: finalItems, groups };
};
