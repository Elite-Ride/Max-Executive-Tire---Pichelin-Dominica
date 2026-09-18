/**
 * Universal Code 128 Barcode Generator & Barcode Utilities for Max Executive Tires
 * Generates exact standard Code 128 (Subset B) SVG barcode representations.
 */

// Code 128 Patterns (widths of alternating bars and spaces, 0 to 106)
const CODE128_PATTERNS: string[] = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213', // 0-9
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132', // 10-19
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211', // 20-29
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313', // 30-39
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331', // 40-49
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111', // 50-59
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214', // 60-69
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111', // 70-79
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141', // 80-89
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141', // 90-99
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112' // 100-106 (104=StartB, 106=Stop)
];

const START_B_INDEX = 104;
const STOP_INDEX = 106;

/**
 * Encodes string to Code 128 pattern of binary 1s (bars) and 0s (spaces)
 */
export function encodeToCode128(text: string): string {
  // Code 128 Subset B maps ASCII characters 32 to 127
  const validChars = text.replace(/[^\x20-\x7E]/g, '');
  if (!validChars) return '';

  const indices: number[] = [START_B_INDEX];

  for (let i = 0; i < validChars.length; i++) {
    const code = validChars.charCodeAt(i) - 32;
    indices.push(code);
  }

  // Calculate checksum
  let checksum = indices[0];
  for (let i = 1; i < indices.length; i++) {
    checksum += indices[i] * i;
  }
  const checkCharIndex = checksum % 103;
  indices.push(checkCharIndex);
  indices.push(STOP_INDEX);

  // Convert indices into binary string
  let binaryString = '';
  for (const idx of indices) {
    const pattern = CODE128_PATTERNS[idx];
    if (!pattern) continue;
    let isBar = true;
    for (let p = 0; p < pattern.length; p++) {
      const width = parseInt(pattern[p], 10);
      binaryString += (isBar ? '1' : '0').repeat(width);
      isBar = !isBar;
    }
  }

  return binaryString;
}

/**
 * Standardize Tyre Size into clean Barcode identifier
 * e.g. "205/55 R16" -> "MET-2055516"
 */
export function getTyreBarcodeValue(tyre: { size: string; id?: string; barcode?: string }): string {
  if (tyre.barcode && tyre.barcode.trim()) {
    return tyre.barcode.trim();
  }
  // Sanitize size: "205/55 R16" -> "2055516"
  const digitsOnly = tyre.size.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 6) {
    return `MET-${digitsOnly}`;
  }
  // Fallback with sanitized size characters
  const clean = tyre.size.replace(/[^0-9A-Za-z]/g, '').toUpperCase();
  return `MET-${clean || (tyre.id || 'TYRE')}`;
}

/**
 * Plays a pleasant POS retail scanner confirmation beep using Web Audio API
 */
export function playScannerBeep(isSuccess: boolean = true) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (isSuccess) {
      // Crisp high-frequency POS supermarket beep (1850 Hz)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, ctx.currentTime);
      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } else {
      // Low buzz for unknown barcode (220 Hz)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }

    // Trigger haptic vibration if supported on mobile
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(isSuccess ? 40 : [50, 50, 50]);
    }
  } catch {
    // Graceful fallback if Web Audio is restricted
  }
}
