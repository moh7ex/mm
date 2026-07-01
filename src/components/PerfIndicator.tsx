import React, { useState, useEffect } from "react";
import { audioEngine } from "../audio";
import { Cpu, Gauge, Activity, AlertTriangle } from "lucide-react";

interface PerfIndicatorProps {
  accentColor: string;
}

export default function PerfIndicator({ accentColor }: PerfIndicatorProps) {
  const [metrics, setMetrics] = useState(() => audioEngine.getPerfMetrics());

  useEffect(() => {
    const timer = setInterval(() => {
      setMetrics(audioEngine.getPerfMetrics());
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // Format sample rate to kHz (e.g. 48000 -> 48kHz)
  const formattedSampleRate = metrics.sampleRate ? `${(metrics.sampleRate / 1000).toFixed(1)} kHz` : "N/A";

  const isStateRunning = metrics.state === "running";

  // Dynamic FPS color
  const fpsColor =
    metrics.fps >= 55
      ? "text-emerald-400"
      : metrics.fps >= 35
      ? "text-amber-400"
      : "text-rose-500";

  // Dynamic latency color (lower is better, < 25ms is excellent, < 50ms is good, else yellow/red)
  const latencyColor =
    metrics.totalLatency < 25
      ? "text-emerald-400"
      : metrics.totalLatency < 60
      ? "text-amber-400"
      : "text-rose-500";

  return (
    <div
      className="flex flex-wrap items-center gap-x-4 gap-y-2 bg-black/40 border border-white/5 px-4 py-2.5 rounded-2xl text-[11px] font-mono text-gray-400 backdrop-blur-md shadow-inner"
      style={{ borderColor: `${accentColor}1c` }}
      dir="ltr"
    >
      {/* AudioContext Status */}
      <div className="flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            isStateRunning ? "bg-emerald-500 animate-pulse" : "bg-gray-500"
          }`}
        />
        <span className="font-semibold text-white">AudioCtx:</span>
        <span className={isStateRunning ? "text-emerald-400" : "text-gray-400"}>
          {metrics.state}
        </span>
      </div>

      {/* Divider */}
      <span className="text-white/10 hidden sm:inline">|</span>

      {/* Latency */}
      <div className="flex items-center gap-1.5">
        <Gauge size={12} className="text-gray-500" />
        <span className="font-semibold text-white">Latency:</span>
        <span className={latencyColor}>{metrics.totalLatency}ms</span>
        <span className="text-[9px] text-gray-500">
          ({metrics.baseLatency}b + {metrics.outputLatency}o)
        </span>
      </div>

      {/* Divider */}
      <span className="text-white/10 hidden sm:inline">|</span>

      {/* Frame Rate */}
      <div className="flex items-center gap-1.5">
        <Activity size={12} className="text-gray-500" />
        <span className="font-semibold text-white">Render FPS:</span>
        <span className={`${fpsColor} font-bold`}>{metrics.fps}</span>
      </div>

      {/* Divider */}
      <span className="text-white/10 hidden sm:inline">|</span>

      {/* Sample Rate */}
      <div className="flex items-center gap-1.5">
        <Cpu size={12} className="text-gray-500" />
        <span className="font-semibold text-white">SampleRate:</span>
        <span className="text-white/80">{formattedSampleRate}</span>
      </div>

      {/* Divider */}
      <span className="text-white/10 hidden sm:inline">|</span>

      {/* Frame Drops */}
      <div className="flex items-center gap-1.5">
        {metrics.frameDrops > 0 ? (
          <AlertTriangle size={12} className="text-amber-500 animate-bounce" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
        )}
        <span className="font-semibold text-white">Drops/s:</span>
        <span className={metrics.frameDrops > 0 ? "text-amber-400 font-bold" : "text-gray-400"}>
          {metrics.frameDrops}
        </span>
        <span className="text-[9px] text-gray-500">({metrics.totalFrameDrops} total)</span>
      </div>
    </div>
  );
}
