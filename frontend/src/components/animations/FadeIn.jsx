import { useRef, forwardRef } from 'react';
import { useFadeIn } from '../../hooks/useGsapAnimation';

/**
 * FadeIn animation component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements
 * @param {number} props.duration - Animation duration (default: 0.6)
 * @param {number} props.delay - Animation delay (default: 0)
 * @param {number} props.y - Y distance to move (default: 20)
 * @param {string} props.ease - Easing function (default: 'power2.out')
 * @param {string} props.className - Additional CSS classes
 */
export const FadeIn = forwardRef(
  (
    {
      children,
      duration = 0.6,
      delay = 0,
      y = 20,
      ease = 'power2.out',
      className = '',
    },
    externalRef
  ) => {
    const internalRef = useRef(null);
    const ref = externalRef || internalRef;

    useFadeIn(ref, { duration, delay, y, ease });

    return <div ref={ref} className={className}>{children}</div>;
  }
);

FadeIn.displayName = 'FadeIn';
