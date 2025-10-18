import { useEffect, useRef } from 'react';
import Lottie, { LottieRefCurrentProps } from 'lottie-react';
import { useAnimationStore } from './store';
import Controls from './components/Controls';
import PlaybackControls from './components/PlaybackControls';
import { generateLottieFromTemplate } from './utils/templateLoader';

function App() {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const { params, isPlaying, lottieData, setLottieData, setIsPlaying } = useAnimationStore();

  // Regenerate Lottie data when params change
  useEffect(() => {
    const generateAnimation = async () => {
      try {
        const data = await generateLottieFromTemplate(params);
        setLottieData(data);
      } catch (error) {
        console.error('Failed to generate animation:', error);
      }
    };
    generateAnimation();
  }, [params, setLottieData]);

  // Control playback
  useEffect(() => {
    if (!lottieRef.current) return;
    if (isPlaying) {
      lottieRef.current.play();
    } else {
      lottieRef.current.pause();
    }
  }, [isPlaying]);

  return (
    <div className="w-screen h-screen bg-dark flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10">
        <h1 className="text-xl font-semibold">LottieKit Preview</h1>
        <p className="text-sm text-gray-500 mt-0.5">Text Reveal Animation</p>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Preview */}
        <div className="flex-1 flex items-center justify-center p-12 relative">
          {/* Grid background for better visibility */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />

          <div className="relative z-10 bg-white/5 rounded-2xl p-12 backdrop-blur-sm border border-white/10">
            {lottieData ? (
              <div className="transition-opacity duration-300">
                <Lottie
                  lottieRef={lottieRef}
                  animationData={lottieData}
                  loop={true}
                  autoplay={isPlaying}
                  style={{ width: 600, height: 200 }}
                />
              </div>
            ) : (
              <div className="w-[600px] h-[200px] flex items-center justify-center text-gray-500">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin w-6 h-6 border-2 border-white/20 border-t-white rounded-full" />
                  <span className="text-sm">Generating animation...</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Controls */}
        <div className="w-[380px] border-l border-white/10 overflow-y-auto bg-white/[0.02]">
          <Controls />
        </div>
      </div>

      {/* Bottom: Playback Controls */}
      <div className="border-t border-white/10 bg-white/[0.02]">
        <PlaybackControls lottieRef={lottieRef} />
      </div>
    </div>
  );
}

export default App;
