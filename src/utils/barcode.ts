// Barcode generator and visual rendering utility
// Supports EAN-13 (Korean retail format 880xxxxxxxxx) and Code-128 patterns

/**
 * Calculates EAN-13 check digit
 */
export function calculateEAN13Checksum(digits12: string): number {
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(digits12[i], 10) || 0;
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const mod = sum % 10;
  return mod === 0 ? 0 : 10 - mod;
}

/**
 * Generates a realistic Korean K-Pop Retail EAN-13 barcode starting with 880
 */
export function generateRandomBarcode(prefix = '880'): string {
  // Korean goods usually start with 8809 or 8804
  const cleanPrefix = prefix.slice(0, 4) || '8809';
  let middle = '';
  for (let i = 0; i < 12 - cleanPrefix.length; i++) {
    middle += Math.floor(Math.random() * 10).toString();
  }
  const first12 = cleanPrefix + middle;
  const checksum = calculateEAN13Checksum(first12);
  return first12 + checksum.toString();
}

/**
 * Validates a barcode string
 */
export function isValidBarcode(barcode: string): boolean {
  if (!barcode) return false;
  const trimmed = barcode.trim();
  // Valid if 8-14 digits or alphanumeric SKU with at least 4 chars
  return /^[0-9A-Za-z\-_]{4,20}$/.test(trimmed);
}

/**
 * Checks if a string is a valid EAN-13 barcode with correct check digit
 */
export function isEAN13(barcode: string): boolean {
  if (!barcode) return false;
  const clean = barcode.replace(/\s+/g, '');
  if (!/^\d{13}$/.test(clean)) return false;
  const calculated = calculateEAN13Checksum(clean.slice(0, 12));
  return calculated === parseInt(clean[12], 10);
}

/**
 * Formats a 13-digit EAN barcode for standard retail readability: e.g. 8 809969 440011
 */
export function formatBarcode(barcode: string): string {
  if (!barcode) return '';
  const clean = barcode.replace(/\s+/g, '');
  if (clean.length === 13) {
    return `${clean[0]} ${clean.slice(1, 7)} ${clean.slice(7)}`;
  }
  return barcode;
}

/**
 * Generates an EAN-13 barcode with specified prefix and sequential/unique seed
 */
export function generateItemBarcodeWithPrefix(prefix = '880', seed?: number): string {
  const cleanPrefix = (prefix || '880').replace(/\D/g, '').slice(0, 6) || '8809';
  const remainingLen = 12 - cleanPrefix.length;
  let numPart = '';
  if (seed !== undefined) {
    numPart = seed.toString().padStart(remainingLen, '0').slice(-remainingLen);
  } else {
    for (let i = 0; i < remainingLen; i++) {
      numPart += Math.floor(Math.random() * 10).toString();
    }
  }
  const first12 = cleanPrefix + numPart;
  const checksum = calculateEAN13Checksum(first12);
  return first12 + checksum.toString();
}

/**
 * Generates a deterministic array of bar widths for SVG rendering
 * creates an authentic-looking barcode pattern based on characters
 */
export function getBarcodeStripePattern(code: string): number[] {
  const clean = code.trim();
  const pattern: number[] = [2, 1, 1, 1]; // Start guard
  
  for (let i = 0; i < clean.length; i++) {
    const charCode = clean.charCodeAt(i);
    // Convert character code into 4 stripe alternating widths
    const w1 = ((charCode * 3 + i) % 3) + 1;
    const w2 = ((charCode * 7 + i * 2) % 3) + 1;
    const w3 = ((charCode * 5 + i * 4) % 3) + 1;
    const w4 = ((charCode * 11 + i * 3) % 2) + 1;
    pattern.push(w1, w2, w3, w4);
  }

  pattern.push(1, 1, 1, 2); // Stop guard
  return pattern;
}
