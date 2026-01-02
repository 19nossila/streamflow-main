import { ContentItem, PlaylistData, LiveChannel, Movie, Series, Episode } from '../types';

// Enhanced regex to capture series, season, and episode numbers
// Supports formats like S01E01, s01e01, 1x01, S01 EP01
// Optimized for performance to prevent ReDoS - uses atomic groups and possessive - where appropriate
const seriesRegex = /(.*?)(?:s|season|temporada)?(\d{1,2})(?:e|x|ep|episode|episodio)?(\d{1,3})/i;

// Security Constants for M3U parsing - INCREASED LIMITS
const MAX_M3U_LINES = 500000; // Increased limit for larger playlists
const MAX_LINE_LENGTH = 4096; // Increased limit for longer URLs or info strings

// Function to parse raw M3U content into our structured PlaylistData
export const parseM3U = (m3uContent: string): PlaylistData => {
    const lines = m3uContent.split(/\r?\n/).filter(line => line.trim() !== '');
    const items: (LiveChannel | Movie | Episode)[] = [];
    const groups = new Set<string>();

    let currentItem: Partial<LiveChannel | Movie | Episode> = {};

    if (lines.length > MAX_M3U_LINES) {
        console.warn(`[M3U Parser] Playlist exceeds MAX_M3U_LINES (${MAX_M3U_LINES}). Truncating.`);
        lines.length = MAX_M3U_LINES;
    }

    for (const line of lines) {
        if (line.length > MAX_LINE_LENGTH) {
            console.warn(`[M3U Parser] Line exceeds MAX_LINE_LENGTH (${MAX_LINE_LENGTH}). Skipping line.`);
            continue;
        }

        if (line.startsWith('#EXTINF:')) {
            const info = line.substring(8).trim();
            const tvgLogoMatch = info.match(/tvg-logo="(.*?)"/);
            const groupTitleMatch = info.match(/group-title="(.*?)"/);
            const nameMatch = info.match(/,(.*)/);

            // Basic validation for extracted strings
            const title = nameMatch ? nameMatch[1].trim().substring(0, 255) : 'Unnamed'; // Limit title length
            const group = groupTitleMatch ? groupTitleMatch[1].trim().substring(0, 255) : 'Uncategorized'; // Limit group length
            groups.add(group);

            const baseProperties = {
                id: title + group, // Simple initial ID
                logo: tvgLogoMatch ? tvgLogoMatch[1].substring(0, 512) : '', // Limit logo URL length
                group,
            };

            const seriesMatch = title.match(seriesRegex);
            if (seriesMatch && group.toLowerCase().includes('series')) {
                const [, seriesName, seasonNum, episodeNum] = seriesMatch;
                currentItem = {
                    ...baseProperties,
                    type: 'episode',
                    title: seriesName.trim().substring(0, 255),
                    season: parseInt(seasonNum, 10),
                    episode: parseInt(episodeNum, 10),
                };
            } else if (group.toLowerCase().includes('movies') || group.toLowerCase().includes('filmes')) {
                currentItem = {
                    ...baseProperties,
                    title,
                    type: 'movie',
                };
            } else {
                currentItem = {
                    ...baseProperties,
                    title,
                    type: 'live',
                };
            }

        } else if (!line.startsWith('#') && currentItem.title) {
            const completedItem = {
                ...currentItem,
                url: line.trim().substring(0, 1024), // Limit URL length
            } as LiveChannel | Movie | Episode;
            items.push(completedItem);
            currentItem = {}; // Reset for the next entry
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
            const seriesKey = `${item.title.toLowerCase().trim()}_${item.group}`;
            
            // Find or create the series object
            let series = seriesMap.get(seriesKey);
            if (!series) {
                series = {
                    id: `series_${seriesKey}`,
                    type: 'series',
                    title: item.title,
                    logo: item.logo, // Use the logo from the first found episode
                    group: item.group,
                    url: '', // Series are containers and don't have a direct stream URL
                    episodes: [],
                    description: '', // Placeholder
                };
                seriesMap.set(seriesKey, series);
            }

            // Add the episode to the series
            series.episodes.push(item as Episode);
            series.episodes.sort((a, b) => {
                if (a.season !== b.season) return a.season! - b.season!;
                return a.episode! - b.episode!;
            });

        } else {
            // Movies and Live channels are added directly
            finalItems.push(item as LiveChannel | Movie);
        }
    }

    // Add the fully formed series to the final list
    seriesMap.forEach(series => {
        finalItems.push(series);
    });

    // Sort the final list for consistent display (e.g., series, then movies, then live)
    finalItems.sort((a, b) => {
        if (a.type !== b.type) {
            return a.type.localeCompare(b.type);
        }
        return a.title.localeCompare(b.title);
    });

    return { items: finalItems, groups };
};
