import { useAnimationStore, PresetName, presets } from '../store';

const presetButtons: { name: PresetName; label: string }[] = [
  { name: 'minimal', label: 'Minimal' },
  { name: 'playful', label: 'Playful' },
  { name: 'cinematic', label: 'Cinematic' },
];

function Controls() {
  const { params, currentPreset, setParams, applyPreset } = useAnimationStore();

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold mb-4">Style Presets</h2>
        <div className="grid grid-cols-3 gap-2">
          {presetButtons.map((preset) => (
            <button
              key={preset.name}
              onClick={() => applyPreset(preset.name)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                currentPreset === preset.name
                  ? 'bg-white text-black'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Parameters</h2>
        <div className="space-y-6">
          {/* Font Size */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400">Font Size</label>
              <span className="text-sm font-mono">{params.fontSize}px</span>
            </div>
            <input
              type="range"
              min="40"
              max="160"
              value={params.fontSize}
              onChange={(e) => setParams({ fontSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Duration Per Char */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400">Speed</label>
              <span className="text-sm font-mono">{params.durationPerChar}f</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={params.durationPerChar}
              onChange={(e) => setParams({ durationPerChar: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Stagger Delay */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400">Stagger</label>
              <span className="text-sm font-mono">{params.staggerDelay}f</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              value={params.staggerDelay}
              onChange={(e) => setParams({ staggerDelay: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Slide Distance */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400">Slide Distance</label>
              <span className="text-sm font-mono">{params.slideDistance}px</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={params.slideDistance}
              onChange={(e) => setParams({ slideDistance: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Spacing */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400">Spacing</label>
              <span className="text-sm font-mono">{params.spacing.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0.4"
              max="1.0"
              step="0.05"
              value={params.spacing}
              onChange={(e) => setParams({ spacing: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Color */}
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-gray-400">Color</label>
              <span className="text-sm font-mono">{params.colorPrimary}</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={params.colorPrimary}
                onChange={(e) => setParams({ colorPrimary: e.target.value })}
                className="w-12 h-12 rounded cursor-pointer"
              />
              <input
                type="text"
                value={params.colorPrimary}
                onChange={(e) => setParams({ colorPrimary: e.target.value })}
                className="flex-1 bg-white/10 px-3 py-2 rounded text-sm font-mono focus:outline-none focus:ring-2 focus:ring-white/30"
                placeholder="#FFFFFF"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Controls;
