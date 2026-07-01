import { useState } from "react";
import { audioEngine } from "../audio";
import { EqualizerBand } from "../types";

interface EqualizerPanelProps {
  accentColor: string;
}

export default function EqualizerPanel({ accentColor }: EqualizerPanelProps) {
  const [bassBoost, setBassBoost] = useState<number>(0);
  const [normalization, setNormalization] = useState<boolean>(true);
  
  const [eqBands, setEqBands] = useState<EqualizerBand[]>([
    { frequency: 31, q: 0.54, gain: 0 },
    { frequency: 62, q: 0.54, gain: 0 },
    { frequency: 125, q: 0.54, gain: 0 },
    { frequency: 250, q: 1, gain: 0 },
    { frequency: 500, q: 1, gain: 0 },
    { frequency: 1000, q: 1, gain: 0 },
    { frequency: 2000, q: 1, gain: 0 },
    { frequency: 4000, q: 1, gain: 0 },
    { frequency: 8000, q: 0.54, gain: 0 },
    { frequency: 16000, q: 0.54, gain: 0 },
  ]);

  const handleEqChange = (idx: number, gain: number) => {
    const updated = [...eqBands];
    updated[idx].gain = gain;
    setEqBands(updated);
    audioEngine.setEQBand(idx, gain);
  };

  const handleBassChange = (val: number) => {
    setBassBoost(val);
    audioEngine.setBassBoost(val);
  };

  const handleNormalizationToggle = () => {
    const newState = !normalization;
    setNormalization(newState);
    audioEngine.toggleNormalization(newState);
  };

  const handleReset = () => {
    setBassBoost(0);
    audioEngine.setBassBoost(0);

    const resetBands = eqBands.map((band, idx) => {
      audioEngine.setEQBand(idx, 0);
      return { ...band, gain: 0 };
    });
    setEqBands(resetBands);
  };

  // Pre-configured EQ Presets
  const applyPreset = (presetName: string) => {
    let gains: number[] = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let bass = 0;

    switch (presetName) {
      case "flat":
        gains = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        bass = 0;
        break;
      case "bass":
        gains = [6, 5, 4, 2, 0, 0, 0, 0, 1, 2];
        bass = 7;
        break;
      case "vocals":
        gains = [-3, -2, -1, 1, 3, 4, 3, 2, 1, -1];
        bass = 0;
        break;
      case "electronic":
        gains = [5, 4, 1, 0, -1, 2, 1, 3, 4, 5];
        bass = 6;
        break;
      case "pop":
        gains = [-1, 2, 3, 4, 2, -1, -2, -2, -1, -1];
        bass = 3;
        break;
      case "classical":
        gains = [3, 2, 2, 2, 0, -1, -2, 1, 2, 3];
        bass = 2;
        break;
    }

    setBassBoost(bass);
    audioEngine.setBassBoost(bass);

    const updated = eqBands.map((band, idx) => {
      audioEngine.setEQBand(idx, gains[idx]);
      return { ...band, gain: gains[idx] };
    });
    setEqBands(updated);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-3xl p-5 backdrop-blur-2xl shadow-2xl flex flex-col gap-6" id="eq-panel-root-node">
      {/* Header controls */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div className="flex flex-col">
          <h4 className="font-semibold text-white text-base">🎛️ معادل وهندسة الصوت</h4>
          <span className="text-xs text-gray-400">تحكم كامل في جودة الترددات ونقاء الصوت</span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="text-xs bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-xl text-white transition-colors"
          >
            إعادة ضبط
          </button>
        </div>
      </div>

      {/* EQ Presets */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {["flat", "bass", "vocals", "electronic", "pop", "classical"].map((preset) => (
          <button
            key={preset}
            onClick={() => applyPreset(preset)}
            className="text-xs py-1.5 rounded-lg border border-white/5 bg-white/5 hover:bg-white/10 text-gray-300 capitalize transition-all"
            style={{ borderColor: preset === "bass" && bassBoost > 0 ? accentColor : undefined }}
          >
            {preset === "flat" ? "طبيعي" :
             preset === "bass" ? "مضخم صوت" :
             preset === "vocals" ? "توضيح صوت" :
             preset === "electronic" ? "إلكترونيك" :
             preset === "pop" ? "بوب" : "كلاسيك"}
          </button>
        ))}
      </div>

      {/* 10-Band EQ Sliders Slider */}
      <div className="flex justify-between items-center h-48 bg-black/40 border border-white/5 rounded-2xl p-4 gap-2">
        {eqBands.map((band, idx) => (
          <div key={band.frequency} className="flex flex-col items-center h-full justify-between flex-1">
            <span className="text-[10px] font-mono text-gray-400">{band.gain > 0 ? `+${band.gain}` : band.gain}</span>
            
            <div className="relative w-4 flex-1 flex justify-center py-2 h-full">
              {/* Custom Track background */}
              <input
                type="range"
                min="-12"
                max="12"
                step="0.5"
                value={band.gain}
                onChange={(e) => handleEqChange(idx, parseFloat(e.target.value))}
                className="accent-white h-full cursor-ns-resize vertical-slider"
                style={{
                  writingMode: "bt-lr" as any,
                  WebkitAppearance: "slider-vertical" as any,
                  accentColor: accentColor
                }}
              />
            </div>
            
            <span className="text-[10px] font-mono text-gray-500 whitespace-nowrap">
              {band.frequency >= 1000 ? `${band.frequency / 1000}kHz` : `${band.frequency}Hz`}
            </span>
          </div>
        ))}
      </div>

      {/* Bass Boost & Normalization Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bass boost dial slider */}
        <div className="bg-black/25 border border-white/5 p-4 rounded-2xl flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-white">🔊 تضخيم البيز (Bass Boost)</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-white" style={{ color: accentColor }}>
              {bassBoost} dB
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={bassBoost}
            onChange={(e) => handleBassChange(parseFloat(e.target.value))}
            className="w-full cursor-pointer range-slider-bar"
            style={{ accentColor: accentColor }}
          />
          <span className="text-[10px] text-gray-400">تضخيم الموجات ذات التردد المنخفض (أقل من 100 هرتز) لقوة وعمق إضافي</span>
        </div>

        {/* Dynamic Loudness Normalization */}
        <div className="bg-black/25 border border-white/5 p-4 rounded-2xl flex justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-white">🎚️ موازنة الصوت الذكية</span>
            <span className="text-[10px] text-gray-400">
              يقوم بضغط مستويات الصوت تلقائيًا لمنع التباينات المزعجة والصدمات الصوتية بين الملفات المختلفة
            </span>
          </div>

          <button
            onClick={handleNormalizationToggle}
            className={`w-14 h-8 flex items-center rounded-full p-1 cursor-pointer transition-all duration-300 ${
              normalization ? "bg-green-500" : "bg-white/10"
            }`}
            style={{ backgroundColor: normalization ? accentColor : undefined }}
          >
            <div
              className={`bg-white w-6 h-6 rounded-full shadow-md transform transition-all duration-300 ${
                normalization ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
