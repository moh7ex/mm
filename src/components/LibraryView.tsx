import React from "react";
import { Search, Heart, Play, Trash2, Music } from "lucide-react";
import { TrackMetadata, Playlist } from "../types";
import { formatTime } from "../utils";
import { translations } from "../locales";

interface LibraryViewProps {
  tracks: TrackMetadata[];
  filteredTracks: TrackMetadata[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activePlaylistId: string;
  setActivePlaylistId: (id: string) => void;
  favorites: Set<number>;
  currentTrack: TrackMetadata | undefined;
  accentColor: string;
  playlists: Playlist[];
  onPlayTrack: (track: TrackMetadata) => void;
  onToggleFavorite: (id: number) => void;
  onAddTrackToPlaylist: (playlistId: string, trackId: number) => void;
  onDeleteTrack: (id: number) => void;
  lang: "ar" | "en";
}

export default function LibraryView({
  tracks,
  filteredTracks,
  searchQuery,
  setSearchQuery,
  activePlaylistId,
  setActivePlaylistId,
  favorites,
  currentTrack,
  accentColor,
  playlists,
  onPlayTrack,
  onToggleFavorite,
  onAddTrackToPlaylist,
  onDeleteTrack,
  lang,
}: LibraryViewProps) {
  const t = translations[lang];

  const isRtl = lang === "ar";
  const alignClass = isRtl ? "text-right" : "text-left";
  const flexRowClass = isRtl ? "flex-row-reverse" : "flex-row";
  const directionClass = isRtl ? "rtl" : "ltr";

  return (
    <div className={`flex flex-col gap-6 animate-fade-in ${alignClass}`} id="library-view-root">
      {/* HEADER SECTION */}
      <div className={`flex flex-col gap-2 ${alignClass}`}>
        <h2 className="text-2xl font-black text-white">{t.lib_header}</h2>
        <p className="text-xs text-gray-400">{t.lib_subtitle}</p>
      </div>

      {/* SEARCH AND FILTER FIELD */}
      <div className="relative w-full">
        <Search className={`absolute ${isRtl ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-gray-400`} size={18} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.lib_search_placeholder}
          className={`w-full h-12 ${isRtl ? "pr-12 pl-4 text-right" : "pl-12 pr-4 text-left"} rounded-2xl bg-white/5 hover:bg-white/10 focus:bg-white/10 border border-white/5 focus:border-white/20 outline-none text-sm text-white placeholder-gray-500 transition-all`}
        />
      </div>

      {/* Smart Library Quick Filter Buttons */}
      <div className={`flex gap-2 flex-wrap ${isRtl ? "justify-start" : "justify-start"}`}>
        {[
          { id: "all", label: t.lib_filter_all },
          { id: "favorites", label: t.lib_filter_fav },
          { id: "recently-played", label: t.lib_filter_recent },
          { id: "most-played", label: t.lib_filter_most },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActivePlaylistId(btn.id)}
            className={`text-xs px-4 py-2 rounded-xl border transition-all active:scale-95 ${
              activePlaylistId === btn.id
                ? "bg-white/10 border-white/25 text-white"
                : "bg-white/5 border-white/5 text-gray-400 hover:text-gray-200"
            }`}
            style={{ color: activePlaylistId === btn.id ? accentColor : undefined }}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* MAIN TRACK LIST CONTAINER */}
      <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col gap-4 min-h-[350px]">
        {filteredTracks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-16">
            <span className="text-4xl text-gray-600">🎵</span>
            <p className="text-sm font-semibold text-gray-400">{t.lib_empty_title}</p>
            <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
              {t.lib_empty_desc}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {filteredTracks.map((item) => {
              const isActive = currentTrack?.id === item.id;
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-2xl transition-all duration-150 border cursor-pointer group ${flexRowClass} ${
                    isActive
                      ? "bg-white/10 border-white/15"
                      : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                  }`}
                >
                  {/* Play button overlay & thumbnail metadata */}
                  <div
                    onClick={() => onPlayTrack(item)}
                    className={`flex items-center gap-3.5 flex-1 min-w-0 ${flexRowClass} ${alignClass}`}
                  >
                    <div className="relative shrink-0 w-11 h-11 rounded-xl overflow-hidden shadow-md bg-black/50">
                      {item.cover ? (
                        <img
                          src={item.cover}
                          className="w-full h-full object-cover"
                          alt={item.title}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Music size={16} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/45 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play size={16} fill="white" className={`text-white ${isRtl ? "ml-0.5" : "mr-0.5"}`} />
                      </div>
                    </div>

                    <div className="flex flex-col flex-1 min-w-0">
                      <span
                        className="text-sm font-bold text-white group-hover:text-[#1ed760] truncate"
                        style={{ color: isActive ? accentColor : undefined }}
                      >
                        {item.title}
                      </span>
                      <span className="text-xs text-gray-400 truncate">{item.artist}</span>
                    </div>
                  </div>

                  {/* Secondary stats & operations */}
                  <div className={`flex items-center gap-3 ${flexRowClass}`}>
                    <span className="hidden sm:inline text-xs font-mono text-gray-500">
                      {formatTime(item.duration)}
                    </span>
                    <span className="hidden md:inline text-[10px] font-mono text-gray-600 bg-white/5 px-2 py-0.5 rounded-full">
                      {item.genre || t.lib_genre_none}
                    </span>

                    {/* Favorite button */}
                    <button
                      onClick={() => onToggleFavorite(item.id)}
                      className="p-1.5 text-gray-500 hover:text-white transition-colors"
                    >
                      <Heart size={16} className={favorites.has(item.id) ? "text-red-500 fill-red-500" : ""} />
                    </button>

                    {/* Quick Add to Playlist pop-down dropdown */}
                    {playlists.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            onAddTrackToPlaylist(e.target.value, item.id);
                            e.target.value = ""; // reset
                          }
                        }}
                        className="bg-white/5 text-[10px] text-gray-400 hover:text-white border border-white/5 rounded px-1.5 py-0.5 outline-none cursor-pointer text-center"
                      >
                        <option value="">{t.lib_add_to_playlist}</option>
                        {playlists.map((pl) => (
                          <option key={pl.id} value={pl.id}>
                            {pl.name}
                          </option>
                        ))}
                      </select>
                    )}

                    {/* Trash Delete button */}
                    <button
                      onClick={() => onDeleteTrack(item.id)}
                      className="p-1.5 text-gray-500 hover:text-red-400 active:scale-95 transition-all"
                      title={t.lib_delete_track}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
