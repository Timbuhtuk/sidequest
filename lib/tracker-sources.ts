export type TrackerSource = {
  url: string;
  title: string;
  description?: string;
  platform?: string;
  checkedAt?: string;
};

export function uniqueTrackerSources(sources: readonly TrackerSource[]): TrackerSource[] {
  const unique = new Map<string, TrackerSource>();
  for (const source of sources) {
    try {
      const url = new URL(source.url);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') continue;
      if (!unique.has(url.href)) unique.set(url.href, {...source, url: url.href});
    } catch {
      // A malformed reference is not a navigable external source.
    }
  }
  return [...unique.values()];
}
