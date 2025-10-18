# LottieKit

[![CI](https://github.com/coltonbatts/LottieKit/actions/workflows/ci.yml/badge.svg)](https://github.com/coltonbatts/LottieKit/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

AI-assisted Lottie animation system that generates, edits, and optimizes Lottie JSON from natural language while teaching motion principles.

## Overview

- **Focus**: MVP with 10 animation patterns, web-only compatibility.
- **Templates**: Parameterized Lottie JSON stored under `templates/`.
- **Core utilities**: Framework-agnostic logic in `packages/core/` for resolving templates and validating output.
- **LLM**: Claude (schema-guarded JSON only) planned for parameterization beyond v0.

## Repository Structure

```
LottieKit/
  README.md
  lottiekit_research_blueprint.md
  templates/
    schema.json
    gentle_pulse_loader.json
    success_checkmark_bounce.json
    button_tap_ripple.json
  packages/
    core/
      templateResolver.ts
      lottieValidator.ts
```

## Templates

- Each template file follows `templates/schema.json` and exposes:
  - `params`: typed inputs with defaults/ranges.
  - `template`: Lottie JSON using directives:
    - `${params.key}` to interpolate params.
    - `${calc(expr)}` to evaluate numeric expressions (supports `+ - * /`, parentheses, and `params.*`).
    - `${color(#RRGGBB)}` converts hex to `[r,g,b,a]` arrays.

### Current patterns (3/10)

- `gentle_pulse_loader`
- `success_checkmark_bounce`
- `button_tap_ripple`

Planned next: text reveal (fade+slide), progress bar fill, icon pop/bounce, error cross wiggle, slide transition (L/R), toggle switch, confetti burst.

## Quickstart

Resolve and validate the `gentle_pulse_loader` template in one script.

```ts
import { readFileSync } from 'node:fs';
import { sanitizeParams, resolveTemplateToObject } from './packages/core/templateResolver';
import { validateAndNormalizeLottie } from './packages/core/lottieValidator';

const def = JSON.parse(readFileSync('templates/gentle_pulse_loader.json', 'utf8'));
const params = sanitizeParams(def, { size: 160, durationFrames: 90, colorPrimary: '#4F46E5' });
const lottie = resolveTemplateToObject(JSON.stringify(def.template), params);
const { valid, normalized, errors } = validateAndNormalizeLottie(lottie);

if (!valid) console.error('Validation errors:', errors);
console.log('Final bytes:', Buffer.from(JSON.stringify(normalized)).byteLength);
```

## Core Utilities

### `packages/core/templateResolver.ts`

- `sanitizeParams(defs, input)` clamps types/ranges using template `params` defaults.
- `resolveTemplateToObject(templateText, params)` resolves `${params.*}`, `${calc(...)}`, `${color(...)}` and returns finalized Lottie JSON.

Example:

```ts
import { readFileSync } from 'fs';
import { sanitizeParams, resolveTemplateToObject } from './packages/core/templateResolver';

const tmplText = readFileSync('templates/gentle_pulse_loader.json', 'utf8');
const tmplDef = JSON.parse(tmplText);

const params = sanitizeParams(tmplDef, {
  size: 160,
  durationFrames: 90,
  colorPrimary: '#4F46E5'
});

const lottie = resolveTemplateToObject(JSON.stringify(tmplDef.template), params);
console.log(lottie);
```

### `packages/core/lottieValidator.ts`

- `validateAndNormalizeLottie(obj)` performs lightweight checks, applies defaults, rounds precision, and returns `{ valid, errors, warnings, normalized }`.

Example:

```ts
import { validateAndNormalizeLottie } from './packages/core/lottieValidator';

const result = validateAndNormalizeLottie(lottie);
if (!result.valid) {
  console.error('Validation errors:', result.errors);
}
// Use result.normalized for preview/export
```

## Preview (MVP plan)

- Web preview with `lottie-web` (via `lottie-react`), parameter sliders, and timeline scrubbing.
- Flow: read template → sanitize params → resolve → validate/normalize → preview.

## Development

- Node 18+ recommended.
- Install deps (once app packages exist):

```bash
npm install
```

- Lint/test/build to be added as the UI/API packages are introduced.

## Environment & LLM

- LLM provider: Claude. Configure via `process.env.CLAUDE_API_KEY` in the future API service.
- All LLM outputs remain schema-guarded and locally validated.

## Roadmap

- Finish 10 MVP templates and preview app.
- Prompt processor (intent + param extraction) with schema-guarded LLM.
- Export as Lottie JSON and `.lottie`, basic optimizer passes.
- Educational explanations (deterministic to start).

## Contributing

- Open issues and PRs are welcome. Keep core logic framework-agnostic in `packages/core/`.

## License

- To be determined for MVP. Core validators/optimizers are intended to be open-source (MIT) in future phases.
