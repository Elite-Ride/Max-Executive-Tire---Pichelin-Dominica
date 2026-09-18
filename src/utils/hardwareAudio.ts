// Web Audio API synthesized hardware sounds for POS peripherals (zero external assets needed)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

/**
 * Barcode Scanner Beep: High-pitched 1900Hz short confirmation beep
 */
export function playBarcodeBeep(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1920, ctx.currentTime);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch (err) {
    console.debug('Audio error:', err);
  }
}

/**
 * Cash Register / Drawer Kick Sound: Mechanical solenoid click followed by metallic drawer roll
 */
export function playCashDrawerKick(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Solenoid click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(180, now);
    osc1.frequency.exponentialRampToValueAtTime(40, now + 0.06);

    gain1.gain.setValueAtTime(0.35, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.06);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.06);

    // Spring / bell latch chime
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1400, now + 0.03);

    gain2.gain.setValueAtTime(0.18, now + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.03);
    osc2.stop(now + 0.35);
  } catch (err) {
    console.debug('Audio error:', err);
  }
}

/**
 * POS Machine / Card Terminal Approval Chime: Pleasant double rising tone
 */
export function playTerminalApprovedBeep(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Note 1
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5

    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.12);

    // Note 2 (higher)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1320, now + 0.14); // E6

    gain2.gain.setValueAtTime(0.22, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.35);
  } catch (err) {
    console.debug('Audio error:', err);
  }
}

/**
 * External Thermal Printer Buzz / Feed
 */
export function playPrinterFeedSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (err) {
    console.debug('Audio error:', err);
  }
}
