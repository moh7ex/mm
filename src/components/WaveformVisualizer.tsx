import React, { useEffect, useRef } from "react";
import { audioEngine } from "../audio";

interface WaveformVisualizerProps {
  isPlaying: boolean;
  accentColor: string;
  glowColor: string;
  duration: number;
  currentTime: number;
  onSeek: (time: number) => void;
}

export default function WaveformVisualizer({
  isPlaying,
  accentColor,
  glowColor,
  duration,
  currentTime,
  onSeek,
}: WaveformVisualizerProps) {
  const spectrumCanvasRef = useRef<HTMLCanvasElement>(null);
  const waveScrubberCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  // 1. Real-time Spectrum Analyzer Animation Loop
  useEffect(() => {
    const canvas = spectrumCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const render = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;

      if (!isPlaying) {
        // Draw idle line once and exit the animation loop to save CPU cycles
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#040406";
        ctx.fillRect(0, 0, w, h);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, h - 2);
        ctx.lineTo(w, h - 2);
        ctx.stroke();
        animationRef.current = null;
        return;
      }

      // Clear with slight transparency for trail effect
      ctx.fillStyle = "rgba(4, 4, 6, 0.2)";
      ctx.fillRect(0, 0, w, h);

      const data = audioEngine.getSpectrumData();
      if (data.length > 0) {
        const barWidth = w / 32;
        const spacing = 2;

        for (let i = 0; i < 32; i++) {
          const value = data[i * 2] || 0;
          const percent = value / 255;
          const barHeight = percent * h * 0.95;

          const x = i * (barWidth) + spacing;
          const y = h - barHeight;

          const grad = ctx.createLinearGradient(x, y, x, h);
          grad.addColorStop(0, accentColor);
          grad.addColorStop(1, "rgba(255, 255, 255, 0.1)");

          ctx.fillStyle = grad;
          ctx.shadowColor = accentColor;
          ctx.shadowBlur = 8;

          ctx.beginPath();
          if (ctx.roundRect) {
            ctx.roundRect(x, y, barWidth - spacing, barHeight, [4, 4, 0, 0]);
          } else {
            ctx.rect(x, y, barWidth - spacing, barHeight);
          }
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, accentColor]);

  // 2. Render static procedural Sound Waveform Scrubber
  useEffect(() => {
    const canvas = waveScrubberCanvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    // Number of bars in the waveform
    const barsCount = 75;
    const barWidth = w / barsCount;
    const spacing = 1.5;

    // Create a deterministic pseudo-random waveform height array
    const peaks: number[] = [];
    let currentSeed = 13579;
    for (let i = 0; i < barsCount; i++) {
      currentSeed = (currentSeed * 9301 + 49297) % 233280;
      const val = 0.25 + (currentSeed / 233280) * 0.75;
      peaks.push(val);
    }

    ctx.clearRect(0, 0, w, h);

    const progressPercent = duration > 0 ? currentTime / duration : 0;
    const activeBarsLimit = Math.floor(progressPercent * barsCount);

    for (let i = 0; i < barsCount; i++) {
      const peakHeight = peaks[i] * h * 0.75;
      const x = i * barWidth + spacing;
      const y = (h - peakHeight) / 2;

      const isActive = i <= activeBarsLimit;

      ctx.beginPath();
      ctx.fillStyle = isActive ? accentColor : "rgba(255, 255, 255, 0.15)";
      ctx.shadowColor = isActive ? accentColor : "transparent";
      ctx.shadowBlur = isActive ? 4 : 0;

      if (ctx.roundRect) {
        ctx.roundRect(x, y, barWidth - spacing, peakHeight, 2);
      } else {
        ctx.rect(x, y, barWidth - spacing, peakHeight);
      }
      ctx.fill();
    }
  }, [currentTime, duration, accentColor]);

  // Waveform Click Seeker
  const handleWaveformClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = waveScrubberCanvasRef.current;
    if (!canvas || duration <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickPercent = clickX / rect.width;
    const newTime = clickPercent * duration;

    onSeek(newTime);
  };

  return (
    <div className="flex flex-col gap-4 w-full" id="visualization-root-node">
      {/* Real-time Spectrum Analyzer */}
      <div className="w-full flex flex-col gap-1">
        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Spectrum Analyzer</span>
        <canvas
          ref={spectrumCanvasRef}
          id="spectrum-visualizer-canvas"
          className="w-full h-16 rounded-xl bg-black/45 border border-white/5 shadow-inner"
        />
      </div>

      {/* Waveform Scrubber Timeline */}
      <div className="w-full flex flex-col gap-1">
        <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">Dynamic Waveform</span>
        <canvas
          ref={waveScrubberCanvasRef}
          id="waveform-scrubber-canvas"
          onClick={handleWaveformClick}
          className="w-full h-12 rounded-xl cursor-pointer bg-black/30 border border-white/5 active:scale-[0.99] transition-transform duration-100"
        />
      </div>
    </div>
  );
}
