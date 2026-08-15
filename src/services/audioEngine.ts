import { Track, SynthParams } from '../types/music';

type TimeUpdateCallback = (currentTime: number, duration: number) => void;
type TrackEndedCallback = () => void;
type StateChangeCallback = (isPlaying: boolean) => void;

export type EqPreset = 'flat' | 'bass-boost' | 'warm-analog' | 'vocal-clarity' | 'eink-pure';

export function formatAudioUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  const clean = pathOrUrl.replace(/\\/g, '/');
  if (clean.startsWith('file:///')) return clean;
  if (clean.startsWith('file://')) return clean.replace('file://', 'file:///');
  if (/^[a-zA-Z]:/.test(clean)) return `file:///${clean}`;
  return clean;
}

class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private htmlAudio: HTMLAudioElement | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  
  // 5-Band Mastering Equalizer DSP Nodes
  private subBassNode: BiquadFilterNode | null = null;
  private lowMidNode: BiquadFilterNode | null = null;
  private vocalMidNode: BiquadFilterNode | null = null;
  private highMidNode: BiquadFilterNode | null = null;
  private airTrebleNode: BiquadFilterNode | null = null;

  // Mastering DSP Nodes
  private saturationNode: WaveShaperNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;
  private pannerNode: StereoPannerNode | null = null;
  private masterGainNode: GainNode | null = null;

  private synthInterval: number | null = null;
  private currentTrack: Track | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.72; // 0.0 - 1.0
  private isMuted: boolean = false;
  private currentTime: number = 0;
  private duration: number = 0;

  // Native WASAPI Audio Status State
  private audioStatus: any = {
    device: 'WASAPI Shared (Speakers)',
    outputMode: 'WASAPI Shared',
    codec: 'FLAC',
    sampleRate: 44100,
    bitDepth: 16,
    channels: 2,
    resampling: false,
    dspEnabled: true,
    directOutput: false,
    replayGain: 'OFF',
    buffer: 'Normal'
  };

  // DSP Feature Settings
  private activeEqPreset: EqPreset = 'warm-analog';
  private tapeWarmthEnabled: boolean = true;
  private spatial3dEnabled: boolean = true;

  private onTimeUpdateCbs: Set<TimeUpdateCallback> = new Set();
  private onTrackEndedCbs: Set<TrackEndedCallback> = new Set();
  private onStateChangeCbs: Set<StateChangeCallback> = new Set();
  private timerId: number | null = null;

  constructor() {
    const win = window as any;
    if (win.audioAPI) {
      // Connect Renderer to Centralized Native Windows Audio Engine in Main Process
      win.audioAPI.onStatusUpdate((status: any) => {
        this.audioStatus = status;
        this.notifyStateChange();
      });

      win.audioAPI.onTimeUpdate((curr: number, dur: number) => {
        this.currentTime = curr;
        this.duration = dur;
        this.notifyTimeUpdate();
      });

      win.audioAPI.onEnded(() => {
        this.isPlaying = false;
        this.notifyStateChange();
        this.notifyTrackEnded();
      });
    }

    this.htmlAudio = new Audio();

    this.htmlAudio.addEventListener('loadedmetadata', () => {
      if (this.htmlAudio && this.htmlAudio.duration && !isNaN(this.htmlAudio.duration) && isFinite(this.htmlAudio.duration)) {
        this.duration = Math.round(this.htmlAudio.duration);
        if (this.currentTrack) {
          this.currentTrack.duration = this.duration;
        }
        this.notifyTimeUpdate();
      }
    });

    this.htmlAudio.addEventListener('timeupdate', () => {
      if (this.htmlAudio && this.currentTrack?.audioUrl) {
        this.currentTime = this.htmlAudio.currentTime;
        if (this.htmlAudio.duration && !isNaN(this.htmlAudio.duration) && isFinite(this.htmlAudio.duration)) {
          const realDur = Math.round(this.htmlAudio.duration);
          if (realDur > 0 && realDur !== this.duration) {
            this.duration = realDur;
            if (this.currentTrack) this.currentTrack.duration = realDur;
          }
        }
        this.notifyTimeUpdate();
      }
    });

    this.htmlAudio.addEventListener('ended', () => {
      if (!(window as any).audioAPI) {
        this.isPlaying = false;
        this.notifyStateChange();
        this.notifyTrackEnded();
      }
    });
  }

  private initAudioContext() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          this.audioCtx = new AudioCtxClass();
          this.setupDspChain();
        } catch (e) {}
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  private setupDspChain() {
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;

      this.subBassNode = this.audioCtx.createBiquadFilter();
      this.subBassNode.type = 'lowshelf';
      this.subBassNode.frequency.setValueAtTime(60, now);

      this.lowMidNode = this.audioCtx.createBiquadFilter();
      this.lowMidNode.type = 'peaking';
      this.lowMidNode.frequency.setValueAtTime(250, now);

      this.vocalMidNode = this.audioCtx.createBiquadFilter();
      this.vocalMidNode.type = 'peaking';
      this.vocalMidNode.frequency.setValueAtTime(1200, now);

      this.highMidNode = this.audioCtx.createBiquadFilter();
      this.highMidNode.type = 'peaking';
      this.highMidNode.frequency.setValueAtTime(3500, now);

      this.airTrebleNode = this.audioCtx.createBiquadFilter();
      this.airTrebleNode.type = 'highshelf';
      this.airTrebleNode.frequency.setValueAtTime(10000, now);

      this.saturationNode = this.audioCtx.createWaveShaper();
      (this.saturationNode as any).curve = this.makeAnalogWarmthCurve();
      this.saturationNode.oversample = '4x';

      this.compressorNode = this.audioCtx.createDynamicsCompressor();

      if (this.audioCtx.createStereoPanner) {
        this.pannerNode = this.audioCtx.createStereoPanner();
        this.pannerNode.pan.setValueAtTime(0.0, now);
      }

      this.masterGainNode = this.audioCtx.createGain();
      this.masterGainNode.gain.setValueAtTime(this.isMuted ? 0 : this.volume, now);

      this.applyEqPreset(this.activeEqPreset);

      if (this.htmlAudio && !this.sourceNode) {
        try {
          this.sourceNode = this.audioCtx.createMediaElementSource(this.htmlAudio);
          this.connectNodes();
        } catch (e) {}
      }
    } catch (err) {}
  }

  private connectNodes() {
    if (!this.audioCtx || !this.sourceNode) return;
    try {
      this.sourceNode.disconnect();
      let lastNode: AudioNode = this.sourceNode;

      if (this.subBassNode) { lastNode.connect(this.subBassNode); lastNode = this.subBassNode; }
      if (this.lowMidNode) { lastNode.connect(this.lowMidNode); lastNode = this.lowMidNode; }
      if (this.vocalMidNode) { lastNode.connect(this.vocalMidNode); lastNode = this.vocalMidNode; }
      if (this.highMidNode) { lastNode.connect(this.highMidNode); lastNode = this.highMidNode; }
      if (this.airTrebleNode) { lastNode.connect(this.airTrebleNode); lastNode = this.airTrebleNode; }

      if (this.tapeWarmthEnabled && this.saturationNode) {
        lastNode.connect(this.saturationNode);
        lastNode = this.saturationNode;
      }

      if (this.compressorNode) {
        lastNode.connect(this.compressorNode);
        lastNode = this.compressorNode;
      }

      if (this.spatial3dEnabled && this.pannerNode) {
        lastNode.connect(this.pannerNode);
        lastNode = this.pannerNode;
      }

      if (this.masterGainNode) {
        lastNode.connect(this.masterGainNode);
        this.masterGainNode.connect(this.audioCtx.destination);
      } else {
        lastNode.connect(this.audioCtx.destination);
      }
    } catch (err) {}
  }

  private makeAnalogWarmthCurve(): Float32Array {
    const n_samples = 44100;
    const curve = new Float32Array(n_samples);
    const drive = 1.35;
    for (let i = 0; i < n_samples; ++i) {
      const x = (i * 2) / n_samples - 1;
      curve[i] = Math.tanh(drive * x);
    }
    return curve;
  }

  public applyEqPreset(preset: EqPreset) {
    this.activeEqPreset = preset;
    if (!this.audioCtx || !this.subBassNode || !this.lowMidNode || !this.vocalMidNode || !this.highMidNode || !this.airTrebleNode) return;

    const now = this.audioCtx.currentTime;
    let sub = 0, lowMid = 0, vocal = 0, highMid = 0, air = 0;

    switch (preset) {
      case 'warm-analog':
        sub = 3.5; lowMid = 2.0; vocal = 1.5; highMid = 1.0; air = -1.5;
        break;
      case 'bass-boost':
        sub = 8.0; lowMid = 4.0; vocal = 0.0; highMid = -1.0; air = -2.0;
        break;
      case 'vocal-clarity':
        sub = -2.0; lowMid = -1.0; vocal = 6.0; highMid = 4.5; air = 3.0;
        break;
      case 'eink-pure':
        sub = 3.0; lowMid = 2.5; vocal = 2.5; highMid = 2.5; air = 2.0;
        break;
      case 'flat':
      default:
        sub = 0; lowMid = 0; vocal = 0; highMid = 0; air = 0;
        break;
    }

    this.subBassNode.gain.setTargetAtTime(sub, now, 0.08);
    this.lowMidNode.gain.setTargetAtTime(lowMid, now, 0.08);
    this.vocalMidNode.gain.setTargetAtTime(vocal, now, 0.08);
    this.highMidNode.gain.setTargetAtTime(highMid, now, 0.08);
    this.airTrebleNode.gain.setTargetAtTime(air, now, 0.08);
  }

  public setTapeWarmth(enabled: boolean) {
    this.tapeWarmthEnabled = enabled;
    this.connectNodes();
  }

  public setSpatial3d(enabled: boolean) {
    this.spatial3dEnabled = enabled;
    this.connectNodes();
  }

  public getAudioStatus() {
    return this.audioStatus;
  }

  public setOutputMode(mode: string) {
    const win = window as any;
    if (win.audioAPI) {
      win.audioAPI.setOutputMode(mode);
    }
  }

  public setDirectOutput(enabled: boolean) {
    const win = window as any;
    if (win.audioAPI) {
      win.audioAPI.setDirectOutput(enabled);
    }
  }

  public setReplayGain(mode: string) {
    const win = window as any;
    if (win.audioAPI) {
      win.audioAPI.setReplayGain(mode);
    }
  }

  private crossfadeDuration: number = 3; // seconds

  public setCrossfadeDuration(sec: number) {
    this.crossfadeDuration = Math.max(0, sec);
  }

  public getCrossfadeDuration(): number {
    return this.crossfadeDuration;
  }

  private fadeOutAudio(audioEl: HTMLAudioElement, durationMs: number) {
    const startVol = audioEl.volume;
    const startTime = performance.now();

    const fadeStep = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      audioEl.volume = Math.max(0, startVol * (1 - progress));

      if (progress < 1) {
        requestAnimationFrame(fadeStep);
      } else {
        audioEl.pause();
        audioEl.src = '';
      }
    };
    requestAnimationFrame(fadeStep);
  }

  private fadeInAudio(audioEl: HTMLAudioElement, targetVol: number, durationMs: number) {
    audioEl.volume = 0;
    const startTime = performance.now();

    const fadeStep = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / durationMs);
      audioEl.volume = Math.min(targetVol, targetVol * progress);

      if (progress < 1) {
        requestAnimationFrame(fadeStep);
      }
    };
    requestAnimationFrame(fadeStep);
  }

  public loadTrack(track: Track, autoPlay: boolean = true) {
    this.stopSynth();

    const targetVol = this.isMuted ? 0 : this.volume;
    const crossfadeMs = this.crossfadeDuration * 1000;

    if (this.isPlaying && this.htmlAudio && this.currentTrack && this.currentTrack.id !== track.id && this.crossfadeDuration > 0 && crossfadeMs > 0 && track.audioUrl) {
      try {
        const outgoingAudio = new Audio(this.htmlAudio.src);
        outgoingAudio.currentTime = this.htmlAudio.currentTime;
        outgoingAudio.volume = targetVol;
        outgoingAudio.play().catch(() => {});
        this.fadeOutAudio(outgoingAudio, crossfadeMs);
      } catch (e) {}

      this.currentTrack = track;
      this.currentTime = 0;
      this.duration = track.duration || 0;
      this.notifyTimeUpdate();

      const cleanUrl = formatAudioUrl(track.audioUrl);
      this.htmlAudio.src = cleanUrl;
      this.htmlAudio.currentTime = 0;

      if (autoPlay) {
        this.isPlaying = true;
        this.notifyStateChange();
        this.htmlAudio.play().then(() => {
          this.fadeInAudio(this.htmlAudio!, targetVol, crossfadeMs);
        }).catch(() => {});
      }
      return;
    }

    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }

    this.currentTrack = track;
    this.currentTime = 0;
    this.duration = track.duration || 0;
    this.notifyTimeUpdate();

    if (autoPlay) {
      this.play();
    }
  }

  public play() {
    if (!this.currentTrack) return;
    const win = window as any;

    this.initAudioContext();
    const isResuming = !this.isPlaying && this.currentTime > 0;
    this.isPlaying = true;
    this.notifyStateChange();

    if (win.audioAPI) {
      if (isResuming && win.audioAPI.resume) {
        win.audioAPI.resume();
      } else {
        win.audioAPI.play(this.currentTrack);
      }
    }

    if (this.currentTrack.audioUrl) {
      const cleanUrl = formatAudioUrl(this.currentTrack.audioUrl);
      if (this.htmlAudio) {
        const currentSrc = this.htmlAudio.src ? decodeURIComponent(this.htmlAudio.src) : '';
        const targetSrc = decodeURIComponent(cleanUrl);
        if (!currentSrc.endsWith(targetSrc) && this.htmlAudio.src !== cleanUrl) {
          this.htmlAudio.src = cleanUrl;
        }

        const targetVol = this.isMuted ? 0 : this.volume;
        if (this.masterGainNode && this.audioCtx) {
          const now = this.audioCtx.currentTime;
          this.masterGainNode.gain.setValueAtTime(Math.max(0.001, targetVol), now);
          this.htmlAudio.volume = 1.0;
        } else {
          this.htmlAudio.volume = targetVol;
        }

        this.htmlAudio.play().catch(err => {
          this.startSynth();
          this.startTimer();
        });
      }
    } else {
      this.startSynth();
      this.startTimer();
    }
  }

  public pause() {
    this.isPlaying = false;
    this.notifyStateChange();

    const win = window as any;
    if (win.audioAPI) {
      win.audioAPI.pause();
    }

    if (this.htmlAudio) {
      this.htmlAudio.pause();
    }
    this.stopSynth();
    this.stopTimer();
  }

  public togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  public seek(seconds: number) {
    this.currentTime = Math.max(0, Math.min(seconds, this.duration || 180));
    const win = window as any;
    if (win.audioAPI) {
      win.audioAPI.seek(this.currentTime);
    }
    if (this.htmlAudio && this.currentTrack?.audioUrl) {
      try {
        this.htmlAudio.currentTime = this.currentTime;
      } catch (e) {}
    }
    this.notifyTimeUpdate();
  }

  public setVolume(normalizedVol: number) {
    const clamped = Math.max(0, Math.min(1, normalizedVol));
    this.volume = clamped;
    const targetVol = this.isMuted ? 0 : this.volume;

    const win = window as any;
    if (win.audioAPI) {
      win.audioAPI.setVolume(Math.round(targetVol * 100));
    }

    if (this.masterGainNode && this.audioCtx) {
      this.masterGainNode.gain.setValueAtTime(targetVol, this.audioCtx.currentTime);
      if (this.htmlAudio) {
        this.htmlAudio.volume = 1.0;
      }
    } else if (this.htmlAudio) {
      this.htmlAudio.volume = targetVol;
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    const targetVol = this.isMuted ? 0 : this.volume;

    const win = window as any;
    if (win.audioAPI) {
      win.audioAPI.setVolume(Math.round(targetVol * 100));
    }

    if (this.masterGainNode && this.audioCtx) {
      this.masterGainNode.gain.setValueAtTime(targetVol, this.audioCtx.currentTime);
      if (this.htmlAudio) {
        this.htmlAudio.volume = 1.0;
      }
    } else if (this.htmlAudio) {
      this.htmlAudio.volume = targetVol;
    }
  }

  private startTimer() {
    this.stopTimer();
    this.timerId = window.setInterval(() => {
      if (this.isPlaying) {
        this.currentTime += 1;
        if (this.duration > 0 && this.currentTime >= this.duration) {
          this.pause();
          this.notifyTrackEnded();
        } else {
          this.notifyTimeUpdate();
        }
      }
    }, 1000);
  }

  private stopTimer() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private startSynth() {
    this.stopSynth();
    if (!this.audioCtx || !this.currentTrack?.synthParams) return;

    const params: SynthParams = this.currentTrack.synthParams;
    const intervalMs = (60 / params.bpm) * 1000;
    let step = 0;

    const playTone = () => {
      if (!this.isPlaying || !this.audioCtx) return;

      const noteIdx = params.pattern[step % params.pattern.length];
      const semitone = params.scale[noteIdx % params.scale.length];
      const freq = params.rootFreq * Math.pow(2, semitone / 12);

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      let type: OscillatorType = 'sine';
      if (params.synthType === 'lofi') type = 'triangle';
      if (params.synthType === 'electro') type = 'sawtooth';
      if (params.synthType === 'chiptune') type = 'square';
      if (params.synthType === 'drone') type = 'sine';

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

      const currentVol = this.isMuted ? 0 : this.volume * 0.15;
      gain.gain.setValueAtTime(currentVol, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + (intervalMs / 1000) * 0.9);

      if (this.subBassNode) {
        osc.connect(gain);
        gain.connect(this.subBassNode);
      } else {
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
      }

      osc.start();
      osc.stop(this.audioCtx.currentTime + (intervalMs / 1000) * 0.9);

      step++;
    };

    playTone();
    this.synthInterval = window.setInterval(playTone, intervalMs);
  }

  private stopSynth() {
    if (this.synthInterval !== null) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
  }

  public onTimeUpdate(cb: TimeUpdateCallback) {
    this.onTimeUpdateCbs.add(cb);
    return () => this.onTimeUpdateCbs.delete(cb);
  }

  public onTrackEnded(cb: TrackEndedCallback) {
    this.onTrackEndedCbs.add(cb);
    return () => this.onTrackEndedCbs.delete(cb);
  }

  public onStateChange(cb: StateChangeCallback) {
    this.onStateChangeCbs.add(cb);
    return () => this.onStateChangeCbs.delete(cb);
  }

  private notifyTimeUpdate() {
    this.onTimeUpdateCbs.forEach(cb => cb(this.currentTime, this.duration));
  }

  private notifyTrackEnded() {
    this.onTrackEndedCbs.forEach(cb => cb());
  }

  private notifyStateChange() {
    this.onStateChangeCbs.forEach(cb => cb(this.isPlaying));
  }
}

export const audioEngine = new AudioEngine();
