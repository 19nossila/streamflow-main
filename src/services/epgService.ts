
import { apiService } from './api';
import { Channel, EpgProgram } from '../types';
import { parseString } from 'xml2js';

// Helper to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'");
};


// 1. Core EPG Parsing and Processing Logic
// This function will be responsible for fetching EPG data from a URL,
// parsing it (assuming XMLTV format), and transforming it into a structured format.
const parseXmltv = (xml: string): Promise<{ channels: EpgChannel[], programs: EpgProgram[] }> => {
    return new Promise((resolve, reject) => {
        parseString(xml, { explicitArray: false, trim: true }, (err, result) => {
            if (err) {
                return reject(err);
            }

            const epgChannels: EpgChannel[] = (result.tv.channel || []).map((c: any) => ({
                id: c.$.id,
                displayName: c['display-name'],
                icon: c.icon ? c.icon.$.src : null,
            }));

            const epgPrograms: EpgProgram[] = (result.tv.programme || []).map((p: any) => ({
                channelId: p.$.channel,
                title: decodeHtmlEntities(p.title._ || p.title),
                description: p.desc ? decodeHtmlEntities(p.desc._ || p.desc) : null,
                startTime: new Date(p.$.start),
                endTime: new Date(p.$.stop),
            }));

            resolve({ channels: epgChannels, programs: epgPrograms });
        });
    });
};


// 2. Service Layer
// This will be the main interface for the UI to interact with.
// It will handle fetching, caching, and retrieving EPG data.
export const epgService = {
    // Fetches and processes EPG data from a given URL
    loadEpgFromUrl: async (url: string): Promise<void> => {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch EPG data: ${response.statusText}`);
            }
            const xml = await response.text();
            const { channels, programs } = await parseXmltv(xml);

            // Here, instead of a local database, we send the parsed data to our backend via apiService
            await apiService.saveEpgData(channels, programs);

        } catch (error) {
            console.error("Error loading EPG data:", error);
            throw error; // Re-throw for the UI to handle
        }
    },

    // Retrieves EPG programs for a specific channel
    getProgramsForChannel: async (channelId: string): Promise<EpgProgram[]> => {
        // Fetch from our backend API
        return apiService.getProgramsForChannel(channelId);
    },

    // Gets the current program for a given channel
    getCurrentProgram: async (channelId: string): Promise<EpgProgram | null> => {
        const now = new Date();
        const programs = await apiService.getProgramsForChannel(channelId);
        return programs.find(p => p.startTime <= now && p.endTime > now) || null;
    },

    // Gets the next program for a given channel
    getNextProgram: async (channelId: string): Promise<EpgProgram | null> => {
        const now = new Date();
        const programs = await apiService.getProgramsForChannel(channelId);
        return programs.find(p => p.startTime > now) || null;
    }
};

// 3. Types
// We need to define the EPG-specific types.
// I'll add these to a new `epg.ts` file inside `src/types` to keep things organized.
export interface EpgChannel {
  id: string;
  displayName: string;
  icon: string | null;
}
