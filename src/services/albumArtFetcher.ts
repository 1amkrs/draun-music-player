/**
 * Multi-Tiered Online Album Art Resolver Service
 * Queries iTunes Search API & MusicBrainz / Cover Art Archive for HD cover artwork.
 */

export async function resolveAlbumArt(options: {
  folderName?: string;
  artist?: string;
  title?: string;
  album?: string;
}): Promise<string | null> {
  const { folderName, artist, title, album } = options;

  const genericFolders = ['music', 'songs', 'download', 'downloads', 'desktop', 'imported folder', 'new folder', 'audio', 'mp3', 'tracks', 'imported music'];

  // Query iTunes Store API for 600x600 HD artwork
  const queryITunes = async (searchTerm: string, entity: string = 'album'): Promise<string | null> => {
    if (!searchTerm || searchTerm.length < 2) return null;
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm)}&entity=${entity}&limit=1`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const rawUrl = data.results[0].artworkUrl100;
          if (rawUrl) return rawUrl.replace('100x100bb', '600x600bb');
        }
      }
    } catch (e) {}
    return null;
  };

  // Query MusicBrainz / Cover Art Archive API
  const queryMusicBrainz = async (artistTerm?: string, releaseTerm?: string): Promise<string | null> => {
    if (!artistTerm || !releaseTerm) return null;
    try {
      const query = `artist:"${encodeURIComponent(artistTerm)}" AND release:"${encodeURIComponent(releaseTerm)}"`;
      const res = await fetch(`https://musicbrainz.org/ws/2/release/?query=${query}&fmt=json`, {
        headers: { 'User-Agent': 'DraunMusicPlayer/1.0.0 ( contact@draun.audio )' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.releases && data.releases.length > 0) {
          const mbid = data.releases[0].id;
          const caaRes = await fetch(`https://coverartarchive.org/release/${mbid}/front-500`);
          if (caaRes.ok) return caaRes.url;
        }
      }
    } catch (e) {}
    return null;
  };

  // Tier 1: Try Folder Name Query if not generic
  if (folderName) {
    const cleanFolder = folderName.replace(/\[.*?\]|\(.*?\)/g, '').replace(/[-_]/g, ' ').trim();
    if (cleanFolder && !genericFolders.includes(cleanFolder.toLowerCase())) {
      const art = await queryITunes(cleanFolder, 'album');
      if (art) return art;

      const artSong = await queryITunes(cleanFolder, 'song');
      if (artSong) return artSong;
    }
  }

  // Tier 2: Try Song Metadata Query (Artist + Album)
  if (artist && album && !artist.toLowerCase().includes('unknown') && !album.toLowerCase().includes('imported')) {
    const art = await queryITunes(`${artist} ${album}`, 'album');
    if (art) return art;

    const mbArt = await queryMusicBrainz(artist, album);
    if (mbArt) return mbArt;
  }

  // Tier 3: Try Song Metadata Query (Artist + Title)
  if (artist && title && !artist.toLowerCase().includes('unknown')) {
    const cleanTitle = title.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
    const art = await queryITunes(`${artist} ${cleanTitle}`, 'song');
    if (art) return art;
  }

  // Tier 4: Try Title alone
  if (title) {
    const cleanTitle = title.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
    if (cleanTitle.length > 3) {
      const art = await queryITunes(cleanTitle, 'song');
      if (art) return art;
    }
  }

  return null;
}
