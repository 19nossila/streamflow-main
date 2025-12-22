
import { EpgChannel, EpgProgram } from '../types';
import { parseString } from 'xml2js';

// Helper to decode HTML entities
const decodeHtmlEntities = (text: string): string => {
    if (!text) return '';
    return text
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'");
};

const parseXmltv = (xml: string): Promise<{ channels: EpgChannel[], programs: EpgProgram[] }> => {
    return new Promise((resolve, reject) => {
        parseString(xml, { explicitArray: false, trim: true }, (err, result) => {
            if (err || !result || !result.tv) {
                return reject(err || new Error("Invalid XMLTV format"));
            }

            const epgChannels: EpgChannel[] = (result.tv.channel || []).map((c: any) => ({
                id: c.$.id,
                name: c['display-name'] || '',
                logo: c.icon ? c.icon.$.src : '',
            }));

            const epgPrograms: EpgProgram[] = (result.tv.programme || []).map((p: any) => ({
                channelId: p.$.channel,
                title: decodeHtmlEntities(p.title._ || p.title),
                description: p.desc ? decodeHtmlEntities(p.desc._ || p.desc) : '',
                start: new Date(p.$.start).getTime(),
                end: new Date(p.$.stop).getTime(),
            }));

            resolve({ channels: epgChannels, programs: epgPrograms });
        });
    });
};

export const epgService = {
    loadEpgFromUrl: async (url: string): Promise<{ channels: EpgChannel[], programs: EpgProgram[] }> => {
        try {
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
            const response = await fetch(proxyUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch EPG data: ${response.statusText}`);
            }
            const xml = await response.text();
            return await parseXmltv(xml);
        } catch (error) {
            console.error("Error loading EPG data:", error);
            throw error;
        }
    },
};
