// Web Worker for non-blocking file parsing and ID3 metadata extraction

// Helper to decode text based on ID3 encoding byte
function decodeText(bytes: Uint8Array, encoding: number): string {
  if (bytes.length === 0) return "";

  if (encoding === 0) {
    // ISO-8859-1
    return String.fromCharCode.apply(null, Array.from(bytes)).replace(/\0+$/, "").trim();
  } else if (encoding === 1) {
    // UTF-16 with BOM
    if (bytes.length < 2) return "";
    const hasBOM = (bytes[0] === 0xff && bytes[1] === 0xfe) || (bytes[0] === 0xfe && bytes[1] === 0xff);
    const start = hasBOM ? 2 : 0;
    const isLittleEndian = bytes[0] === 0xff && bytes[1] === 0xfe;

    const chars: string[] = [];
    for (let i = start; i < bytes.length - 1; i += 2) {
      const code = isLittleEndian 
        ? (bytes[i + 1] << 8) | bytes[i] 
        : (bytes[i] << 8) | bytes[i + 1];
      if (code === 0) break;
      chars.push(String.fromCharCode(code));
    }
    return chars.join("").trim();
  } else if (encoding === 2) {
    // UTF-16BE without BOM
    const chars: string[] = [];
    for (let i = 0; i < bytes.length - 1; i += 2) {
      const code = (bytes[i] << 8) | bytes[i + 1];
      if (code === 0) break;
      chars.push(String.fromCharCode(code));
    }
    return chars.join("").trim();
  } else if (encoding === 3) {
    // UTF-8
    try {
      const decoder = new TextDecoder("utf-8");
      return decoder.decode(bytes).replace(/\0+$/, "").trim();
    } catch {
      return String.fromCharCode.apply(null, Array.from(bytes)).replace(/\0+$/, "").trim();
    }
  }
  return "";
}

// Synchsafe integer conversion (ID3v2 uses 7-bit bytes for size values)
function readSynchsafeInt(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 21) |
    (bytes[offset + 1] << 14) |
    (bytes[offset + 2] << 7) |
    bytes[offset + 3]
  );
}

function readStandardInt(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset] << 24) |
    (bytes[offset + 1] << 16) |
    (bytes[offset + 2] << 8) |
    bytes[offset + 3]
  );
}

self.onmessage = async (e: MessageEvent) => {
  const { fileBuffer, fileName, fileSize, fileType } = e.data;
  const bytes = new Uint8Array(fileBuffer);

  // Default values
  const result = {
    title: fileName.replace(/\.[^/.]+$/, ""),
    artist: "فنان غير معروف",
    album: "ألبوم محلي",
    genre: "غير محدد",
    coverBlob: null as Blob | null,
    duration: 0,
    fileSize,
  };

  try {
    // Check ID3v2 signature "ID3"
    if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
      const majorVersion = bytes[3];
      const tagSize = readSynchsafeInt(bytes, 6);
      let offset = 10;
      const endOffset = 10 + tagSize;

      while (offset < endOffset && offset < bytes.length) {
        // Frames must have non-null names
        if (bytes[offset] === 0) break;

        const frameId = String.fromCharCode(
          bytes[offset],
          bytes[offset + 1],
          bytes[offset + 2],
          bytes[offset + 3]
        );

        // Frame size varies slightly depending on ID3v2.3 vs ID3v2.4
        let frameSize = 0;
        if (majorVersion === 4) {
          frameSize = readSynchsafeInt(bytes, offset + 4);
        } else {
          frameSize = readStandardInt(bytes, offset + 4);
        }

        if (frameSize <= 0 || offset + 10 + frameSize > bytes.length) {
          break;
        }

        const frameDataOffset = offset + 10;
        const frameData = bytes.slice(frameDataOffset, frameDataOffset + frameSize);

        if (frameId === "TIT2" || frameId === "TIT") {
          result.title = decodeText(frameData.slice(1), frameData[0]);
        } else if (frameId === "TPE1" || frameId === "TPE") {
          result.artist = decodeText(frameData.slice(1), frameData[0]);
        } else if (frameId === "TALB" || frameId === "TAL") {
          result.album = decodeText(frameData.slice(1), frameData[0]);
        } else if (frameId === "TCON" || frameId === "TCO") {
          result.genre = decodeText(frameData.slice(1), frameData[0]);
        } else if (frameId === "APIC" || frameId === "PIC") {
          // Attached Picture Frame
          const encoding = frameData[0];
          
          // Find mime type
          let mimeEnd = 1;
          while (mimeEnd < frameData.length && frameData[mimeEnd] !== 0) {
            mimeEnd++;
          }
          const mimeTypeBytes = frameData.slice(1, mimeEnd);
          const mimeType = String.fromCharCode.apply(null, Array.from(mimeTypeBytes));

          const pictureType = frameData[mimeEnd + 1]; // e.g., 3 is Cover (front)
          
          // Description
          let descEnd = mimeEnd + 2;
          if (encoding === 1 || encoding === 2) {
            // UTF-16 uses 2 bytes null terminator
            while (descEnd < frameData.length - 1 && !(frameData[descEnd] === 0 && frameData[descEnd + 1] === 0)) {
              descEnd += 2;
            }
            descEnd += 2;
          } else {
            while (descEnd < frameData.length && frameData[descEnd] !== 0) {
              descEnd++;
            }
            descEnd++;
          }

          const pictureData = frameData.slice(descEnd);
          if (pictureData.length > 0) {
            result.coverBlob = new Blob([pictureData], { type: mimeType || "image/jpeg" });
          }
        }

        offset += 10 + frameSize;
      }
    }
  } catch (err) {
    console.error("Worker parsing error:", err);
  }

  // Return parsed metadata
  (self as any).postMessage(result, [fileBuffer]);
};
export {};
