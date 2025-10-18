import { useState, useEffect } from 'react';
import type { LottieRefCurrentProps } from 'lottie-react';
import { useAnimationStore } from '../store';

interface PlaybackControlsProps {
  lottieRef: React.RefObject<LottieRefCurrentProps>;
}

function PlaybackControls({ lottieRef }: PlaybackControlsProps) {
  const { isPlaying, setIsPlaying, lottieData } = useAnimationStore();
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);

  useEffect(() => {
    if (!lottieRef.current) return;

    const animItem = lottieRef.current;
    const handleFrame = () => {
      if (animItem) {
        setCurrentFrame(Math.floor(animItem.animationItem?.currentFrame || 0));
      }
    };

    const interval = setInterval(handleFrame, 16);
    return () => clearInterval(interval);
  }, [lottieRef]);

  useEffect(() => {
    if (lottieData) {
      setTotalFrames(lottieData.op || 0);
    }
  }, [lottieData]);

  const handleExport = () => {
    if (!lottieData) return;

    const dataStr = JSON.stringify(lottieData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lottiekit-text-reveal-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestart = () => {
    if (!lottieRef.current) return;
    lottieRef.current.goToAndPlay(0);
  };

  return (
    <div className="px-6 py-4 flex items-center gap-6">
      {/* Play/Pause */}
      <button
        onClick={() => setIsPlaying(!isPlaying)}
        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
        title={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="1" width="3" height="12" rx="1" />
            <rect x="9" y="1" width="3" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <path d="M3 1.5C3 0.947715 3.44772 0.5 4 0.5C4.36754 0.5 4.70459 0.697371 4.89443 1.00924L12.3944 12.5092C12.6835 12.9845 12.5232 13.6084 12.0479 13.8976C11.5726 14.1867 10.9487 14.0264 10.6596 13.5511L3.15959 2.05111C3.05624 1.88384 3 1.69453 3 1.5Z" />
          </svg>
        )}
      </button>

      {/* Restart */}
      <button
        onClick={handleRestart}
        className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center"
        title="Restart"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 8C2 4.68629 4.68629 2 8 2C9.85097 2 11.4908 2.87914 12.5355 4.24264M14 8C14 11.3137 11.3137 14 8 14C6.14903 14 4.50917 13.1209 3.46447 11.7574" strokeLinecap="round" />
          <path d="M12 1V4.5H8.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Frame counter */}
      <div className="text-sm font-mono text-gray-400">
        {currentFrame} / {totalFrames}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Export button */}
      <button
        onClick={handleExport}
        disabled={!lottieData}
        className="px-6 py-2.5 bg-white text-black rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Export JSON
      </button>
    </div>
  );
}

export default PlaybackControls;
