import React, { useState, useEffect } from "react";
import { User, ShieldCheck, Flame, Clock, Music, Heart, Calendar, BarChart2, Edit2, Check, Sparkles, FolderLock, Upload } from "lucide-react";
import { TrackMetadata, UserProfile } from "../types";
import { db } from "../db";
import { formatTime, formatBytes } from "../utils";
import { translations } from "../locales";

interface ProfileViewProps {
  tracks: TrackMetadata[];
  accentColor: string;
  glowColor: string;
  onPlayTrack: (track: TrackMetadata) => void;
  showToast: (msg: string) => void;
  lang: "ar" | "en";
}

const AVATARS = [
  "linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)",
  "linear-gradient(135deg, #1ed760 0%, #1db954 100%)",
  "linear-gradient(135deg, #fc3c44 0%, #9b51e0 100%)",
  "linear-gradient(135deg, #00bbf9 0%, #00f5d4 100%)",
  "linear-gradient(135deg, #f72585 0%, #7209b7 100%)",
  "linear-gradient(135deg, #ffe600 0%, #ff5e00 100%)",
];

export default function ProfileView({
  tracks,
  accentColor,
  glowColor,
  onPlayTrack,
  showToast,
  lang,
}: ProfileViewProps) {
  const t = translations[lang];

  const [profile, setProfile] = useState<UserProfile>({
    name: lang === "ar" ? "مستمع كوانتوم" : "Quantum Listener",
    bio: lang === "ar" ? "عاشق للأصوات النقية والترددات عالية الوضوح." : "Dedicated lover of pure sound waves and HD audio.",
    avatarUrl: AVATARS[0],
    joinDate: new Date().toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", { year: "numeric", month: "long" }),
    preferredGenre: lang === "ar" ? "موسيقى إلكترونية / Ambient" : "Electronic / Ambient",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editGenre, setEditGenre] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("");

  // Load profile from DB on mount
  useEffect(() => {
    async function loadProfile() {
      const savedProfile = await db.getSetting<UserProfile>("userProfile");
      if (savedProfile) {
        setProfile(savedProfile);
        setEditName(savedProfile.name);
        setEditBio(savedProfile.bio || "");
        setEditGenre(savedProfile.preferredGenre || "");
        setSelectedAvatar(savedProfile.avatarUrl || AVATARS[0]);
      } else {
        setEditName(profile.name);
        setEditBio(profile.bio || "");
        setEditGenre(profile.preferredGenre || "");
        setSelectedAvatar(profile.avatarUrl || AVATARS[0]);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    const updatedProfile: UserProfile = {
      ...profile,
      name: editName.trim(),
      bio: editBio.trim(),
      preferredGenre: editGenre.trim(),
      avatarUrl: selectedAvatar,
    };

    setProfile(updatedProfile);
    await db.setSetting("userProfile", updatedProfile);
    setIsEditing(false);
    showToast(t.toast_profile_saved);
  };

  const handleCustomAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast(t.toast_large_file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedAvatar(base64);
      showToast(lang === "ar" ? "✨ تم رفع الصورة الشخصية بنجاح" : "✨ Profile photo uploaded successfully");
    };
    reader.readAsDataURL(file);
  };

  // Derive Statistics from active IndexedDB tracks
  const totalTracks = tracks.length;
  const totalPlayCount = tracks.reduce((acc, t) => acc + (t.playCount || 0), 0);
  const totalSize = tracks.reduce((acc, t) => acc + t.fileSize, 0);

  // Top/Most Played Song
  const topPlayedTrack = [...tracks]
    .filter((t) => (t.playCount || 0) > 0)
    .sort((a, b) => (b.playCount || 0) - (a.playCount || 0))[0];

  // Recently played tracks list (sorted by lastPlayed timestamp)
  const recentlyPlayed = [...tracks]
    .filter((t) => t.lastPlayed)
    .sort((a, b) => (b.lastPlayed || 0) - (a.lastPlayed || 0))
    .slice(0, 5);

  // Compute genre stats
  const genresMap: Record<string, number> = {};
  tracks.forEach((t) => {
    const g = t.genre || (lang === "ar" ? "غير محدد" : "Undefined");
    genresMap[g] = (genresMap[g] || 0) + 1;
  });
  const topGenre = Object.entries(genresMap).sort((a, b) => b[1] - a[1])[0]?.[0] || (lang === "ar" ? "لا يوجد بعد" : "None yet");

  const isRtl = lang === "ar";
  const alignClass = isRtl ? "text-right" : "text-left";
  const justifyClass = isRtl ? "justify-end" : "justify-start";
  const flexRowClass = isRtl ? "flex-row-reverse" : "flex-row";

  return (
    <div className={`flex flex-col gap-8 animate-fade-in ${alignClass}`} id="profile-view-root">
      {/* 1. HERO BENTO GRID HEADER */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* User Card */}
        <div
          className={`md:col-span-8 bg-white/5 border border-white/10 rounded-3xl p-6 relative overflow-hidden backdrop-blur-xl flex flex-col sm:flex-row items-center gap-6`}
          style={{
            boxShadow: `0 10px 30px rgba(0,0,0,0.3), 0 0 20px ${glowColor}11`,
          }}
        >
          {/* Backdrop blur effect */}
          <div
            className="absolute -top-12 -left-12 w-48 h-48 rounded-full filter blur-3xl opacity-10"
            style={{ background: profile.avatarUrl.startsWith("linear-gradient") ? profile.avatarUrl : `url(${profile.avatarUrl})` }}
          />

          {/* User Avatar circle */}
          <div
            className="w-24 h-24 rounded-2xl shrink-0 border-2 border-white/20 shadow-2xl relative flex items-center justify-center text-white overflow-hidden bg-black/40"
            style={{ background: profile.avatarUrl.startsWith("linear-gradient") ? profile.avatarUrl : undefined }}
          >
            {profile.avatarUrl.startsWith("linear-gradient") ? (
              <User size={36} className="text-white/95 filter drop-shadow-md" />
            ) : (
              <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="" />
            )}
            <span className="absolute bottom-1 right-1 bg-emerald-500 w-3 h-3 rounded-full border border-black" />
          </div>

          {/* User Details */}
          <div className="flex-1 flex flex-col gap-2 w-full">
            <div className={`flex items-center justify-between gap-2 flex-wrap ${flexRowClass}`}>
              <div className="flex items-center gap-1.5">
                <h2 className="text-xl font-extrabold text-white">{profile.name}</h2>
                <span title={t.pr_verified}>
                  <ShieldCheck size={16} className="text-emerald-400" />
                </span>
              </div>

              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-[10px] bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                  <Edit2 size={10} />
                  <span>{t.pr_edit_btn}</span>
                </button>
              )}
            </div>

            <p className="text-xs text-gray-300 italic">"{profile.bio}"</p>

            <div className={`flex items-center gap-4 flex-wrap mt-2 text-[11px] text-gray-400 font-mono ${flexRowClass}`}>
              <div className="flex items-center gap-1">
                <Calendar size={12} className="text-gray-500" />
                <span>{t.pr_join_date}: {profile.joinDate}</span>
              </div>
              <div className="flex items-center gap-1">
                <Music size={12} className="text-gray-500" />
                <span>{t.pr_preferred_genre}: {profile.preferredGenre}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rapid Local Security Badge */}
        <div className="md:col-span-4 bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden backdrop-blur-xl">
          <div className="flex flex-col gap-1.5">
            <div className={`text-amber-400 text-xs font-mono font-semibold flex items-center gap-1 ${justifyClass}`}>
              <span>{t.pr_privacy_badge}</span>
              <FolderLock size={14} />
            </div>
            <h3 className="text-sm font-bold text-white">{t.pr_privacy_title}</h3>
            <p className="text-[11px] text-gray-400 leading-relaxed mt-1">
              {t.pr_privacy_desc}
            </p>
          </div>
          <span className="text-[9px] text-gray-500 font-mono block mt-3">Quantum Sandboxed Environment v1.0</span>
        </div>
      </div>

      {/* 2. PROFILE EDIT FORM (CONDITIONAL) */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col gap-5 animate-slide-up"
        >
          <div className={`flex items-center gap-2 text-white font-bold text-sm ${justifyClass}`}>
            <Sparkles size={16} style={{ color: accentColor }} />
            <span>{t.pr_edit_header}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-400">{t.pr_input_name}</span>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className={`bg-black/30 border border-white/5 p-3 rounded-xl text-white text-xs outline-none focus:border-white/20 ${alignClass}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-400">{t.pr_input_bio}</span>
              <input
                type="text"
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                className={`bg-black/30 border border-white/5 p-3 rounded-xl text-white text-xs outline-none focus:border-white/20 ${alignClass}`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-gray-400">{t.pr_input_genre}</span>
              <input
                type="text"
                value={editGenre}
                onChange={(e) => setEditGenre(e.target.value)}
                className={`bg-black/30 border border-white/5 p-3 rounded-xl text-white text-xs outline-none focus:border-white/20 ${alignClass}`}
              />
            </div>
          </div>

          {/* Preset avatar list */}
          <div className="flex flex-col gap-3">
            <span className="text-xs text-gray-400">{t.pr_avatar_preset}</span>
            <div className={`flex gap-3 flex-wrap ${justifyClass}`}>
              {AVATARS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setSelectedAvatar(bg)}
                  className={`w-10 h-10 rounded-xl relative transition-transform duration-200 active:scale-90 ${
                    selectedAvatar === bg ? "ring-2 ring-white scale-105" : "hover:scale-105"
                  }`}
                  style={{ background: bg }}
                >
                  {selectedAvatar === bg && (
                    <span className="absolute inset-0 flex items-center justify-center text-white font-black text-xs">
                      <Check size={14} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Custom avatar upload image file */}
          <div className="flex flex-col gap-3 border-t border-white/5 pt-4">
            <span className="text-xs text-gray-400">{t.pr_avatar_upload}</span>
            <div className={`flex items-center gap-3 ${flexRowClass}`}>
              {/* Show preview of selected image if it's base64 */}
              {selectedAvatar && !selectedAvatar.startsWith("linear-gradient") && (
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 shrink-0 bg-black/20">
                  <img src={selectedAvatar} className="w-full h-full object-cover" alt="" />
                </div>
              )}
              <label className="flex items-center gap-2 text-xs bg-white/10 hover:bg-white/15 px-4 py-2.5 rounded-xl text-white cursor-pointer active:scale-95 transition-all">
                <Upload size={14} style={{ color: accentColor }} />
                <span>{lang === "ar" ? "رفع صورة شخصية" : "Choose Profile Photo"}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCustomAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className={`flex gap-2 mt-2 ${justifyClass}`}>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs bg-white/5 hover:bg-white/10 text-gray-300 px-4 py-2 rounded-xl"
            >
              {lang === "ar" ? "إلغاء" : "Cancel"}
            </button>
            <button
              type="submit"
              className="text-xs py-2 px-5 rounded-xl text-black font-bold flex items-center gap-1"
              style={{ backgroundColor: accentColor }}
            >
              <Check size={14} />
              <span>{t.pr_btn_save}</span>
            </button>
          </div>
        </form>
      )}

      {/* 3. BENTO STATS SECTION */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total play session count */}
        <div className={`bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between ${flexRowClass}`}>
          <div className="flex flex-col">
            <span className="text-gray-400 text-[10px]">{t.pr_stat_plays}</span>
            <span className="text-xl font-black text-white font-mono mt-0.5">{totalPlayCount}</span>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-400">
            <Flame size={18} />
          </div>
        </div>

        {/* Total physical space */}
        <div className={`bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between ${flexRowClass}`}>
          <div className="flex flex-col">
            <span className="text-gray-400 text-[10px]">{t.pr_stat_db_size}</span>
            <span className="text-xl font-black text-white font-mono mt-0.5">{formatBytes(totalSize)}</span>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-cyan-500/10 text-cyan-400">
            <Clock size={18} />
          </div>
        </div>

        {/* Total number of imported files */}
        <div className={`bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between ${flexRowClass}`}>
          <div className="flex flex-col">
            <span className="text-gray-400 text-[10px]">{t.pr_stat_available}</span>
            <span className="text-xl font-black text-white font-mono mt-0.5">{totalTracks}</span>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10 text-purple-400">
            <Music size={18} />
          </div>
        </div>

        {/* Top Genre */}
        <div className={`bg-white/5 border border-white/10 p-5 rounded-2xl flex items-center justify-between ${flexRowClass}`}>
          <div className="flex flex-col">
            <span className="text-gray-400 text-[10px]">{t.pr_stat_dominant}</span>
            <span className="text-xs font-black text-white mt-1.5 truncate max-w-[130px]">{topGenre}</span>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-500/10 text-rose-400">
            <Heart size={18} />
          </div>
        </div>
      </div>

      {/* 4. DETAILS ROW: Top Track & Recent History logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Track Spot */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col gap-4">
          <div className={`flex items-center gap-2 text-sm text-white font-bold border-b border-white/5 pb-3 ${justifyClass}`}>
            <span>{t.pr_fav_song_title}</span>
            <BarChart2 size={16} className="text-gray-400" />
          </div>

          {topPlayedTrack ? (
            <div
              onClick={() => onPlayTrack(topPlayedTrack)}
              className={`flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group ${flexRowClass}`}
            >
              <div className={`flex items-center gap-3 ${flexRowClass}`}>
                <div className="w-11 h-11 rounded-xl bg-black overflow-hidden shrink-0 relative">
                  {topPlayedTrack.cover ? (
                    <img src={topPlayedTrack.cover} className="w-full h-full object-cover" alt="" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <Music size={16} />
                    </div>
                  )}
                </div>
                <div className={`flex flex-col ${alignClass}`}>
                  <span className="text-xs font-bold text-white group-hover:text-green-400 transition-colors">
                    {topPlayedTrack.title}
                  </span>
                  <span className="text-[10px] text-gray-400">{topPlayedTrack.artist}</span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1 font-mono text-[10px] text-gray-500">
                <span className="text-green-400 font-bold">{topPlayedTrack.playCount} {lang === "ar" ? "تشغيلات" : "plays"}</span>
                <span>{lang === "ar" ? "المدة" : "Duration"}: {formatTime(topPlayedTrack.duration)}</span>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-gray-500 py-10">
              {t.pr_fav_song_empty}
            </div>
          )}
        </div>

        {/* Recently Played Logs */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col gap-4">
          <div className={`flex items-center gap-2 text-sm text-white font-bold border-b border-white/5 pb-3 ${justifyClass}`}>
            <span>{t.pr_history_title}</span>
            <Clock size={16} className="text-gray-400" />
          </div>

          {recentlyPlayed.length === 0 ? (
            <div className="text-center text-xs text-gray-500 py-10">{t.pr_history_empty}</div>
          ) : (
            <div className="flex flex-col gap-2">
              {recentlyPlayed.map((track) => (
                <div
                  key={track.id}
                  onClick={() => onPlayTrack(track)}
                  className={`flex items-center justify-between p-2.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all cursor-pointer group ${flexRowClass}`}
                >
                  <div className={`flex items-center gap-2.5 ${flexRowClass}`}>
                    <div className="w-8 h-8 rounded-lg bg-black overflow-hidden shrink-0">
                      {track.cover ? (
                        <img src={track.cover} className="w-full h-full object-cover" alt="" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                          <Music size={12} />
                        </div>
                      )}
                    </div>
                    <div className={`flex flex-col ${alignClass}`}>
                      <span className="text-xs font-bold text-white group-hover:text-green-400 transition-colors truncate max-w-[150px]">
                        {track.title}
                      </span>
                      <span className="text-[9px] text-gray-400">{track.artist}</span>
                    </div>
                  </div>

                  <span className="text-[9px] text-gray-500 font-mono">
                    {track.lastPlayed ? new Date(track.lastPlayed).toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
