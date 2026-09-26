import type { ArmInput, PuppetPose, RoleName } from '../types';

interface Part { crop: [number, number, number, number]; start: [number, number]; end: [number, number] }
interface ArmParts { upper: Part; fore: Part }
interface RoleLayout {
  base: { crop: [number, number, number, number]; dest: [number, number, number, number] };
  neck: [number, number];
  shoulders: [[number, number], [number, number]];
  lengths: [[number, number], [number, number]];
  rest?: [[number, number], [number, number]];
  arms: [ArmParts, ArmParts];
}

interface ArmSolution { shoulder: [number, number]; elbow: [number, number]; wrist: [number, number]; upper: number; fore: number }

const assets: Record<RoleName, string> = {
  sheng: `${import.meta.env.BASE_URL}assets/sheng-atlas.webp`,
  dan: `${import.meta.env.BASE_URL}assets/dan-atlas.webp`,
  jing: `${import.meta.env.BASE_URL}assets/jing-atlas.webp`,
};

const layouts: Record<RoleName, RoleLayout> = {
  sheng: { base: { crop: [0, 0, 530, 1024], dest: [122, 50, 402.8, 778.24] }, neck: [345, 239], shoulders: [[315.04, 263.56], [385.72, 264.32]], lengths: [[120, 110], [120, 98]], arms: [
    { upper: { crop: [680, 40, 210, 455], start: [110, 53], end: [117, 410] }, fore: { crop: [695, 530, 205, 460], start: [98, 43], end: [113, 323] } },
    { upper: { crop: [1200, 45, 220, 442], start: [94, 48], end: [82, 404] }, fore: { crop: [1090, 530, 430, 390], start: [75, 41], end: [154, 242] } },
  ] },
  dan: { base: { crop: [0, 0, 530, 1024], dest: [94.64, 50, 402.8, 778.24] }, neck: [346, 269], shoulders: [[302.88, 303.84], [397.12, 303.08]], lengths: [[120, 110], [120, 110]], arms: [
    { upper: { crop: [620, 40, 280, 450], start: [187, 51], end: [188, 400] }, fore: { crop: [690, 520, 280, 450], start: [94, 52], end: [174, 305] } },
    { upper: { crop: [1130, 40, 280, 450], start: [74, 50], end: [91, 398] }, fore: { crop: [1135, 515, 385, 470], start: [80, 59], end: [193, 260] } },
  ] },
  jing: { base: { crop: [0, 0, 620, 1024], dest: [122, 50, 471.2, 778.24] }, neck: [353, 253], shoulders: [[283.12, 308.4], [414.6, 276.48]], lengths: [[125, 110], [125, 102]], rest: [[123, -36], [45, 30]], arms: [
    { upper: { crop: [760, 50, 225, 420], start: [83, 60], end: [99, 371] }, fore: { crop: [760, 520, 190, 440], start: [84, 54], end: [105, 259] } },
    { upper: { crop: [1115, 50, 240, 420], start: [127, 59], end: [119, 372] }, fore: { crop: [1150, 465, 275, 550], start: [69, 131], end: [109, 310] } },
  ] },
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export class PuppetRig {
  private readonly context: CanvasRenderingContext2D;
  private role: RoleName = 'sheng';
  private source: HTMLCanvasElement | null = null;
  private generation = 0;

  constructor(private readonly canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('canvas-unavailable');
    this.context = context;
  }

  async load(role: RoleName): Promise<void> {
    const generation = ++this.generation;
    const image = new Image();
    image.src = assets[role];
    await image.decode();
    if (generation !== this.generation) return;
    this.role = role;
    this.source = this.prepareTexture(image);
  }

  draw(pose: PuppetPose): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (this.canvas.width !== width || this.canvas.height !== height) { this.canvas.width = width; this.canvas.height = height }
    const context = this.context;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, width, height);
    if (!this.source || !pose.visible) return;

    const fit = Math.min(width / 700, height / 900) * pose.body.scale;
    const originX = (width - 700 * fit) / 2 + pose.body.x * width * 0.12;
    const originY = (height - 900 * fit) / 2 + pose.body.y * height * 0.08;
    context.setTransform(fit, 0, 0, fit, originX, originY);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';

    const config = layouts[this.role];
    const solutions = config.shoulders.map((shoulder, index) => this.poseArm(shoulder, config.lengths[index], index, index === 0 ? pose.left : pose.right, config.rest?.[index])) as [ArmSolution, ArmSolution];
    const drawArm = (index: 0 | 1) => {
      const solution = solutions[index];
      const parts = config.arms[index];
      this.drawPart(parts.upper, solution.shoulder, solution.upper, config.lengths[index][0]);
      this.drawPart(parts.fore, solution.elbow, solution.fore, config.lengths[index][1]);
      this.drawRivet(solution.elbow, 4);
      this.drawRivet(solution.wrist, 3);
    };
    drawArm(0);
    context.drawImage(this.source, ...config.base.crop, ...config.base.dest);
    drawArm(1);
    config.shoulders.forEach((shoulder) => this.drawRivet(shoulder, 5));
  }

  private prepareTexture(image: HTMLImageElement): HTMLCanvasElement {
    const texture = document.createElement('canvas');
    texture.width = image.naturalWidth;
    texture.height = image.naturalHeight;
    const context = texture.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('texture-canvas-unavailable');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, texture.width, texture.height);
    for (let index = 0; index < pixels.data.length; index += 4) {
      const low = Math.min(pixels.data[index], pixels.data[index + 1], pixels.data[index + 2]);
      const high = Math.max(pixels.data[index], pixels.data[index + 1], pixels.data[index + 2]);
      if (low > 155 && high - low < 25) pixels.data[index + 3] = 0;
    }
    context.putImageData(pixels, 0, 0);
    return texture;
  }

  private poseArm(shoulder: [number, number], lengths: [number, number], side: number, input: ArmInput, rest?: [number, number]): ArmSolution {
    const x = clamp(input.x * 75, -75, 75);
    const y = clamp(input.y * 75, -80, 55);
    const upperDegrees = (rest ? rest[0] : side === 0 ? 123 : 57) + (side === 0 ? 1 : -1) * y * 1.05 + x * 0.6;
    const flexDegrees = (rest ? rest[1] : side === 0 ? -36 : -86) + x * 0.86 - y * 0.72;
    const upper = upperDegrees * Math.PI / 180;
    const fore = (upperDegrees + clamp(flexDegrees, -155, 135)) * Math.PI / 180;
    const elbow = this.joint(shoulder, upper, lengths[0]);
    return { shoulder, elbow, wrist: this.joint(elbow, fore, lengths[1]), upper, fore };
  }

  private joint(origin: [number, number], angle: number, length: number): [number, number] {
    return [origin[0] + Math.cos(angle) * length, origin[1] + Math.sin(angle) * length];
  }

  private drawPart(part: Part, anchor: [number, number], angle: number, length: number): void {
    if (!this.source) return;
    const [sourceX, sourceY, sourceWidth, sourceHeight] = part.crop;
    const [startX, startY] = part.start;
    const [endX, endY] = part.end;
    const originalAngle = Math.atan2(endY - startY, endX - startX);
    const scale = length / Math.hypot(endX - startX, endY - startY);
    this.context.save();
    this.context.translate(...anchor);
    this.context.rotate(angle - originalAngle);
    this.context.scale(scale, scale);
    this.context.drawImage(this.source, sourceX, sourceY, sourceWidth, sourceHeight, -startX, -startY, sourceWidth, sourceHeight);
    this.context.restore();
  }

  private drawRivet(point: [number, number], radius: number): void {
    const gradient = this.context.createRadialGradient(point[0] - radius * 0.35, point[1] - radius * 0.4, 0.3, point[0], point[1], radius);
    gradient.addColorStop(0, '#fff0b9'); gradient.addColorStop(0.35, '#d9a64e'); gradient.addColorStop(0.8, '#835325'); gradient.addColorStop(1, '#472c17');
    this.context.fillStyle = gradient;
    this.context.beginPath(); this.context.arc(point[0], point[1], radius, 0, Math.PI * 2); this.context.fill();
  }
}
