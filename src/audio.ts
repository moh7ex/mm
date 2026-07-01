import { EqualizerBand } from "./types";

export class QuantumAudioEngine {
  public ctx: AudioContext | null = null;

  // Performance Monitoring State
  private lastPerfFrameTime: number = 0;
  private fpsCounter: number = 0;
  private fps: number = 60;
  private frameDropsCounter: number = 0;
  private totalFrameDrops: number = 0;
  private frameDropsInLastSecond: number = 0;
  private perfIntervalId: any = null;
  
  // Dual players for seamless crossfading
  private playerA: HTMLAudioElement;
  private playerB: HTMLAudioElement;
  private activePlayer: "A" | "B" = "A";

  private sourceA: MediaElementAudioSourceNode | null = null;
  private sourceB: MediaElementAudioSourceNode | null = null;

  private gainA: GainNode | null = null;
  private gainB: GainNode | null = null;

  // Effects chain (shared)
  private compressor: DynamicsCompressorNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private analyser: AnalyserNode | null = null;

  // Configuration
  private volume: number = 0.8;
  private crossfadeDuration: number = 3; // seconds
  private isNormalized: boolean = true;
  private eqBands: EqualizerBand[] = [
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
  ];
  private bassBoostGain: number = 0;

  // Handlers
  public onTimeUpdate: (currentTime: number, duration: number) => void = () => {};
  public onTrackEnded: () => void = () => {};
  public onCrossfadeStarted: () => void = () => {};

  constructor() {
    this.playerA = new Audio();
    this.playerB = new Audio();
    
    this.playerA.crossOrigin = "anonymous";
    this.playerB.crossOrigin = "anonymous";

    this.setupAudioListeners();
  }

  private setupAudioListeners() {
    const handleTimeUpdate = (player: HTMLAudioElement) => {
      if (this.isCurrentPlayer(player)) {
        this.onTimeUpdate(player.currentTime, player.duration || 0);

        // Detect if we should start crossfading into the next track (pre-trigger)
        const duration = player.duration || 0;
        const remaining = duration - player.currentTime;
        if (duration > 5 && remaining <= this.crossfadeDuration && remaining > 0) {
          // Trigger crossfade callback to request and load next track
          this.onCrossfadeStarted();
        }
      }
    };

    const handleEnded = (player: HTMLAudioElement) => {
      if (this.isCurrentPlayer(player)) {
        this.onTrackEnded();
      }
    };

    this.playerA.addEventListener("timeupdate", () => handleTimeUpdate(this.playerA));
    this.playerB.addEventListener("timeupdate", () => handleTimeUpdate(this.playerB));

    this.playerA.addEventListener("ended", () => handleEnded(this.playerA));
    this.playerB.addEventListener("ended", () => handleEnded(this.playerB));
  }

  private isCurrentPlayer(player: HTMLAudioElement): boolean {
    return (this.activePlayer === "A" && player === this.playerA) ||
           (this.activePlayer === "B" && player === this.playerB);
  }

  public get activeAudioElement(): HTMLAudioElement {
    return this.activePlayer === "A" ? this.playerA : this.playerB;
  }

  public async initContext() {
    if (this.ctx) return;

    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Resuming safety
      if (this.ctx.state === "suspended") {
        await this.ctx.resume();
      }

      this.startPerfMonitoring();

      // 1. Create Source Nodes
      this.sourceA = this.ctx.createMediaElementSource(this.playerA);
      this.sourceB = this.ctx.createMediaElementSource(this.playerB);

      // 2. Create independent gain nodes for crossfading
      this.gainA = this.ctx.createGain();
      this.gainB = this.ctx.createGain();

      this.gainA.gain.value = this.activePlayer === "A" ? this.volume : 0;
      this.gainB.gain.value = this.activePlayer === "B" ? this.volume : 0;

      this.sourceA.connect(this.gainA);
      this.sourceB.connect(this.gainB);

      // 3. Setup dynamic normalizer / compressor
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.01, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // Connect source gain nodes to the compressor
      this.gainA.connect(this.compressor);
      this.gainB.connect(this.compressor);

      // 4. Create Equalizer filters
      let lastNode: AudioNode = this.compressor;

      // Bass boost filter (lowshelf)
      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = "lowshelf";
      this.bassFilter.frequency.value = 100;
      this.bassFilter.Q.value = 0.8;
      this.bassFilter.gain.value = this.bassBoostGain;
      lastNode.connect(this.bassFilter);
      lastNode = this.bassFilter;

      // 10 bands peaking filters
      this.eqFilters = [];
      this.eqBands.forEach((band, idx) => {
        const filter = this.ctx!.createBiquadFilter();
        if (idx === 0) {
          filter.type = "lowshelf";
        } else if (idx === this.eqBands.length - 1) {
          filter.type = "highshelf";
        } else {
          filter.type = "peaking";
        }
        filter.frequency.value = band.frequency;
        filter.Q.value = band.q;
        filter.gain.value = band.gain;
        lastNode.connect(filter);
        this.eqFilters.push(filter);
        lastNode = filter;
      });

      // 5. Connect to Analyser node
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 512;
      lastNode.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

    } catch (err) {
      console.error("Failed to initialize AudioContext:", err);
    }
  }

  // Play a song on the active player with optional fading
  public async playTrackBlob(blob: Blob, startPosition: number = 0): Promise<string> {
    await this.initContext();
    
    const url = URL.createObjectURL(blob);
    const currentPlayer = this.activeAudioElement;
    
    currentPlayer.pause();
    currentPlayer.src = url;
    currentPlayer.load();
    currentPlayer.currentTime = startPosition;

    // Reset gain to normal user volume
    const currentGain = this.activePlayer === "A" ? this.gainA : this.gainB;
    if (currentGain && this.ctx) {
      currentGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
    }

    try {
      await currentPlayer.play();
    } catch (err) {
      console.warn("Autoplay block or playback aborted:", err);
    }

    return url;
  }

  // Pre-load and smoothly crossfade to the next track
  private isCrossfading = false;
  public async crossfadeTo(nextBlob: Blob): Promise<string> {
    if (this.isCrossfading || !this.ctx) return "";
    this.isCrossfading = true;

    await this.initContext();

    const nextPlayerType = this.activePlayer === "A" ? "B" : "A";
    const nextPlayer = nextPlayerType === "A" ? this.playerA : this.playerB;
    const prevPlayer = this.activePlayer === "A" ? this.playerA : this.playerB;

    const nextGain = nextPlayerType === "A" ? this.gainA : this.gainB;
    const prevGain = this.activePlayer === "A" ? this.gainA : this.gainB;

    const url = URL.createObjectURL(nextBlob);

    nextPlayer.pause();
    nextPlayer.src = url;
    nextPlayer.load();
    nextPlayer.currentTime = 0;

    // Setup gains for fading
    if (this.ctx && prevGain && nextGain) {
      const now = this.ctx.currentTime;
      
      // Fade active player out
      prevGain.gain.setValueAtTime(prevGain.gain.value, now);
      prevGain.gain.linearRampToValueAtTime(0, now + this.crossfadeDuration);

      // Fade incoming player in
      nextGain.gain.setValueAtTime(0, now);
      nextGain.gain.linearRampToValueAtTime(this.volume, now + this.crossfadeDuration);
    }

    try {
      await nextPlayer.play();
    } catch (err) {
      console.error("Crossfade autoplay failed:", err);
    }

    // Switch active state
    this.activePlayer = nextPlayerType;

    // Stop and clean up old player after transition
    setTimeout(() => {
      prevPlayer.pause();
      // Revoke the old object URL if needed to save memory
      this.isCrossfading = false;
    }, this.crossfadeDuration * 1000);

    return url;
  }

  // Controls
  public play() {
    this.activeAudioElement.play().catch(err => console.warn(err));
  }

  public pause() {
    this.activeAudioElement.pause();
  }

  public setVolume(volume: number) {
    this.volume = volume;
    if (this.ctx) {
      const gainNode = this.activePlayer === "A" ? this.gainA : this.gainB;
      if (gainNode) {
        gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
      }
    } else {
      this.playerA.volume = volume;
      this.playerB.volume = volume;
    }
  }

  public setPlaybackRate(rate: number) {
    this.playerA.playbackRate = rate;
    this.playerB.playbackRate = rate;
  }

  public setBassBoost(dbValue: number) {
    this.bassBoostGain = dbValue;
    if (this.bassFilter && this.ctx) {
      this.bassFilter.gain.setValueAtTime(dbValue, this.ctx.currentTime);
    }
  }

  public setEQBand(idx: number, dbValue: number) {
    if (idx < 0 || idx >= this.eqBands.length) return;
    this.eqBands[idx].gain = dbValue;
    if (this.eqFilters[idx] && this.ctx) {
      this.eqFilters[idx].gain.setValueAtTime(dbValue, this.ctx.currentTime);
    }
  }

  public toggleNormalization(enabled: boolean) {
    this.isNormalized = enabled;
    if (this.compressor && this.ctx) {
      const threshold = enabled ? -18 : 0; // Threshold 0 effectively disables compression
      this.compressor.threshold.setValueAtTime(threshold, this.ctx.currentTime);
    }
  }

  // Real-time canvas data
  public getSpectrumData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }

  public getWaveformData(): Uint8Array {
    if (!this.analyser) return new Uint8Array(0);
    const dataArray = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(dataArray);
    return dataArray;
  }

  // Get current position & length
  public getCurrentTime(): number {
    return this.activeAudioElement.currentTime;
  }

  public getDuration(): number {
    return this.activeAudioElement.duration || 0;
  }

  public seek(seconds: number) {
    this.activeAudioElement.currentTime = seconds;
  }

  // Performance monitoring loop
  public startPerfMonitoring() {
    if (this.perfIntervalId) return;

    const measure = (timestamp: number) => {
      if (this.lastPerfFrameTime) {
        const elapsed = timestamp - this.lastPerfFrameTime;
        this.fpsCounter++;
        // If elapsed is greater than 25ms, we consider it a frame drop (target 60 FPS is ~16.6ms)
        if (elapsed > 25) {
          this.frameDropsCounter++;
          this.totalFrameDrops++;
        }
      }
      this.lastPerfFrameTime = timestamp;
      if (this.ctx) {
        requestAnimationFrame(measure);
      } else {
        this.perfIntervalId = null;
      }
    };

    requestAnimationFrame(measure);

    this.perfIntervalId = setInterval(() => {
      this.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.frameDropsInLastSecond = this.frameDropsCounter;
      this.frameDropsCounter = 0;
    }, 1000);
  }

  public getPerfMetrics() {
    const baseLat = this.ctx ? (this.ctx.baseLatency || 0.005) : 0;
    const outLat = this.ctx ? ((this.ctx as any).outputLatency || 0.010) : 0;
    return {
      baseLatency: Math.round(baseLat * 1000),
      outputLatency: Math.round(outLat * 1000),
      totalLatency: Math.round((baseLat + outLat) * 1000),
      sampleRate: this.ctx ? this.ctx.sampleRate : 44100,
      state: this.ctx ? this.ctx.state : "offline",
      fps: this.fps,
      frameDrops: this.frameDropsInLastSecond,
      totalFrameDrops: this.totalFrameDrops,
    };
  }

  // Destroy/Unload resources
  public destroy() {
    this.playerA.pause();
    this.playerB.pause();
    this.playerA.src = "";
    this.playerB.src = "";
    if (this.perfIntervalId) {
      clearInterval(this.perfIntervalId);
    }
    if (this.ctx) {
      this.ctx.close();
    }
  }
}

export const audioEngine = new QuantumAudioEngine();
