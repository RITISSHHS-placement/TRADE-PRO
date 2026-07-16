import { useRef, forwardRef } from 'react';
import { useScrollAnimation } from '../../hooks/useScrollTrigger';

/**
 * SlideUp animation component with scroll trigger
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements
 * @param {number} props.duration - Animation duration (default: 0.8)
 * @param {number} props.distance - Distance to slide (default: 50)
 * @param {string} props.ease - Easing function (default: 'power3.out')
 * @param {string} props.className - Additional CSS classes
 */
export const SlideUp = forwardRef(
  (
    {
      children,
      duration = 0.8,
      distance = 50,
      ease = 'power3.out',
      className = '',
    },
    externalRef
  ) => {
    const internalRef = useRef(null);
    const ref = externalRef || internalRef;

    useScrollAnimation(ref, { duration, y: distance, ease });

    return (
      <div
        ref={ref}
        className={className}
        style={{ opacity: 0, transform: `translateY(${distance}px)` }}
      >
        {children}
      </div>
    );
  }
);

SlideUp.displayName = 'SlideUp';
