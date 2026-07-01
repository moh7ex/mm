import { useState, useEffect, useRef } from "react";
import { TrackMetadata, QueueItem } from "../types";
import { db } from "../db";
import { audioEngine } from "../audio";
import { extractDominantColor } from "../utils";

interface UseAudioPlayerProps {
  filteredTracks: TrackMetadata[];
  tracks: TrackMetadata[];
  loadLibrary: () => Promise<void>;
  showToast: (message: string, showUndo?: boolean, action?: () => void) => void;
  themePreset: "spotify" | "apple" | "cyber" | "oled";
  applyThemePreset: (preset: "spotify" | "apple" | "cyber" | "oled") => void;
  setAccentColor: (color: string) => void;
  setGlowColor: (color: string) => void;
}

export function useAudioPlayer({
  filteredTracks,
  tracks,
  loadLibrary,
  showToast,
  themePreset,
  applyThemePreset,
  setAccentColor,
  setGlowColor,
}: UseAudioPlayerProps) {
  const [currentTrack, setCurrentTrack] = useState<TrackMetadata | undefined>(undefined);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [repeatMode, setRepeatMode] = useState(0); // 0 = off, 1 = repeat playlist, 2 = repeat one
  const [isShuffled, setIsShuffled] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Queue Manager States
  const [currentQueue, setCurrentQueue] = useState<QueueItem[]>([]);
  const [upcomingQueue, setUpcomingQueue] = useState<QueueItem[]>([]);
  const [historyQueue, setHistoryQueue] = useState<QueueItem[]>([]);

  // Restore player settings from DB on initialization
  useEffect(() => {
    async function restoreSettings() {
      const savedVolume = await db.getSetting<number>("volume");
      if (savedVolume !== null) {
        setVolume(savedVolume);
        audioEngine.setVolume(savedVolume);
      }

      const savedRate = await db.getSetting<number>("playbackRate");
      if (savedRate !== null) {
        setPlaybackRate(savedRate);
        audioEngine.setPlaybackRate(savedRate);
      }
    }
    restoreSettings();

    // Clean up Audio Object URLs on window unload to prevent memory leaks
    const handleUnload = () => {
      if (audioEngine.activeAudioElement.src) {
        URL.revokeObjectURL(audioEngine.activeAudioElement.src);
      }
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  // Set up listeners for audio progress and events
  useEffect(() => {
    audioEngine.onTimeUpdate = (cur, dur) => {
      setCurrentTime(cur);
      setDuration(dur);
    };
  }, []);

  // Set up overlap and ending transitions
  useEffect(() => {
    audioEngine.onCrossfadeStarted = async () => {
      if (upcomingQueue.length === 0 || audioEngine.ctx?.state === "suspended") return;

      const nextItem = upcomingQueue[0];
      const nextTrackId = nextItem.trackId;

      try {
        const blobs = await db.getTrackBlobs(nextTrackId);
        if (blobs) {
          const nextTrackMetadata = nextItem.metadata;
          const coverUrl = blobs.coverBlob ? URL.createObjectURL(blobs.coverBlob) : "";

          const trackWithCoverUrl = {
            ...nextTrackMetadata,
            cover: coverUrl,
          };

          setCurrentTrack(trackWithCoverUrl);
          setCurrentQueue([nextItem]);
          setUpcomingQueue(upcomingQueue.slice(1));

          await audioEngine.crossfadeTo(blobs.audioBlob);
        }
      } catch (err) {
        console.warn("Failed preloading next crossfade track:", err);
      }
    };

    audioEngine.onTrackEnded = () => {
      handleNextTrack();
    };
  }, [upcomingQueue, repeatMode, filteredTracks]);

  // Integration with hardware media widgets & Bluetooth keys
  useEffect(() => {
    if ("mediaSession" in navigator && currentTrack) {
      navigator.mediaSession.setActionHandler("play", handlePlayPause);
      navigator.mediaSession.setActionHandler("pause", handlePlayPause);
      navigator.mediaSession.setActionHandler("previoustrack", handlePrevTrack);
      navigator.mediaSession.setActionHandler("nexttrack", handleNextTrack);
    }
  }, [currentTrack, isPlaying, upcomingQueue]);

  // Compiles next up list
  const compileUpcomingQueue = (trackId: number, currentList = filteredTracks) => {
    const activeList = [...currentList];
    const currentIndex = activeList.findIndex((t) => t.id === trackId);
    if (currentIndex === -1) return;

    let nextList: TrackMetadata[] = [];
    if (isShuffled) {
      nextList = [...activeList].sort(() => Math.random() - 0.5);
    } else {
      nextList = activeList.slice(currentIndex + 1);
    }

    const compiled: QueueItem[] = nextList.map((t) => ({
      id: Math.random().toString(36).substring(7),
      trackId: t.id,
      metadata: t,
    }));

    setUpcomingQueue(compiled);
  };

  const playTrack = async (track: TrackMetadata, startPosition: number = 0) => {
    try {
      const blobs = await db.getTrackBlobs(track.id);
      if (!blobs) {
        showToast("خطأ: تعذر العثور على ملف الصوت الخاص بالأغنية");
        return;
      }

      setCurrentTrack(track);
      setIsPlaying(true);
      setCurrentTime(startPosition);

      // Extract dynamic colors from Album Art cover
      if (blobs.coverBlob) {
        const palette = await extractDominantColor(blobs.coverBlob);
        setAccentColor(palette.primary);
        setGlowColor(palette.glow);
      } else {
        applyThemePreset(themePreset);
      }

      const coverUrl = blobs.coverBlob ? URL.createObjectURL(blobs.coverBlob) : "";
      const trackWithCoverUrl = {
        ...track,
        cover: coverUrl,
      };

      setCurrentTrack(trackWithCoverUrl);

      await audioEngine.playTrackBlob(blobs.audioBlob, startPosition);

      // Increment play counter in the DB
      const updatedPlayCount = track.playCount + 1;
      await db.updateTrackMetadata(track.id, {
        playCount: updatedPlayCount,
        lastPlayed: Date.now(),
      });

      await loadLibrary();

      const queueItem: QueueItem = {
        id: Math.random().toString(36).substring(7),
        trackId: track.id,
        metadata: trackWithCoverUrl,
      };
      setCurrentQueue([queueItem]);

      compileUpcomingQueue(track.id);

      setHistoryQueue((prev) => [...prev, queueItem]);
    } catch (err) {
      console.error("Failed to play track:", track.title, err);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      audioEngine.pause();
      setIsPlaying(false);
    } else {
      audioEngine.play();
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    if (upcomingQueue.length > 0) {
      const next = upcomingQueue[0];
      playTrack(next.metadata);
    } else if (repeatMode === 1 && filteredTracks.length > 0) {
      playTrack(filteredTracks[0]);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrevTrack = () => {
    const currentIdx = filteredTracks.findIndex((t) => t.id === currentTrack?.id);
    if (currentIdx > 0) {
      playTrack(filteredTracks[currentIdx - 1]);
    } else {
      audioEngine.seek(0);
    }
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    audioEngine.seek(time);
  };

  const handleVolumeChange = (vol: number) => {
    setVolume(vol);
    audioEngine.setVolume(vol);
    db.setSetting("volume", vol);
  };

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    audioEngine.setPlaybackRate(rate);
    db.setSetting("playbackRate", rate);
  };

  const handleToggleShuffle = () => {
    const newState = !isShuffled;
    setIsShuffled(newState);
    showToast(newState ? "🔀 تفعيل الترتيب العشوائي" : "🔁 إيقاف الترتيب العشوائي");
    if (currentTrack) {
      compileUpcomingQueue(currentTrack.id);
    }
  };

  const handleToggleRepeat = () => {
    const nextMode = (repeatMode + 1) % 3;
    setRepeatMode(nextMode);
    const labels = ["إيقاف التكرار", "تكرار القائمة بالكامل 🔁", "تكرار الأغنية الحالية فقط 🔂"];
    showToast(labels[nextMode]);
  };

  return {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    playbackRate,
    repeatMode,
    isShuffled,
    isExpanded,
    currentQueue,
    upcomingQueue,
    historyQueue,
    setCurrentTrack,
    setIsPlaying,
    setIsExpanded,
    setUpcomingQueue,
    playTrack,
    handlePlayPause,
    handleNextTrack,
    handlePrevTrack,
    handleSeek,
    handleVolumeChange,
    handleRateChange,
    handleToggleShuffle,
    handleToggleRepeat,
    compileUpcomingQueue,
  };
}
