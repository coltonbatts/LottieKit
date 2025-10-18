/*
 Framework-agnostic Lottie validator/normalizer for web compatibility.
 - Validates structure using Ajv (lightweight schema subset)
 - Normalizes defaults and keyframes
 - Strips unsupported features for web (expressions, effects)
 - Rounds numeric precision
*/

import Ajv from 'ajv';

export type ValidationResult = {
  valid: boolean;
  errors: string[];
  warnings: string[];
  normalized: any;
};

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

// Minimal Lottie schema subset (sufficient for our templates)
const lottieSchema = {
  type: 'object',
  required: ['v', 'fr', 'ip', 'op', 'w', 'h', 'layers'],
  properties: {
    v: { type: 'string' },
    fr: { type: 'number' },
    ip: { type: 'number' },
    op: { type: 'number' },
    w: { type: 'number' },
    h: { type: 'number' },
    layers: {
      type: 'array',
      items: {
        type: 'object',
        required: ['ty'],
        properties: {
          ty: { type: 'number' }, // 4 = shape
          ks: { type: 'object' },
          shapes: { type: 'array' },
          ef: { not: {} }, // disallow effects in MVP
          t: { not: {} } // disallow text layers in MVP
        }
      }
    }
  },
  additionalProperties: true
} as const;

const validateSchema = ajv.compile(lottieSchema);

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
    // Strip unsupported for web MVP
    delete (layer as any).ef; // effects
    delete (layer as any).tt; // track mattes
    delete (layer as any).tm; // time remap at layer (shape tm is allowed under shapes)
    if (layer.t) delete (layer as any).t; // text layers not supported in MVP

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
      const arr = pr.k;
      // Ensure final keyframe exists at or before op
      if (arr.length >= 2) {
        const last = arr[arr.length - 1] as any;
        const prev = arr[arr.length - 2] as any;
        // Non-destructive: could remove exact duplicates
        if (JSON.stringify(last.s ?? last) === JSON.stringify(prev.e ?? prev)) {
          // keep for now
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

  for (const layer of clone.layers || []) removeRedundantKeyframes(layer);

  const schemaOk = validateSchema(clone);
  if (!schemaOk) {
    for (const err of validateSchema.errors || []) {
      errors.push(`${err.instancePath || '.'} ${err.message}`.trim());
    }
  }

  const normalized = roundNumbers(clone, 3);
  return { valid: errors.length === 0, errors, warnings, normalized };
}
