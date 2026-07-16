import { useRef, forwardRef } from 'react';
import { useStagger } from '../../hooks/useGsapTimeline';

/**
 * Stagger animation component for lists and grids
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements
 * @param {number} props.stagger - Stagger amount between items (default: 0.1)
 * @param {number} props.duration - Animation duration (default: 0.5)
 * @param {string} props.ease - Easing function (default: 'power2.out')
 * @param {string} props.className - Additional CSS classes
 */
export const Stagger = forwardRef(
  (
    {
      children,
      stagger = 0.1,
      duration = 0.5,
      ease = 'power2.out',
      className = '',
    },
    externalRef
  ) => {
    const internalRef = useRef(null);
    const containerRef = externalRef || internalRef;

    useStagger(containerRef, { stagger, duration, ease });

    return (
      <div ref={containerRef} className={className}>
        {children}
      </div>
    );
  }
);

Stagger.displayName = 'Stagger';
