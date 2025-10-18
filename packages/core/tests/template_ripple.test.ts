import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';

import { sanitizeParams, resolveTemplateToObject, validateAndNormalizeLottie } from '../index.js';

function extractTemplateAndParamsText(fileText: string) {
  const key = '"template"';
  const idx = fileText.indexOf(key);
  if (idx === -1) throw new Error('template key not found');
  const braceStart = fileText.indexOf('{', idx);
  if (braceStart === -1) throw new Error('template object start not found');
  let depth = 0;
  let end = braceStart;
  for (; end < fileText.length; end++) {
    const ch = fileText[end];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) { end++; break; }
    }
  }
  const templateText = fileText.slice(braceStart, end);
  const outerText = fileText.slice(0, braceStart) + '{}' + fileText.slice(end);
  const outer = JSON.parse(outerText);
  return { templateText, outer };
}

{
  const repoRoot = resolvePath(process.cwd(), '..', '..');
  const templatePath = resolvePath(repoRoot, 'templates/button_tap_ripple.json');
  const fileText = readFileSync(templatePath, 'utf8');
  const { templateText, outer } = extractTemplateAndParamsText(fileText);

  const params = sanitizeParams(outer, {
    fps: 60,
    durationFrames: 45,
    size: 120,
    colorPrimary: '#0EA5E9',
    stroke: 4,
    startScale: 20,
    endScale: 150,
  });

  const resolved = resolveTemplateToObject(templateText, params);
  const { valid, errors, normalized } = validateAndNormalizeLottie(resolved);

  assert.equal(valid, true, `Expected valid Lottie, got errors: ${errors.join(', ')}`);
  const bytes = Buffer.from(JSON.stringify(normalized)).byteLength;
  console.log(`button_tap_ripple bytes: ${bytes}`);
  assert.ok(bytes < 50 * 1024, 'Expected < 50KB output');
}
