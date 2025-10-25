import { useRef, useState, useEffect } from 'react';

interface SwipeGestureConfig {
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  threshold?: number;
}

export const useSwipeGesture = ({
  onSwipeRight,
  onSwipeLeft,
  threshold = 100,
}: SwipeGestureConfig) => {
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsSwiping(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isSwiping) return;
    
    currentX.current = e.touches[0].clientX;
    const diff = currentX.current - startX.current;
    const progress = Math.min(Math.abs(diff) / threshold, 1);
    setSwipeProgress(progress);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;

    const diff = currentX.current - startX.current;
    
    if (Math.abs(diff) >= threshold) {
      if (diff > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (diff < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    setIsSwiping(false);
    setSwipeProgress(0);
    startX.current = 0;
    currentX.current = 0;
  };

  return {
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
    isSwiping,
    swipeProgress,
  };
};
