import { describe, expect, it } from 'vitest';
import type { GestureFrame, HandPose, Handedness, Point3D } from '../types';
import { PoseController } from './pose-controller';

const point = (x: number, y: number): Point3D => ({ x, y, z: 0 });
const hand = (handedness: Handedness, x: number, y: number, seenAt: number): HandPose => ({ handedness, gesture: 'None', score: 0, wrist: point(x, y), palm: point(x, y), landmarks: Array.from({ length: 21 }, () => point(x, y)), seenAt });
const frame = (hands: HandPose[], timestamp: number): GestureFrame => ({ hands, timestamp, fistCandidate: false, crossCandidate: false });

describe('PoseController', () => {
  it('maps two hands to arms, body translation and bounded scale', () => {
    const controller = new PoseController();
    const base = performance.now();
    controller.ingest(frame([hand('left', 0.15, 0.35, base), hand('right', 0.85, 0.65, base)], base));
    const pose = controller.step(base + 100);
    expect(pose.left.x).toBeLessThan(0);
    expect(pose.right.x).toBeGreaterThan(0);
    expect(pose.body.scale).toBeGreaterThanOrEqual(0.86);
    expect(pose.body.scale).toBeLessThanOrEqual(1.14);
  });

  it('eases a missing hand back toward rest after 300ms', () => {
    const controller = new PoseController();
    const base = performance.now();
    controller.ingest(frame([hand('left', 0.02, 0.1, base)], base));
    const active = controller.step(base + 100).left.x;
    controller.ingest(frame([], base + 401));
    let settled = active;
    for (let index = 1; index <= 8; index += 1) settled = controller.step(base + 401 + index * 100).left.x;
    expect(Math.abs(settled)).toBeLessThan(Math.abs(active));
  });

  it('accepts keyboard-friendly manual control values', () => {
    const controller = new PoseController();
    controller.setManual(true);
    controller.setManualControl('right', 2, -2);
    const pose = controller.step(performance.now() + 200);
    expect(pose.right.x).toBeLessThanOrEqual(1);
    expect(pose.right.y).toBeGreaterThanOrEqual(-1);
  });
});
