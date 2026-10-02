import raw from './dx-map-intel.json';
import type {MapText, PlanPoint} from './dx-map-model';

export type MapIntelKind = 'mission' | 'collectible' | 'access' | 'route' | 'loot' | 'person' | 'location';
export type MapIntelPoint = {
    id: string;
    model: string;
    floor: string;
    position: PlanPoint;
    kind: MapIntelKind;
    title: MapText;
    detail: MapText;
    sourceMap: string;
    // Stable HTML annotation index, not the colored number printed on the map.
    sourcePoint: number;
    precision: 'aligned' | 'approximate';
    sourcePixel: PlanPoint;
    registration: string;
};
export type MapIntelSource = {url: string; title: string; points: number};

export const mapIntelRecords = raw.records as MapIntelPoint[];
export const mapIntelSources = raw.sources as Record<string, MapIntelSource>;
export const mapIntelColors = raw.colors as Record<MapIntelKind, string>;

export function intelForLocation(id: string): MapIntelPoint[]
{
    return mapIntelRecords.filter(item => item.model === id);
}
