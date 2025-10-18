import type { AnimationParams } from '../store';

// Import the core resolver functions
// Since we're in a Vite environment, we need to handle module resolution
const resolveTemplateToObject = (templateText: string, params: Record<string, unknown>): any => {
  // Inline minimal template resolver for the preview app
  let result = templateText;

  // Replace ${params.key}
  result = result.replace(/\$\{\s*params\.([a-zA-Z0-9_]+)\s*}/g, (_m, key) => {
    const v = params[key];
    if (v === undefined) throw new Error(`Missing param: ${key}`);
    return typeof v === 'string' ? JSON.stringify(v) : String(v);
  });

  // Replace ${color(#RRGGBB)}
  result = result.replace(/\$\{\s*color\(([^}]+)\)\s*}/g, (_m, inner) => {
    const cleaned = inner.trim().replace(/^\"|\"$/g, '');
    const rgba = hexToRgbaArray(cleaned);
    return JSON.stringify(rgba);
  });

  // Replace ${calc(...)}
  result = result.replace(/\$\{\s*calc\(([^}]+)\)\s*}/g, (_m, expr) => {
    const val = evalCalc(expr, params);
    return String(Number(val.toFixed(3)));
  });

  return JSON.parse(result);
};

function hexToRgbaArray(hex: string): [number, number, number, number] {
  const m = /^#([\da-fA-F]{6})([\da-fA-F]{2})?$/.exec(hex.trim());
  if (!m) throw new Error(`Invalid hex color: ${hex}`);
  const h = m[1];
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const a = m[2] ? parseInt(m[2], 16) / 255 : 1;
  return [
    Number(r.toFixed(3)),
    Number(g.toFixed(3)),
    Number(b.toFixed(3)),
    Number(a.toFixed(3)),
  ];
}

function evalCalc(expr: string, params: Record<string, unknown>): number {
  // Simple eval for calc expressions - use Function constructor for safety
  const paramEntries = Object.entries(params)
    .filter(([_, v]) => typeof v === 'number')
    .map(([k, v]) => `const ${k} = ${v};`)
    .join('\n');

  const code = `
    ${paramEntries}
    return ${expr.replace(/params\./g, '')};
  `;

  try {
    return new Function(code)();
  } catch (e) {
    console.error('Calc error:', e, 'Expression:', expr);
    return 0;
  }
}

export async function generateLottieFromTemplate(params: AnimationParams): Promise<any> {
  // Fetch the template file
  const response = await fetch('/templates/text_reveal_stagger.json');
  const templateFile = await response.json();

  // Extract template section
  const templateText = JSON.stringify(templateFile.template);

  // Resolve with params
  const resolved = resolveTemplateToObject(templateText, params);

  return resolved;
}
