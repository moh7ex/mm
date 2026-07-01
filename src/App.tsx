import React, { useState, useEffect } from "react";
import { useLibrary } from "./hooks/useLibrary";
import { useAudioPlayer } from "./hooks/useAudioPlayer";
import ErrorBoundary from "./components/ErrorBoundary";
import { formatTime, formatBytes } from "./utils";
import MiniPlayer from "./components/MiniPlayer";
import FullPlayer from "./components/FullPlayer";
import LibraryView from "./components/LibraryView";
import PlaylistsView from "./components/PlaylistsView";
import UploadView from "./components/UploadView";
import StudioView from "./components/StudioView";
import ProfileView from "./components/ProfileView";
import SettingsView from "./components/SettingsView";
import PerfIndicator from "./components/PerfIndicator";
import { db } from "./db";
import { translations } from "./locales";

import {
  Sparkles,
  Disc,
  Music,
  ListMusic,
  UploadCloud,
  Terminal,
  Info,
  Undo2,
  User,
  Settings
} from "lucide-react";

export default function App() {
  // Navigation View Switcher (Tabs)
  // Options: "studio" | "library" | "playlists" | "upload" | "profile" | "settings"
  const [activeTab, setActiveTab] = useState<"studio" | "library" | "playlists" | "upload" | "profile" | "settings">("library");

  // Language State ("ar" | "en")
  const [lang, setLang] = useState<"ar" | "en">("ar");

  const handleLangChange = async (newLang: "ar" | "en") => {
    setLang(newLang);
    await db.setSetting("app_lang", newLang);
  };

  // Styling & Theme (Dynamic Palette)
  const [accentColor, setAccentColor] = useState("#1ed760");
  const [glowColor, setGlowColor] = useState("rgba(30, 215, 96, 0.4)");
  const [isDark, setIsDark] = useState(true);
  const [themePreset, setThemePreset] = useState<"spotify" | "apple" | "cyber" | "oled">("spotify");

  // Debug & Performance Monitor State
  const [isDebugMode, setIsDebugMode] = useState(false);

  // Background states
  const [appBgImage, setAppBgImage] = useState<string>("");
  const [playerBgStyle, setPlayerBgStyle] = useState<"blurred-cover" | "solid" | "custom">("blurred-cover");
  const [playerCustomBg, setPlayerCustomBg] = useState<string>("");

  const handleAppBgChange = async (url: string) => {
    setAppBgImage(url);
    await db.setSetting("appBgImage", url);
  };

  const handlePlayerBgStyleChange = async (style: "blurred-cover" | "solid" | "custom") => {
    setPlayerBgStyle(style);
    await db.setSetting("playerBgStyle", style);
  };

  const handlePlayerCustomBgChange = async (url: string) => {
    setPlayerCustomBg(url);
    await db.setSetting("playerCustomBg", url);
  };

  // Toast / Notifications Stack
  const [toast, setToast] = useState<{ message: string; showUndo?: boolean; action?: () => void } | null>(null);

  // Toast helper
  const showToast = (message: string, showUndo = false, action?: () => void) => {
    setToast({ message, showUndo, action });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Theme preset mappings
  const applyThemePreset = (preset: "spotify" | "apple" | "cyber" | "oled") => {
    setThemePreset(preset);
    db.setSetting("themePreset", preset);

    switch (preset) {
      case "spotify":
        setAccentColor("#1ed760");
        setGlowColor("rgba(30, 215, 96, 0.4)");
        setIsDark(true);
        break;
      case "apple":
        setAccentColor("#fc3c44");
        setGlowColor("rgba(252, 60, 68, 0.4)");
        setIsDark(true);
        break;
      case "cyber":
        setAccentColor("#00bbf9");
        setGlowColor("rgba(0, 191, 249, 0.4)");
        setIsDark(true);
        break;
      case "oled":
        setAccentColor("#ffffff");
        setGlowColor("rgba(255, 255, 255, 0.25)");
        setIsDark(true);
        break;
    }
  };

  // Initialize Library Custom Hook
  const {
    tracks,
    filteredTracks,
    playlists,
    activePlaylistId,
    favorites,
    searchQuery,
    isIngesting,
    ingestProgress,
    setActivePlaylistId,
    setSearchQuery,
    loadLibrary,
    handleIngestFiles,
    handleToggleFavorite,
    handleDeleteTrack,
    handleCreatePlaylist,
    handleDeletePlaylist,
    handleAddTrackToPlaylist,
  } = useLibrary({ showToast });

  // Initialize Audio Playback & Queue Custom Hook
  const {
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
  } = useAudioPlayer({
    filteredTracks,
    tracks,
    loadLibrary,
    showToast,
    themePreset,
    applyThemePreset,
    setAccentColor,
    setGlowColor,
  });

  // Restore saved theme and debug settings on initial load
  useEffect(() => {
    async function setupThemeAndDebug() {
      const savedTheme = await db.getSetting<"spotify" | "apple" | "cyber" | "oled">("themePreset");
      if (savedTheme) {
        applyThemePreset(savedTheme);
      }

      const savedDebug = await db.getSetting<boolean>("isDebugMode");
      if (savedDebug !== null) {
        setIsDebugMode(savedDebug);
      }

      const savedAppBg = await db.getSetting<string>("appBgImage");
      if (savedAppBg) {
        setAppBgImage(savedAppBg);
      }

      const savedPlayerBgStyle = await db.getSetting<"blurred-cover" | "solid" | "custom">("playerBgStyle");
      if (savedPlayerBgStyle) {
        setPlayerBgStyle(savedPlayerBgStyle);
      }

      const savedPlayerCustomBg = await db.getSetting<string>("playerCustomBg");
      if (savedPlayerCustomBg) {
        setPlayerCustomBg(savedPlayerCustomBg);
      }

      const savedLang = await db.getSetting<"ar" | "en">("app_lang");
      if (savedLang) {
        setLang(savedLang);
      }
    }
    setupThemeAndDebug();
  }, []);

  // Update active view to 'studio' once a song starts playing for immediate beautiful visualizer feedback
  useEffect(() => {
    if (currentTrack) {
      setActiveTab("studio");
    }
  }, [currentTrack]);

  const handleToggleDebug = async () => {
    const newVal = !isDebugMode;
    setIsDebugMode(newVal);
    await db.setSetting("isDebugMode", newVal);
    const t = translations[lang];
    showToast(newVal ? t.toast_developer_active : t.toast_developer_inactive);
  };

  // Handle playing playlist
  const handlePlayPlaylist = (playlistId: string) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl || pl.trackIds.length === 0) return;

    const firstTrackId = pl.trackIds[0];
    const firstTrack = tracks.find((t) => t.id === firstTrackId);
    if (firstTrack) {
      setActivePlaylistId(playlistId);
      playTrack(firstTrack);
      setActiveTab("studio");
    }
  };

  // Remove track from custom playlist
  const handleRemoveTrackFromPlaylist = async (playlistId: string, trackId: number) => {
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;

    const updated = {
      ...pl,
      trackIds: pl.trackIds.filter((id) => id !== trackId),
    };

    await db.savePlaylist(updated);
    await loadLibrary();
    const t = translations[lang];
    showToast(t.toast_playlist_removed);
  };

  const t = translations[lang];
  const isRtl = lang === "ar";
  const alignClass = isRtl ? "text-right" : "text-left";
  const flexRowClass = isRtl ? "flex-row-reverse" : "flex-row";
  const flexJustifyClass = isRtl ? "justify-end" : "justify-start";
  const directionClass = isRtl ? "rtl" : "ltr";

  return (
    <ErrorBoundary>
      <div
        className={`min-h-screen pb-32 transition-colors duration-500 text-white selection:bg-[#1ed760]/20 selection:text-white ${
          isDark ? "bg-[#020204]" : "bg-gray-100 text-gray-900"
        }`}
        dir={directionClass}
        style={appBgImage ? {
          backgroundImage: `linear-gradient(rgba(2, 2, 4, 0.85), rgba(2, 2, 4, 0.93)), url(${appBgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        } : undefined}
      >
        {/* GLOBAL TOAST LAYER */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 bg-[#0a0a0f]/95 border border-white/10 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-2xl text-xs font-semibold select-none animate-slide-up">
            <span>{toast.message}</span>
            {toast.showUndo && toast.action && (
              <button
                onClick={toast.action}
                className={`flex items-center gap-1.5 text-[#1ed760] hover:brightness-110 active:scale-95 transition-all mr-2 border-r border-white/10 pr-2.5 ${flexRowClass}`}
                style={{ color: accentColor }}
              >
                <Undo2 size={14} />
                <span>{t.undo}</span>
              </button>
            )}
          </div>
        )}

        {/* CORE APPLICATION CONTAINER */}
        <div className="max-w-6xl mx-auto px-4 pt-10">
          
          {/* NAV HEADER */}
          <div className={`flex justify-between items-center flex-wrap gap-4 mb-8 border-b border-white/5 pb-6 ${flexRowClass}`}>
            <div className={`flex flex-col gap-1 ${alignClass}`}>
              <h1 className={`text-3xl font-extrabold tracking-tight font-display flex items-center gap-2.5 ${flexRowClass}`}>
                <Sparkles size={26} className="text-[#1ed760]" style={{ color: accentColor }} />
                <span>{t.app_title}</span>
              </h1>
              <p className="text-xs text-gray-400">{t.app_subtitle}</p>
            </div>
          </div>

          {/* DYNAMIC NAVIGATION RAIL (TABS SYSTEM) */}
          <div className={`sticky top-4 z-40 bg-[#0c0c14]/80 backdrop-blur-2xl border border-white/10 shadow-2xl p-2 rounded-3xl mb-8 flex gap-2 overflow-x-auto ${flexRowClass}`}>
            {[
              { id: "studio", label: t.tab_studio, icon: Disc },
              { id: "library", label: t.tab_library, icon: Music },
              { id: "playlists", label: t.tab_playlists, icon: ListMusic },
              { id: "upload", label: t.tab_upload, icon: UploadCloud },
              { id: "profile", label: t.tab_profile, icon: User },
              { id: "settings", label: t.tab_settings, icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isTabActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs font-extrabold transition-all active:scale-[0.98] whitespace-nowrap ${flexRowClass} ${
                    isTabActive
                      ? "bg-white/15 text-white shadow-lg border border-white/5"
                      : "text-gray-400 hover:text-gray-200"
                  }`}
                  style={{ color: isTabActive ? accentColor : undefined }}
                >
                  <Icon size={16} className={tab.id === "studio" && isPlaying ? "animate-spin-slow" : ""} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC TAB VIEW PORT */}
          <main className="min-h-[480px]">
            {activeTab === "studio" && (
              <StudioView
                track={currentTrack}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                volume={volume}
                playbackRate={playbackRate}
                repeatMode={repeatMode}
                isShuffled={isShuffled}
                favorites={favorites}
                currentQueue={currentQueue}
                upcomingQueue={upcomingQueue}
                historyQueue={historyQueue}
                accentColor={accentColor}
                glowColor={glowColor}
                onPlayPause={handlePlayPause}
                onNext={handleNextTrack}
                onPrev={handlePrevTrack}
                onSeek={handleSeek}
                onVolumeChange={handleVolumeChange}
                onRateChange={handleRateChange}
                onToggleShuffle={handleToggleShuffle}
                onToggleRepeat={handleToggleRepeat}
                onToggleFavorite={handleToggleFavorite}
                onRemoveFromQueue={(id) => setUpcomingQueue((prev) => prev.filter((i) => i.id !== id))}
                onReorderQueue={setUpcomingQueue}
                onClearQueue={() => setUpcomingQueue([])}
                onPlayTrackDirectly={(id) => {
                  const track = tracks.find((t) => t.id === id);
                  if (track) playTrack(track);
                }}
                lang={lang}
              />
            )}

            {activeTab === "library" && (
              <LibraryView
                tracks={tracks}
                filteredTracks={filteredTracks}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activePlaylistId={activePlaylistId}
                setActivePlaylistId={setActivePlaylistId}
                favorites={favorites}
                currentTrack={currentTrack}
                accentColor={accentColor}
                playlists={playlists}
                onPlayTrack={playTrack}
                onToggleFavorite={handleToggleFavorite}
                onAddTrackToPlaylist={handleAddTrackToPlaylist}
                onDeleteTrack={(id) =>
                  handleDeleteTrack(id, currentTrack?.id, () => {
                    setCurrentTrack(undefined);
                    setIsPlaying(false);
                  })
                }
                lang={lang}
              />
            )}

            {activeTab === "playlists" && (
              <PlaylistsView
                playlists={playlists}
                tracks={tracks}
                activePlaylistId={activePlaylistId}
                accentColor={accentColor}
                onCreatePlaylist={handleCreatePlaylist}
                onDeletePlaylist={handleDeletePlaylist}
                onSelectPlaylist={setActivePlaylistId}
                onPlayPlaylist={handlePlayPlaylist}
                onPlayTrack={playTrack}
                onRemoveTrackFromPlaylist={handleRemoveTrackFromPlaylist}
                lang={lang}
              />
            )}

            {activeTab === "upload" && (
              <UploadView
                tracks={tracks}
                isIngesting={isIngesting}
                ingestProgress={ingestProgress}
                accentColor={accentColor}
                onIngestFiles={handleIngestFiles}
                lang={lang}
              />
            )}

            {activeTab === "profile" && (
              <ProfileView
                tracks={tracks}
                accentColor={accentColor}
                glowColor={glowColor}
                onPlayTrack={playTrack}
                showToast={showToast}
                lang={lang}
              />
            )}

            {activeTab === "settings" && (
              <SettingsView
                themePreset={themePreset}
                onChangeTheme={applyThemePreset}
                appBgImage={appBgImage}
                onChangeAppBg={handleAppBgChange}
                playerBgStyle={playerBgStyle}
                onChangePlayerBgStyle={handlePlayerBgStyleChange}
                playerCustomBg={playerCustomBg}
                onChangePlayerCustomBg={handlePlayerCustomBgChange}
                isDebugMode={isDebugMode}
                onToggleDebug={handleToggleDebug}
                accentColor={accentColor}
                glowColor={glowColor}
                showToast={showToast}
                lang={lang}
                onChangeLang={handleLangChange}
              />
            )}
          </main>

          {/* APP FOOTER WITH PERFORMANCE & DEBUG CONTROLS */}
          <footer className={`mt-16 mb-6 border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 ${flexRowClass}`}>
            <div className="flex items-center gap-2">
              <span>{t.footer_copyright}</span>
            </div>
            <div className={`flex items-center gap-4 flex-wrap ${flexRowClass}`}>
              <button
                onClick={handleToggleDebug}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all active:scale-95 font-semibold text-[10px] ${flexRowClass} ${
                  isDebugMode
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                    : "bg-white/5 border-white/5 text-gray-400 hover:text-gray-300"
                }`}
              >
                <Terminal size={12} />
                <span>{isDebugMode ? t.footer_debug_active : t.footer_debug_btn}</span>
              </button>
              {isDebugMode && <PerfIndicator accentColor={accentColor} />}
            </div>
          </footer>

        </div>

        {/* FLOAT STICKY PLAYER DOCK */}
        <MiniPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          accentColor={accentColor}
          glowColor={glowColor}
          duration={duration}
          currentTime={currentTime}
          onPlayPause={handlePlayPause}
          onNext={handleNextTrack}
          onPrev={handlePrevTrack}
          onExpand={() => setActiveTab("studio")}
          lang={lang}
        />

        {/* DETAILED EXPANDED PLAYER SCREEN */}
        {isExpanded && (
          <FullPlayer
            track={currentTrack}
            isPlaying={isPlaying}
            accentColor={accentColor}
            glowColor={glowColor}
            isDark={isDark}
            duration={duration}
            currentTime={currentTime}
            volume={volume}
            playbackRate={playbackRate}
            repeatMode={repeatMode}
            isShuffled={isShuffled}
            favorites={favorites}
            playerBgStyle={playerBgStyle}
            playerCustomBg={playerCustomBg}
            currentQueue={currentQueue}
            upcomingQueue={upcomingQueue}
            historyQueue={historyQueue}
            onPlayPause={handlePlayPause}
            onNext={handleNextTrack}
            onPrev={handlePrevTrack}
            onSeek={handleSeek}
            onVolumeChange={handleVolumeChange}
            onRateChange={handleRateChange}
            onToggleShuffle={handleToggleShuffle}
            onToggleRepeat={handleToggleRepeat}
            onToggleFavorite={handleToggleFavorite}
            onClose={() => setIsExpanded(false)}
            
            // Queue operations
            onRemoveFromQueue={(id) => setUpcomingQueue((prev) => prev.filter((i) => i.id !== id))}
            onReorderQueue={setUpcomingQueue}
            onClearQueue={() => setUpcomingQueue([])}
            onPlayTrackDirectly={(id) => {
              const track = tracks.find((t) => t.id === id);
              if (track) playTrack(track);
            }}
            lang={lang}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}
