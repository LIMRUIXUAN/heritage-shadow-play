import { describe, expect, it } from 'vitest';
import type { GestureFrame, HandPose, Handedness, Point3D } from '../types';
import { ConsecutiveGate, FistCueGate, GestureStabilizer, TimedGate, actorHandednessFromMediaPipe, isCrossedArms, mapFrameControlSides, resolveControlSide } from './gestures';

const point = (x: number, y: number): Point3D => ({ x, y, z: 0 });
const hand = (handedness: Handedness, x: number, y: number, gesture = 'None', score = 0): HandPose => ({
  handedness, gesture, score, wrist: point(x, y), palm: point(x, y), landmarks: Array.from({ length: 21 }, () => point(x, y)), seenAt: 0,
});
const frame = (hands: HandPose[]): GestureFrame => ({ hands, fistCandidate: false, crossCandidate: isCrossedArms(hands), timestamp: 0 });

describe('gesture geometry', () => {
  it('converts MediaPipe image-side labels into actor-side handedness', () => {
    expect(actorHandednessFromMediaPipe('Right')).toBe('left');
    expect(actorHandednessFromMediaPipe('Left')).toBe('right');
  });

  it('recognizes an actor X after converting both reversed MediaPipe labels', () => {
    const actorLeft = hand(actorHandednessFromMediaPipe('Right'), 0.58, 0.51);
    const actorRight = hand(actorHandednessFromMediaPipe('Left'), 0.41, 0.55);
    expect(isCrossedArms([actorLeft, actorRight])).toBe(true);
  });

  it('keeps natural handedness or deliberately swaps the puppet control side', () => {
    expect(resolveControlSide('left', 'natural')).toBe('left');
    expect(resolveControlSide('right', 'natural')).toBe('right');
    expect(resolveControlSide('left', 'swapped')).toBe('right');
    expect(resolveControlSide('right', 'swapped')).toBe('left');
  });

  it('swaps only puppet assignment without changing an already detected X gesture', () => {
    const crossed = frame([hand('left', 0.58, 0.51), hand('right', 0.41, 0.55)]);
    const swapped = mapFrameControlSides(crossed, 'swapped');
    expect(swapped.hands.map((item) => item.handedness)).toEqual(['right', 'left']);
    expect(swapped.crossCandidate).toBe(true);
  });

  it('detects centered crossed wrists', () => {
    expect(isCrossedArms([hand('left', 0.58, 0.51), hand('right', 0.41, 0.55)])).toBe(true);
  });

  it('rejects uncrossed or vertically separated hands', () => {
    expect(isCrossedArms([hand('left', 0.3, 0.5), hand('right', 0.7, 0.5)])).toBe(false);
    expect(isCrossedArms([hand('left', 0.52, 0.5), hand('right', 0.48, 0.5)])).toBe(false);
    expect(isCrossedArms([hand('left', 0.58, 0.25), hand('right', 0.41, 0.7)])).toBe(false);
  });
});

describe('opening sound timing', () => {
  const fist = frame([hand('left', 0.3, 0.5, 'Closed_Fist', 0.78)]);
  const released = frame([]);

  it('sounds on the first confident fist while the curtain still waits for eight frames', () => {
    const cue = new FistCueGate();
    const stabilizer = new GestureStabilizer();
    for (let index = 0; index < 8; index += 1) {
      const input = { ...fist, timestamp: index * 66 };
      expect(cue.update(input, true)).toBe(index === 0);
      expect(stabilizer.update(input, 'closed').confirmed).toBe(index === 7);
    }
  });

  it('rejects weak fists and ignores gestures outside an active closed curtain', () => {
    const cue = new FistCueGate();
    expect(cue.update(frame([hand('left', 0.3, 0.5, 'Closed_Fist', 0.4)]), true)).toBe(false);
    expect(cue.update(fist, false)).toBe(false);
    const crossed = frame([hand('left', 0.58, 0.51), hand('right', 0.41, 0.55)]);
    expect(cue.update(crossed, true)).toBe(false);
    expect(cue.update(fist, true)).toBe(true);
  });

  it('does not replay after a brief recognition dropout', () => {
    const cue = new FistCueGate();
    expect(cue.update(fist, true)).toBe(true);
    expect(cue.update({ ...released, timestamp: 66 }, true)).toBe(false);
    expect(cue.update({ ...fist, timestamp: 132 }, true)).toBe(false);
    expect(cue.update({ ...fist, timestamp: 4000 }, true)).toBe(false);
  });

  it('rearms after releasing for half a second without forcing the curtain open', () => {
    const cue = new FistCueGate();
    const stabilizer = new GestureStabilizer();
    expect(cue.update(fist, true)).toBe(true);
    expect(stabilizer.update(fist, 'closed').confirmed).toBe(false);
    expect(cue.update({ ...released, timestamp: 100 }, true)).toBe(false);
    expect(stabilizer.update(released, 'closed').progress).toBe(0);
    const nextFist = { ...fist, timestamp: 600 };
    expect(cue.update(nextFist, true)).toBe(true);
    expect(stabilizer.update(nextFist, 'closed').confirmed).toBe(false);
  });

  it('allows a new opening sound after a state change', () => {
    const cue = new FistCueGate();
    expect(cue.update(fist, true)).toBe(true);
    cue.reset();
    expect(cue.update(fist, true)).toBe(true);
    expect(cue.update(fist, false)).toBe(false);
    expect(cue.update(fist, true)).toBe(true);
  });
});

describe('gesture stabilization', () => {
  it('requires a continuous three-second X hold and resets when released', () => {
    const gate = new TimedGate(3000);
    expect(gate.update(true, 1000)).toEqual({ progress: 0, confirmed: false });
    expect(gate.update(true, 2500).progress).toBe(0.5);
    expect(gate.update(false, 2600)).toEqual({ progress: 0, confirmed: false });
    expect(gate.update(true, 3000).progress).toBe(0);
    expect(gate.update(true, 5999).confirmed).toBe(false);
    expect(gate.update(true, 6000)).toEqual({ progress: 1, confirmed: true });
    expect(gate.update(true, 7000).confirmed).toBe(false);
  });

  it('does not confirm the closing gesture before three seconds', () => {
    const stabilizer = new GestureStabilizer();
    const crossed = frame([hand('left', 0.58, 0.51), hand('right', 0.41, 0.55)]);
    expect(stabilizer.update({ ...crossed, timestamp: 1000 }, 'performing').confirmed).toBe(false);
    expect(stabilizer.update({ ...crossed, timestamp: 3999 }, 'performing').confirmed).toBe(false);
    expect(stabilizer.update({ ...crossed, timestamp: 4000 }, 'performing')).toMatchObject({ progress: 1, confirmed: true });
  });

  it('confirms only once after eight consecutive frames', () => {
    const gate = new ConsecutiveGate();
    for (let index = 0; index < 7; index += 1) expect(gate.update(true).confirmed).toBe(false);
    expect(gate.update(true)).toEqual({ progress: 1, confirmed: true });
    expect(gate.update(true).confirmed).toBe(false);
  });

  it('resets the count when a candidate drops out', () => {
    const gate = new ConsecutiveGate();
    for (let index = 0; index < 6; index += 1) gate.update(true);
    expect(gate.update(false)).toEqual({ progress: 0, confirmed: false });
    expect(gate.update(true).progress).toBe(0.125);
  });

  it('recognizes a confident fist but rejects a weak one', () => {
    const stabilizer = new GestureStabilizer();
    const strong = frame([hand('left', 0.3, 0.5, 'Closed_Fist', 0.78)]);
    const weak = frame([hand('left', 0.3, 0.5, 'Closed_Fist', 0.4)]);
    expect(stabilizer.update(weak, 'closed').progress).toBe(0);
    expect(stabilizer.update(strong, 'closed').progress).toBe(0.125);
  });
});
