import React, { useState, useEffect } from "react";
import { Settings, Paintbrush, Image, Sparkles, Trash2, RefreshCw, Eye, EyeOff, Check, Upload } from "lucide-react";
import { translations } from "../locales";

interface SettingsViewProps {
  themePreset: "spotify" | "apple" | "cyber" | "oled";
  onChangeTheme: (preset: "spotify" | "apple" | "cyber" | "oled") => void;
  appBgImage: string;
  onChangeAppBg: (url: string) => void;
  playerBgStyle: "blurred-cover" | "solid" | "custom";
  onChangePlayerBgStyle: (style: "blurred-cover" | "solid" | "custom") => void;
  playerCustomBg: string;
  onChangePlayerCustomBg: (url: string) => void;
  isDebugMode: boolean;
  onToggleDebug: () => void;
  accentColor: string;
  glowColor: string;
  showToast: (msg: string) => void;
  lang: "ar" | "en";
  onChangeLang: (lang: "ar" | "en") => void;
}

export default function SettingsView({
  themePreset,
  onChangeTheme,
  appBgImage,
  onChangeAppBg,
  playerBgStyle,
  onChangePlayerBgStyle,
  playerCustomBg,
  onChangePlayerCustomBg,
  isDebugMode,
  onToggleDebug,
  accentColor,
  glowColor,
  showToast,
  lang,
  onChangeLang,
}: SettingsViewProps) {
  const t = translations[lang];

  const PRESET_BGS = [
    { name: lang === "ar" ? "بدون خلفية (افتراضي)" : "No backdrop (default)", url: "" },
    { name: lang === "ar" ? "سديم كوني غامق" : "Cosmic Dark Nebula", url: "https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?q=80&w=1200&auto=format&fit=crop" },
    { name: lang === "ar" ? "أضواء الأورورا الهادئة" : "Calming Aurora Lights", url: "https://images.unsplash.com/photo-1531315630201-bb15abeb1653?q=80&w=1200&auto=format&fit=crop" },
    { name: lang === "ar" ? "خطوط زرقاء مجردة" : "Abstract Blue Streams", url: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1200&auto=format&fit=crop" },
    { name: lang === "ar" ? "درجات الرمادي البسيطة" : "Minimalist Gray Shading", url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=1200&auto=format&fit=crop" },
  ];

  const [customBgInput, setCustomBgInput] = useState(appBgImage);
  const [customPlayerBgInput, setCustomPlayerBgInput] = useState(playerCustomBg);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setCustomBgInput(appBgImage);
  }, [appBgImage]);

  useEffect(() => {
    setCustomPlayerBgInput(playerCustomBg);
  }, [playerCustomBg]);

  // Handle uploading local background image
  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "app" | "player") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast(t.toast_large_file);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (target === "app") {
        onChangeAppBg(base64);
        showToast(t.toast_bg_applied);
      } else {
        onChangePlayerCustomBg(base64);
        showToast(t.toast_player_bg_applied);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomBg = () => {
    onChangeAppBg(customBgInput.trim());
    showToast(t.toast_bg_applied);
  };

  const handleApplyCustomPlayerBg = () => {
    onChangePlayerCustomBg(customPlayerBgInput.trim());
    showToast(t.toast_player_bg_applied);
  };

  const handleFullReset = async () => {
    const confirmMsg = lang === "ar" 
      ? "⚠️ هل أنت متأكد تماماً من حذف جميع الأغاني المستوردة، قوائم التشغيل، والملف الشخصي؟ لا يمكن التراجع عن هذه الخطوة!" 
      : "⚠️ Are you absolutely sure you want to delete all imported tracks, playlists, and profile data? This action cannot be undone!";
    
    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsResetting(true);
    try {
      // Clear IndexedDB completely
      const request = indexedDB.deleteDatabase("quantum_media_db");
      request.onsuccess = () => {
        showToast(t.toast_db_cleared);
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      };
      request.onerror = () => {
        showToast(t.toast_db_error);
        setIsResetting(false);
      };
    } catch (err) {
      console.error(err);
      setIsResetting(false);
    }
  };

  const isRtl = lang === "ar";
  const alignClass = isRtl ? "text-right" : "text-left";
  const justifyClass = isRtl ? "justify-end" : "justify-start";
  const flexRowClass = isRtl ? "flex-row-reverse" : "flex-row";

  return (
    <div className={`flex flex-col gap-8 animate-fade-in ${alignClass}`} id="settings-view-root">
      {/* HEADER SECTION */}
      <div className={`flex flex-col gap-1 ${alignClass}`}>
        <h2 className={`text-2xl font-black text-white flex items-center gap-2 ${justifyClass}`}>
          <span>{t.se_header}</span>
          <Settings size={24} style={{ color: accentColor }} />
        </h2>
        <p className="text-xs text-gray-400">{t.se_subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* RIGHT COLUMN (8 Cols) - Visuals & Settings Modules */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* 1. THEMES & PRESETS MODULE */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col gap-5">
            <div className={`flex items-center gap-2 border-b border-white/5 pb-3 ${justifyClass}`}>
              <span className="text-sm font-bold text-white">{t.se_theme_header}</span>
              <Paintbrush size={16} className="text-gray-400" />
            </div>

            <p className="text-xs text-gray-400">{t.se_theme_desc}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { id: "spotify", name: t.se_theme_spotify, desc: t.se_theme_spotify_desc, bg: "bg-[#1ed760]" },
                { id: "apple", name: t.se_theme_apple, desc: t.se_theme_apple_desc, bg: "bg-[#fc3c44]" },
                { id: "cyber", name: t.se_theme_cyber, desc: t.se_theme_cyber_desc, bg: "bg-[#00bbf9]" },
                { id: "oled", name: t.se_theme_oled, desc: t.se_theme_oled_desc, bg: "bg-white" },
              ].map((preset) => {
                const isActive = themePreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => onChangeTheme(preset.id as any)}
                    className={`p-4 rounded-2xl border transition-all active:scale-95 flex flex-col gap-2 relative overflow-hidden group ${alignClass} ${
                      isActive
                        ? "bg-white/10 border-white/20 shadow-lg"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className={`flex items-center justify-between w-full ${flexRowClass}`}>
                      <span className={`w-3.5 h-3.5 rounded-full ${preset.bg}`} />
                      {isActive && <Check size={14} style={{ color: accentColor }} />}
                    </div>
                    <div className="flex flex-col gap-0.5 mt-2">
                      <span className="text-xs font-bold text-white">{preset.name}</span>
                      <span className="text-[10px] text-gray-400">{preset.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. APP BACKGROUND IMAGE MODULE */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col gap-5">
            <div className={`flex items-center gap-2 border-b border-white/5 pb-3 ${justifyClass}`}>
              <span className="text-sm font-bold text-white">{t.se_app_bg_title}</span>
              <Image size={16} className="text-gray-400" />
            </div>

            <p className="text-xs text-gray-400">{t.se_app_bg_desc}</p>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {PRESET_BGS.map((bg, idx) => {
                const isActive = appBgImage === bg.url;
                return (
                  <button
                    key={idx}
                    onClick={() => onChangeAppBg(bg.url)}
                    className={`p-2 rounded-xl border text-center transition-all active:scale-95 flex flex-col gap-2 relative overflow-hidden h-20 group ${
                      isActive
                        ? "border-white/40 bg-white/10 shadow-lg"
                        : "border-white/5 bg-white/5 hover:border-white/20"
                    }`}
                  >
                    {bg.url ? (
                      <img src={bg.url} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="" />
                    ) : (
                      <div className="absolute inset-0 bg-[#020204]" />
                    )}
                    <span className="relative z-10 text-[10px] font-bold text-white mt-auto truncate w-full px-1">{bg.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom Inputs */}
            <div className="flex flex-col gap-3 border-t border-white/5 pt-4 mt-2">
              <span className="text-xs font-semibold text-gray-300">{t.se_app_bg_input_label}</span>
              
              <div className={`flex gap-2 ${flexRowClass}`}>
                <input
                  type="text"
                  value={customBgInput}
                  onChange={(e) => setCustomBgInput(e.target.value)}
                  placeholder={t.se_app_bg_placeholder}
                  className={`bg-black/30 border border-white/5 p-2.5 rounded-xl text-white text-xs outline-none focus:border-white/20 text-left flex-1`}
                />
                <button
                  onClick={handleApplyCustomBg}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-black hover:brightness-110 active:scale-95 transition-all shrink-0"
                  style={{ backgroundColor: accentColor }}
                >
                  {t.se_app_bg_btn}
                </button>
              </div>

              {/* Upload field */}
              <div className={`flex items-center justify-between bg-black/20 p-3 rounded-2xl border border-white/5 ${flexRowClass}`}>
                <span className="text-[11px] text-gray-400">{t.se_app_bg_upload_label}</span>
                <label className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl text-white cursor-pointer active:scale-95 transition-all">
                  <Upload size={12} />
                  <span>{t.se_app_bg_upload_btn}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleBgUpload(e, "app")}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* 3. MUSIC PLAYER STYLE & COVER BACKGROUND */}
          <div className="bg-white/5 border border-white/10 p-6 rounded-3xl backdrop-blur-xl flex flex-col gap-5">
            <div className={`flex items-center gap-2 border-b border-white/5 pb-3 ${justifyClass}`}>
              <span className="text-sm font-bold text-white">{t.se_player_bg_title}</span>
              <Sparkles size={16} className="text-gray-400" />
            </div>

            <p className="text-xs text-gray-400">{t.se_player_bg_desc}</p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: "blurred-cover", title: t.se_player_bg_blur, desc: t.se_player_bg_blur_desc },
                { id: "solid", title: t.se_player_bg_solid, desc: t.se_player_bg_solid_desc },
                { id: "custom", title: t.se_player_bg_custom, desc: t.se_player_bg_custom_desc },
              ].map((style) => {
                const isActive = playerBgStyle === style.id;
                return (
                  <button
                    key={style.id}
                    onClick={() => onChangePlayerBgStyle(style.id as any)}
                    className={`p-4 rounded-2xl border transition-all active:scale-95 flex flex-col gap-1.5 ${alignClass} ${
                      isActive
                        ? "bg-white/10 border-white/20 shadow-lg"
                        : "bg-white/5 border-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className={`flex items-center justify-between w-full ${flexRowClass}`}>
                      <span className="text-xs font-bold text-white">{style.title}</span>
                      {isActive && <Check size={12} style={{ color: accentColor }} />}
                    </div>
                    <span className="text-[10px] text-gray-400 leading-relaxed">{style.desc}</span>
                  </button>
                );
              })}
            </div>

            {playerBgStyle === "custom" && (
              <div className="flex flex-col gap-3 border-t border-white/5 pt-4 animate-slide-up">
                <span className="text-xs font-semibold text-gray-300">{t.se_player_custom_input}</span>
                <div className={`flex gap-2 ${flexRowClass}`}>
                  <input
                    type="text"
                    value={customPlayerBgInput}
                    onChange={(e) => setCustomPlayerBgInput(e.target.value)}
                    placeholder={t.se_player_custom_placeholder}
                    className="bg-black/30 border border-white/5 p-2.5 rounded-xl text-white text-xs outline-none focus:border-white/20 text-left flex-1"
                  />
                  <button
                    onClick={handleApplyCustomPlayerBg}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold text-black hover:brightness-110 active:scale-95 transition-all"
                    style={{ backgroundColor: accentColor }}
                  >
                    {t.se_player_custom_btn}
                  </button>
                </div>

                <div className={`flex items-center justify-between bg-black/20 p-3 rounded-2xl border border-white/5 ${flexRowClass}`}>
                  <span className="text-[11px] text-gray-400">{t.se_player_custom_upload}</span>
                  <label className="flex items-center gap-1.5 text-xs bg-white/10 hover:bg-white/15 px-3 py-2 rounded-xl text-white cursor-pointer active:scale-95 transition-all">
                    <Upload size={12} />
                    <span>{t.se_app_bg_upload_btn}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleBgUpload(e, "player")}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* LEFT COLUMN (4 Cols) - Diagnostics & Reset Core */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* LANGUAGE SWITCHER SETTINGS */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex flex-col gap-4">
            <div className={`flex items-center gap-2 text-sm text-white font-bold border-b border-white/5 pb-3 ${justifyClass}`}>
              <span>{t.se_lang_title}</span>
              <span className="text-blue-400">🌐</span>
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              {t.se_lang_desc}
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => onChangeLang("ar")}
                className={`py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] border ${
                  lang === "ar"
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {t.se_lang_ar}
              </button>
              <button
                onClick={() => onChangeLang("en")}
                className={`py-2.5 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] border ${
                  lang === "en"
                    ? "bg-white/10 border-white/20 text-white"
                    : "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                }`}
              >
                {t.se_lang_en}
              </button>
            </div>
          </div>

          {/* SYSTEM MAINTENANCE MODULE */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex flex-col gap-4">
            <div className={`flex items-center gap-2 text-sm text-white font-bold border-b border-white/5 pb-3 ${justifyClass}`}>
              <span>{t.se_maintenance_title}</span>
              <Trash2 size={16} className="text-rose-500" />
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              {t.se_maintenance_desc}
            </p>

            <button
              onClick={handleFullReset}
              disabled={isResetting}
              className="w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-3 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <RefreshCw size={14} className={isResetting ? "animate-spin" : ""} />
              <span>{isResetting ? t.se_maintenance_loading : t.se_maintenance_btn}</span>
            </button>
          </div>

          {/* DEVELOPER DEBUG TOGGLE */}
          <div className="bg-white/5 border border-white/10 p-5 rounded-3xl flex flex-col gap-4">
            <div className={`flex items-center gap-2 text-sm text-white font-bold border-b border-white/5 pb-3 ${justifyClass}`}>
              <span>{t.se_debug_title}</span>
              <Eye size={16} className="text-amber-500" />
            </div>

            <p className="text-[11px] text-gray-400 leading-relaxed">
              {t.se_debug_desc}
            </p>

            <button
              onClick={onToggleDebug}
              className={`w-full flex items-center justify-center gap-2 border py-3 rounded-2xl text-xs font-bold transition-all active:scale-[0.98] ${
                isDebugMode
                  ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                  : "bg-white/5 border-white/5 text-gray-300 hover:bg-white/10"
              }`}
            >
              {isDebugMode ? <EyeOff size={14} /> : <Eye size={14} />}
              <span>{isDebugMode ? t.se_debug_btn_disable : t.se_debug_btn_enable}</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
