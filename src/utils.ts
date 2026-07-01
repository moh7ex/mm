import { LyricsLine, TrackMetadata } from "./types";

// Sorensen-Dice similarity algorithm for smart fuzzy matching
export function getFuzzySimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, "");
  const s2 = str2.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]/g, "");

  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.8;

  const getBigrams = (str: string) => {
    const bigrams = new Set<string>();
    for (let i = 0; i < str.length - 1; i++) {
      bigrams.add(str.substring(i, i + 2));
    }
    return bigrams;
  };

  const bigrams1 = getBigrams(s1);
  const bigrams2 = getBigrams(s2);

  if (bigrams1.size === 0 || bigrams2.size === 0) return 0.0;

  let intersection = 0;
  bigrams2.forEach((bigram) => {
    if (bigrams1.has(bigram)) {
      intersection++;
    }
  });

  return (2.0 * intersection) / (bigrams1.size + bigrams2.size);
}

// Search tracks with intelligent fuzzy scoring
export function searchTracks(tracks: TrackMetadata[], query: string): TrackMetadata[] {
  const q = query.trim().toLowerCase();
  if (!q) return tracks;

  return tracks
    .map((track) => {
      const titleSim = getFuzzySimilarity(track.title, q);
      const artistSim = getFuzzySimilarity(track.artist, q);
      const albumSim = getFuzzySimilarity(track.album || "", q);
      const genreSim = getFuzzySimilarity(track.genre || "", q);

      // Take the best match score with higher weight on title
      const score = Math.max(
        titleSim * 1.0,
        artistSim * 0.8,
        albumSim * 0.6,
        genreSim * 0.5
      );

      return { track, score };
    })
    .filter((item) => item.score > 0.15 || item.track.title.toLowerCase().includes(q) || item.track.artist.toLowerCase().includes(q))
    .sort((a, b) => b.score - a.score)
    .map((item) => item.track);
}

// Extends canvas image rendering to extract the dominant dynamic colors
export interface ExtractedPalette {
  primary: string;
  glow: string;
  isDark: boolean;
}

export function extractDominantColor(imgBlob: Blob): Promise<ExtractedPalette> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(imgBlob);
    
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 5;
        canvas.height = 5;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          resolve({ primary: "#1ed760", glow: "rgba(30, 215, 96, 0.4)", isDark: true });
          URL.revokeObjectURL(url);
          return;
        }

        ctx.drawImage(img, 0, 0, 5, 5);
        const imgData = ctx.getImageData(0, 0, 5, 5).data;

        // Calculate average color
        let r = 0, g = 0, b = 0;
        let count = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          // Avoid near-pure white or pure black pixels for a more vibrant tone
          const pixelR = imgData[i];
          const pixelG = imgData[i+1];
          const pixelB = imgData[i+2];
          const pixelA = imgData[i+3];

          if (pixelA > 200) {
            const brightness = (pixelR * 299 + pixelG * 587 + pixelB * 114) / 1000;
            if (brightness > 20 && brightness < 235) {
              r += pixelR;
              g += pixelG;
              b += pixelB;
              count++;
            }
          }
        }

        if (count === 0) {
          // Fallback if image was monochromatic or empty
          for (let i = 0; i < imgData.length; i += 4) {
            r += imgData[i];
            g += imgData[i+1];
            b += imgData[i+2];
            count++;
          }
        }

        r = Math.round(r / count);
        g = Math.round(g / count);
        b = Math.round(b / count);

        // Convert to HEX
        const toHex = (c: number) => c.toString(16).padStart(2, "0");
        const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        const glow = `rgba(${r}, ${g}, ${b}, 0.45)`;
        
        // Determine brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        const isDark = brightness < 128;

        resolve({ primary: hex, glow, isDark });
      } catch (err) {
        console.warn("Palette extraction failed, using defaults", err);
        resolve({ primary: "#1ed760", glow: "rgba(30, 215, 96, 0.4)", isDark: true });
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    img.onerror = () => {
      resolve({ primary: "#1ed760", glow: "rgba(30, 215, 96, 0.4)", isDark: true });
      URL.revokeObjectURL(url);
    };

    img.src = url;
  });
}

// LRC Lyrics Parser
export function parseLRC(text: string): LyricsLine[] {
  const lines = text.split(/\r?\n/);
  const result: LyricsLine[] = [];
  const regex = /\[(\d+):(\d+)(?:\.(\d+))?\]/g;

  lines.forEach((line) => {
    // There can be multiple timestamp tags on a single lyrics line
    const tags: { time: number }[] = [];
    let match;
    
    // Reset regex index
    regex.lastIndex = 0;
    
    while ((match = regex.exec(line)) !== null) {
      const min = parseInt(match[1], 10);
      const sec = parseInt(match[2], 10);
      const msStr = match[3] || "0";
      const ms = parseFloat("0." + msStr) * 1000;
      
      const timeInSec = min * 60 + sec + ms / 1000;
      tags.push({ time: timeInSec });
    }

    const cleanLine = line.replace(regex, "").trim();
    if (cleanLine || tags.length > 0) {
      tags.forEach((tag) => {
        result.push({
          time: tag.time,
          text: cleanLine,
        });
      });
    }
  });

  return result.sort((a, b) => a.time - b.time);
}

// Format duration
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds === Infinity) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
