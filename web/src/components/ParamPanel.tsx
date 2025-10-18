import React from 'react';
import clsx from 'clsx';

type ParamDef = { type: 'number' | 'string' | 'color' | 'boolean'; min?: number; max?: number; step?: number; default: any };

export function ParamPanel({
  paramsDef,
  values,
  onChange
}: {
  paramsDef: Record<string, ParamDef>;
  values: Record<string, any>;
  onChange: (key: string, value: any) => void;
}) {
  const entries = Object.entries(paramsDef || {});
  if (entries.length === 0) return <div className="card">No parameters.</div>;

  return (
    <div className="card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {entries.map(([key, def]) => {
          const id = `param-${key}`;
          const v = values[key] ?? def.default;
          if (def.type === 'number') {
            return (
              <div key={key}>
                <label className="label" htmlFor={id}>{key}</label>
                <input
                  id={id}
                  className={clsx('input')}
                  type="range"
                  min={def.min ?? 0}
                  max={def.max ?? 100}
                  step={def.step ?? 1}
                  value={Number(v)}
                  onChange={(e) => onChange(key, Number(e.target.value))}
                />
                <div className="meta">{v}</div>
              </div>
            );
          }
          if (def.type === 'color') {
            return (
              <div key={key}>
                <label className="label" htmlFor={id}>{key}</label>
                <input
                  id={id}
                  className={clsx('input')}
                  type="color"
                  value={String(v)}
                  onChange={(e) => onChange(key, e.target.value)}
                />
              </div>
            );
          }
          if (def.type === 'boolean') {
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  id={id}
                  type="checkbox"
                  checked={Boolean(v)}
                  onChange={(e) => onChange(key, e.target.checked)}
                />
                <label htmlFor={id} className="label" style={{ margin: 0 }}>{key}</label>
              </div>
            );
          }
          return (
            <div key={key}>
              <label className="label" htmlFor={id}>{key}</label>
              <input
                id={id}
                className={clsx('input')}
                type="text"
                value={String(v)}
                onChange={(e) => onChange(key, e.target.value)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
