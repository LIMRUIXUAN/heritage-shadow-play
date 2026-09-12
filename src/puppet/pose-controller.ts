import type { ArmInput, GestureFrame, HandPose, PuppetPose } from '../types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const restArm = (): ArmInput => ({ x: 0, y: 0 });

export class PoseController {
  private current: PuppetPose = { left: restArm(), right: restArm(), body: { x: 0, y: 0, scale: 1 }, visible: false };
  private target: PuppetPose = structuredClone(this.current);
  private lastStep = performance.now();
  private lastSeen = { left: -Infinity, right: -Infinity };
  private manual = false;

  setVisible(visible: boolean): void { this.target.visible = visible; this.current.visible = visible }
  setManual(enabled: boolean): void { this.manual = enabled }

  ingest(frame: GestureFrame): void {
    if (this.manual) return;
    const left = frame.hands.find((hand) => hand.handedness === 'left');
    const right = frame.hands.find((hand) => hand.handedness === 'right');
    if (left) { this.target.left = this.mapArm(left, 'left'); this.lastSeen.left = frame.timestamp }
    if (right) { this.target.right = this.mapArm(right, 'right'); this.lastSeen.right = frame.timestamp }
    if (!left && frame.timestamp - this.lastSeen.left > 300) this.target.left = restArm();
    if (!right && frame.timestamp - this.lastSeen.right > 300) this.target.right = restArm();
    this.target.body = this.mapBody(left, right, frame.timestamp);
  }

  setManualControl(control: 'left' | 'body' | 'right', x: number, y: number): void {
    const input = { x: clamp(x, -1, 1), y: clamp(y, -1, 1) };
    if (control === 'body') this.target.body = { x: input.x, y: input.y, scale: 1 };
    else this.target[control] = input;
  }

  step(now: number): PuppetPose {
    const delta = Math.min(Math.max(now - this.lastStep, 0), 100);
    this.lastStep = now;
    const armAlpha = 1 - Math.exp(-delta / 95);
    const bodyAlpha = 1 - Math.exp(-delta / 130);
    this.current.left = this.smoothArm(this.current.left, this.target.left, armAlpha);
    this.current.right = this.smoothArm(this.current.right, this.target.right, armAlpha);
    this.current.body.x += (this.target.body.x - this.current.body.x) * bodyAlpha;
    this.current.body.y += (this.target.body.y - this.current.body.y) * bodyAlpha;
    this.current.body.scale += (this.target.body.scale - this.current.body.scale) * bodyAlpha;
    this.current.visible = this.target.visible;
    return this.current;
  }

  reset(): void {
    this.target.left = restArm();
    this.target.right = restArm();
    this.target.body = { x: 0, y: 0, scale: 1 };
  }

  private mapArm(hand: HandPose, side: 'left' | 'right'): ArmInput {
    const anchorX = side === 'left' ? 0.27 : 0.73;
    return {
      x: clamp((hand.palm.x - anchorX) / 0.28, -1, 1),
      y: clamp((hand.palm.y - 0.52) / 0.34, -1, 1),
    };
  }

  private mapBody(left: HandPose | undefined, right: HandPose | undefined, now: number): PuppetPose['body'] {
    if (left && right) {
      const midpointX = (left.palm.x + right.palm.x) / 2;
      const midpointY = (left.palm.y + right.palm.y) / 2;
      const distance = Math.hypot(left.palm.x - right.palm.x, left.palm.y - right.palm.y);
      return {
        x: clamp((midpointX - 0.5) / 0.34, -1, 1),
        y: clamp((midpointY - 0.5) / 0.34, -1, 1),
        scale: clamp(0.86 + ((distance - 0.18) / 0.5) * 0.28, 0.86, 1.14),
      };
    }
    const single = left ?? right;
    if (single) return { x: clamp((single.palm.x - 0.5) / 0.55, -0.72, 0.72), y: clamp((single.palm.y - 0.5) / 0.5, -0.7, 0.7), scale: 1 };
    if (now - Math.max(this.lastSeen.left, this.lastSeen.right) <= 300) return this.target.body;
    return { x: 0, y: 0, scale: 1 };
  }

  private smoothArm(current: ArmInput, target: ArmInput, alpha: number): ArmInput {
    return { x: current.x + (target.x - current.x) * alpha, y: current.y + (target.y - current.y) * alpha };
  }
}
