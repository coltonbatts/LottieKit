import React, { useEffect, useMemo, useState } from 'react';
import Lottie from 'lottie-react';
import { ParamPanel } from './components/ParamPanel';
import { useParamStore } from './store';
import { downloadJson } from './lib/downloadJson';
import { sanitizeParams, resolveTemplateToObject, validateAndNormalizeLottie } from '@core/index.js';

const TEMPLATE_FILES = {
  gentle_pulse_loader: 'gentle_pulse_loader.json',
  success_checkmark_bounce: 'success_checkmark_bounce.json',
  button_tap_ripple: 'button_tap_ripple.json'
} as const;

type TemplateKey = keyof typeof TEMPLATE_FILES;

function extractTemplate(txt: string): { meta: any; templateText: string } {
  const key = '"template"';
  const idx = txt.indexOf(key);
  if (idx === -1) throw new Error('Template file missing "template" field');
  // Find colon after "template"
  let i = idx + key.length;
  while (i < txt.length && /\s|:/.test(txt[i])) i++;
  if (txt[i] !== '{') throw new Error('Expected object for template field');
  // Brace matching to get the full template object text
  let start = i;
  let depth = 0;
  let inStr = false;
  for (; i < txt.length; i++) {
    const c = txt[i];
    if (c === '"' && txt[i - 1] !== '\\') inStr = !inStr;
    if (inStr) continue;
    if (c === '{') depth++;
    else if (c === '}') {
      depth--;
      if (depth === 0) { i++; break; }
    }
  }
  const templateText = txt.slice(start, i);
  const replaced = txt.slice(0, start) + '"__TEMPLATE_PLACEHOLDER__"' + txt.slice(i);
  const meta = JSON.parse(replaced);
  return { meta, templateText };
}

export default function App() {
  const [selection, setSelection] = useState<TemplateKey>('gentle_pulse_loader');
  const [error, setError] = useState<string | null>(null);
  const [lottieObj, setLottieObj] = useState<any | null>(null);
  const [meta, setMeta] = useState<{ bytes: number; fr?: number; op?: number; layers?: number }>({ bytes: 0 });

  const template = useParamStore((s) => s.template);
  const params = useParamStore((s) => s.params);
  const setTemplate = useParamStore((s) => s.setTemplate);
  const setParam = useParamStore((s) => s.setParam);
  const reset = useParamStore((s) => s.reset);

  // Load selected template
  useEffect(() => {
    async function load() {
      setError(null);
      setLottieObj(null);
      try {
        const file = TEMPLATE_FILES[selection];
        const res = await fetch(`/templates/${file}`);
        if (!res.ok) throw new Error(`Failed to load template ${file}`);
        const txt = await res.text();
        const { meta: def, templateText } = extractTemplate(txt);
        setTemplate({ ...def, templateText, name: selection });
      } catch (e: any) {
        setError(e.message || String(e));
      }
    }
    load();
  }, [selection, setTemplate]);

  // Recompute preview on template or params changes
  useEffect(() => {
    if (!template) return;
    try {
      setError(null);
      // 1) sanitize
      const sanitized = sanitizeParams(template, params);
      // 2) resolve (prefer template.templateText if present)
      const templateText = (template as any).templateText ?? JSON.stringify(template.template);
      const resolved = resolveTemplateToObject(templateText, sanitized);
      // 3) validate
      const { valid, errors, normalized } = validateAndNormalizeLottie(resolved);
      if (!valid) {
        setError(errors.join('\n'));
        setLottieObj(null);
        return;
      }
      const jsonText = JSON.stringify(normalized);
      setMeta({
        bytes: new TextEncoder().encode(jsonText).byteLength,
        fr: normalized.fr,
        op: normalized.op,
        layers: Array.isArray(normalized.layers) ? normalized.layers.length : undefined
      });
      setLottieObj(normalized);
    } catch (e: any) {
      setError(e.message || String(e));
      setLottieObj(null);
    }
  }, [template, params]);

  const canPreview = !error && !!lottieObj;

  const handleDownload = () => {
    if (!lottieObj) return;
    const name = template?.name || 'lottie';
    downloadJson(`${name}.json`, lottieObj);
  };

  const templateOptions = useMemo(
    () => [
      { key: 'gentle_pulse_loader', label: 'Gentle Pulse Loader' },
      { key: 'success_checkmark_bounce', label: 'Success Checkmark Bounce' },
      { key: 'button_tap_ripple', label: 'Button Tap Ripple' }
    ],
    []
  );

  return (
    <div className="container">
      <h1 style={{ marginTop: 0 }}>LottieKit Preview</h1>
      <div className="row">
        <div className="left">
          <div className="card">
            <label className="label" htmlFor="template-picker">Template</label>
            <select
              id="template-picker"
              className="select"
              value={selection}
              onChange={(e) => setSelection(e.target.value as TemplateKey)}
            >
              {templateOptions.map((o) => (
                <option key={o.key} value={o.key}>{o.label}</option>
              ))}
            </select>
          </div>

          <div style={{ height: 12 }} />

          {template ? (
            <ParamPanel paramsDef={template.params} values={params} onChange={setParam} />
          ) : (
            <div className="card">Loading params…</div>
          )}

          <div className="toolbar">
            <button className="btn" onClick={() => reset()}>Reset Params</button>
            <button className="btn primary" onClick={handleDownload} disabled={!lottieObj}>Download JSON</button>
          </div>
        </div>

        <div className="right">
          <div className="card">
            <div className="previewBox" style={{ minHeight: 420 }}>
              {canPreview ? (
                <Lottie animationData={lottieObj} loop autoplay style={{ width: 420, height: 420 }} />
              ) : (
                <div style={{ color: '#64748b' }}>{error ? 'Invalid params or template' : 'Loading…'}</div>
              )}
            </div>
            <div className="meta">
              Bytes: {meta.bytes} | fr: {meta.fr ?? '-'} | op: {meta.op ?? '-'} | layers: {meta.layers ?? '-'}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="toast">
          <div style={{ fontWeight: 600, marginBottom: 4 }}>Validation/Error</div>
          <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
        </div>
      )}
    </div>
  );
}
