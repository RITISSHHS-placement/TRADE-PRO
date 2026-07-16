import { useRef, forwardRef } from 'react';
import { useHoverAnimation } from '../../hooks/useGsapTimeline';

/**
 * HoverScale animation component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements
 * @param {number} props.scale - Scale amount on hover (default: 1.05)
 * @param {number} props.duration - Animation duration (default: 0.3)
 * @param {string} props.ease - Easing function (default: 'power2.out')
 * @param {string} props.className - Additional CSS classes
 */
export const HoverScale = forwardRef(
  (
    {
      children,
      scale = 1.05,
      duration = 0.3,
      ease = 'power2.out',
      className = '',
    },
    externalRef
  ) => {
    const internalRef = useRef(null);
    const ref = externalRef || internalRef;

    useHoverAnimation(ref, { scale, duration, ease });

    return <div ref={ref} className={className}>{children}</div>;
  }
);

HoverScale.displayName = 'HoverScale';
