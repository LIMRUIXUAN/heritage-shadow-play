import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VisionAdapter } from './adapter';

class FakeWorker {
  static instances: FakeWorker[] = [];
  listeners = new Map<string, (event: { data: unknown }) => void>();
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor() { FakeWorker.instances.push(this) }
  addEventListener(type: string, listener: (event: { data: unknown }) => void): void { this.listeners.set(type, listener) }
  send(data: unknown): void { this.listeners.get('message')?.({ data }) }
}

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done });
  return { promise, resolve };
};

describe('VisionAdapter camera lifecycle', () => {
  let getUserMedia: ReturnType<typeof vi.fn>;
  let stop: ReturnType<typeof vi.fn>;
  let stream: MediaStream;
  let video: HTMLVideoElement;
  beforeEach(() => {
    vi.useFakeTimers();
    FakeWorker.instances = [];
    stop = vi.fn();
    stream = { getTracks: () => [{ stop }] } as unknown as MediaStream;
    getUserMedia = vi.fn().mockResolvedValue(stream);
    video = { srcObject: null, play: vi.fn().mockResolvedValue(undefined) } as unknown as HTMLVideoElement;
    vi.stubGlobal('Worker', FakeWorker);
    vi.stubGlobal('createImageBitmap', vi.fn());
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });
  });
  afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() });

  it('stops a camera acquired after model loading has already failed', async () => {
    const pending = deferred<MediaStream>();
    getUserMedia.mockReturnValueOnce(pending.promise);
    const vision = new VisionAdapter();
    const result = vision.start(video).catch((error: Error) => error.message);
    FakeWorker.instances[0].send({ type: 'error', message: 'model-failed' });
    expect(await result).toBe('model-failed');
    pending.resolve(stream);
    await Promise.resolve();
    expect(stop).toHaveBeenCalledOnce();
    expect(video.srcObject).toBeNull();
    expect(vision.ready).toBe(false);
  });

  it('stops an existing stream on failure and creates a fresh worker on retry', async () => {
    const vision = new VisionAdapter();
    const result = vision.start(video).catch((error: Error) => error.message);
    await Promise.resolve();
    FakeWorker.instances[0].send({ type: 'error', message: 'model-failed' });
    await result;
    expect(stop).toHaveBeenCalledOnce();
    const retry = vision.start(video);
    FakeWorker.instances[1].send({ type: 'ready' });
    await retry;
    expect(vision.ready).toBe(true);
    expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
    vision.close();
  });

  it('does not reopen a camera after switching to manual controls', async () => {
    const pending = deferred<MediaStream>();
    getUserMedia.mockReturnValueOnce(pending.promise);
    const vision = new VisionAdapter();
    const result = vision.start(video).catch((error: Error) => error.message);
    vision.stopCamera();
    FakeWorker.instances[0].send({ type: 'ready' });
    pending.resolve(stream);
    expect(await result).toBe('camera-start-cancelled');
    expect(stop).toHaveBeenCalledOnce();
    expect(video.play).not.toHaveBeenCalled();
    vision.close();
  });

  it('times out stalled model loading and releases the camera', async () => {
    const vision = new VisionAdapter();
    const result = vision.start(video).catch((error: Error) => error.message);
    await vi.advanceTimersByTimeAsync(30000);
    expect(await result).toBe('vision-model-timeout');
    expect(stop).toHaveBeenCalledOnce();
    expect(vision.ready).toBe(false);
  });
});
