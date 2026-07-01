import React, { useState } from "react";
import { UploadCloud, Info, Database, FolderPlus, HelpCircle } from "lucide-react";
import { TrackMetadata } from "../types";
import { formatTime, formatBytes } from "../utils";
import { translations } from "../locales";

interface UploadViewProps {
  tracks: TrackMetadata[];
  isIngesting: boolean;
  ingestProgress: { current: number; total: number };
  accentColor: string;
  onIngestFiles: (filesList: FileList) => void;
  lang: "ar" | "en";
}

export default function UploadView({
  tracks,
  isIngesting,
  ingestProgress,
  accentColor,
  onIngestFiles,
  lang,
}: UploadViewProps) {
  const t = translations[lang];
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onIngestFiles(e.dataTransfer.files);
    }
  };

  // Calculations for storage metrics
  const totalTracks = tracks.length;
  const totalDuration = tracks.reduce((acc, t) => acc + t.duration, 0);
  const totalSize = tracks.reduce((acc, t) => acc + t.fileSize, 0);

  const isRtl = lang === "ar";
  const alignClass = isRtl ? "text-right" : "text-left";
  const flexRowClass = isRtl ? "flex-row-reverse" : "flex-row";
  const flexRowJustifyClass = isRtl ? "justify-end" : "justify-start";

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in ${alignClass}`} id="upload-view-root">
      
      {/* LEFT TWO COLUMNS: File Dropper & Ingestion Engine Progress */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className={`flex flex-col gap-1 ${alignClass}`}>
          <h2 className="text-xl font-black text-white">{t.up_header}</h2>
          <p className="text-xs text-gray-400">
            {t.up_subtitle}
          </p>
        </div>

        {/* DRAG AND DROP DOCK */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center gap-4 transition-all duration-300 min-h-[260px] relative overflow-hidden backdrop-blur-md ${
            isDragOver
              ? "bg-white/10 scale-[1.01]"
              : "bg-white/5 border-white/10 hover:border-white/20"
          }`}
          style={{ borderColor: isDragOver ? accentColor : undefined }}
        >
          <div
            className="absolute inset-0 opacity-10 pointer-events-none transition-transform duration-700 bg-radial-gradient"
            style={{
              backgroundImage: `radial-gradient(circle at center, ${accentColor} 0%, transparent 70%)`,
              transform: isDragOver ? "scale(1.2)" : "scale(1)",
            }}
          />

          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform duration-300"
            style={{
              backgroundColor: `${accentColor}11`,
              transform: isDragOver ? "translateY(-4px)" : "translateY(0)",
            }}
          >
            <UploadCloud size={32} style={{ color: accentColor }} />
          </div>

          <div className="flex flex-col gap-1.5 z-10">
            <h3 className="text-base font-bold text-white">{t.up_drag_title}</h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              {t.up_drag_desc}
            </p>
          </div>

          {isIngesting ? (
            <div className="w-full max-w-md bg-black/40 border border-white/5 p-4 rounded-2xl flex flex-col gap-3.5 z-10 animate-pulse">
              <div className={`flex justify-between text-xs font-semibold text-white ${flexRowClass}`}>
                <span>{t.up_ingest_loading}</span>
                <span className="font-mono">
                  {ingestProgress.current} / {ingestProgress.total} ({Math.round((ingestProgress.current / ingestProgress.total) * 100)}%)
                </span>
              </div>
              <div className="bg-white/10 h-2.5 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(ingestProgress.current / ingestProgress.total) * 100}%`,
                    backgroundColor: accentColor,
                  }}
                />
              </div>
            </div>
          ) : (
            <label className="z-10 flex items-center justify-center gap-2 text-xs bg-white/10 hover:bg-white/15 border border-white/10 text-white font-bold px-6 py-3 rounded-2xl cursor-pointer active:scale-95 transition-all">
              <FolderPlus size={16} />
              <span>{t.up_btn_choose}</span>
              <input
                type="file"
                multiple
                accept="audio/*"
                onChange={(e) => e.target.files && onIngestFiles(e.target.files)}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* TECHNICAL WORKER EXPLANATION */}
        <div className={`bg-white/5 border border-white/10 p-5 rounded-3xl flex flex-col gap-3.5 ${alignClass}`}>
          <div className={`flex items-center gap-2 text-white font-bold text-sm ${flexRowJustifyClass}`}>
            <span>{t.up_tech_title}</span>
            <HelpCircle size={16} className="text-gray-400" />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {t.up_tech_desc}
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Engine stats & Storage Diagnostics */}
      <div className="flex flex-col gap-6">
        <div className={`flex flex-col gap-1 ${alignClass}`}>
          <h2 className="text-xl font-black text-white">{t.up_stats_header}</h2>
          <p className="text-xs text-gray-400">{t.up_stats_sub}</p>
        </div>

        {/* STATS CHASSIS */}
        <div className="bg-white/5 border border-white/10 p-5 rounded-3xl backdrop-blur-xl flex flex-col gap-4">
          <div className="flex flex-col gap-1.5 border-b border-white/5 pb-4">
            <div className={`flex items-center gap-2 text-xs text-gray-400 font-mono ${flexRowJustifyClass}`}>
              <span>IndexedDB / Local</span>
              <Database size={12} />
            </div>
            <h4 className={`text-base font-bold text-white ${alignClass}`}>{t.up_storage_local}</h4>
          </div>

          <div className={`flex flex-col gap-3 text-xs text-gray-400 ${alignClass}`}>
            <div className={`flex justify-between items-center bg-black/25 p-2.5 rounded-xl ${flexRowClass}`}>
              <span className="text-white font-bold font-mono">{totalTracks}</span>
              <span>{t.up_stat_songs}</span>
            </div>
            <div className={`flex justify-between items-center bg-black/25 p-2.5 rounded-xl ${flexRowClass}`}>
              <span className="text-white font-bold font-mono">{formatBytes(totalSize)}</span>
              <span>{t.up_stat_space}</span>
            </div>
            <div className={`flex justify-between items-center bg-black/25 p-2.5 rounded-xl ${flexRowClass}`}>
              <span className="text-white font-bold font-mono">{formatTime(totalDuration)}</span>
              <span>{t.up_stat_duration}</span>
            </div>
          </div>

          <div className={`flex items-center gap-2 text-[10px] text-gray-500 border-t border-white/5 pt-4 ${alignClass} ${flexRowJustifyClass}`}>
            <span>{t.up_privacy_note}</span>
            <Info size={12} className="shrink-0" />
          </div>
        </div>

        {/* METRICS VISUAL PREVIEW */}
        <div className={`bg-white/5 border border-white/10 p-5 rounded-3xl flex flex-col gap-3.5 ${alignClass}`}>
          <span className="text-xs text-gray-400 uppercase tracking-wider font-mono">{t.up_diagnostics_title}</span>
          <p className="text-xs text-gray-300 leading-relaxed">
            {t.up_diagnostics_desc}
          </p>
        </div>
      </div>
    </div>
  );
}
