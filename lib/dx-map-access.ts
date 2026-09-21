import raw from './dx-map-access.json';

export type MapAccessEntry = {
    id: string;
    model: string;
    kind: 'keycode' | 'password';
    label: string;
    secret: string;
    floor: string | null;
    place: string | null;
    region: string | null;
    note?: string;
};

export const mapAccessRecords = raw.records as MapAccessEntry[];
export const mapAccessSources = raw.sources;

export function accessForLocation(id: string): MapAccessEntry[]
{
    return mapAccessRecords.filter(item => item.model === id);
}
