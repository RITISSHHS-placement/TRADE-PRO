import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Simple scroll-triggered animation hook
 * @param {React.RefObject} target - Target ref to animate
 * @param {Object} options - Animation options
 */
export const useScrollAnimation = (target, options = {}) => {
  const { 
    duration = 0.8, 
    delay = 0, 
    y = 50, 
    ease = 'power3.out',
    start = 'top 80%',
    toggleActions = 'play none none reverse'
  } = options;

  useEffect(() => {
    if (!target.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(target.current,
        { opacity: 0, y },
        { 
          opacity: 1, 
          y: 0, 
          duration, 
          delay, 
          ease,
          scrollTrigger: {
            trigger: target.current,
            start,
            toggleActions,
          }
        }
      );
    }, target);

    return () => ctx.revert();
  }, [target, duration, delay, y, ease, start, toggleActions]);
};

/**
 * Simple staggered scroll animation for lists
 * @param {React.RefObject} target - Container ref with children
 * @param {Object} options - Animation options
 */
export const useScrollStagger = (target, options = {}) => {
  const { 
    duration = 0.5, 
    stagger = 0.1, 
    y = 30, 
    ease = 'power2.out',
    start = 'top 85%'
  } = options;

  useEffect(() => {
    if (!target.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(target.current.children,
        { opacity: 0, y },
        { 
          opacity: 1, 
          y: 0, 
          duration, 
          stagger,
          ease,
          scrollTrigger: {
            trigger: target.current,
            start,
          }
        }
      );
    }, target);

    return () => ctx.revert();
  }, [target, duration, stagger, y, ease, start]);
};

/**
 * Parallax scroll effect hook
 * @param {React.RefObject} target - Target ref to apply parallax to
 * @param {Object} options - { speed, direction }
 */
export const useParallax = (target, options = {}) => {
  const { speed = 0.5, direction = 'y' } = options;

  useEffect(() => {
    if (!target.current) return;

    const ctx = gsap.context(() => {
      gsap.to(target.current, {
        [direction]: () => -ScrollTrigger.maxScroll(window) * speed,
        ease: 'none',
        scrollTrigger: {
          trigger: target.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      });
    }, target);

    return () => ctx.revert();
  }, [target, speed, direction]);
};
