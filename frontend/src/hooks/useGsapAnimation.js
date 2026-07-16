import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Simple fade-in animation hook
 * @param {React.RefObject} target - Target ref to animate
 * @param {Object} options - Animation options
 */
export const useFadeIn = (target, options = {}) => {
  const { duration = 0.6, delay = 0, y = 20, ease = 'power2.out' } = options;

  useEffect(() => {
    if (!target.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(target.current, 
        { opacity: 0, y },
        { opacity: 1, y: 0, duration, delay, ease }
      );
    }, target);

    return () => ctx.revert();
  }, [target, duration, delay, y, ease]);
};

/**
 * Simple slide-up animation hook
 * @param {React.RefObject} target - Target ref to animate
 * @param {Object} options - Animation options
 */
export const useSlideUp = (target, options = {}) => {
  const { duration = 0.8, delay = 0, distance = 50, ease = 'power3.out' } = options;

  useEffect(() => {
    if (!target.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(target.current,
        { opacity: 0, y: distance },
        { opacity: 1, y: 0, duration, delay, ease }
      );
    }, target);

    return () => ctx.revert();
  }, [target, duration, delay, distance, ease]);
};

/**
 * Simple scale-in animation hook
 * @param {React.RefObject} target - Target ref to animate
 * @param {Object} options - Animation options
 */
export const useScaleIn = (target, options = {}) => {
  const { duration = 0.5, delay = 0, fromScale = 0.8, ease = 'back.out(1.7)' } = options;

  useEffect(() => {
    if (!target.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(target.current,
        { opacity: 0, scale: fromScale },
        { opacity: 1, scale: 1, duration, delay, ease }
      );
    }, target);

    return () => ctx.revert();
  }, [target, duration, delay, fromScale, ease]);
};
