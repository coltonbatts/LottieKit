import { create } from 'zustand';

export interface AnimationParams {
  fps: number;
  durationPerChar: number;
  staggerDelay: number;
  slideDistance: number;
  fontSize: number;
  colorPrimary: string;
  spacing: number;
}

export type PresetName = 'minimal' | 'playful' | 'cinematic';

interface AnimationStore {
  params: AnimationParams;
  isPlaying: boolean;
  currentPreset: PresetName | null;
  lottieData: any | null;
  setParams: (params: Partial<AnimationParams>) => void;
  setIsPlaying: (playing: boolean) => void;
  applyPreset: (preset: PresetName) => void;
  setLottieData: (data: any) => void;
}

const defaultParams: AnimationParams = {
  fps: 60,
  durationPerChar: 20,
  staggerDelay: 4,
  slideDistance: 30,
  fontSize: 80,
  colorPrimary: '#FFFFFF',
  spacing: 0.65,
};

export const presets: Record<PresetName, Partial<AnimationParams>> = {
  minimal: {
    durationPerChar: 25,
    staggerDelay: 3,
    slideDistance: 20,
    spacing: 0.65,
  },
  playful: {
    durationPerChar: 18,
    staggerDelay: 5,
    slideDistance: 40,
    spacing: 0.7,
  },
  cinematic: {
    durationPerChar: 30,
    staggerDelay: 6,
    slideDistance: 50,
    spacing: 0.75,
  },
};

export const useAnimationStore = create<AnimationStore>((set) => ({
  params: defaultParams,
  isPlaying: true,
  currentPreset: null,
  lottieData: null,
  setParams: (newParams) =>
    set((state) => ({
      params: { ...state.params, ...newParams },
      currentPreset: null,
    })),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  applyPreset: (preset) =>
    set((state) => ({
      params: { ...state.params, ...presets[preset] },
      currentPreset: preset,
    })),
  setLottieData: (data) => set({ lottieData: data }),
}));
