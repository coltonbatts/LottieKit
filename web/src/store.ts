import { create } from 'zustand';

export type TemplateDef = {
  name?: string;
  params: Record<string, { type: 'number' | 'string' | 'color' | 'boolean'; min?: number; max?: number; step?: number; default: any }>;
  template: unknown;
};

type State = {
  template?: TemplateDef;
  params: Record<string, any>;
  setTemplate: (def: TemplateDef) => void;
  setParam: (key: string, value: any) => void;
  reset: () => void;
};

export const useParamStore = create<State>((set, get) => ({
  template: undefined,
  params: {},
  setTemplate: (def) => {
    const defaults: Record<string, any> = {};
    for (const k of Object.keys(def.params || {})) {
      defaults[k] = def.params[k].default;
    }
    set({ template: def, params: defaults });
  },
  setParam: (key, value) => set({ params: { ...get().params, [key]: value } }),
  reset: () => {
    const t = get().template;
    if (!t) return;
    const defaults: Record<string, any> = {};
    for (const k of Object.keys(t.params || {})) defaults[k] = t.params[k].default;
    set({ params: defaults });
  }
}));
