import type { ControlSideMode, DebugHandFilter, GestureFrame, HandPose, Point3D } from '../types';

const connections: Array<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];

export interface DebugDrawOptions {
  displayMirrored: boolean;
  filter: DebugHandFilter;
  sideMode: ControlSideMode;
}

const targetX = { left: 0.2, right: 0.8 };

export function drawDebugFrame(canvas: HTMLCanvasElement, frame: GestureFrame, options: DebugDrawOptions): void {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * dpr));
  const height = Math.max(1, Math.round(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height }
  const context = canvas.getContext('2d');
  if (!context) return;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  context.lineCap = 'round';
  context.lineJoin = 'round';
  const shownHands = frame.hands.filter((hand) => options.filter === 'all' || hand.handedness === options.filter);

  shownHands.forEach((hand) => drawHand(context, hand, rect.width, rect.height, options));
  drawControlLinks(context, shownHands, rect.width, rect.height, options);
  drawCrossGuide(context, frame, rect.width, rect.height, options);
}

function screenPoint(point: Point3D, width: number, height: number, mirrored: boolean): { x: number; y: number } {
  return { x: (mirrored ? point.x : 1 - point.x) * width, y: point.y * height };
}

function drawHand(context: CanvasRenderingContext2D, hand: HandPose, width: number, height: number, options: DebugDrawOptions): void {
  const color = hand.handedness === 'left' ? '#ffd36b' : '#ff8c6f';
  context.strokeStyle = color;
  context.fillStyle = '#fff4ca';
  context.lineWidth = 2;
  connections.forEach(([from, to]) => {
    const a = screenPoint(hand.landmarks[from], width, height, options.displayMirrored);
    const b = screenPoint(hand.landmarks[to], width, height, options.displayMirrored);
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  });
  hand.landmarks.forEach((point, index) => {
    const screen = screenPoint(point, width, height, options.displayMirrored);
    context.beginPath();
    context.arc(screen.x, screen.y, index === 0 ? 4 : 2.4, 0, Math.PI * 2);
    context.fill();
  });
  const palm = screenPoint(hand.palm, width, height, options.displayMirrored);
  context.fillStyle = color;
  context.beginPath();
  context.arc(palm.x, palm.y, 6, 0, Math.PI * 2);
  context.fill();
  const detected = hand.sourceHandedness ?? hand.handedness;
  const label = `${detected.toUpperCase()} → ${hand.handedness.toUpperCase()} ARM`;
  drawLabel(context, label, palm.x + 8, palm.y - 10, color, width);
}

function drawControlLinks(context: CanvasRenderingContext2D, hands: HandPose[], width: number, height: number, options: DebugDrawOptions): void {
  const controlY = height - 17;
  context.font = '700 9px ui-sans-serif, system-ui, sans-serif';
  context.textAlign = 'center';
  hands.forEach((hand) => {
    const palm = screenPoint(hand.palm, width, height, options.displayMirrored);
    const endX = targetX[hand.handedness] * width;
    const color = hand.handedness === 'left' ? '#ffd36b' : '#ff8c6f';
    context.strokeStyle = color;
    context.globalAlpha = 0.85;
    context.lineWidth = 1.5;
    context.setLineDash([5, 4]);
    context.beginPath();
    context.moveTo(palm.x, palm.y);
    context.quadraticCurveTo(palm.x, controlY - 25, endX, controlY);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = color;
    context.fillText(`${hand.handedness.toUpperCase()} ARM`, endX, controlY - 4);
  });
  if (hands.length === 2 && options.filter === 'all') {
    const a = screenPoint(hands[0].palm, width, height, options.displayMirrored);
    const b = screenPoint(hands[1].palm, width, height, options.displayMirrored);
    const midpoint = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    context.strokeStyle = '#8fe6c4';
    context.setLineDash([3, 4]);
    context.beginPath();
    context.moveTo(midpoint.x, midpoint.y);
    context.lineTo(width / 2, controlY);
    context.stroke();
    context.setLineDash([]);
    context.fillStyle = '#8fe6c4';
    context.fillText('BODY', width / 2, controlY - 4);
  }
  context.globalAlpha = 1;
  context.textAlign = 'start';
}

function drawCrossGuide(context: CanvasRenderingContext2D, frame: GestureFrame, width: number, height: number, options: DebugDrawOptions): void {
  const left = frame.hands.find((hand) => hand.handedness === 'left');
  const right = frame.hands.find((hand) => hand.handedness === 'right');
  if (!left || !right || options.filter !== 'all') return;
  const a = screenPoint(left.wrist, width, height, options.displayMirrored);
  const b = screenPoint(right.wrist, width, height, options.displayMirrored);
  context.strokeStyle = frame.crossCandidate ? '#8fe6c4' : '#ffffff66';
  context.lineWidth = frame.crossCandidate ? 4 : 2;
  context.beginPath();
  context.moveTo(a.x, a.y);
  context.lineTo(b.x, b.y);
  context.stroke();
  drawLabel(context, frame.crossCandidate ? 'X READY' : 'X NOT READY', (a.x + b.x) / 2 + 7, (a.y + b.y) / 2 - 7, context.strokeStyle as string, width);
}

function drawLabel(context: CanvasRenderingContext2D, label: string, x: number, y: number, color: string, width: number): void {
  context.font = '800 9px ui-sans-serif, system-ui, sans-serif';
  const labelWidth = context.measureText(label).width + 10;
  const safeX = Math.min(Math.max(3, x), width - labelWidth - 3);
  context.fillStyle = '#25100de6';
  context.fillRect(safeX, y - 11, labelWidth, 15);
  context.fillStyle = color;
  context.fillText(label, safeX + 5, y);
}
