import { useState, useEffect } from 'react';

const ProgressBar = ({ animate = true }) => {
  const [progress, setProgress] = useState(0);
  const [isAnimating, setIsAnimating] = useState(animate);
  const [intervalTime, setIntervalTime] = useState(30); // Regular speed for animation

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setProgress((prev) => (prev === 100 ? 0 : prev + 1));
    }, intervalTime); // Speed changes based on `intervalTime`

    return () => clearInterval(interval);
  }, [isAnimating, intervalTime]);

  // Handle the case when animation is stopped, and it should finish faster
  useEffect(() => {
    if (animate) {
      setIsAnimating(true);
      setIntervalTime(30); // Set normal speed when animation is active
    } else if (progress < 100) {
      // When stopping animation, speed up to complete the cycle faster
      setIntervalTime(3); // Faster speed to complete the progress quickly
    } else {
      setIsAnimating(false);
      setIntervalTime(8); // Reset to normal speed once the progress completes
    }
  }, [animate, progress]);

  return (
    <div className="w-full">
      <progress
        className="progress progress-primary w-full"
        value={progress}
        max="100"
      ></progress>
    </div>
  );
};

export default ProgressBar;
