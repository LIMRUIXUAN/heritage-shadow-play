import { musicTrack, musicUrl } from './tracks';
import { curtainCues, curtainCueUrl, type CurtainCueKind } from './curtain-cues';

export type PlaybackStatus = 'idle' | 'playing' | 'blocked' | 'error';

const readPreference = (key: string): string | null => {
  try { return localStorage.getItem(key) } catch { return null }
};
const savePreference = (key: string, value: string): void => {
  try { localStorage.setItem(key, value) } catch { /* Private browsing may disable storage. */ }
};

export class AudioEngine {
  private enabled = readPreference('shadow-play-sound') !== 'off';
  private active = false;
  private unlocked = false;
  private hidden = false;
  private revision = 0;
  private track = musicTrack(readPreference('shadow-play-music') ?? '');
  private volume = Math.max(0, Math.min(1, Number(readPreference('shadow-play-volume') ?? '0.28') || 0));
  private status: PlaybackStatus = 'idle';
  private listener: (() => void) | null = null;
  private readonly music = new Audio();
  private readonly cueAudio = new Map<CurtainCueKind, HTMLAudioElement>();
  private currentCue: HTMLAudioElement | null = null;
  private cueRevision = 0;
  private cueError = false;

  constructor() {
    this.music.loop = true;
    this.music.preload = 'metadata';
    this.music.volume = this.volume;
    this.music.src = musicUrl(this.track);
    this.music.addEventListener('error', () => this.setStatus('error'));
    for (const cue of curtainCues) {
      const audio = new Audio(curtainCueUrl(cue.file));
      audio.preload = 'auto';
      audio.volume = 0.7;
      audio.loop = false;
      audio.addEventListener('ended', () => {
        if (this.currentCue === audio) this.stopCue();
      });
      audio.addEventListener('error', () => {
        if (this.currentCue !== audio) return;
        this.stopCue();
        this.cueError = true;
        this.listener?.();
      });
      this.cueAudio.set(cue.kind as CurtainCueKind, audio);
    }
  }

  get soundEnabled(): boolean { return this.enabled }
  get selectedTrackId(): string { return this.track.id }
  get musicVolume(): number { return this.volume }
  get playbackStatus(): PlaybackStatus { return this.status }
  get curtainCueFailed(): boolean { return this.cueError }

  onChange(listener: () => void): void { this.listener = listener }

  private setStatus(status: PlaybackStatus): void {
    this.status = status;
    this.listener?.();
  }

  private async playMusic(): Promise<void> {
    if (!this.enabled || !this.active || !this.unlocked || this.hidden) return;
    const revision = this.revision;
    try {
      await this.music.play();
      if (revision === this.revision) this.setStatus('playing');
    } catch (error) {
      if (revision !== this.revision || (error instanceof Error && error.name === 'AbortError')) return;
      this.setStatus(error instanceof Error && error.name === 'NotAllowedError' ? 'blocked' : 'error');
    }
  }

  async unlock(): Promise<void> {
    this.unlocked = true;
    if (this.music.error) this.music.load();
    await this.playMusic();
  }

  setActive(active: boolean): void {
    this.active = active;
    if (active) void this.playMusic();
    else this.stop();
  }

  async selectTrack(id: string): Promise<void> {
    this.revision += 1;
    this.music.pause();
    this.track = musicTrack(id);
    this.music.src = musicUrl(this.track);
    this.setStatus('idle');
    savePreference('shadow-play-music', this.track.id);
    await this.unlock();
  }

  setVolume(volume: number): void {
    if (!Number.isFinite(volume)) return;
    this.volume = Math.max(0, Math.min(1, volume));
    this.music.volume = this.volume * (this.currentCue ? 0.2 : 1);
    savePreference('shadow-play-volume', String(this.volume));
    this.listener?.();
  }

  async toggle(): Promise<boolean> {
    this.enabled = !this.enabled;
    savePreference('shadow-play-sound', this.enabled ? 'on' : 'off');
    if (this.enabled) await this.unlock();
    else { this.revision += 1; this.music.pause(); this.stopCue(); this.setStatus('idle') }
    return this.enabled;
  }

  async playCurtainCue(kind: CurtainCueKind): Promise<void> {
    if (!this.enabled || !this.active || !this.unlocked || this.hidden) return;
    const cue = this.cueAudio.get(kind);
    if (!cue) return;
    this.stopCue();
    const revision = this.cueRevision;
    this.currentCue = cue;
    this.cueError = false;
    if (cue.error) cue.load();
    cue.currentTime = 0;
    this.music.volume = this.volume * 0.2;
    this.listener?.();
    try { await cue.play() }
    catch (error) {
      if (revision !== this.cueRevision) return;
      this.stopCue();
      if (error instanceof Error && error.name === 'AbortError') return;
      this.cueError = true;
      this.listener?.();
    }
  }

  private stopCue(): void {
    this.cueRevision += 1;
    if (this.currentCue) {
      this.currentCue.pause();
      this.currentCue.currentTime = 0;
    }
    this.currentCue = null;
    this.music.volume = this.volume;
    this.listener?.();
  }

  onVisibilityChange(hidden: boolean): void {
    this.hidden = hidden;
    if (hidden) {
      this.revision += 1;
      this.music.pause();
      this.stopCue();
      this.setStatus('idle');
    } else void this.playMusic();
  }

  stop(): void {
    this.active = false;
    this.revision += 1;
    this.music.pause();
    this.stopCue();
    this.music.currentTime = 0;
    this.setStatus('idle');
  }
}
