/*
 Minimal, framework-agnostic template resolver for LottieKit.
 - Replaces ${params.*} tokens
 - Evaluates ${calc(...)} with a tiny expression parser (numbers, + - * /, parentheses, params.*)
 - Converts ${color(#RRGGBB)} to [r,g,b,a] normalized arrays
 - Returns finalized Lottie JSON (parsed object)
*/

export type TemplateParams = Record<string, unknown>;

// --- Color helpers ---
function hexToRgbaArray(hex: string): [number, number, number, number] {
  const m = /^#([\da-fA-F]{6})([\da-fA-F]{2})?$/.exec(hex.trim());
  if (!m) throw new Error(`Invalid hex color: ${hex}`);
  const h = m[1];
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const a = m[2] ? parseInt(m[2], 16) / 255 : 1;
  return [Number(r.toFixed(3)), Number(g.toFixed(3)), Number(b.toFixed(3)), Number(a.toFixed(3))];
}

// --- Tiny expression evaluator for calc() ---
// Supports: numbers, + - * /, parentheses, and params.<key>
function evalCalcExpression(expr: string, params: TemplateParams): number {
  // Tokenize
  type Tok = { t: 'num' | 'op' | 'lp' | 'rp'; v: string } | { t: 'ident'; v: string };
  const tokens: Tok[] = [];
  let i = 0;
  const s = expr.trim();
  const isDigit = (c: string) => /[0-9.]/.test(c);
  const isAlpha = (c: string) => /[a-zA-Z_]/.test(c);
  while (i < s.length) {
    const c = s[i];
    if (c === ' ') { i++; continue; }
    if (c === '(') { tokens.push({ t: 'lp', v: c }); i++; continue; }
    if (c === ')') { tokens.push({ t: 'rp', v: c }); i++; continue; }
    if ('+-*/'.includes(c)) { tokens.push({ t: 'op', v: c }); i++; continue; }
    if (isDigit(c)) {
      let j = i + 1;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      tokens.push({ t: 'num', v: s.slice(i, j) });
      i = j; continue;
    }
    if (isAlpha(c)) {
      let j = i + 1;
      while (j < s.length && /[a-zA-Z0-9_\.]/.test(s[j])) j++;
      tokens.push({ t: 'ident', v: s.slice(i, j) });
      i = j; continue;
    }
    throw new Error(`Unexpected character in calc(): '${c}'`);
  }

  // Shunting-yard to RPN
  const out: Tok[] = [];
  const ops: Tok[] = [];
  const prec: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };
  let prevTok: Tok | null = null;
  for (const t of tokens) {
    if (t.t === 'num' || t.t === 'ident') {
      out.push(t);
    } else if (t.t === 'op') {
      // Handle unary minus by injecting a leading zero
      if (t.v === '-' && (prevTok == null || prevTok.t === 'op' || prevTok.t === 'lp')) {
        out.push({ t: 'num', v: '0' } as Tok);
      }
      while (ops.length && ops[ops.length - 1].t === 'op' && prec[(ops[ops.length - 1] as any).v] >= prec[t.v]) {
        out.push(ops.pop()!);
      }
      ops.push(t);
    } else if (t.t === 'lp') {
      ops.push(t);
    } else if (t.t === 'rp') {
      while (ops.length && ops[ops.length - 1].t !== 'lp') out.push(ops.pop()!);
      if (!ops.length) throw new Error('Mismatched parentheses in calc()');
      ops.pop();
    }
    prevTok = t;
  }
  while (ops.length) {
    const op = ops.pop()!;
    if (op.t === 'lp' || op.t === 'rp') throw new Error('Mismatched parentheses in calc()');
    out.push(op);
  }

  // Eval RPN
  const st: number[] = [];
  for (const t of out) {
    if (t.t === 'num') st.push(parseFloat(t.v));
    else if (t.t === 'ident') {
      if (!t.v.startsWith('params.')) throw new Error(`Unknown identifier '${t.v}'`);
      const key = t.v.slice('params.'.length);
      const val = params[key];
      if (typeof val !== 'number') throw new Error(`Expected numeric param '${key}', got ${typeof val}`);
      st.push(val as number);
    } else if (t.t === 'op') {
      const b = st.pop(); const a = st.pop();
      if (a === undefined || b === undefined) throw new Error('Invalid calc() expression');
      switch (t.v) {
        case '+': st.push(a + b); break;
        case '-': st.push(a - b); break;
        case '*': st.push(a * b); break;
        case '/': st.push(a / b); break;
      }
    }
  }
  if (st.length !== 1) throw new Error('Invalid calc() expression');
  return st[0];
}

// Replace ${...} directives safely in a template string
function replaceDirectives(templateText: string, params: TemplateParams): string {
  // 1) ${params.key}
  templateText = templateText.replace(/\$\{\s*params\.([a-zA-Z0-9_]+)\s*}/g, (_m, key) => {
    const v = params[key];
    if (v === undefined) throw new Error(`Missing param: ${key}`);
    return typeof v === 'string' ? JSON.stringify(v) : String(v as any);
  });

  // 2) ${color(#RRGGBB)} (after params so nested ${color(${params.color})} works)
  templateText = templateText.replace(/\$\{\s*color\(([^}]+)\)\s*}/g, (_m, inner) => {
    // inner may be a quoted string like "\"#AABBCC\"" after params replacement
    const cleaned = inner.trim().replace(/^\"|\"$/g, '');
    const rgba = hexToRgbaArray(cleaned);
    return JSON.stringify(rgba);
  });

  // 3) ${calc(...)}
  templateText = templateText.replace(/\$\{\s*calc\(([^}]+)\)\s*}/g, (_m, expr) => {
    const val = evalCalcExpression(expr, params);
    return String(Number(val.toFixed(3)));
  });

  return templateText;
}

export function resolveTemplateToObject(templateText: string, params: TemplateParams): any {
  const replaced = replaceDirectives(templateText, params);
  try {
    return JSON.parse(replaced);
  } catch (e) {
    // Provide a helpful snippet for debugging
    const snippet = replaced.slice(0, 400);
    throw new Error(`Resolved template is not valid JSON: ${(e as Error).message}. Snippet: ${snippet}`);
  }
}

// Convenience: clamp and coerce basic params before resolution
export function sanitizeParams(defs: any, input: TemplateParams): TemplateParams {
  const out: TemplateParams = {};
  const p = defs?.params || {};
  for (const key of Object.keys(p)) {
    const d = p[key];
    let v = input[key] ?? d.default;
    if (d.type === 'number') {
      if (typeof v !== 'number') v = Number(v);
      if (typeof d.min === 'number') v = Math.max(d.min, v);
      if (typeof d.max === 'number') v = Math.min(d.max, v);
      out[key] = v;
    } else if (d.type === 'boolean') {
      out[key] = Boolean(v);
    } else if (d.type === 'color') {
      if (typeof v !== 'string') throw new Error(`Param ${key} must be a hex string`);
      out[key] = v;
    } else {
      out[key] = v;
    }
  }
  return out;
}
