/*
  Online Lyrics Fetcher Service for DRAUN E-Ink Music Player
  Queries LRCLIB and Lyrics.ovh APIs with local caching for instant lyrics lookup by title and artist.
*/

const LYRICS_CACHE = new Map<string, string>();

export async function fetchOnlineLyrics(title: string, artist: string, album?: string): Promise<string> {
  const cleanTitle = title.replace(/\.[^/.]+$/, '').replace(/\[.*\]/g, '').replace(/\(.*\)/g, '').trim();
  const cleanArtist = artist.replace(/Unknown/i, '').replace(/Local/i, '').trim();
  const cacheKey = `${cleanTitle.toLowerCase()}---${cleanArtist.toLowerCase()}`;

  if (LYRICS_CACHE.has(cacheKey)) {
    return LYRICS_CACHE.get(cacheKey)!;
  }

  // 1. Query LRCLIB API (Best API for synced timestamped [mm:ss.xx] & plain lyrics)
  try {
    const params = new URLSearchParams();
    params.append('track_name', cleanTitle);
    if (cleanArtist) params.append('artist_name', cleanArtist);
    if (album) params.append('album_name', album);

    const res = await fetch(`https://lrclib.net/api/get?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      const lyrics = data.syncedLyrics || data.plainLyrics;
      if (lyrics && lyrics.trim().length > 0) {
        LYRICS_CACHE.set(cacheKey, lyrics.trim());
        return lyrics.trim();
      }
    }
  } catch (e) {}

  // 2. Query LRCLIB Search API fallback
  try {
    const query = `${cleanTitle} ${cleanArtist}`.trim();
    const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(query)}`);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (Array.isArray(searchData) && searchData.length > 0) {
        const match = searchData.find(item => item.syncedLyrics || item.plainLyrics) || searchData[0];
        const lyrics = match.syncedLyrics || match.plainLyrics;
        if (lyrics && lyrics.trim().length > 0) {
          LYRICS_CACHE.set(cacheKey, lyrics.trim());
          return lyrics.trim();
        }
      }
    }
  } catch (e) {}

  // 3. Query Lyrics.ovh API fallback
  if (cleanArtist && cleanTitle) {
    try {
      const ovhRes = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(cleanArtist)}/${encodeURIComponent(cleanTitle)}`);
      if (ovhRes.ok) {
        const ovhData = await ovhRes.json();
        if (ovhData.lyrics && ovhData.lyrics.trim().length > 0) {
          LYRICS_CACHE.set(cacheKey, ovhData.lyrics.trim());
          return ovhData.lyrics.trim();
        }
      }
    } catch (e) {}
  }

  return '';
}
