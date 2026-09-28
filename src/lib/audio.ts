// Tiny synth-based audio: no asset files needed for the placeholder build.
// Real music/SFX can replace this module later (e.g. with howler).

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let droneNodes: { osc: OscillatorNode; gain: GainNode }[] = [];
let muted = true;

function ensureCtx() {
  if (ctx) return ctx;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  ctx = new AC();
  masterGain = ctx.createGain();
  masterGain.gain.value = muted ? 0 : 0.25;
  masterGain.connect(ctx.destination);
  return ctx;
}

export function unlockAudio() {
  const c = ensureCtx();
  if (c.state === "suspended") void c.resume();
}

export function setMuted(next: boolean) {
  muted = next;
  if (masterGain && ctx) {
    masterGain.gain.setTargetAtTime(muted ? 0 : 0.25, ctx.currentTime, 0.05);
  }
}

export function blip(freq = 440, dur = 0.08, type: OscillatorType = "square") {
  if (muted) return;
  const c = ensureCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.3, c.currentTime + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  osc.connect(g);
  g.connect(masterGain!);
  osc.start();
  osc.stop(c.currentTime + dur + 0.02);
}

export const sfx = {
  step: () => blip(180 + Math.random() * 20, 0.04, "triangle"),
  select: () => blip(660, 0.09, "square"),
  confirm: () => {
    blip(523, 0.07);
    setTimeout(() => blip(784, 0.1), 70);
  },
  open: () => blip(392, 0.12, "sawtooth"),
  close: () => blip(294, 0.1, "sawtooth"),
  warp: () => {
    blip(220, 0.5, "sine");
    setTimeout(() => blip(880, 0.4, "sine"), 120);
  },
};

// Ambient drone that shifts a little per scene.
export function startDrone(baseFreq = 110) {
  stopDrone();
  const c = ensureCtx();
  [1, 1.5, 2.01].forEach((mult, i) => {
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = "sine";
    osc.frequency.value = baseFreq * mult;
    g.gain.value = 0.04 / (i + 1);
    osc.connect(g);
    g.connect(masterGain!);
    osc.start();
    droneNodes.push({ osc, gain: g });
  });
}

export function stopDrone() {
  droneNodes.forEach(({ osc }) => {
    try {
      osc.stop();
    } catch {
      /* already stopped */
    }
  });
  droneNodes = [];
}
