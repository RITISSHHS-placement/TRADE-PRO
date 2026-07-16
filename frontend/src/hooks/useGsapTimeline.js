import { useEffect, useRef } from 'react';
import gsap from 'gsap';

/**
 * Simple staggered animation hook for children elements
 * @param {React.RefObject} target - Container ref with children
 * @param {Object} options - Animation options
 */
export const useStagger = (target, options = {}) => {
  const { 
    duration = 0.5, 
    stagger = 0.1, 
    y = 20, 
    scale = 0.95,
    ease = 'power2.out',
    delay = 0
  } = options;

  useEffect(() => {
    if (!target.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(target.current.children,
        { opacity: 0, y, scale },
        { 
          opacity: 1, 
          y: 0, 
          scale: 1, 
          duration, 
          stagger,
          delay,
          ease
        }
      );
    }, target);

    return () => ctx.revert();
  }, [target, duration, stagger, y, scale, ease, delay]);
};

/**
 * Simple hover animation hook
 * @param {React.RefObject} target - Target ref to animate
 * @param {Object} options - Animation options
 */
export const useHoverAnimation = (target, options = {}) => {
  const { 
    scale = 1.05, 
    duration = 0.3, 
    ease = 'power2.out' 
  } = options;

  useEffect(() => {
    if (!target.current) return;

    const element = target.current;
    
    const handleMouseEnter = () => {
      gsap.to(element, { scale, duration, ease });
    };

    const handleMouseLeave = () => {
      gsap.to(element, { scale: 1, duration, ease });
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [target, scale, duration, ease]);
};
