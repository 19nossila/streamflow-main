import { ContentItem, PlaylistData, LiveChannel, Movie, Series, Episode } from '../types';

// Regex aprimorado para capturar números de temporada e episódio em vários formatos.
// Prioriza SXXEXX, TXXEXX e também lida com XXxYY.
const seasonEpisodeRegex = /(?:[SsT]\s*(\d{1,3})[EeXx]\s*(\d{1,3}))|(?:(\d{1,3})x(\d{1,3}))/i;

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

            const extractedTvgName = tvgLogoMatch ? tvgLogoMatch[1].trim().substring(0, 255) : null;
            const fullItemTitleFromExtinf = nameMatch ? nameMatch[1].trim() : 'Unnamed';
            const group = groupTitleMatch ? groupTitleMatch[1].trim().substring(0, 255) : 'Uncategorized';
            groups.add(group);

            const baseProperties = {
                id: fullItemTitleFromExtinf + group, // Usar o título completo para uma ID mais única inicial
                logo: tvgLogoMatch ? tvgLogoMatch[1].substring(0, 512) : '',
                group,
            };

            let seasonNum: number | undefined;
            let episodeNum: number | undefined;
            let seriesTitleForEpisode: string = '';
            let episodeDescription: string = fullItemTitleFromExtinf;

            const sEMatch = fullItemTitleFromExtinf.match(seasonEpisodeRegex);
            if (sEMatch) {
                if (sEMatch[1] && sEMatch[2]) { // Matched SXXEXX or TXXEXX
                    seasonNum = parseInt(sEMatch[1], 10);
                    episodeNum = parseInt(sEMatch[2], 10);
                } else if (sEMatch[3] && sEMatch[4]) { // Matched XXxYY
                    seasonNum = parseInt(sEMatch[3], 10);
                    episodeNum = parseInt(sEMatch[4], 10);
                }
            }
            
            // Determine series title and clean episode description
            if (group.toLowerCase().includes('series') && extractedTvgName) {
                seriesTitleForEpisode = extractedTvgName;
            } else if (group.toLowerCase().includes('series')) {
                // Tentar inferir o nome da série do fullItemTitleFromExtinf antes do SXXEXX ou XXxYY
                const potentialSeriesNameMatch = fullItemTitleFromExtinf.match(/^(.*?)(?:[SsT]\s*\d{1,3}[EeXx]\s*\d{1,3}|\d{1,3}x\d{1,3})/i);
                if (potentialSeriesNameMatch && potentialSeriesNameMatch[1]) {
                    seriesTitleForEpisode = potentialSeriesNameMatch[1].replace(/^-+\s*|-+\s*$/g, '').trim().substring(0, 255);
                } else {
                    seriesTitleForEpisode = fullItemTitleFromExtinf.split(' -')[0].trim().substring(0, 255); // Fallback
                }
            }

            if (seriesTitleForEpisode && seasonNum !== undefined && episodeNum !== undefined) {
                // This is likely an episode
                let cleanedEpisodeDesc = fullItemTitleFromExtinf
                    .replace(new RegExp(seriesTitleForEpisode.replace(/[.*+?^${}()|[\\]]/g, '\\$&'), 'gi'), '') // Remove series name
                    .replace(seasonEpisodeRegex, '') // Remove SXXEXX or XXxYY patterns
                    .replace(/^-+\s*|-+\s*$/g, '') // Clean leading/trailing dashes
                    .trim();
                
                if (!cleanedEpisodeDesc) {
                    cleanedEpisodeDesc = `Season ${seasonNum}, Episode ${episodeNum}`;
                }
                episodeDescription = cleanedEpisodeDesc;

                currentItem = {
                    ...baseProperties,
                    type: 'episode',
                    title: seriesTitleForEpisode, // Título da série para agrupamento
                    season: seasonNum,
                    episode: episodeNum,
                    description: episodeDescription.substring(0, 512),
                };
            } else if (group.toLowerCase().includes('movies') || group.toLowerCase().includes('filmes')) {
                currentItem = {
                    ...baseProperties,
                    title: extractedTvgName || fullItemTitleFromExtinf, // Usar tvg-name se disponível, senão título completo
                    type: 'movie',
                    description: fullItemTitleFromExtinf.substring(0, 512), // Título completo como descrição do filme
                };
            } else {
                // Default para canal ao vivo se não for filme nem episódio/série bem definido
                currentItem = {
                    ...baseProperties,
                    title: extractedTvgName || fullItemTitleFromExtinf, // Usar tvg-name se disponível, senão título completo
                    type: 'live',
                    description: fullItemTitleFromExtinf.substring(0, 512),
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
