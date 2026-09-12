/// <reference lib="webworker" />

import { FilesetResolver, GestureRecognizer, type GestureRecognizerResult } from '@mediapipe/tasks-vision';
import type { GestureFrame, HandPose, Point3D } from '../types';
import { actorHandednessFromMediaPipe, averagePoints, isCrossedArms } from './gestures';

const PALM_INDICES = [0, 5, 9, 13, 17];
const workerScope = self as unknown as DedicatedWorkerGlobalScope;
let recognizer: GestureRecognizer | null = null;
let canvas: OffscreenCanvas | null = null;

type InitMessage = { type: 'init'; wasmUrl: string; modelUrl: string };
type FrameMessage = { type: 'frame'; id: number; bitmap: ImageBitmap; timestamp: number };
type CloseMessage = { type: 'close' };

function toGestureFrame(result: GestureRecognizerResult, timestamp: number): GestureFrame {
  const hands: HandPose[] = result.landmarks.map((source, index) => {
    const landmarks: Point3D[] = source.map((point) => ({ x: point.x, y: point.y, z: point.z }));
    const sourceHandedness = actorHandednessFromMediaPipe(result.handedness[index]?.[0]?.categoryName);
    const gesture = result.gestures[index]?.[0];
    return {
      sourceHandedness,
      handedness: sourceHandedness,
      gesture: gesture?.categoryName ?? 'None',
      score: gesture?.score ?? 0,
      landmarks,
      palm: averagePoints(PALM_INDICES.map((landmarkIndex) => landmarks[landmarkIndex])),
      wrist: landmarks[0],
      seenAt: timestamp,
    };
  });
  return {
    hands,
    fistCandidate: hands.some((hand) => hand.gesture === 'Closed_Fist' && hand.score >= 0.65),
    crossCandidate: isCrossedArms(hands),
    timestamp,
  };
}

workerScope.addEventListener('message', async (event: MessageEvent<InitMessage | FrameMessage | CloseMessage>) => {
  const message = event.data;
  try {
    if (message.type === 'init') {
      await import(/* @vite-ignore */ `${message.wasmUrl}/vision_wasm_module_internal.js`);
      const fileset = await FilesetResolver.forVisionTasks(message.wasmUrl);
      recognizer = await GestureRecognizer.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: message.modelUrl },
        runningMode: 'VIDEO',
        numHands: 2,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.55,
        minTrackingConfidence: 0.5,
        cannedGesturesClassifierOptions: { scoreThreshold: 0.45 },
      });
      workerScope.postMessage({ type: 'ready' });
      return;
    }
    if (message.type === 'close') {
      recognizer?.close();
      recognizer = null;
      return;
    }
    if (!recognizer) throw new Error('recognizer-not-ready');
    const started = performance.now();
    canvas ??= new OffscreenCanvas(480, 360);
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('worker-canvas-unavailable');
    context.save();
    context.setTransform(-1, 0, 0, 1, canvas.width, 0);
    context.drawImage(message.bitmap, 0, 0, canvas.width, canvas.height);
    context.restore();
    message.bitmap.close();
    const frame = toGestureFrame(recognizer.recognizeForVideo(canvas, message.timestamp), message.timestamp);
    workerScope.postMessage({ type: 'result', id: message.id, frame, inferenceMs: performance.now() - started });
  } catch (error) {
    if (message.type === 'frame') message.bitmap.close();
    workerScope.postMessage({ type: 'error', id: message.type === 'frame' ? message.id : undefined, message: error instanceof Error ? error.message : String(error) });
  }
});
