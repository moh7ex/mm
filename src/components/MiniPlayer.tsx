import React, { useRef } from "react";
import { TrackMetadata } from "../types";
import { Play, Pause, ChevronUp, SkipForward, SkipBack } from "lucide-react";

interface MiniPlayerProps {
  track?: TrackMetadata;
  isPlaying: boolean;
  accentColor: string;
  glowColor: string;
  duration: number;
  currentTime: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onExpand: () => void;
  lang: "ar" | "en";
}

export default function MiniPlayer({
  track,
  isPlaying,
  accentColor,
  glowColor,
  duration,
  currentTime,
  onPlayPause,
  onNext,
  onPrev,
  onExpand,
  lang,
}: MiniPlayerProps) {
  const touchStartX = useRef<number | null>(null);

  if (!track) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diffX = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(diffX) > 60) {
      if (diffX > 0) {
        onPrev();
      } else {
        onNext();
      }
    }
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isRtl = lang === "ar";
  const flexRowClass = isRtl ? "flex-row-reverse" : "flex-row";
  const textAlignment = isRtl ? "text-right" : "text-left";

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`fixed bottom-[74px] left-[4%] right-[4%] h-16 bg-black/65 hover:bg-black/85 border border-white/10 rounded-2xl backdrop-blur-2xl flex items-center justify-between px-4 z-50 shadow-2xl transition-all duration-300 ${flexRowClass}`}
      style={{
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px ${glowColor}1a`,
        borderColor: `${accentColor}2a`,
      }}
    >
      <div
        className="absolute inset-0 -z-10 opacity-5 rounded-2xl pointer-events-none"
        style={{ backgroundColor: accentColor }}
      />

      <div
        onClick={onExpand}
        className={`flex items-center gap-3 cursor-pointer flex-1 min-w-0 h-full ${flexRowClass} ${textAlignment}`}
      >
        <img
          src={track.cover || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><rect width='100%25' height='100%25' fill='%23111'/></svg>"}
          className="w-10 h-10 rounded-xl object-cover animate-spin-slow shadow-lg border border-white/5"
          style={{ animationPlayState: isPlaying ? "running" : "paused" }}
          alt={track.title}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-white truncate">{track.title}</h4>
          <span className="text-[10px] text-gray-400 truncate">{track.artist}</span>
        </div>
      </div>

      <div className={`flex items-center gap-3 ${flexRowClass}`}>
        <button
          onClick={onPrev}
          className="p-1.5 text-gray-400 hover:text-white transition-colors active:scale-90"
        >
          <SkipBack size={16} />
        </button>

        <button
          onClick={onPlayPause}
          className="w-9 h-9 rounded-full flex items-center justify-center text-black shadow-md transition-all active:scale-95 cursor-pointer hover:brightness-110"
          style={{ backgroundColor: accentColor, boxShadow: `0 4px 12px ${glowColor}` }}
        >
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className={isRtl ? "ml-0.5" : "ml-1"} />}
        </button>

        <button
          onClick={onNext}
          className="p-1.5 text-gray-400 hover:text-white transition-colors active:scale-90"
        >
          <SkipForward size={16} />
        </button>

        <div className="h-6 w-px bg-white/10 mx-1" />

        <button
          onClick={onExpand}
          className="p-1.5 text-gray-400 hover:text-white transition-colors animate-bounce active:scale-90"
          title={isRtl ? "توسيع واجهة المشغل" : "Expand Player"}
        >
          <ChevronUp size={20} />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 rounded-b-2xl overflow-hidden">
        <div
          className="h-full transition-all duration-100 ease-out"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: accentColor,
            boxShadow: `0 0 8px ${accentColor}`,
          }}
        />
      </div>
    </div>
  );
}
