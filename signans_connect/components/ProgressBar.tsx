import React, { useState, useEffect, useRef } from "react";

const ProgressBar = ({ animate = true }) => {
  const [progress, setProgress] = useState(0);
  const animationFrame = useRef<number | null>(null);

  useEffect(() => {
    // If animating/loading => show indeterminate bar
    if (animate) {
      setProgress(0);
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      return;
    }

    // If loading finished => animate progress from 0 to 100 smoothly
    let start: number | null = null;

    const duration = 500; // animation duration in ms

    const step = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;

      const progressValue = Math.min((elapsed / duration) * 100, 100);
      setProgress(progressValue);

      if (elapsed < duration) {
        animationFrame.current = requestAnimationFrame(step);
      } else {
        animationFrame.current = null;
      }
    };

    animationFrame.current = requestAnimationFrame(step);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [animate]);

  return (
    <div className="w-full">
      {animate ? (
        // Indeterminate progress (no value attribute)
        <progress className="progress progress-primary w-full" />
      ) : (
        // Smooth fill progress
        <progress
          className="progress progress-primary w-full transition-all duration-500"
          value={progress}
          max={100}
        />
      )}
    </div>
  );
};

export default ProgressBar;
