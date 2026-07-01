import React, { useState } from "react";
import { Music, Play, Trash2, Plus, Sparkles } from "lucide-react";
import { Playlist, TrackMetadata } from "../types";
import { formatTime } from "../utils";
import { translations } from "../locales";

interface PlaylistsViewProps {
  playlists: Playlist[];
  tracks: TrackMetadata[];
  activePlaylistId: string;
  accentColor: string;
  onCreatePlaylist: (name: string, desc?: string) => void;
  onDeletePlaylist: (id: string) => void;
  onSelectPlaylist: (id: string) => void;
  onPlayPlaylist: (playlistId: string) => void;
  onPlayTrack: (track: TrackMetadata) => void;
  onRemoveTrackFromPlaylist?: (playlistId: string, trackId: number) => void;
  lang: "ar" | "en";
}

export default function PlaylistsView({
  playlists,
  tracks,
  activePlaylistId,
  accentColor,
  onCreatePlaylist,
  onDeletePlaylist,
  onSelectPlaylist,
  onPlayPlaylist,
  onPlayTrack,
  onRemoveTrackFromPlaylist,
  lang,
}: PlaylistsViewProps) {
  const t = translations[lang];

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    onCreatePlaylist(newPlaylistName.trim(), newPlaylistDesc.trim());
    setNewPlaylistName("");
    setNewPlaylistDesc("");
    setShowCreateModal(false);
  };

  // Find currently active playlist and its tracks
  const currentPlaylist = playlists.find((p) => p.id === activePlaylistId);
  const playlistTracks = currentPlaylist
    ? tracks.filter((t) => currentPlaylist.trackIds.includes(t.id))
    : [];

  const isRtl = lang === "ar";
  const alignClass = isRtl ? "text-right" : "text-left";
  const flexRowClass = isRtl ? "flex-row-reverse" : "flex-row";
  const directionClass = isRtl ? "rtl" : "ltr";

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in ${alignClass}`} id="playlists-view-root">
      
      {/* LEFT COLUMN: playlists list and creation */}
      <div className="flex flex-col gap-4">
        <div className={`flex justify-between items-center ${flexRowClass}`}>
          <div className={`flex flex-col gap-1 ${alignClass}`}>
            <h2 className="text-xl font-black text-white">{t.pl_header}</h2>
            <p className="text-[11px] text-gray-400">{t.pl_subtitle}</p>
          </div>

          <button
            onClick={() => setShowCreateModal((prev) => !prev)}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
          >
            <Plus size={14} />
            <span>{t.pl_btn_new}</span>
          </button>
        </div>

        {showCreateModal && (
          <form
            onSubmit={handleSubmit}
            className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col gap-3 animate-slide-up"
          >
            <div className={`flex flex-col gap-1 ${alignClass}`}>
              <span className="text-[11px] text-gray-400">{t.pl_label_name}</span>
              <input
                type="text"
                required
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder={t.pl_placeholder_name}
                className={`bg-white/5 border border-white/5 p-2 rounded-xl text-white text-xs outline-none focus:border-white/20 ${alignClass}`}
              />
            </div>

            <div className={`flex flex-col gap-1 ${alignClass}`}>
              <span className="text-[11px] text-gray-400">{t.pl_label_desc}</span>
              <input
                type="text"
                value={newPlaylistDesc}
                onChange={(e) => setNewPlaylistDesc(e.target.value)}
                placeholder={t.pl_placeholder_desc}
                className={`bg-white/5 border border-white/5 p-2 rounded-xl text-white text-xs outline-none focus:border-white/20 ${alignClass}`}
              />
            </div>

            <div className={`flex gap-2 justify-end`}>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg"
              >
                {t.pl_btn_cancel}
              </button>
              <button
                type="submit"
                className="text-xs py-1.5 px-4 rounded-lg text-black font-semibold"
                style={{ backgroundColor: accentColor }}
              >
                {t.pl_btn_create}
              </button>
            </div>
          </form>
        )}

        {/* List of custom / default playlists */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-3xl backdrop-blur-xl flex flex-col gap-2 max-h-[450px] overflow-y-auto">
          {playlists.length === 0 ? (
            <div className="py-8 text-center text-gray-500 text-xs">{t.pl_empty_list}</div>
          ) : (
            playlists.map((pl) => {
              const isActive = pl.id === activePlaylistId;
              const trackCount = pl.trackIds.length;

              return (
                <div
                  key={pl.id}
                  onClick={() => onSelectPlaylist(pl.id)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${flexRowClass} ${
                    isActive
                      ? "bg-white/10 border-white/20 shadow-lg"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  }`}
                >
                  <div className={`flex items-center gap-3 ${flexRowClass}`}>
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
                      style={{
                        backgroundColor: isActive ? `${accentColor}22` : "rgba(255,255,255,0.05)",
                      }}
                    >
                      <Music size={16} style={{ color: isActive ? accentColor : "#888" }} />
                    </div>

                    <div className={`flex flex-col ${alignClass}`}>
                      <span className="text-sm font-semibold text-white">{pl.name}</span>
                      <span className="text-[10px] text-gray-400">
                        {trackCount === 0 ? t.pl_songs_empty : `${trackCount} ${t.pl_songs_count}`}
                      </span>
                    </div>
                  </div>

                  <div className={`flex items-center gap-1.5 ${flexRowClass}`}>
                    {trackCount > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onPlayPlaylist(pl.id);
                        }}
                        className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                        title={t.pl_play_list}
                      >
                        <Play size={10} fill="currentColor" />
                      </button>
                    )}

                    {pl.isCustom && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeletePlaylist(pl.id);
                        }}
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                      >
                        <Trash2 size={10} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Tracks in Selected Playlist */}
      <div className="lg:col-span-2 flex flex-col gap-4">
        {currentPlaylist ? (
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col gap-6 h-full min-h-[400px]">
            {/* Playlist Hero Info */}
            <div className={`flex justify-between items-end border-b border-white/5 pb-4 ${flexRowClass} ${alignClass}`}>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-gray-400 uppercase tracking-wider font-mono">{t.pl_active_status}</span>
                <h3 className="text-2xl font-black text-white">{currentPlaylist.name}</h3>
                {currentPlaylist.description && (
                  <p className="text-xs text-gray-400 mt-1">{currentPlaylist.description}</p>
                )}
                <span className="text-[10px] text-gray-500 mt-1">
                  {lang === "ar" ? "إجمالي الأغاني" : "Total Songs"}: {playlistTracks.length} • {t.pl_total_duration}:{" "}
                  {formatTime(playlistTracks.reduce((acc, t) => acc + t.duration, 0))}
                </span>
              </div>

              {playlistTracks.length > 0 && (
                <button
                  onClick={() => onPlayPlaylist(currentPlaylist.id)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs text-black transition-all active:scale-95 ${flexRowClass}`}
                  style={{ backgroundColor: accentColor }}
                >
                  <Play size={14} fill="currentColor" />
                  <span>{t.pl_play_list}</span>
                </button>
              )}
            </div>

            {/* Playlist Track list */}
            {playlistTracks.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-gray-500 text-xs">
                <Sparkles className="text-gray-600 mb-2" size={24} />
                <span>{t.pl_empty_tracks}</span>
                <span className="text-[10px] text-gray-600 mt-1">
                  {t.pl_empty_tracks_desc}
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
                {playlistTracks.map((track, idx) => (
                  <div
                    key={track.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all cursor-pointer group ${flexRowClass}`}
                    onClick={() => onPlayTrack(track)}
                  >
                    <div className={`flex items-center gap-3 ${flexRowClass}`}>
                      <span className="text-xs text-gray-500 w-4 text-center font-mono">{idx + 1}</span>
                      <div className="w-9 h-9 rounded-lg bg-black/40 overflow-hidden relative">
                        {track.cover ? (
                          <img src={track.cover} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            <Music size={14} />
                          </div>
                        )}
                      </div>
                      <div className={`flex flex-col ${alignClass}`}>
                        <span className="text-xs font-bold text-white group-hover:text-[#1ed760] transition-colors">
                          {track.title}
                        </span>
                        <span className="text-[10px] text-gray-400">{track.artist}</span>
                      </div>
                    </div>

                    <div className={`flex items-center gap-3 ${flexRowClass}`}>
                      <span className="text-[10px] font-mono text-gray-500">{formatTime(track.duration)}</span>
                      {onRemoveTrackFromPlaylist && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveTrackFromPlaylist(currentPlaylist.id, track.id);
                          }}
                          className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col items-center justify-center text-center h-full min-h-[400px]">
            <div className="text-gray-500 flex flex-col items-center gap-2">
              <span className="text-4xl">📁</span>
              <p className="text-xs font-semibold">{t.pl_select_hint}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
