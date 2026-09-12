import { describe, expect, it } from 'vitest';
import { ExperienceMachine } from './machine';

describe('ExperienceMachine', () => {
  it('accepts only legal stage transitions', () => {
    const machine = new ExperienceMachine();
    expect(machine.transition('performing', 0)).toBe(false);
    expect(machine.transition('initializing', 0)).toBe(true);
    expect(machine.transition('closed', 100)).toBe(true);
    expect(machine.transition('opening', 1400)).toBe(true);
    expect(machine.transition('performing', 2220)).toBe(true);
    expect(machine.transition('closing', 3500)).toBe(true);
    expect(machine.transition('closed', 4320)).toBe(true);
  });

  it('blocks gestures during the transition cooldown', () => {
    const machine = new ExperienceMachine();
    machine.transition('initializing', 0);
    machine.transition('closed', 100);
    expect(machine.canAcceptGesture(1299)).toBe(false);
    expect(machine.canAcceptGesture(1300)).toBe(true);
  });

  it('provides a camera error to manual recovery path', () => {
    const machine = new ExperienceMachine();
    machine.transition('initializing', 0);
    expect(machine.transition('camera-error', 20)).toBe(true);
    expect(machine.transition('manual', 30)).toBe(true);
    expect(machine.transition('initializing', 40)).toBe(true);
  });
});
