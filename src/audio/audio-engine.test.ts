import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AudioEngine } from './audio-engine';

class FakeAudio {
  static last: FakeAudio;
  static instances: FakeAudio[] = [];
  src = '';
  volume = 1;
  currentTime = 0;
  loop = false;
  preload = '';
  paused = true;
  error: Error | null = null;
  load = vi.fn(() => { this.error = null });
  listeners = new Map<string, () => void>();
  play = vi.fn(async () => { this.paused = false });
  pause = vi.fn(() => { this.paused = true });
  addEventListener(event: string, listener: () => void): void { this.listeners.set(event, listener) }
  constructor(src?: string) {
    if (!src) FakeAudio.last = this;
    else this.src = src;
    FakeAudio.instances.push(this);
  }
}

describe('AudioEngine playback lifecycle', () => {
  let preferences: Map<string, string>;
  beforeEach(() => {
    preferences = new Map();
    FakeAudio.instances = [];
    vi.stubGlobal('localStorage', { getItem: (key: string) => preferences.get(key) ?? null, setItem: (key: string, value: string) => preferences.set(key, value) });
    vi.stubGlobal('Audio', FakeAudio);
  });
  afterEach(() => vi.unstubAllGlobals());

  it('requires user activation and an active experience; returning home stays silent', async () => {
    const audio = new AudioEngine();
    audio.setActive(true);
    expect(FakeAudio.last.play).not.toHaveBeenCalled();
    await audio.unlock();
    expect(audio.playbackStatus).toBe('playing');
    audio.stop();
    await audio.toggle();
    await audio.toggle();
    audio.onVisibilityChange(false);
    expect(FakeAudio.last.play).toHaveBeenCalledTimes(1);
    expect(FakeAudio.last.paused).toBe(true);
  });

  it('resumes a hidden performance but never revives one stopped while hidden', async () => {
    const audio = new AudioEngine();
    audio.setActive(true);
    await audio.unlock();
    audio.onVisibilityChange(true);
    expect(FakeAudio.last.paused).toBe(true);
    audio.onVisibilityChange(false);
    expect(FakeAudio.last.play).toHaveBeenCalledTimes(2);
    audio.onVisibilityChange(true);
    audio.stop();
    audio.onVisibilityChange(false);
    expect(FakeAudio.last.play).toHaveBeenCalledTimes(2);
  });

  it('changes tracks while preserving mute, volume and saved preferences', async () => {
    const audio = new AudioEngine();
    audio.setActive(true);
    await audio.unlock();
    audio.setVolume(0.42);
    await audio.toggle();
    await audio.selectTrack('asian-drums');
    expect(FakeAudio.last.src).toContain('assets/music/asian-drums.mp3');
    expect(FakeAudio.last.paused).toBe(true);
    const restored = new AudioEngine();
    expect(restored.selectedTrackId).toBe('asian-drums');
    expect(restored.musicVolume).toBe(0.42);
    expect(restored.soundEnabled).toBe(false);
  });

  it('reports blocked playback and recovers on a new user activation', async () => {
    const audio = new AudioEngine();
    FakeAudio.last.play.mockRejectedValueOnce(Object.assign(new Error('blocked'), { name: 'NotAllowedError' }));
    audio.setActive(true);
    await audio.unlock();
    expect(audio.playbackStatus).toBe('blocked');
    await audio.unlock();
    expect(audio.playbackStatus).toBe('playing');
    FakeAudio.last.listeners.get('error')?.();
    expect(audio.playbackStatus).toBe('error');
    FakeAudio.last.error = new Error('network');
    await audio.unlock();
    expect(FakeAudio.last.load).toHaveBeenCalledOnce();
    expect(audio.playbackStatus).toBe('playing');
  });

  it('does not publish an obsolete playback result after stopping', async () => {
    const audio = new AudioEngine();
    let rejectPlay!: (error: Error) => void;
    FakeAudio.last.play.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectPlay = reject }));
    audio.setActive(true);
    const activation = audio.unlock();
    audio.stop();
    rejectPlay(new Error('late error'));
    await activation;
    expect(audio.playbackStatus).toBe('idle');
  });

  it('works without localStorage and clamps volume controls', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('disabled') }, setItem: () => { throw new Error('disabled') } });
    const audio = new AudioEngine();
    audio.setVolume(2);
    expect(audio.musicVolume).toBe(1);
    audio.setVolume(-1);
    expect(audio.musicVolume).toBe(0);
    audio.setVolume(NaN);
    expect(audio.musicVolume).toBe(0);
  });

  it('plays distinct one-shot opening and closing recordings, ducking and restoring music', async () => {
    const audio = new AudioEngine();
    const music = FakeAudio.last;
    const opening = FakeAudio.instances.find((item) => item.src.includes('curtain-opening.mp3'))!;
    const closing = FakeAudio.instances.find((item) => item.src.includes('curtain-closing.mp3'))!;
    audio.setActive(true);
    await audio.unlock();
    await audio.playCurtainCue('opening');
    expect(opening.play).toHaveBeenCalledOnce();
    expect(opening.loop).toBe(false);
    expect(music.volume).toBeCloseTo(0.28 * 0.2);
    audio.setVolume(0.5);
    expect(music.volume).toBeCloseTo(0.1);
    await audio.playCurtainCue('closing');
    expect(opening.paused).toBe(true);
    expect(closing.play).toHaveBeenCalledOnce();
    expect(closing.loop).toBe(false);
    opening.listeners.get('ended')?.();
    expect(music.volume).toBeCloseTo(0.1);
    closing.listeners.get('ended')?.();
    expect(music.volume).toBe(0.5);
  });

  it('stops percussion on mute, page hiding and returning home without replaying it', async () => {
    const audio = new AudioEngine();
    const opening = FakeAudio.instances.find((item) => item.src.includes('curtain-opening.mp3'))!;
    audio.setActive(true);
    await audio.unlock();
    await audio.playCurtainCue('opening');
    await audio.toggle();
    expect(opening.paused).toBe(true);
    await audio.playCurtainCue('opening');
    expect(opening.play).toHaveBeenCalledTimes(1);
    await audio.toggle();
    await audio.playCurtainCue('opening');
    audio.onVisibilityChange(true);
    expect(opening.paused).toBe(true);
    audio.onVisibilityChange(false);
    expect(opening.play).toHaveBeenCalledTimes(2);
    await audio.playCurtainCue('opening');
    audio.stop();
    expect(opening.paused).toBe(true);
    await audio.playCurtainCue('opening');
    expect(opening.play).toHaveBeenCalledTimes(3);
  });

  it('restores background volume on cue failure and supports retry', async () => {
    const audio = new AudioEngine();
    const music = FakeAudio.last;
    const closing = FakeAudio.instances.find((item) => item.src.includes('curtain-closing.mp3'))!;
    audio.setActive(true);
    await audio.unlock();
    closing.play.mockRejectedValueOnce(new Error('network'));
    await audio.playCurtainCue('closing');
    expect(audio.curtainCueFailed).toBe(true);
    expect(music.volume).toBe(0.28);
    closing.error = new Error('network');
    await audio.playCurtainCue('closing');
    expect(closing.load).toHaveBeenCalledOnce();
    expect(audio.curtainCueFailed).toBe(false);
  });

  it('ignores a late cue rejection after a newer cue has started', async () => {
    const audio = new AudioEngine();
    const opening = FakeAudio.instances.find((item) => item.src.includes('curtain-opening.mp3'))!;
    audio.setActive(true);
    await audio.unlock();
    let rejectPlay!: (error: Error) => void;
    opening.play.mockImplementationOnce(() => new Promise((_resolve, reject) => { rejectPlay = reject }));
    const oldCue = audio.playCurtainCue('opening');
    await audio.playCurtainCue('closing');
    rejectPlay(new Error('obsolete'));
    await oldCue;
    expect(audio.curtainCueFailed).toBe(false);
    expect(FakeAudio.last.volume).toBeCloseTo(0.28 * 0.2);
  });
});
