import React, { useState, useEffect } from "react";
import { TrackMetadata, QueueItem } from "../types";
import { formatTime } from "../utils";
import WaveformVisualizer from "./WaveformVisualizer";
import EqualizerPanel from "./EqualizerPanel";
import LyricsPanel from "./LyricsPanel";
import QueuePanel from "./QueuePanel";
import {
  ChevronDown,
  Heart,
  Shuffle,
  RotateCcw,
  SkipBack,
  Play,
  Pause,
  SkipForward,
  FastForward,
  Repeat,
  Volume2,
  VolumeX,
  Clock,
  Music,
  Sliders,
  AlignLeft,
  ListMusic,
} from "lucide-react";

interface FullPlayerProps {
  track?: TrackMetadata;
  isPlaying: boolean;
  accentColor: string;
  glowColor: string;
  isDark: boolean;
  duration: number;
  currentTime: number;
  volume: number;
  playbackRate: number;
  repeatMode: number; // 0 = off, 1 = repeat all, 2 = repeat one
  isShuffled: boolean;
  favorites: Set<number>;
  playerBgStyle?: "blurred-cover" | "solid" | "custom";
  playerCustomBg?: string;
  lang: "ar" | "en";
  
  // Queue & Sub-components data
  currentQueue: QueueItem[];
  upcomingQueue: QueueItem[];
  historyQueue: QueueItem[];
  
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onRateChange: (rate: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleFavorite: (trackId: number) => void;
  onClose: () => void;
  
  // Queue actions
  onRemoveFromQueue: (instanceId: string) => void;
  onReorderQueue: (newQueue: QueueItem[]) => void;
  onClearQueue: () => void;
  onPlayTrackDirectly: (trackId: number) => void;
}

export default function FullPlayer({
  track,
  isPlaying,
  accentColor,
  glowColor,
  duration,
  currentTime,
  volume,
  playbackRate,
  repeatMode,
  isShuffled,
  favorites,
  playerBgStyle = "blurred-cover",
  playerCustomBg = "",
  lang,
  currentQueue,
  upcomingQueue,
  historyQueue,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onRateChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleFavorite,
  onClose,
  onRemoveFromQueue,
  onReorderQueue,
  onClearQueue,
  onPlayTrackDirectly,
}: FullPlayerProps) {
  const [activeTab, setActiveTab] = useState<"visuals" | "eq" | "lyrics" | "queue">("visuals");
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(volume);
  const [sleepMinutes, setSleepMinutes] = useState<number>(0);
  const [sleepSeconds, setSleepSeconds] = useState<number>(0);
  const [isSleepActive, setIsSleepActive] = useState(false);

  // CD rotation parallax
  const [parallaxStyle, setParallaxStyle] = useState({ transform: "perspective(1000px) rotateX(0deg) rotateY(0deg)" });

  if (!track) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    const rotateX = -y / 15;
    const rotateY = x / 15;
    
    setParallaxStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`
    });
  };

  const handleMouseLeave = () => {
    setParallaxStyle({
      transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)"
    });
  };

  const handleMuteToggle = () => {
    if (isMuted) {
      onVolumeChange(prevVolume);
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      onVolumeChange(0);
      setIsMuted(true);
    }
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSleepActive) {
      if (sleepMinutes === 0 && sleepSeconds === 0) {
        setIsSleepActive(false);
        if (isPlaying) onPlayPause();
      } else {
        timer = setInterval(() => {
          if (sleepSeconds > 0) {
            setSleepSeconds(sleepSeconds - 1);
          } else if (sleepMinutes > 0) {
            setSleepMinutes(sleepMinutes - 1);
            setSleepSeconds(59);
          }
        }, 1000);
      }
    }
    return () => clearInterval(timer);
  }, [isSleepActive, sleepMinutes, sleepSeconds, isPlaying]);

  const startSleepTimer = (mins: number) => {
    if (mins === 0) {
      setIsSleepActive(false);
      setSleepMinutes(0);
      setSleepSeconds(0);
    } else {
      setSleepMinutes(mins);
      setSleepSeconds(0);
      setIsSleepActive(true);
    }
  };

  const isFavorited = favorites.has(track.id);
  const isRtl = lang === "ar";
  const dirClass = isRtl ? "rtl" : "ltr";
  const textAlignment = isRtl ? "text-right" : "text-left";
  const flexRowClass = isRtl ? "flex-row-reverse" : "flex-row";

  return (
    <div
      className={`fixed inset-0 z-50 bg-[#020204]/98 flex flex-col overflow-y-auto pb-8 relative ${textAlignment}`}
      dir={dirClass}
      style={{
        backgroundImage: playerBgStyle === "solid"
          ? "none"
          : `radial-gradient(circle at 50% 10%, ${accentColor}12 0%, #020204 80%)`,
      }}
    >
      {/* Blurred Cover background style */}
      {playerBgStyle === "blurred-cover" && track.cover && (
        <div 
          className="absolute inset-0 -z-20 opacity-30 filter blur-[90px] scale-110 pointer-events-none transition-all duration-1000"
          style={{
            backgroundImage: `url(${track.cover})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Custom player background image */}
      {playerBgStyle === "custom" && playerCustomBg && (
        <div 
          className="absolute inset-0 -z-20 opacity-30 pointer-events-none transition-all duration-1000"
          style={{
            backgroundImage: `linear-gradient(rgba(2, 2, 4, 0.82), rgba(2, 2, 4, 0.95)), url(${playerCustomBg})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      )}

      {/* Dynamic Ambient Background Blur */}
      {playerBgStyle !== "solid" && (
        <div
          className="absolute top-0 left-0 right-0 h-[40vh] opacity-25 -z-10 filter blur-[120px] transition-all duration-1000 pointer-events-none"
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* HEADER SECTION */}
      <div className={`w-full max-w-4xl mx-auto px-6 pt-8 flex items-center justify-between z-10 ${flexRowClass}`}>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 active:scale-95 transition-all"
        >
          <ChevronDown size={22} />
        </button>

        <div className="flex flex-col items-center text-center">
          <span className="text-[10px] uppercase font-mono tracking-widest text-gray-500">PRO STUDIO CORE v5</span>
          <span className="text-xs text-gray-400 font-medium">{track.album || (isRtl ? "ألبوم غير معروف" : "Unknown Album")}</span>
        </div>

        <button
          onClick={() => onToggleFavorite(track.id)}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 active:scale-95 transition-all"
        >
          <Heart size={20} className={isFavorited ? "text-red-500 fill-red-500" : "text-gray-300"} />
        </button>
      </div>

      {/* CORE CONTAINER */}
      <div className="flex-1 w-full max-w-4xl mx-auto px-6 mt-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10">
        
        {/* LEFT COLUMN: CD Visualizer & Controls */}
        <div className="flex flex-col items-center gap-6">
          {/* Interactive CD */}
          <div
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={parallaxStyle}
            className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.8)] border-4 border-[#121215] flex items-center justify-center transition-all duration-200 ease-out"
          >
            <div
              className="absolute inset-0 rounded-full filter blur-xl opacity-20 -z-10 transition-all duration-1000"
              style={{ backgroundColor: accentColor }}
            />

            <div
              className={`absolute inset-0 rounded-full overflow-hidden transition-transform ${
                isPlaying ? "animate-spin-slow" : ""
              }`}
              style={{
                backgroundImage: "repeating-radial-gradient(circle, #09090b, #0d0d11 2px, #040406 4px)",
              }}
            >
              <div className="absolute inset-10 rounded-full overflow-hidden border-8 border-[#0c0c0e]">
                <img
                  src={track.cover || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg'><rect width='100%25' height='100%25' fill='%23222'/></svg>"}
                  className="w-full h-full object-cover"
                  alt={track.title}
                />
              </div>

              <div className="absolute top-[42%] left-[42%] w-[16%] h-[16%] rounded-full bg-black border-4 border-[#18181b] shadow-inner flex items-center justify-center">
                <div className="w-1/3 h-1/3 bg-[#0d0d11] rounded-full" />
              </div>
            </div>

            <div className="absolute inset-0 rounded-full pointer-events-none mix-blend-overlay opacity-40">
              <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="-20" y1="50" x2="120" y2="50" stroke="white" strokeWidth="6" transform="rotate(-45, 50, 50)" />
                <line x1="-20" y1="50" x2="120" y2="50" stroke="white" strokeWidth="2" transform="rotate(-40, 50, 50)" />
                <line x1="-20" y1="50" x2="120" y2="50" stroke="white" strokeWidth="3" transform="rotate(45, 50, 50)" opacity="0.6" />
              </svg>
            </div>
          </div>

          {/* Track Titles */}
          <div className="text-center w-full px-4">
            <h2 className="text-2xl font-bold text-white tracking-tight leading-tight truncate">{track.title}</h2>
            <p className="text-sm font-medium text-gray-400 mt-1 truncate">{track.artist}</p>
          </div>

          {/* Controls HUD */}
          <div className="w-full max-w-xs flex flex-col gap-4">
            <div className={`flex justify-between items-center px-4 ${flexRowClass}`}>
              <button
                onClick={onToggleShuffle}
                className={`p-2 transition-colors active:scale-90 ${isShuffled ? "text-[#1ed760]" : "text-gray-500 hover:text-white"}`}
                style={{ color: isShuffled ? accentColor : undefined }}
                title={isRtl ? "تفعيل الوضع العشوائي" : "Toggle Shuffle"}
              >
                <Shuffle size={18} />
              </button>

              <button
                onClick={() => onSeek(Math.max(0, currentTime - 10))}
                className="p-2 text-gray-400 hover:text-white transition-colors active:scale-90"
                title={isRtl ? "رجوع 10 ثواني" : "Back 10s"}
              >
                <RotateCcw size={18} />
              </button>

              <button
                onClick={onPrev}
                className="p-2 text-gray-400 hover:text-white transition-colors active:scale-90"
                title={isRtl ? "الأغنية السابقة" : "Previous Song"}
              >
                <SkipBack size={22} fill="currentColor" />
              </button>

              <button
                onClick={onPlayPause}
                className="w-16 h-16 rounded-full flex items-center justify-center text-black shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer hover:brightness-110"
                style={{
                  backgroundColor: accentColor,
                  boxShadow: `0 10px 30px ${glowColor}50, inset 0 2px 0 rgba(255,255,255,0.2)`
                }}
              >
                {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className={isRtl ? "mr-1" : "ml-1"} />}
              </button>

              <button
                onClick={onNext}
                className="p-2 text-gray-400 hover:text-white transition-colors active:scale-90"
                title={isRtl ? "الأغنية التالية" : "Next Song"}
              >
                <SkipForward size={22} fill="currentColor" />
              </button>

              <button
                onClick={() => onSeek(Math.min(duration, currentTime + 10))}
                className="p-2 text-gray-400 hover:text-white transition-colors active:scale-90"
                title={isRtl ? "تقدم 10 ثواني" : "Forward 10s"}
              >
                <FastForward size={18} />
              </button>

              <button
                onClick={onToggleRepeat}
                className={`p-2 transition-colors active:scale-90 ${repeatMode > 0 ? "text-[#1ed760]" : "text-gray-500 hover:text-white"}`}
                style={{ color: repeatMode > 0 ? accentColor : undefined }}
                title={repeatMode === 2 ? (isRtl ? "تكرار أغنية واحدة" : "Repeat One") : repeatMode === 1 ? (isRtl ? "تكرار القائمة" : "Repeat All") : (isRtl ? "تكرار ملغي" : "Repeat Off")}
              >
                <Repeat size={18} />
              </button>
            </div>

            {/* Volume */}
            <div className={`flex items-center gap-3 bg-white/5 border border-white/5 p-3 rounded-2xl ${flexRowClass}`}>
              <button
                onClick={handleMuteToggle}
                className="text-gray-400 hover:text-white transition-colors active:scale-95"
              >
                {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className="flex-1 cursor-pointer h-1.5 rounded-lg bg-white/10 outline-none range-slider-bar"
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

            {/* Sleep Timer */}
            <div className={`flex items-center justify-between bg-white/5 border border-white/5 p-3 rounded-2xl ${flexRowClass}`}>
              <div className="flex items-center gap-1.5 text-xs text-gray-300 font-medium">
                <Clock size={16} style={{ color: isSleepActive ? accentColor : "#888" }} />
                <span>{isRtl ? "مؤقت النوم" : "Sleep Timer"}</span>
              </div>

              {isSleepActive ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">
                    {sleepMinutes.toString().padStart(2, "0")}:{sleepSeconds.toString().padStart(2, "0")}
                  </span>
                  <button
                    onClick={() => startSleepTimer(0)}
                    className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/10 px-2 py-0.5 rounded"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                </div>
              ) : (
                <div className="flex gap-1.5">
                  {[15, 30, 60].map((mins) => (
                    <button
                      key={mins}
                      onClick={() => startSleepTimer(mins)}
                      className="text-[10px] bg-white/5 border border-white/5 hover:bg-white/10 text-gray-300 px-2 py-1 rounded font-mono"
                    >
                      {mins}{isRtl ? "د" : "m"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sideboards */}
        <div className="flex flex-col gap-4 h-full">
          {/* Tab Selection */}
          <div className="grid grid-cols-4 bg-white/5 p-1 rounded-2xl border border-white/5 gap-1">
            <button
              onClick={() => setActiveTab("visuals")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "visuals" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
              }`}
              style={{ color: activeTab === "visuals" ? accentColor : undefined }}
            >
              <Music size={14} />
              <span className="hidden sm:inline">{isRtl ? "موجات" : "Visuals"}</span>
            </button>

            <button
              onClick={() => setActiveTab("eq")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "eq" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
              }`}
              style={{ color: activeTab === "eq" ? accentColor : undefined }}
            >
              <Sliders size={14} />
              <span className="hidden sm:inline">{isRtl ? "إيكولايزر" : "Equalizer"}</span>
            </button>

            <button
              onClick={() => setActiveTab("lyrics")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "lyrics" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
              }`}
              style={{ color: activeTab === "lyrics" ? accentColor : undefined }}
            >
              <AlignLeft size={14} />
              <span className="hidden sm:inline">{isRtl ? "الكلمات" : "Lyrics"}</span>
            </button>

            <button
              onClick={() => setActiveTab("queue")}
              className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "queue" ? "bg-white/10 text-white" : "text-gray-400 hover:text-white"
              }`}
              style={{ color: activeTab === "queue" ? accentColor : undefined }}
            >
              <ListMusic size={14} />
              <span className="hidden sm:inline">{isRtl ? "الانتظار" : "Queue"}</span>
            </button>
          </div>

          {/* Dynamic Tab Panel */}
          <div className="flex-1 min-h-[300px]">
            {activeTab === "visuals" && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl flex flex-col justify-center gap-6 h-80">
                <div className={`flex justify-between items-center ${flexRowClass}`}>
                  <span className="text-xs uppercase font-mono tracking-wider text-gray-400">Time & Progress Scrubber</span>
                  <span className="text-xs font-mono font-bold text-white">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <WaveformVisualizer
                  isPlaying={isPlaying}
                  accentColor={accentColor}
                  glowColor={glowColor}
                  duration={duration}
                  currentTime={currentTime}
                  onSeek={onSeek}
                />
              </div>
            )}

            {activeTab === "eq" && <EqualizerPanel accentColor={accentColor} />}

            {activeTab === "lyrics" && (
              <LyricsPanel trackId={track.id} currentTime={currentTime} accentColor={accentColor} />
            )}

            {activeTab === "queue" && (
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
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
