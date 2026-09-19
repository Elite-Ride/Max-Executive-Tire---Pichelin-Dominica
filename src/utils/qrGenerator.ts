import QRCode from 'qrcode';

// In-memory cache to prevent re-generating identical QR codes
const qrCache = new Map<string, string>();

/**
 * Generates a data URL for a QR code pointing directly to the tyre product details page
 */
export async function generateTyreQrDataUrl(tyreId: string): Promise<string> {
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://maxexecutivetires.dm';
  const url = `${baseUrl}?tyre=${encodeURIComponent(tyreId)}`;

  if (qrCache.has(url)) {
    return qrCache.get(url)!;
  }

  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 140,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    });
    qrCache.set(url, dataUrl);
    return dataUrl;
  } catch (err) {
    console.warn('Failed to generate QR code for tyre:', tyreId, err);
    return '';
  }
}

/**
 * Returns the direct URL for a tyre details page
 */
export function getTyreProductUrl(tyreId: string): string {
  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}`
    : 'https://maxexecutivetires.dm';
  return `${baseUrl}?tyre=${encodeURIComponent(tyreId)}`;
}
