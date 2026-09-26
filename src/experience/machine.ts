import type { ExperienceState } from '../types';

type Listener = (next: ExperienceState, previous: ExperienceState) => void;

const allowed: Record<ExperienceState, ExperienceState[]> = {
  landing: ['initializing', 'manual'],
  initializing: ['closed', 'camera-error', 'manual', 'landing'],
  closed: ['opening', 'manual', 'initializing', 'camera-error', 'landing'],
  opening: ['performing', 'manual', 'landing'],
  performing: ['closing', 'manual', 'camera-error', 'landing'],
  closing: ['closed', 'manual', 'landing'],
  manual: ['initializing', 'landing'],
  'camera-error': ['initializing', 'manual', 'landing'],
};

export class ExperienceMachine {
  private current: ExperienceState = 'landing';
  private listeners = new Set<Listener>();
  private cooldownUntil = 0;

  get state(): ExperienceState { return this.current }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  transition(next: ExperienceState, now = performance.now()): boolean {
    if (next === this.current || !allowed[this.current].includes(next)) return false;
    const previous = this.current;
    this.current = next;
    if (next === 'performing' || next === 'closed') this.cooldownUntil = now + 1200;
    this.listeners.forEach((listener) => listener(next, previous));
    return true;
  }

  canAcceptGesture(now: number): boolean {
    return (this.current === 'closed' || this.current === 'performing') && now >= this.cooldownUntil;
  }

  reset(): void {
    this.current = 'landing';
    this.cooldownUntil = 0;
  }
}
