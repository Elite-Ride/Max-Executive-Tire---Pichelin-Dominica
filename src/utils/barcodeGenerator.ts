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

// --- UPC-A BARCODE SPECIFICATIONS & ENCODING ---

// UPC-A Left Hand (L-Code) Patterns (7 modules per digit)
const UPCA_L_CODES: string[] = [
  '0001101', // 0
  '0011001', // 1
  '0010011', // 2
  '0111101', // 3
  '0100011', // 4
  '0110001', // 5
  '0101111', // 6
  '0111011', // 7
  '0110111', // 8
  '0001011', // 9
];

// UPC-A Right Hand (R-Code) Patterns (7 modules per digit, bitwise NOT of L-codes)
const UPCA_R_CODES: string[] = [
  '1110010', // 0
  '1100110', // 1
  '1101100', // 2
  '1000010', // 3
  '1011100', // 4
  '1001110', // 5
  '1010000', // 6
  '1000100', // 7
  '1001000', // 8
  '1110100', // 9
];

/**
 * Calculates standard UPC-A Modulo 10 Check Digit for an 11-digit string.
 */
export function calculateUpcACheckDigit(elevenDigits: string): number {
  const digits = elevenDigits.replace(/\D/g, '').slice(0, 11);
  if (digits.length !== 11) return 0;

  let oddSum = 0;
  let evenSum = 0;

  for (let i = 0; i < 11; i++) {
    const d = parseInt(digits[i], 10);
    // 0-indexed: 0, 2, 4, 6, 8, 10 are odd positions (1st, 3rd, 5th, etc.)
    if (i % 2 === 0) {
      oddSum += d;
    } else {
      evenSum += d;
    }
  }

  const total = oddSum * 3 + evenSum;
  const mod = total % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * Generates a standard, valid 12-digit UPC-A barcode for any tyre product.
 * Format: 0 (System) + 84920 (Manufacturer) + XXXXX (5-Digit Tyre SKU) + C (Check Digit)
 */
export function generateTyreUpcA(tyre: {
  id?: string;
  size: string;
  barcode?: string;
  width?: number;
  rimDiameter?: number;
  aspectRatio?: number;
}): string {
  // If tyre already has a valid 12-digit barcode, verify and use it
  if (tyre.barcode && /^\d{12}$/.test(tyre.barcode.trim())) {
    const raw = tyre.barcode.trim();
    const expectedCheck = calculateUpcACheckDigit(raw.slice(0, 11));
    if (parseInt(raw[11], 10) === expectedCheck) {
      return raw;
    }
  }

  // System Number: 0 (Regular consumer / automotive retail merchandise)
  const systemDigit = '0';
  // Company / Manufacturer Prefix: 84920 (Max Executive Tires Dominica)
  const companyPrefix = '84920';

  // Build deterministic 5-digit product SKU from tyre dimensions and ID
  let skuNum = 0;
  if (tyre.width && tyre.rimDiameter) {
    skuNum = (tyre.width * 100 + Math.round(tyre.rimDiameter)) % 100000;
  } else {
    // Extract numerical digits from size (e.g. 2055516 -> 20516)
    const rawNums = tyre.size.replace(/\D/g, '');
    if (rawNums.length >= 5) {
      skuNum = parseInt(rawNums.slice(0, 5), 10);
    }
  }

  // Mix in tyre ID to ensure uniqueness for tyres of same size (e.g., brand variations)
  if (tyre.id) {
    let hash = 0;
    for (let i = 0; i < tyre.id.length; i++) {
      hash = (hash * 31 + tyre.id.charCodeAt(i)) % 10000;
    }
    skuNum = (skuNum + hash) % 100000;
  }

  const skuStr = skuNum.toString().padStart(5, '0');
  const elevenDigits = `${systemDigit}${companyPrefix}${skuStr}`;
  const checkDigit = calculateUpcACheckDigit(elevenDigits);

  return `${elevenDigits}${checkDigit}`;
}

/**
 * Formats a 12-digit UPC-A string into standard human-readable format:
 * "0 84920 20516 7"
 */
export function formatUpcA(upc: string): string {
  const digits = upc.replace(/\D/g, '');
  if (digits.length !== 12) return upc;
  return `${digits[0]} ${digits.slice(1, 6)} ${digits.slice(6, 11)} ${digits[11]}`;
}

export interface UpcAModule {
  isBar: boolean;
  isGuard: boolean;
}

/**
 * Encodes a 12-digit UPC-A string into 95 binary modules with guard flags.
 * Standard UPC-A:
 * - 3 modules Left Guard ('101')
 * - 42 modules Left 6 digits (L-codes)
 * - 5 modules Center Guard ('01010')
 * - 42 modules Right 6 digits (R-codes)
 * - 3 modules Right Guard ('101')
 * Total = 95 modules
 */
export function encodeToUpcA(upc12: string): { binary: string; modules: UpcAModule[] } {
  const digits = upc12.replace(/\D/g, '');
  if (digits.length !== 12) {
    // Return empty fallback
    return { binary: '', modules: [] };
  }

  const modules: UpcAModule[] = [];

  const addBits = (bitStr: string, isGuard: boolean) => {
    for (let i = 0; i < bitStr.length; i++) {
      modules.push({
        isBar: bitStr[i] === '1',
        isGuard,
      });
    }
  };

  // 1. Left Guard (101)
  addBits('101', true);

  // 2. First 6 digits (L-Codes)
  for (let i = 0; i < 6; i++) {
    const digit = parseInt(digits[i], 10);
    addBits(UPCA_L_CODES[digit] || '0001101', false);
  }

  // 3. Center Guard (01010)
  addBits('01010', true);

  // 4. Last 6 digits (R-Codes)
  for (let i = 6; i < 12; i++) {
    const digit = parseInt(digits[i], 10);
    addBits(UPCA_R_CODES[digit] || '1110010', false);
  }

  // 5. Right Guard (101)
  addBits('101', true);

  const binary = modules.map((m) => (m.isBar ? '1' : '0')).join('');
  return { binary, modules };
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
