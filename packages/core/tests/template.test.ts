import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { resolve as resolvePath } from 'node:path';
import { fileURLToPath } from 'node:url';

import { sanitizeParams, resolveTemplateToObject, validateAndNormalizeLottie } from '../index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolvePath(__filename, '..');

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

// Test resolving and validating the gentle pulse loader template
{
  // When executed via npm --prefix packages/core test, the CWD is packages/core
  // Resolve the templates folder relative to repo root
  const repoRoot = resolvePath(process.cwd(), '..', '..');
  const templatePath = resolvePath(repoRoot, 'templates/gentle_pulse_loader.json');
  const fileText = readFileSync(templatePath, 'utf8');
  const { templateText, outer } = extractTemplateAndParamsText(fileText);

  const params = sanitizeParams(outer, {
    fps: 60,
    durationFrames: 90,
    size: 120,
    colorPrimary: '#4F46E5',
    scaleMin: 90,
    scaleMax: 110,
    stroke: 0,
  });

  const resolved = resolveTemplateToObject(templateText, params);
  const { valid, errors, normalized } = validateAndNormalizeLottie(resolved);

  assert.equal(valid, true, `Expected valid Lottie, got errors: ${errors.join(', ')}`);

  const bytes = Buffer.from(JSON.stringify(normalized)).byteLength;
  console.log(`gentle_pulse_loader bytes: ${bytes}`);
  assert.ok(bytes < 50 * 1024, 'Expected < 50KB output');
}
