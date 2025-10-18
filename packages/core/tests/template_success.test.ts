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
  const templatePath = resolvePath(repoRoot, 'templates/success_checkmark_bounce.json');
  const fileText = readFileSync(templatePath, 'utf8');
  const { templateText, outer } = extractTemplateAndParamsText(fileText);

  const params = sanitizeParams(outer, {
    fps: 60,
    durationFrames: 90,
    size: 100,
    colorPrimary: '#16A34A',
    stroke: 6,
    bounceOvershoot: 110,
  });

  const resolved = resolveTemplateToObject(templateText, params);
  const { valid, errors, normalized } = validateAndNormalizeLottie(resolved);

  assert.equal(valid, true, `Expected valid Lottie, got errors: ${errors.join(', ')}`);
  const bytes = Buffer.from(JSON.stringify(normalized)).byteLength;
  console.log(`success_checkmark_bounce bytes: ${bytes}`);
  assert.ok(bytes < 50 * 1024, 'Expected < 50KB output');
}
