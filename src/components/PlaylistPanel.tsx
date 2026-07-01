import React, { useState } from "react";
import { Playlist, TrackMetadata } from "../types";
import { FolderHeart, Play, Trash2, Plus, Music } from "lucide-react";

interface PlaylistPanelProps {
  playlists: Playlist[];
  tracks: TrackMetadata[];
  activePlaylistId: string;
  accentColor: string;
  onCreatePlaylist: (name: string, desc?: string) => void;
  onDeletePlaylist: (id: string) => void;
  onSelectPlaylist: (id: string) => void;
  onPlayPlaylist: (playlistId: string) => void;
}

export default function PlaylistPanel({
  playlists,
  tracks,
  activePlaylistId,
  accentColor,
  onCreatePlaylist,
  onDeletePlaylist,
  onSelectPlaylist,
  onPlayPlaylist,
}: PlaylistPanelProps) {
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

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl flex flex-col gap-4 h-[420px]" id="playlist-panel-root-node">
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <h4 className="font-semibold text-white text-base">📁 قوائم التشغيل (Playlists)</h4>
          <span className="text-xs text-gray-400">قوائم ذكية وقوائم مخصصة من إنشائك</span>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white transition-colors"
          title="إنشاء قائمة جديدة"
        >
          <Plus size={18} />
        </button>
      </div>

      {showCreateModal && (
        <form onSubmit={handleSubmit} className="bg-black/40 border border-white/10 p-4 rounded-2xl flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">اسم القائمة</span>
            <input
              type="text"
              required
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              placeholder="مثال: موسيقى للدراسة، جيم..."
              className="bg-white/5 border border-white/5 p-2 rounded-xl text-white text-xs outline-none focus:border-white/20"
            />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400">الوصف (اختياري)</span>
            <input
              type="text"
              value={newPlaylistDesc}
              onChange={(e) => setNewPlaylistDesc(e.target.value)}
              placeholder="وصف بسيط للقائمة..."
              className="bg-white/5 border border-white/5 p-2 rounded-xl text-white text-xs outline-none focus:border-white/20"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-3 py-1.5 rounded-lg"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="text-xs py-1.5 px-4 rounded-lg text-black font-semibold"
              style={{ backgroundColor: accentColor }}
            >
              إنشاء القائمة
            </button>
          </div>
        </form>
      )}

      <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-2 scrollbar-thin">
        {playlists.map((pl) => {
          const isActive = pl.id === activePlaylistId;
          const trackCount = pl.trackIds.length;
          
          return (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 border ${
                isActive
                  ? "bg-white/10 border-white/20 shadow-lg"
                  : "bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: isActive ? accentColor + "22" : "rgba(255,255,255,0.05)" }}
                >
                  <Music size={18} style={{ color: isActive ? accentColor : "#888" }} />
                </div>
                
                <div className="flex flex-col text-right">
                  <span className="text-sm font-semibold text-white">{pl.name}</span>
                  <span className="text-[10px] text-gray-400">
                    {trackCount === 0 ? "لا توجد أغاني" : `${trackCount} أغنية`} {pl.description ? `• ${pl.description}` : ""}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {trackCount > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayPlaylist(pl.id);
                    }}
                    className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                    title="تشغيل القائمة"
                  >
                    <Play size={12} fill="currentColor" />
                  </button>
                )}

                {pl.isCustom && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePlaylist(pl.id);
                    }}
                    className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="حذف القائمة"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
