export class AudioEngine {
  private context: AudioContext | null = null;
  private enabled = true;
  private wasPlayingBeforeHide = false;
  private readonly music = new Audio('/assets/theatre-music.wav');

  constructor() {
    this.music.loop = true;
    this.music.preload = 'auto';
    this.music.volume = 0.38;
  }

  get soundEnabled(): boolean { return this.enabled }

  async unlock(): Promise<void> {
    this.context ??= new AudioContext();
    if (this.context.state === 'suspended') await this.context.resume();
    if (this.enabled) await this.music.play().catch(() => undefined);
  }

  async toggle(): Promise<boolean> {
    this.enabled = !this.enabled;
    if (this.enabled) await this.unlock();
    else this.music.pause();
    return this.enabled;
  }

  playGong(): void {
    if (!this.enabled || !this.context) return;
    const context = this.context;
    const now = context.currentTime;
    const master = context.createGain();
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.34, now + 0.018);
    master.gain.exponentialRampToValueAtTime(0.0001, now + 1.85);
    master.connect(context.destination);

    [168, 243, 337, 472].forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = index < 2 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, now);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * (index % 2 ? 0.91 : 0.96), now + 1.6);
      gain.gain.value = [0.8, 0.5, 0.28, 0.16][index];
      oscillator.connect(gain).connect(master);
      oscillator.start(now + index * 0.004);
      oscillator.stop(now + 1.9);
    });

    const noiseLength = Math.floor(context.sampleRate * 0.22);
    const noiseBuffer = context.createBuffer(1, noiseLength, context.sampleRate);
    const samples = noiseBuffer.getChannelData(0);
    for (let index = 0; index < noiseLength; index += 1) samples[index] = (Math.random() * 2 - 1) * (1 - index / noiseLength);
    const noise = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const noiseGain = context.createGain();
    noise.buffer = noiseBuffer;
    filter.type = 'bandpass';
    filter.frequency.value = 920;
    filter.Q.value = 0.7;
    noiseGain.gain.setValueAtTime(0.18, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    noise.connect(filter).connect(noiseGain).connect(master);
    noise.start(now);
  }

  onVisibilityChange(hidden: boolean): void {
    if (hidden) {
      this.wasPlayingBeforeHide = !this.music.paused;
      this.music.pause();
    } else if (this.enabled && this.wasPlayingBeforeHide) {
      void this.music.play().catch(() => undefined);
    }
  }

  stop(): void { this.music.pause(); this.music.currentTime = 0 }
}
