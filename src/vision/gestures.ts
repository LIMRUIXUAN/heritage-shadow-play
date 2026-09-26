import type { ControlSideMode, GestureFrame, GestureProgress, Handedness, HandPose, Point3D } from '../types';

export const REQUIRED_GESTURE_FRAMES = 8;
export const FIST_CONFIDENCE = 0.65;
export const CROSS_HOLD_MS = 3000;

export function actorHandednessFromMediaPipe(value?: string): Handedness {
  const imageSide: Handedness = value?.toLowerCase() === 'right' ? 'right' : 'left';
  return imageSide === 'left' ? 'right' : 'left';
}

export function resolveControlSide(detected: Handedness, mode: ControlSideMode): Handedness {
  if (mode === 'natural') return detected;
  return detected === 'left' ? 'right' : 'left';
}

export function mapFrameControlSides(frame: GestureFrame, mode: ControlSideMode): GestureFrame {
  const hands = frame.hands.map((hand) => {
    const sourceHandedness = hand.sourceHandedness ?? hand.handedness;
    return { ...hand, sourceHandedness, handedness: resolveControlSide(sourceHandedness, mode) };
  });
  return { ...frame, hands };
}

export function averagePoints(points: Point3D[]): Point3D {
  const total = points.reduce((sum, point) => ({ x: sum.x + point.x, y: sum.y + point.y, z: sum.z + point.z }), { x: 0, y: 0, z: 0 });
  const count = Math.max(points.length, 1);
  return { x: total.x / count, y: total.y / count, z: total.z / count };
}

export function isCrossedArms(hands: HandPose[]): boolean {
  const left = hands.find((hand) => hand.handedness === 'left');
  const right = hands.find((hand) => hand.handedness === 'right');
  if (!left || !right) return false;
  const horizontalCross = left.wrist.x >= 0.55 && right.wrist.x <= 0.45 && left.wrist.x - right.wrist.x >= 0.14;
  const verticalAlignment = Math.abs(left.wrist.y - right.wrist.y) <= 0.16;
  const midpointX = (left.wrist.x + right.wrist.x) / 2;
  const midpointY = (left.wrist.y + right.wrist.y) / 2;
  const centered = midpointX >= 0.32 && midpointX <= 0.68 && midpointY >= 0.24 && midpointY <= 0.78;
  const distance = Math.hypot(left.wrist.x - right.wrist.x, left.wrist.y - right.wrist.y);
  return horizontalCross && verticalAlignment && centered && distance >= 0.14 && distance <= 0.5;
}

export function isClosedFist(frame: GestureFrame): boolean {
  return frame.hands.some((hand) => hand.gesture === 'Closed_Fist' && hand.score >= FIST_CONFIDENCE);
}

// Sound responds immediately; curtain movement still uses the stability gate.
export class FistCueGate {
  private latched = false;
  private releasedAt: number | null = null;

  update(frame: GestureFrame, active: boolean): boolean {
    if (!active) {
      this.reset();
      return false;
    }
    if (!isClosedFist(frame)) {
      this.releasedAt ??= frame.timestamp;
      return false;
    }
    if (this.releasedAt !== null && frame.timestamp - this.releasedAt >= 500) this.latched = false;
    this.releasedAt = null;
    if (this.latched) return false;
    this.latched = true;
    return true;
  }

  reset(): void { this.latched = false; this.releasedAt = null }
}

export class ConsecutiveGate {
  private count = 0;
  private latched = false;

  constructor(private readonly required = REQUIRED_GESTURE_FRAMES) {}

  update(hit: boolean): { progress: number; confirmed: boolean } {
    if (!hit) {
      this.count = 0;
      this.latched = false;
      return { progress: 0, confirmed: false };
    }
    if (this.latched) return { progress: 1, confirmed: false };
    this.count += 1;
    if (this.count >= this.required) {
      this.latched = true;
      return { progress: 1, confirmed: true };
    }
    return { progress: this.count / this.required, confirmed: false };
  }

  reset(): void { this.count = 0; this.latched = false }
}

export class TimedGate {
  private startedAt: number | null = null;
  private latched = false;

  constructor(private readonly holdMs: number) {}

  update(hit: boolean, now: number): { progress: number; confirmed: boolean } {
    if (!hit) {
      this.reset();
      return { progress: 0, confirmed: false };
    }
    if (this.latched) return { progress: 1, confirmed: false };
    if (this.startedAt === null) {
      this.startedAt = now;
      return { progress: 0, confirmed: false };
    }
    const progress = Math.min(1, Math.max(0, (now - this.startedAt) / this.holdMs));
    if (progress >= 1) {
      this.latched = true;
      return { progress: 1, confirmed: true };
    }
    return { progress, confirmed: false };
  }

  reset(): void { this.startedAt = null; this.latched = false }
}

export class GestureStabilizer {
  private readonly fist = new ConsecutiveGate();
  private readonly cross = new TimedGate(CROSS_HOLD_MS);

  update(frame: GestureFrame, state: 'closed' | 'performing' | 'inactive'): GestureProgress {
    if (state === 'closed') {
      this.cross.reset();
      return { action: 'fist', ...this.fist.update(isClosedFist(frame)) };
    }
    if (state === 'performing') {
      this.fist.reset();
      return { action: 'cross', ...this.cross.update(frame.crossCandidate, frame.timestamp) };
    }
    this.reset();
    return { action: null, progress: 0, confirmed: false };
  }

  reset(): void { this.fist.reset(); this.cross.reset() }
}
