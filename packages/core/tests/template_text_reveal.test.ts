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

// Test resolving and validating the text reveal stagger template
{
  const repoRoot = resolvePath(process.cwd(), '..', '..');
  const templatePath = resolvePath(repoRoot, 'templates/text_reveal_stagger.json');
  const fileText = readFileSync(templatePath, 'utf8');
  const { templateText, outer } = extractTemplateAndParamsText(fileText);

  const params = sanitizeParams(outer, {
    fps: 60,
    durationPerChar: 20,
    staggerDelay: 4,
    slideDistance: 30,
    fontSize: 80,
    colorPrimary: '#FFFFFF',
    spacing: 0.65,
  });

  const resolved = resolveTemplateToObject(templateText, params);
  const { valid, errors, normalized } = validateAndNormalizeLottie(resolved);

  assert.equal(valid, true, `Expected valid Lottie, got errors: ${errors.join(', ')}`);

  const bytes = Buffer.from(JSON.stringify(normalized)).byteLength;
  console.log(`text_reveal_stagger bytes: ${bytes}`);
  assert.ok(bytes < 30 * 1024, 'Expected < 30KB output');
}
