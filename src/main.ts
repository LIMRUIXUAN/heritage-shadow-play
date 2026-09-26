import { AudioEngine } from './audio/audio-engine';
import { musicTracks } from './audio/tracks';
import { ExperienceMachine } from './experience/machine';
import { applyLanguage, t } from './i18n';
import { PoseController } from './puppet/pose-controller';
import { PuppetRig } from './puppet/rig';
import type { ControlSideMode, DebugHandFilter, ExperienceState, GestureFrame, Language, RoleName } from './types';
import { VisionAdapter } from './vision/adapter';
import { drawDebugFrame } from './vision/debug-renderer';
import { FistCueGate, GestureStabilizer } from './vision/gestures';

const element = <T extends Element>(selector: string): T => {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Missing element: ${selector}`);
  return found;
};

const experience = element<HTMLElement>('#experience');
const video = element<HTMLVideoElement>('#cameraVideo');
const puppetCanvas = element<HTMLCanvasElement>('#puppetCanvas');
const debugCanvas = element<HTMLCanvasElement>('#debugCanvas');
const cameraPreview = element<HTMLElement>('#cameraPreview');
const manualControls = element<HTMLElement>('#manualControls');
const retryButton = element<HTMLButtonElement>('#retryButton');
const modeButton = element<HTMLButtonElement>('#modeButton');
const statusText = element<HTMLElement>('#statusText');
const cue = element<HTMLElement>('#gestureCue');
const cueGlyph = element<HTMLElement>('#cueGlyph');
const cueTitle = element<HTMLElement>('#cueTitle');
const cueDetail = element<HTMLElement>('#cueDetail');
const cueProgress = element<HTMLElement>('#cueProgress');
const soundButton = element<HTMLButtonElement>('#soundButton');
const soundIcon = element<HTMLElement>('#soundIcon');
const musicSelect = element<HTMLSelectElement>('#musicSelect');
const musicVolume = element<HTMLInputElement>('#musicVolume');
const musicVolumeValue = element<HTMLOutputElement>('#musicVolumeValue');
const musicStatus = element<HTMLElement>('#musicStatus');
const debugButton = element<HTMLButtonElement>('#debugButton');
const mirrorButton = element<HTMLButtonElement>('#mirrorButton');
const debugHandSelect = element<HTMLSelectElement>('#debugHandSelect');
const controlSideSelect = element<HTMLSelectElement>('#controlSideSelect');
const inferenceRate = element<HTMLElement>('#inferenceRate');
const inferenceLatency = element<HTMLElement>('#inferenceLatency');
const renderRate = element<HTMLElement>('#renderRate');
const mappingSummary = element<HTMLElement>('#mappingSummary');
const gongFlash = element<HTMLElement>('#gongFlash');
const dialog = element<HTMLDialogElement>('#knowledgeDialog');

const machine = new ExperienceMachine();
const vision = new VisionAdapter();
const audio = new AudioEngine();
const poses = new PoseController();
const rig = new PuppetRig(puppetCanvas);
const stabilizer = new GestureStabilizer();
const fistCue = new FistCueGate();

let language = initialLanguage();
let debugVisible = false;
let previewMirrored = true;
let debugHandFilter: DebugHandFilter = 'all';
let controlSideMode: ControlSideMode = 'natural';
let currentFrame: GestureFrame = { hands: [], fistCandidate: false, crossCandidate: false, timestamp: 0 };
let lastInferenceAt = -Infinity;
let inferenceSamples = 0;
let inferenceWindowStarted = performance.now();
let renderSamples = 0;
let renderWindowStarted = performance.now();
let animationFrame = 0;
let transitionTimer = 0;
let visionFailureHandled = false;
let cameraStartRequest = 0;

void rig.load('sheng').catch(() => setStatus('cameraError'));
applyLanguage(language);

machine.subscribe((next) => {
  experience.dataset.state = next;
  audio.setActive(next !== 'landing');
  experience.dataset.mode = next === 'manual' || next === 'camera-error' ? 'manual' : 'camera';
  experience.dataset.curtain = ['opening', 'performing', 'manual', 'camera-error'].includes(next) ? 'open' : 'closed';
  poses.setManual(next === 'manual' || next === 'camera-error');
  poses.setVisible(['opening', 'performing', 'closing', 'manual', 'camera-error'].includes(next));
  if (next === 'closed') poses.reset();
  stabilizer.reset();
  fistCue.reset();
  updateInterface(next);
});

function initialLanguage(): Language {
  let saved: string | null = null;
  try { saved = localStorage.getItem('shadow-play-language') } catch { /* Storage is optional. */ }
  if (saved === 'zh' || saved === 'en' || saved === 'ms') return saved;
  if (navigator.language.toLowerCase().startsWith('ms')) return 'ms';
  if (navigator.language.toLowerCase().startsWith('en')) return 'en';
  return 'zh';
}

function setStatus(key: string): void { statusText.textContent = t(language, key) }

function updateInterface(state = machine.state): void {
  const stateKeys: Record<ExperienceState, string> = {
    landing: 'landingStatus', initializing: 'initializing', closed: 'closed', opening: 'opening', performing: 'performing', closing: 'closing', manual: 'manual', 'camera-error': 'cameraError',
  };
  setStatus(stateKeys[state]);
  cue.hidden = !['closed', 'performing'].includes(state);
  if (state === 'closed') {
    cueGlyph.textContent = '拳';
    cueTitle.textContent = t(language, 'makeFist');
    cueDetail.textContent = t(language, 'fistDetail');
  } else if (state === 'performing') {
    cueGlyph.textContent = '叉';
    cueTitle.textContent = t(language, 'crossHands');
    cueDetail.textContent = detailForHands(currentFrame.hands.length);
  }
  cueProgress.style.transform = 'scaleX(0)';
  manualControls.hidden = state !== 'manual' && state !== 'camera-error';
  retryButton.hidden = state !== 'camera-error';
  modeButton.textContent = t(language, state === 'manual' || state === 'camera-error' ? 'cameraMode' : 'manualMode');
  debugButton.disabled = !vision.ready;
  cameraPreview.hidden = !(debugVisible && vision.ready && !['landing', 'manual', 'camera-error'].includes(state));
  updateDebugControls();
  updateSoundButton();
}

function updateDebugControls(): void {
  mirrorButton.setAttribute('aria-pressed', String(previewMirrored));
  mirrorButton.textContent = t(language, previewMirrored ? 'mirrorView' : 'cameraView');
  video.classList.toggle('is-unmirrored', !previewMirrored);
  debugHandSelect.value = debugHandFilter;
  controlSideSelect.value = controlSideMode;
  updateMappingSummary();
}

function updateMappingSummary(): void {
  if (!currentFrame.hands.length) { mappingSummary.textContent = t(language, 'waitingHands'); return }
  mappingSummary.textContent = currentFrame.hands.map((hand) => {
    const detected = hand.sourceHandedness ?? hand.handedness;
    const key = `${detected}Controls${hand.handedness[0].toUpperCase()}${hand.handedness.slice(1)}`;
    return t(language, key);
  }).join(' · ');
}

function detailForHands(count: number): string {
  if (count <= 0) return t(language, 'noHands');
  if (count === 1) return t(language, 'oneHand');
  return t(language, 'crossDetail');
}

async function startCamera(): Promise<void> {
  window.clearTimeout(transitionTimer);
  visionFailureHandled = false;
  if (!machine.transition('initializing')) return;
  const request = ++cameraStartRequest;
  try {
    await vision.start(video);
    if (request !== cameraStartRequest || machine.state !== 'initializing') return;
    machine.transition('closed');
  } catch (error) {
    console.warn('Camera or MediaPipe initialization failed', error);
    if (request === cameraStartRequest && machine.state === 'initializing') machine.transition('camera-error');
  }
}

function enterManual(): void {
  if (!machine.transition('manual')) return;
  cameraStartRequest += 1;
  window.clearTimeout(transitionTimer);
  vision.stopCamera();
}

function openCurtain(now: number): void {
  if (!machine.transition('opening', now)) return;
  gongFlash.classList.remove('is-active');
  void gongFlash.offsetWidth;
  gongFlash.classList.add('is-active');
  transitionTimer = window.setTimeout(() => {
    if (machine.state === 'opening') machine.transition('performing');
  }, 820);
}

function closeCurtain(now: number): void {
  if (!machine.transition('closing', now)) return;
  void audio.playCurtainCue('closing');
  transitionTimer = window.setTimeout(() => {
    if (machine.state === 'closing') machine.transition('closed');
  }, 820);
}

function returnHome(): void {
  cameraStartRequest += 1;
  window.clearTimeout(transitionTimer);
  vision.stopCamera();
  audio.stop();
  debugVisible = false;
  debugButton.setAttribute('aria-pressed', 'false');
  poses.reset();
  if (!machine.transition('landing')) machine.reset();
  experience.dataset.state = 'landing';
  experience.dataset.curtain = 'closed';
  updateInterface('landing');
  element<HTMLButtonElement>('#enterButton').focus();
}

function handleGestureFrame(frame: GestureFrame, now: number): void {
  currentFrame = frame;
  poses.ingest(frame);
  if (debugVisible) drawDebugFrame(debugCanvas, frame, { displayMirrored: previewMirrored, filter: debugHandFilter, sideMode: controlSideMode });
  updateMappingSummary();
  if (machine.state === 'performing') cueDetail.textContent = detailForHands(frame.hands.length);
  const activeState = machine.canAcceptGesture(now) ? machine.state === 'closed' ? 'closed' : 'performing' : 'inactive';
  if (fistCue.update(frame, activeState === 'closed')) void audio.playCurtainCue('opening');
  const result = stabilizer.update(frame, activeState);
  cueProgress.style.transform = `scaleX(${result.progress.toFixed(3)})`;
  if (machine.state === 'performing' && frame.crossCandidate) {
    const seconds = Math.max(0, Math.ceil((1 - result.progress) * 3));
    cueDetail.textContent = t(language, 'holdingCross').replace('{seconds}', String(seconds));
  }
  if (!result.confirmed) return;
  if (result.action === 'fist') openCurtain(now);
  if (result.action === 'cross') closeCurtain(now);
}

function updateInferenceRate(now: number): void {
  inferenceSamples += 1;
  const elapsed = now - inferenceWindowStarted;
  if (elapsed < 1000) return;
  inferenceRate.textContent = String(Math.round(inferenceSamples * 1000 / elapsed));
  inferenceLatency.textContent = String(Math.round(vision.metrics.inferenceMs));
  inferenceSamples = 0;
  inferenceWindowStarted = now;
}

function updateRenderRate(now: number): void {
  renderSamples += 1;
  const elapsed = now - renderWindowStarted;
  if (elapsed < 1000) return;
  renderRate.textContent = String(Math.round(renderSamples * 1000 / elapsed));
  renderSamples = 0;
  renderWindowStarted = now;
}

function handleVisionFailure(error: unknown): void {
  console.warn('Gesture recognition failed', error);
  if (visionFailureHandled || !['closed', 'performing'].includes(machine.state)) return;
  visionFailureHandled = true;
  vision.stopCamera();
  machine.transition('camera-error');
}

function requestInference(now: number): void {
  lastInferenceAt = now;
  void vision.sample(video, now).then((frame) => {
    if (!frame || !['closed', 'performing'].includes(machine.state)) return;
    const completedAt = performance.now();
    handleGestureFrame(frame, completedAt);
    updateInferenceRate(completedAt);
  }).catch(handleVisionFailure);
}

function loop(now: number): void {
  if (!document.hidden && vision.ready && !vision.busy && (machine.state === 'closed' || machine.state === 'performing') && now - lastInferenceAt >= 66) requestInference(now);
  rig.draw(poses.step(now));
  updateRenderRate(now);
  animationFrame = requestAnimationFrame(loop);
}

function updateSoundButton(): void {
  soundIcon.textContent = audio.soundEnabled ? '声' : '默';
  soundButton.setAttribute('aria-pressed', String(audio.soundEnabled));
  soundButton.setAttribute('aria-label', t(language, audio.soundEnabled ? 'soundOn' : 'soundOff'));
  musicSelect.value = audio.selectedTrackId;
  musicVolume.value = String(Math.round(audio.musicVolume * 100));
  musicVolumeValue.value = `${musicVolume.value}%`;
  musicVolume.setAttribute('aria-valuetext', `${musicVolume.value}%`);
  musicStatus.hidden = !audio.soundEnabled || (!audio.curtainCueFailed && !['blocked', 'error'].includes(audio.playbackStatus));
  musicStatus.textContent = t(language, audio.curtainCueFailed ? 'cueError' : audio.playbackStatus === 'blocked' ? 'musicBlocked' : 'musicError');
}

musicSelect.replaceChildren(...musicTracks.map((track) => {
  const option = document.createElement('option');
  option.value = track.id;
  option.textContent = track.title;
  return option;
}));
audio.onChange(updateSoundButton);
musicSelect.addEventListener('change', () => { void audio.selectTrack(musicSelect.value) });
musicVolume.addEventListener('input', () => audio.setVolume(Number(musicVolume.value) / 100));
for (const kind of ['opening', 'closing'] as const) {
  element<HTMLButtonElement>(`#preview${kind === 'opening' ? 'Opening' : 'Closing'}Cue`).addEventListener('click', () => {
    void audio.unlock().then(() => audio.playCurtainCue(kind));
  });
}
element<HTMLButtonElement>('#musicCreditsButton').addEventListener('click', () => {
  dialog.showModal();
  element<HTMLElement>('#musicCreditsHeading').focus();
});

element<HTMLButtonElement>('#enterButton').addEventListener('click', () => { void audio.unlock(); void startCamera() });
element<HTMLButtonElement>('#manualEntryButton').addEventListener('click', () => { void audio.unlock(); enterManual() });
element<HTMLButtonElement>('#homeButton').addEventListener('click', returnHome);
retryButton.addEventListener('click', () => { void audio.unlock(); void startCamera() });
modeButton.addEventListener('click', () => {
  if (machine.state === 'manual' || machine.state === 'camera-error') { void startCamera(); return }
  enterManual();
});

soundButton.addEventListener('click', async () => { await audio.toggle(); updateSoundButton() });
debugButton.addEventListener('click', () => {
  debugVisible = !debugVisible;
  debugButton.setAttribute('aria-pressed', String(debugVisible));
  cameraPreview.hidden = !(debugVisible && vision.ready);
  if (debugVisible) drawDebugFrame(debugCanvas, currentFrame, { displayMirrored: previewMirrored, filter: debugHandFilter, sideMode: controlSideMode });
});

mirrorButton.addEventListener('click', () => {
  previewMirrored = !previewMirrored;
  updateDebugControls();
  drawDebugFrame(debugCanvas, currentFrame, { displayMirrored: previewMirrored, filter: debugHandFilter, sideMode: controlSideMode });
});

debugHandSelect.addEventListener('change', () => {
  debugHandFilter = debugHandSelect.value as DebugHandFilter;
  drawDebugFrame(debugCanvas, currentFrame, { displayMirrored: previewMirrored, filter: debugHandFilter, sideMode: controlSideMode });
});

controlSideSelect.addEventListener('change', () => {
  controlSideMode = controlSideSelect.value as ControlSideMode;
  vision.setControlSideMode(controlSideMode);
  updateDebugControls();
});

document.querySelectorAll<HTMLButtonElement>('.role-button').forEach((button) => {
  button.addEventListener('click', async () => {
    const role = button.dataset.role as RoleName;
    document.querySelectorAll<HTMLButtonElement>('.role-button').forEach((candidate) => {
      const active = candidate === button;
      candidate.classList.toggle('is-active', active);
      candidate.setAttribute('aria-pressed', String(active));
    });
    await rig.load(role).catch(() => setStatus('cameraError'));
  });
});

document.querySelectorAll<HTMLButtonElement>('[data-language]').forEach((button) => {
  button.addEventListener('click', () => {
    language = button.dataset.language as Language;
    try { localStorage.setItem('shadow-play-language', language) } catch { /* Storage is optional. */ }
    applyLanguage(language);
    updateInterface();
  });
});

element<HTMLButtonElement>('#knowledgeButton').addEventListener('click', () => dialog.showModal());
element<HTMLButtonElement>('#closeKnowledgeButton').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close() });

type ManualValue = { x: number; y: number };
const manualValues = new Map<'left' | 'body' | 'right', ManualValue>([['left', { x: 0, y: 0 }], ['body', { x: 0, y: 0 }], ['right', { x: 0, y: 0 }]]);
document.querySelectorAll<HTMLButtonElement>('.manual-handle').forEach((handle) => {
  const control = handle.dataset.control as 'left' | 'body' | 'right';
  const pad = handle.closest<HTMLElement>('.manual-pad');
  if (!pad) return;
  const setValue = (x: number, y: number) => {
    const value = { x: Math.max(-1, Math.min(1, x)), y: Math.max(-1, Math.min(1, y)) };
    manualValues.set(control, value);
    handle.style.transform = `translate(${(value.x * 18).toFixed(1)}px, ${(value.y * 18).toFixed(1)}px)`;
    poses.setManualControl(control, value.x, value.y);
  };
  const move = (event: PointerEvent) => {
    if (!handle.hasPointerCapture(event.pointerId)) return;
    const rect = pad.getBoundingClientRect();
    setValue((event.clientX - (rect.left + rect.width / 2)) / (rect.width * 0.32), (event.clientY - (rect.top + rect.height / 2)) / (rect.height * 0.32));
  };
  handle.addEventListener('pointerdown', (event) => { handle.setPointerCapture(event.pointerId); move(event) });
  handle.addEventListener('pointermove', move);
  handle.addEventListener('keydown', (event) => {
    const value = manualValues.get(control) ?? { x: 0, y: 0 };
    if (event.key === 'Home') { event.preventDefault(); setValue(0, 0); return }
    const delta = event.shiftKey ? 0.2 : 0.08;
    const directions: Record<string, ManualValue> = { ArrowLeft: { x: -delta, y: 0 }, ArrowRight: { x: delta, y: 0 }, ArrowUp: { x: 0, y: -delta }, ArrowDown: { x: 0, y: delta } };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    setValue(value.x + direction.x, value.y + direction.y);
  });
});

document.addEventListener('visibilitychange', () => audio.onVisibilityChange(document.hidden));
window.addEventListener('beforeunload', () => { cancelAnimationFrame(animationFrame); vision.close() });

updateInterface('landing');
animationFrame = requestAnimationFrame(loop);
