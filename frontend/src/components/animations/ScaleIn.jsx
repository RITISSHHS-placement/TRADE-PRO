import { useRef, forwardRef } from 'react';
import { useScaleIn } from '../../hooks/useGsapAnimation';

/**
 * ScaleIn animation component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements
 * @param {number} props.duration - Animation duration (default: 0.5)
 * @param {number} props.delay - Animation delay (default: 0)
 * @param {number} props.fromScale - Starting scale (default: 0.8)
 * @param {string} props.ease - Easing function (default: 'back.out(1.7)')
 * @param {string} props.className - Additional CSS classes
 */
export const ScaleIn = forwardRef(
  (
    {
      children,
      duration = 0.5,
      delay = 0,
      fromScale = 0.8,
      ease = 'back.out(1.7)',
      className = '',
    },
    externalRef
  ) => {
    const internalRef = useRef(null);
    const ref = externalRef || internalRef;

    useScaleIn(ref, { duration, delay, fromScale, ease });

    return <div ref={ref} className={className}>{children}</div>;
  }
);

ScaleIn.displayName = 'ScaleIn';
