/**
 * Song Metadata Auto-Recognizer Service for Draun
 * Extracts embedded audio tags (ID3v2 / FLAC / MP4) and queries iTunes & MusicBrainz APIs
 * to automatically recognize Artist Name, Album Name, Release Year, Genre, and Cover Art.
 */

export interface RecognizedMetadata {
  title: string;
  artist: string;
  album: string;
  year: number;
  genre: string;
  coverUrl?: string;
  trackNumber?: number;
}

/**
 * Extract embedded ID3v2 tags AND cover art from File array buffer
 */
export async function parseEmbeddedID3Tags(file: File): Promise<Partial<RecognizedMetadata>> {
  try {
    // Read enough bytes to cover ID3 header + common tags + embedded art
    const slice = file.slice(0, 512 * 1024); // 512KB
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const result: Partial<RecognizedMetadata> = {};

    // ── MP4 / M4A: look for 'covr' atom ──────────────────────────────────
    if (file.name.match(/\.(m4a|mp4|aac)$/i)) {
      const coverUrl = extractMP4Cover(bytes, file.type || 'image/jpeg');
      if (coverUrl) result.coverUrl = coverUrl;
      return result;
    }

    // ── FLAC: look for METADATA_BLOCK_PICTURE ─────────────────────────────
    if (file.name.match(/\.flac$/i)) {
      const text = new TextDecoder('latin1').decode(bytes);
      // fLaC marker at offset 0
      if (bytes[0] === 0x66 && bytes[1] === 0x4C && bytes[2] === 0x61 && bytes[3] === 0x43) {
        const coverUrl = extractFLACPicture(bytes);
        if (coverUrl) result.coverUrl = coverUrl;
      }
      return result;
    }

    // ── ID3v2 (MP3, WAV with ID3) ─────────────────────────────────────────
    if (!(bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33)) return result;

    const id3Version = bytes[3]; // 2, 3, or 4
    const str = new TextDecoder('latin1').decode(bytes);

    // Calculate ID3 tag total size from syncsafe integer at bytes 6-9
    const id3Size = ((bytes[6] & 0x7f) << 21) | ((bytes[7] & 0x7f) << 14) |
                    ((bytes[8] & 0x7f) << 7)  | (bytes[9] & 0x7f);
    const tagEnd = Math.min(10 + id3Size, bytes.length);

    // Frame ID length is 3 bytes in ID3v2.2, 4 bytes in v2.3/v2.4
    const frameIdLen = id3Version === 2 ? 3 : 4;
    const frameSizeLen = id3Version === 2 ? 3 : 4;
    const frameHeaderLen = frameIdLen + frameSizeLen + (id3Version === 2 ? 0 : 2); // +2 flags in v2.3/v2.4

    const readFrameSize = (pos: number): number => {
      if (id3Version === 2) {
        return (bytes[pos] << 16) | (bytes[pos + 1] << 8) | bytes[pos + 2];
      } else if (id3Version === 4) {
        // syncsafe in ID3v2.4
        return ((bytes[pos] & 0x7f) << 21) | ((bytes[pos + 1] & 0x7f) << 14) |
               ((bytes[pos + 2] & 0x7f) << 7) | (bytes[pos + 3] & 0x7f);
      } else {
        return (bytes[pos] << 24) | (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
      }
    };

    const textFrames: Record<string, string> = {
      [id3Version === 2 ? 'TT2' : 'TIT2']: 'title',
      [id3Version === 2 ? 'TP1' : 'TPE1']: 'artist',
      [id3Version === 2 ? 'TAL' : 'TALB']: 'album',
      [id3Version === 2 ? 'TYE' : 'TYER']: 'year',
      'TDRC': 'year',
      [id3Version === 2 ? 'TCO' : 'TCON']: 'genre',
    };

    let pos = 10; // start after ID3 header
    while (pos < tagEnd - frameHeaderLen) {
      const frameId = new TextDecoder('latin1').decode(bytes.subarray(pos, pos + frameIdLen));
      if (!frameId || frameId[0] === '\x00') break;

      const frameSize = readFrameSize(pos + frameIdLen);
      if (frameSize <= 0 || frameSize > tagEnd - pos) break;

      const dataStart = pos + frameHeaderLen;
      const dataEnd = dataStart + frameSize;

      // ── Text frames ──
      const fieldName = textFrames[frameId];
      if (fieldName && dataEnd <= bytes.length) {
        const raw = bytes.subarray(dataStart, dataEnd);
        const encoding = raw[0];
        let text = '';
        if (encoding === 1 || encoding === 2) {
          text = new TextDecoder('utf-16').decode(raw.subarray(1));
        } else {
          text = new TextDecoder('utf-8', { fatal: false }).decode(raw.subarray(1));
        }
        text = text.replace(/[\x00\r\n]/g, '').trim();
        if (text.length > 0) {
          if (fieldName === 'year') {
            const y = parseInt(text.slice(0, 4), 10);
            if (!isNaN(y) && y > 1900 && y <= 2030) (result as any).year = y;
          } else if (fieldName === 'genre') {
            (result as any).genre = text.replace(/^\(\d+\)/, '').trim();
          } else {
            (result as any)[fieldName] = text;
          }
        }
      }

      // ── APIC: Attached Picture ──
      const apicId = id3Version === 2 ? 'PIC' : 'APIC';
      if (frameId === apicId && !result.coverUrl && dataEnd <= bytes.length) {
        const coverUrl = extractAPICFrame(bytes.subarray(dataStart, dataEnd));
        if (coverUrl) result.coverUrl = coverUrl;
      }

      pos = dataEnd;
    }

    return result;
  } catch (e) {
    return {};
  }
}

/** Extract cover image blob URL from an APIC frame payload */
function extractAPICFrame(data: Uint8Array): string | null {
  try {
    // encoding byte
    let offset = 1;
    // MIME type: null-terminated ASCII string
    const mimeEnd = data.indexOf(0x00, offset);
    if (mimeEnd === -1) return null;
    const mimeType = new TextDecoder('latin1').decode(data.subarray(offset, mimeEnd)) || 'image/jpeg';
    offset = mimeEnd + 1;
    // Picture type byte (0x03 = front cover, but accept any)
    offset += 1;
    // Description: null-terminated string (encoding-aware)
    const encoding = data[0];
    if (encoding === 1 || encoding === 2) {
      // UTF-16: look for \x00\x00 null terminator
      while (offset < data.length - 1) {
        if (data[offset] === 0x00 && data[offset + 1] === 0x00) { offset += 2; break; }
        offset += 2;
      }
    } else {
      while (offset < data.length && data[offset] !== 0x00) offset++;
      offset += 1;
    }
    if (offset >= data.length) return null;
    const imgData = data.subarray(offset);
    if (imgData.length < 4) return null;
    const blob = new Blob([new Uint8Array(imgData)], { type: mimeType || 'image/jpeg' });
    return URL.createObjectURL(blob);
  } catch { return null; }
}

/** Extract cover from FLAC METADATA_BLOCK_PICTURE */
function extractFLACPicture(bytes: Uint8Array): string | null {
  try {
    let pos = 4; // skip 'fLaC'
    while (pos < bytes.length - 4) {
      const blockType = bytes[pos] & 0x7f;
      const isLast = !!(bytes[pos] & 0x80);
      const blockSize = (bytes[pos + 1] << 16) | (bytes[pos + 2] << 8) | bytes[pos + 3];
      pos += 4;
      if (blockType === 6 && blockSize > 8) { // PICTURE block
        // pictureType (4 bytes), mimeLen (4 bytes), mime, descLen (4 bytes), desc, w, h, colorDepth, colorCount, dataLen (4 bytes), data
        let o = pos;
        o += 4; // picture type
        const mimeLen = (bytes[o] << 24) | (bytes[o+1] << 16) | (bytes[o+2] << 8) | bytes[o+3]; o += 4;
        const mime = new TextDecoder().decode(bytes.subarray(o, o + mimeLen)); o += mimeLen;
        const descLen = (bytes[o] << 24) | (bytes[o+1] << 16) | (bytes[o+2] << 8) | bytes[o+3]; o += 4;
        o += descLen;
        o += 16; // width, height, color depth, color count
        const dataLen = (bytes[o] << 24) | (bytes[o+1] << 16) | (bytes[o+2] << 8) | bytes[o+3]; o += 4;
        if (dataLen > 0 && o + dataLen <= bytes.length) {
          const chunk = bytes.subarray(o, o + dataLen);
          const blob = new Blob([new Uint8Array(chunk)], { type: mime || 'image/jpeg' });
          return URL.createObjectURL(blob);
        }
      }
      pos += blockSize;
      if (isLast) break;
    }
    return null;
  } catch { return null; }
}

/** Extract cover from MP4/M4A 'covr' atom */
function extractMP4Cover(bytes: Uint8Array, mimeType: string): string | null {
  try {
    const str = new TextDecoder('latin1').decode(bytes);
    const idx = str.indexOf('covr');
    if (idx === -1) return null;
    // Skip 'covr' + size(4) + 'data'(4) + type(4) + locale(4) = 16 bytes
    const dataStart = idx + 4 + 4 + 4 + 4 + 4;
    if (dataStart >= bytes.length) return null;
    const imgData = bytes.subarray(dataStart);
    if (imgData.length < 4) return null;
    // Detect JPEG vs PNG
    const isPNG = imgData[0] === 0x89 && imgData[1] === 0x50;
    const blob = new Blob([new Uint8Array(imgData)], { type: isPNG ? 'image/png' : 'image/jpeg' });
    return URL.createObjectURL(blob);
  } catch { return null; }
}



/**
 * Parse artist, title, album, and year from filename conventions
 * Examples:
 * - "Tame Impala - Currents - 01 - Less I Know The Better.mp3"
 * - "Coldplay - Yellow.flac"
 * - "01 - Reckoner - Radiohead.m4a"
 */
export function parseFilenameMetadata(fileName: string, folderName?: string): Partial<RecognizedMetadata> {
  const cleanName = fileName.replace(/\.[^/.]+$/, '').trim();
  const result: Partial<RecognizedMetadata> = {};

  // Try "Artist - Title" or "Artist - Album - Title"
  const parts = cleanName.split(/\s*[-–—]\s*/);

  if (parts.length >= 3) {
    // Artist - Album - Title or Track - Artist - Title
    if (/^\d+$/.test(parts[0])) {
      result.trackNumber = parseInt(parts[0], 10);
      result.artist = parts[1];
      result.title = parts[2];
    } else {
      result.artist = parts[0];
      result.album = parts[1];
      result.title = parts.slice(2).join(' - ');
    }
  } else if (parts.length === 2) {
    if (/^\d+$/.test(parts[0])) {
      result.trackNumber = parseInt(parts[0], 10);
      result.title = parts[1];
    } else {
      result.artist = parts[0];
      result.title = parts[1];
    }
  } else {
    // Single title string, strip leading numbers
    result.title = cleanName.replace(/^\d+[\s._-]+/, '').trim();
  }

  // Use folder name if folder represents album or artist
  if (folderName && !['IMPORTED MUSIC', 'MUSIC', 'SONGS', 'DOWNLOADS'].includes(folderName.toUpperCase())) {
    const yearMatch = folderName.match(/\((19\d\d|20\d\d)\)|\[(19\d\d|20\d\d)\]/);
    if (yearMatch) {
      result.year = parseInt(yearMatch[1] || yearMatch[2], 10);
    }
    const cleanFolder = folderName.replace(/\(.*?\)|\[.*?\]/g, '').trim();
    if (cleanFolder) {
      result.album = cleanFolder;
    }
  }

  return result;
}

/**
 * Auto-recognize artist, album name, year, genre, and cover art via online metadata APIs
 */
export async function autoRecognizeSongMetadata(options: {
  fileName: string;
  folderName?: string;
  file?: File;
}): Promise<RecognizedMetadata> {
  const { fileName, folderName, file } = options;

  // 1. Start with filename fallback
  const filenameMeta = parseFilenameMetadata(fileName, folderName);

  // 2. Read embedded ID3/audio tags if file object is provided
  let embeddedMeta: Partial<RecognizedMetadata> = {};
  if (file) {
    embeddedMeta = await parseEmbeddedID3Tags(file);
  }

  // Merge embedded tags over filename hints
  const candidateTitle = embeddedMeta.title || filenameMeta.title || fileName.replace(/\.[^/.]+$/, '');
  const candidateArtist = embeddedMeta.artist || filenameMeta.artist || 'Unknown Artist';
  const candidateAlbum = embeddedMeta.album || filenameMeta.album || folderName || 'Single Tracks';
  const candidateYear = embeddedMeta.year || filenameMeta.year || 2026;
  const candidateGenre = embeddedMeta.genre || 'Imported';

  const recognized: RecognizedMetadata = {
    title: candidateTitle,
    artist: candidateArtist,
    album: candidateAlbum,
    year: candidateYear,
    genre: candidateGenre
  };

  // 3. Online Metadata API Auto-Recognition (iTunes Search API & MusicBrainz)
  try {
    const searchTerm = candidateArtist !== 'Unknown Artist'
      ? `${candidateArtist} ${candidateTitle}`
      : `${candidateTitle} ${candidateAlbum !== 'Single Tracks' ? candidateAlbum : ''}`;

    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(searchTerm.trim())}&entity=song&limit=1`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const match = data.results[0];
        if (match.artistName) recognized.artist = match.artistName;
        if (match.collectionName) recognized.album = match.collectionName;
        if (match.trackName) recognized.title = match.trackName;
        if (match.primaryGenreName) recognized.genre = match.primaryGenreName;
        if (match.releaseDate) {
          const yearVal = parseInt(match.releaseDate.slice(0, 4), 10);
          if (!isNaN(yearVal)) recognized.year = yearVal;
        }
        if (match.artworkUrl100) {
          recognized.coverUrl = match.artworkUrl100.replace('100x100bb', '600x600bb');
        }
      }
    }
  } catch (e) {
    // Online network lookup fallback
  }

  return recognized;
}
