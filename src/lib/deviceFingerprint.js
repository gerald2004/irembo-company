const STORAGE_KEY = 'dfp';

async function compute() {
  const canvas = (() => {
    try {
      const el  = document.createElement('canvas');
      const ctx = el.getContext('2d');
      ctx.textBaseline = 'top';
      ctx.font         = '14px Arial';
      ctx.fillStyle    = '#f80';
      el.width = 240; el.height = 32;
      ctx.fillRect(0, 0, 240, 32);
      ctx.fillStyle = '#069';
      ctx.fillText('irembo•fingerprint', 4, 8);
      ctx.fillStyle = 'rgba(180,20,220,0.6)';
      ctx.fillText('irembo•fingerprint', 6, 10);
      return el.toDataURL();
    } catch { return ''; }
  })();

  const parts = [
    navigator.userAgent,
    navigator.language,
    (navigator.languages || []).join(','),
    `${screen.width}x${screen.height}x${screen.colorDepth}`,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency || ''),
    String(navigator.deviceMemory       || ''),
    canvas,
  ];

  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(parts.join('|'))
  );
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

let _promise = null;

export async function initDeviceFingerprint() {
  const cached = localStorage.getItem(STORAGE_KEY);
  if (cached) return cached;
  if (!_promise) _promise = compute();
  const fp = await _promise;
  localStorage.setItem(STORAGE_KEY, fp);
  return fp;
}

export function getDeviceFingerprint() {
  return localStorage.getItem(STORAGE_KEY) ?? '';
}
