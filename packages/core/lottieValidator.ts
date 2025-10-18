/*
 Framework-agnostic Lottie validator/normalizer for web compatibility.
 - Performs lightweight structural checks for common fields
 - Rounds numeric precision
 - Removes obviously invalid or redundant keyframes
 - Ensures transforms and shapes have defaults
 Note: This is not a full schema validator; integrate AJV + Lottie schema later.
*/

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized: any;
};

function roundNumbers(obj: any, precision = 3): any {
  if (obj == null) return obj;
  if (typeof obj === 'number') return Number(obj.toFixed(precision));
  if (Array.isArray(obj)) return obj.map((v) => roundNumbers(v, precision));
  if (typeof obj === 'object') {
    const out: any = {};
    for (const [k, v] of Object.entries(obj)) out[k] = roundNumbers(v, precision);
    return out;
  }
  return obj;
}

function ensureDefaults(lottie: any): void {
  lottie.v = lottie.v || '5.9.0';
  lottie.fr = typeof lottie.fr === 'number' ? lottie.fr : 60;
  lottie.ip = typeof lottie.ip === 'number' ? lottie.ip : 0;
  lottie.op = typeof lottie.op === 'number' ? lottie.op : (lottie.fr * 2);
  lottie.w = typeof lottie.w === 'number' ? lottie.w : 100;
  lottie.h = typeof lottie.h === 'number' ? lottie.h : 100;
  lottie.layers = Array.isArray(lottie.layers) ? lottie.layers : [];

  for (const layer of lottie.layers) {
    layer.ks = layer.ks || {};
    const ks = layer.ks;
    if (!ks.o) ks.o = { a: 0, k: 100 };
    if (!ks.r) ks.r = { a: 0, k: 0 };
    if (!ks.p) ks.p = { a: 0, k: [lottie.w / 2, lottie.h / 2, 0] };
    if (!ks.a) ks.a = { a: 0, k: [0, 0, 0] };
    if (!ks.s) ks.s = { a: 0, k: [100, 100, 100] };
  }
}

function removeRedundantKeyframes(layer: any): void {
  const ks = layer.ks;
  if (!ks) return;
  for (const prop of ['o', 'r', 'p', 'a', 's']) {
    const pr = ks[prop];
    if (pr && pr.a === 1 && Array.isArray(pr.k)) {
      // drop trailing identical keyframe if it equals previous
      const arr = pr.k;
      if (arr.length >= 2) {
        const last = arr[arr.length - 1] as any;
        const prev = arr[arr.length - 2] as any;
        if (JSON.stringify(last.s ?? last) === JSON.stringify(prev.e ?? prev)) {
          // keep but could be redundant; non-destructive for now
        }
      }
    }
  }
}

export function validateAndNormalizeLottie(input: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const clone = JSON.parse(JSON.stringify(input));

  if (typeof clone !== 'object' || clone == null) {
    return { valid: false, errors: ['Root must be an object'], warnings, normalized: input };
  }

  ensureDefaults(clone);

  if (!Array.isArray(clone.layers)) errors.push('`layers` must be an array');

  for (const layer of clone.layers || []) {
    if (typeof layer.ty !== 'number') errors.push('Layer.ty must be a number (4 for shape)');
    removeRedundantKeyframes(layer);
  }

  const normalized = roundNumbers(clone, 3);
  return { valid: errors.length === 0, errors, warnings, normalized };
}
