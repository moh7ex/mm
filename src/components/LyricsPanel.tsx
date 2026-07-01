import React, { useState, useEffect, useRef } from "react";
import { LyricsLine } from "../types";
import { parseLRC } from "../utils";
import { db } from "../db";
import { audioEngine } from "../audio";

interface LyricsPanelProps {
  trackId: number;
  currentTime: number;
  accentColor: string;
}

export default function LyricsPanel({ trackId, currentTime, accentColor }: LyricsPanelProps) {
  const [lyricsText, setLyricsText] = useState<string>("");
  const [parsedLyrics, setParsedLyrics] = useState<LyricsLine[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Load custom lyrics from DB
  useEffect(() => {
    async function loadLyrics() {
      const metadata = await db.getTrackMetadata(trackId);
      if (metadata) {
        // Retrieve if there is custom lyrics stored in IndexedDB (we can store it in a standard attribute 'lyrics' in metadata)
        const customLyrics = (metadata as any).lyrics || "";
        setLyricsText(customLyrics);
        if (customLyrics) {
          setParsedLyrics(parseLRC(customLyrics));
        } else {
          setParsedLyrics([]);
        }
      }
    }
    loadLyrics();
  }, [trackId]);

  // Handle saving pasted LRC lyrics
  const handleSaveLyrics = async () => {
    try {
      const parsed = parseLRC(lyricsText);
      setParsedLyrics(parsed);
      
      // Persist in IndexedDB metadata
      await db.updateTrackMetadata(trackId, {
        lyrics: lyricsText
      } as any);
      
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to parse or save lyrics:", err);
    }
  };

  // Find the currently active line index based on time
  let activeIndex = -1;
  for (let i = 0; i < parsedLyrics.length; i++) {
    if (currentTime >= parsedLyrics[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Smooth scroll active line to center of lyrics panel
  useEffect(() => {
    if (activeLineRef.current && containerRef.current) {
      const container = containerRef.current;
      const activeLine = activeLineRef.current;
      
      const containerHeight = container.clientHeight;
      const lineOffsetTop = activeLine.offsetTop;
      const lineHeight = activeLine.clientHeight;

      const targetScrollTop = lineOffsetTop - (containerHeight / 2) + (lineHeight / 2);

      container.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });
    }
  }, [activeIndex]);

  const handleImportLrcFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      setLyricsText(text);
      const parsed = parseLRC(text);
      setParsedLyrics(parsed);

      await db.updateTrackMetadata(trackId, {
        lyrics: text
      } as any);
    };
    reader.readAsText(file);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl h-80 flex flex-col gap-4" id="lyrics-panel-root-node">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-wider font-mono text-gray-400">Synced Lyrics (LRC)</span>
          <span className="text-xs text-gray-500">كلمات متزامنة مع وقت تشغيل الأغنية</span>
        </div>
        
        <div className="flex gap-2">
          {parsedLyrics.length > 0 && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl text-white transition-colors"
            >
              تعديل الكلمات
            </button>
          )}
        </div>
      </div>

      {isEditing || parsedLyrics.length === 0 ? (
        // Lyrics Entry Editor / Paste Area
        <div className="flex-1 flex flex-col gap-3 justify-center items-center">
          {parsedLyrics.length === 0 && !isEditing ? (
            <div className="text-center flex flex-col items-center gap-3">
              <span className="text-3xl">📝</span>
              <p className="text-sm text-gray-300 font-medium">لا توجد كلمات متزامنة لهذه الأغنية</p>
              <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
                يمكنك تحميل ملف كلمات (.lrc) أو لصق نص كلمات متزامن بصيغة [00:12.34] ليتم تفعيلها تلقائياً.
              </p>
              <div className="flex gap-2 mt-2">
                <label className="text-xs bg-white/10 hover:bg-white/15 px-4 py-2 rounded-xl text-white font-medium cursor-pointer border border-white/5 transition-colors">
                  📤 استيراد ملف .lrc
                  <input
                    type="file"
                    accept=".lrc"
                    onChange={handleImportLrcFile}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-xs py-2 px-4 rounded-xl font-medium text-black"
                  style={{ backgroundColor: accentColor }}
                >
                  كتابة/لصق الكلمات
                </button>
              </div>
            </div>
          ) : (
            // Full screen editing text area
            <div className="w-full h-full flex flex-col gap-2">
              <textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                placeholder="[00:10.00] كلمات السطر الأول&#10;[00:15.50] كلمات السطر الثاني متزامن مع الوقت..."
                className="w-full flex-1 bg-black/40 border border-white/5 p-3 rounded-2xl text-white text-xs font-mono outline-none resize-none focus:border-white/20"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-xs bg-white/10 hover:bg-white/15 px-4 py-2 rounded-xl text-gray-300"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleSaveLyrics}
                  className="text-xs py-2 px-4 rounded-xl text-black font-semibold"
                  style={{ backgroundColor: accentColor }}
                >
                  حفظ الكلمات
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        // Active Lyrics Scroller (Apple Music-style)
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto pr-2 scrollbar-none flex flex-col gap-6 relative"
          style={{ maskImage: "linear-gradient(to bottom, transparent, white 20%, white 80%, transparent)" }}
        >
          {/* Spacer before first line */}
          <div className="h-32 shrink-0" />
          
          {parsedLyrics.map((line, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={idx}
                ref={isActive ? activeLineRef : null}
                onClick={() => {
                  // Seek to the time of this lyric line on double click or simple click!
                  audioEngine.seek(line.time);
                }}
                className={`py-1 text-center font-display text-lg font-bold leading-snug cursor-pointer transition-all duration-300 select-none ${
                  isActive
                    ? "scale-105 opacity-100 text-white drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)]"
                    : "opacity-25 hover:opacity-50 text-gray-300"
                }`}
                style={{
                  color: isActive ? accentColor : undefined,
                }}
              >
                {line.text}
              </div>
            );
          })}

          {/* Spacer after last line */}
          <div className="h-32 shrink-0" />
        </div>
      )}
    </div>
  );
}
