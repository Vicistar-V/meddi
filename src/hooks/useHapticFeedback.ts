export const useHapticFeedback = () => {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  };

  const light = () => vibrate(10);
  const medium = () => vibrate(20);
  const strong = () => vibrate(30);
  const success = () => vibrate([10, 50, 10]);
  const error = () => vibrate([50, 50, 50]);

  return {
    light,
    medium,
    strong,
    success,
    error,
    vibrate,
  };
};
