import { useRef, forwardRef } from 'react';
import { useParallax } from '../../hooks/useScrollTrigger';

/**
 * Parallax scroll effect component
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements
 * @param {number} props.speed - Parallax speed (default: 0.5)
 * @param {string} props.direction - Direction 'y' or 'x' (default: 'y')
 * @param {string} props.className - Additional CSS classes
 */
export const Parallax = forwardRef(
  (
    {
      children,
      speed = 0.5,
      direction = 'y',
      className = '',
    },
    externalRef
  ) => {
    const internalRef = useRef(null);
    const ref = externalRef || internalRef;

    useParallax(ref, { speed, direction });

    return <div ref={ref} className={className}>{children}</div>;
  }
);

Parallax.displayName = 'Parallax';
