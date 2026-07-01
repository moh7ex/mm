import React, { useState } from "react";
import { Play, Pause, SkipForward, SkipBack, Disc, Sliders, Music, ListMusic, Shuffle, Repeat, Volume2, VolumeX } from "lucide-react";
import { TrackMetadata, QueueItem } from "../types";
import WaveformVisualizer from "./WaveformVisualizer";
import EqualizerPanel from "./EqualizerPanel";
import LyricsPanel from "./LyricsPanel";
import QueuePanel from "./QueuePanel";
import { formatTime } from "../utils";
import { translations } from "../locales";

interface StudioViewProps {
  track: TrackMetadata | undefined;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  repeatMode: number;
  isShuffled: boolean;
  favorites: Set<number>;
  currentQueue: QueueItem[];
  upcomingQueue: QueueItem[];
  historyQueue: QueueItem[];
  accentColor: string;
  glowColor: string;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onRateChange: (rate: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: (id: number) => void;
  onRemoveFromQueue: (id: string) => void;
  onReorderQueue: (queue: QueueItem[]) => void;
  onClearQueue: () => void;
  onPlayTrackDirectly: (id: number) => void;
  lang: "ar" | "en";
}

export default function StudioView({
  track,
  isPlaying,
  currentTime,
  duration,
  volume,
  playbackRate,
  repeatMode,
  isShuffled,
  favorites,
  currentQueue,
  upcomingQueue,
  historyQueue,
  accentColor,
  glowColor,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onRateChange,
  onToggleShuffle,
  onToggleRepeat,
  onRemoveFromQueue,
  onReorderQueue,
  onClearQueue,
  onPlayTrackDirectly,
  lang,
}: StudioViewProps) {
  const t = translations[lang];
  const [activeSubTab, setActiveSubTab] = useState<"eq" | "lyrics" | "queue">("lyrics");

  const isRtl = lang === "ar";
  const alignClass = isRtl ? "text-right" : "text-left";
  const flexRowClass = isRtl ? "flex-row-reverse" : "flex-row";

  if (!track) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-20 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl animate-fade-in" id="studio-view-empty">
        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 text-gray-500 border border-white/5">
          <Disc size={40} className="animate-spin-slow" />
        </div>
        <h3 className="text-xl font-bold text-white">{t.st_empty_title}</h3>
        <p className="text-xs text-gray-400 mt-2 max-w-sm leading-relaxed">
          {t.st_empty_desc}
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in ${alignClass}`} id="studio-view-active">
      
      {/* 1. LEFT PANEL (5 Cols): Vinyl Spin, Lyrics Visualizer & Waveform */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        
        {/* Dynamic Studio Vinyl artwork card */}
        <div
          className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-2xl transition-all duration-1000"
          style={{
            boxShadow: `0 12px 40px rgba(0, 0, 0, 0.4), 0 0 24px ${glowColor}1c`,
          }}
        >
          <div
            className="absolute inset-0 filter blur-3xl opacity-15 scale-125 -z-10 bg-cover bg-center transition-all duration-1000"
            style={{ backgroundImage: `url(${track.cover})` }}
          />

          <div className="relative w-44 h-44 group">
            <img
              src={track.cover || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><rect width='100%25' height='100%25' fill='%23111'/></svg>"}
              className="w-full h-full rounded-full object-cover animate-spin-slow border-4 border-black/50 shadow-2xl z-10 relative"
              style={{ animationPlayState: isPlaying ? "running" : "paused" }}
              alt={track.title}
            />
            {/* Vinyl Center Hole Overlay */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black border-2 border-white/10 z-20 shadow-inner" />
          </div>

          <div className="flex flex-col gap-1 mt-5 max-w-full">
            <h3 className="text-lg font-black text-white truncate">{track.title}</h3>
            <p className="text-xs text-gray-400 truncate">{track.artist}</p>
          </div>

          {/* Micro Live Waveform Spectrum */}
          <div className="w-full mt-4 p-4 bg-black/30 border border-white/5 rounded-2xl relative">
            <WaveformVisualizer
              isPlaying={isPlaying}
              accentColor={accentColor}
              glowColor={glowColor}
              duration={duration}
              currentTime={currentTime}
              onSeek={onSeek}
            />
          </div>
        </div>

        {/* Dynamic Volume and Playback Details */}
        <div className={`bg-white/5 border border-white/10 p-5 rounded-3xl flex flex-col gap-4 ${alignClass}`}>
          <div className={`flex justify-between items-center text-xs font-semibold text-gray-400 ${flexRowClass}`}>
            <span className="font-mono">{formatTime(duration)}</span>
            <span className="font-mono">{formatTime(currentTime)}</span>
          </div>

          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-white"
            style={{ accentColor }}
          />

          {/* Center Playback Triggers */}
          <div className={`flex items-center justify-center gap-6 mt-1 ${flexRowClass}`}>
            <button
              onClick={onToggleShuffle}
              className={`transition-colors active:scale-90 p-1 ${isShuffled ? "text-[#1ed760]" : "text-gray-500 hover:text-white"}`}
              style={{ color: isShuffled ? accentColor : undefined }}
              title={isRtl ? "خلط الأغاني" : "Shuffle"}
            >
              <Shuffle size={16} />
            </button>

            <button
              onClick={onPrev}
              className="text-gray-400 hover:text-white active:scale-90 transition-all p-1"
            >
              <SkipBack size={18} />
            </button>

            <button
              onClick={onPlayPause}
              className="w-12 h-12 rounded-full flex items-center justify-center text-black active:scale-95 hover:brightness-110 transition-all shadow-lg font-bold"
              style={{ backgroundColor: accentColor, boxShadow: `0 4px 14px ${glowColor}` }}
            >
              {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className={isRtl ? "mr-1" : "ml-1"} />}
            </button>

            <button
              onClick={onNext}
              className="text-gray-400 hover:text-white active:scale-90 transition-all p-1"
            >
              <SkipForward size={18} />
            </button>

            <button
              onClick={onToggleRepeat}
              className={`transition-colors active:scale-90 p-1 ${repeatMode > 0 ? "text-[#1ed760]" : "text-gray-500 hover:text-white"}`}
              style={{ color: repeatMode > 0 ? accentColor : undefined }}
              title={repeatMode === 2 ? (isRtl ? "تكرار أغنية واحدة" : "Repeat One") : repeatMode === 1 ? (isRtl ? "تكرار الكل" : "Repeat All") : (isRtl ? "تكرار ملغي" : "Repeat Off")}
            >
              <Repeat size={16} />
            </button>
          </div>

          {/* Volume and Playback Speed Controls Row */}
          <div className={`flex items-center gap-3 border-t border-white/5 pt-3 ${flexRowClass}`}>
            <button
              onClick={() => onVolumeChange(volume > 0 ? 0 : 0.8)}
              className="text-gray-400 hover:text-white transition-colors active:scale-95"
            >
              {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="flex-1 cursor-pointer h-1 rounded-lg bg-white/10 outline-none"
              style={{ accentColor: accentColor }}
            />

            <select
              value={playbackRate}
              onChange={(e) => onRateChange(parseFloat(e.target.value))}
              className="bg-black/40 border border-white/10 text-[10px] text-white rounded-lg px-2 py-1 outline-none font-mono font-bold cursor-pointer hover:bg-black/60"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1.0x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2.0x</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. RIGHT PANEL (7 Cols): Tabs for EQ, Lyrics, Queue */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Horizontal Navigation within Studio View */}
        <div className={`flex gap-1 bg-white/5 border border-white/5 p-1 rounded-2xl ${flexRowClass}`}>
          {[
            { id: "lyrics", label: t.st_lyrics, icon: Music },
            { id: "eq", label: t.st_eq, icon: Sliders },
            { id: "queue", label: t.st_queue, icon: ListMusic },
          ].map((tab) => {
            const Icon = tab.icon;
            const isTabActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                  isTabActive
                    ? "bg-white/10 text-white"
                    : "text-gray-400 hover:text-gray-200"
                }`}
                style={{ color: isTabActive ? accentColor : undefined }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab view screen wrappers */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-xl flex-1 min-h-[380px] overflow-hidden flex flex-col">
          {activeSubTab === "lyrics" && (
            <div className="flex-1 overflow-y-auto max-h-[350px]">
              <LyricsPanel trackId={track.id} currentTime={currentTime} accentColor={accentColor} />
            </div>
          )}

          {activeSubTab === "eq" && (
            <div className="flex-1 overflow-y-auto max-h-[350px]">
              <EqualizerPanel accentColor={accentColor} />
            </div>
          )}

          {activeSubTab === "queue" && (
            <div className="flex-1 overflow-y-auto max-h-[350px]">
              <QueuePanel
                currentQueue={currentQueue}
                upcomingQueue={upcomingQueue}
                historyQueue={historyQueue}
                currentTrackId={track.id}
                accentColor={accentColor}
                onPlayTrack={onPlayTrackDirectly}
                onRemoveFromQueue={onRemoveFromQueue}
                onReorderQueue={onReorderQueue}
                onClearQueue={onClearQueue}
              />
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
