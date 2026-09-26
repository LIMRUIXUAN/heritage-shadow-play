import type { ControlSideMode, GestureFrame, VisionMetrics } from '../types';
import { mapFrameControlSides } from './gestures';

const WASM_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task';

type PendingFrame = { resolve: (frame: GestureFrame) => void; reject: (error: Error) => void; captureMs: number };

export class VisionAdapter {
  private worker: Worker | null = null;
  private workerReady: Promise<void> | null = null;
  private workerReadyState = false;
  private cancelWorkerInit: (() => void) | null = null;
  private stream: MediaStream | null = null;
  private pending: PendingFrame | null = null;
  private nextFrameId = 1;
  private startGeneration = 0;
  private controlSideMode: ControlSideMode = 'natural';
  private latestMetrics: VisionMetrics = { inferenceMs: 0, captureMs: 0, backend: 'worker' };

  get ready(): boolean { return this.workerReadyState && Boolean(this.stream) }
  get busy(): boolean { return Boolean(this.pending) }
  get metrics(): Readonly<VisionMetrics> { return this.latestMetrics }

  setControlSideMode(mode: ControlSideMode): void { this.controlSideMode = mode }

  async start(video: HTMLVideoElement): Promise<void> {
    this.stopCamera();
    const generation = this.startGeneration;
    if (!navigator.mediaDevices?.getUserMedia || typeof Worker === 'undefined' || typeof createImageBitmap === 'undefined') throw new Error('camera-or-worker-unavailable');
    try {
      const [, stream] = await Promise.all([
        this.loadWorker(),
        navigator.mediaDevices.getUserMedia({ audio: false, video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } } }).then((stream) => {
          if (generation !== this.startGeneration) {
            stream.getTracks().forEach((track) => track.stop());
            throw new Error('camera-start-cancelled');
          }
          this.stream = stream;
          return stream;
        }),
      ]);
      if (generation !== this.startGeneration) return;
      video.srcObject = stream;
      await video.play();
    } catch (error) {
      if (generation === this.startGeneration) this.close();
      throw error;
    }
  }

  async sample(video: HTMLVideoElement, timestamp: number): Promise<GestureFrame | null> {
    if (!this.worker || !this.ready || this.pending || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return null;
    const started = performance.now();
    const bitmap = await createImageBitmap(video, { resizeWidth: 480, resizeHeight: 360, resizeQuality: 'low' });
    if (!this.worker || !this.ready || this.pending) { bitmap.close(); return null }
    const id = this.nextFrameId++;
    const captureMs = performance.now() - started;
    const frame = await new Promise<GestureFrame>((resolve, reject) => {
      this.pending = { resolve, reject, captureMs };
      this.worker?.postMessage({ type: 'frame', id, bitmap, timestamp }, [bitmap]);
    });
    return this.applyControlMapping(frame);
  }

  stopCamera(): void {
    this.startGeneration += 1;
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = null;
  }

  close(): void {
    this.stopCamera();
    this.cancelWorkerInit?.();
    this.cancelWorkerInit = null;
    this.worker?.postMessage({ type: 'close' });
    this.worker?.terminate();
    this.worker = null;
    this.workerReady = null;
    this.workerReadyState = false;
    this.pending?.reject(new Error('vision-closed'));
    this.pending = null;
  }

  private loadWorker(): Promise<void> {
    if (this.workerReady) return this.workerReady;
    this.worker = new Worker(new URL('./recognizer.worker.ts', import.meta.url), { type: 'module', name: 'shadow-play-vision' });
    this.workerReady = new Promise<void>((resolve, reject) => {
      if (!this.worker) { reject(new Error('worker-unavailable')); return }
      const timeout = setTimeout(() => reject(new Error('vision-model-timeout')), 30000);
      const ready = () => { clearTimeout(timeout); this.cancelWorkerInit = null; resolve() };
      const failed = (error: Error) => { clearTimeout(timeout); this.cancelWorkerInit = null; reject(error) };
      this.cancelWorkerInit = () => failed(new Error('vision-init-cancelled'));
      this.worker.addEventListener('message', (event: MessageEvent) => {
        const message = event.data;
        if (message.type === 'ready') {
          this.workerReadyState = true;
          ready();
          return;
        }
        if (message.type === 'result' && this.pending) {
          this.latestMetrics = { inferenceMs: message.inferenceMs, captureMs: this.pending.captureMs, backend: 'worker' };
          const pending = this.pending;
          this.pending = null;
          pending.resolve(message.frame as GestureFrame);
          return;
        }
        if (message.type === 'error') {
          const error = new Error(message.message || 'vision-worker-error');
          if (this.pending) {
            const pending = this.pending;
            this.pending = null;
            pending.reject(error);
          } else failed(error);
        }
      });
      this.worker.addEventListener('error', (event) => {
        const error = new Error(event.message || 'vision-worker-crashed');
        if (this.pending) {
          const pending = this.pending;
          this.pending = null;
          pending.reject(error);
        }
        failed(error);
      });
      this.worker.postMessage({ type: 'init', wasmUrl: WASM_URL, modelUrl: MODEL_URL });
    });
    return this.workerReady;
  }

  private applyControlMapping(frame: GestureFrame): GestureFrame {
    return mapFrameControlSides(frame, this.controlSideMode);
  }
}
