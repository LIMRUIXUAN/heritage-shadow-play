export type ExperienceState = 'landing' | 'initializing' | 'closed' | 'opening' | 'performing' | 'closing' | 'manual' | 'camera-error';
export type Handedness = 'left' | 'right';
export type ControlSideMode = 'natural' | 'swapped';
export type DebugHandFilter = 'all' | Handedness;
export type RoleName = 'sheng' | 'dan' | 'jing';
export type Language = 'zh' | 'en' | 'ms';

export interface Point3D { x: number; y: number; z: number }

export interface HandPose {
  sourceHandedness?: Handedness;
  handedness: Handedness;
  gesture: string;
  score: number;
  landmarks: Point3D[];
  palm: Point3D;
  wrist: Point3D;
  seenAt: number;
}

export interface VisionMetrics {
  inferenceMs: number;
  captureMs: number;
  backend: 'worker';
}

export interface GestureFrame {
  hands: HandPose[];
  fistCandidate: boolean;
  crossCandidate: boolean;
  timestamp: number;
}

export interface ArmInput { x: number; y: number }

export interface PuppetPose {
  left: ArmInput;
  right: ArmInput;
  body: { x: number; y: number; scale: number };
  visible: boolean;
}

export interface GestureProgress {
  action: 'fist' | 'cross' | null;
  progress: number;
  confirmed: boolean;
}
