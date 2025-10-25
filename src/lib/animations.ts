// Animation configuration presets for consistent animations across the app

export const springConfig = {
  type: "spring" as const,
  stiffness: 300,
  damping: 30,
};

export const easingConfig = {
  easeOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  easeIn: "cubic-bezier(0.4, 0, 1, 1)",
  easeInOut: "cubic-bezier(0.4, 0, 0.2, 1)",
  spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
};

export const durationConfig = {
  fast: 200,
  normal: 300,
  slow: 500,
};

export const cardExitAnimation = {
  initial: { scale: 1, rotate: 0, x: 0, opacity: 1 },
  exit: { 
    scale: 0.8, 
    rotate: -10, 
    x: "120%", 
    opacity: 0,
    transition: { duration: 0.6, ease: easingConfig.easeOut }
  }
};

export const cardEntranceAnimation = {
  initial: { x: "100%", scale: 0.9, opacity: 0 },
  animate: { 
    x: 0, 
    scale: 1, 
    opacity: 1,
    transition: { 
      duration: 0.4, 
      ease: easingConfig.spring 
    }
  }
};

export const confettiParticleAnimation = {
  initial: { scale: 0, y: 0, opacity: 1 },
  animate: { 
    scale: 1, 
    y: -100, 
    opacity: 0,
    transition: { duration: 1, ease: easingConfig.easeOut }
  }
};

export const checkmarkAnimation = {
  initial: { pathLength: 0 },
  animate: { 
    pathLength: 1,
    transition: { duration: 0.5, ease: easingConfig.easeOut }
  }
};
