
import React, { useEffect, useState, useRef } from 'react';

interface AnimatedNumberProps extends React.HTMLAttributes<HTMLSpanElement> {
  value: number;
  duration?: number;
  className?: string;
}

const AnimatedNumber = ({ value, duration = 1000, ...props }: AnimatedNumberProps) => {
  const [displayValue, setDisplayValue] = useState(0);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const startValue = prevValueRef.current;
    let startTime: number | null = null;
    let animationFrameId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // easeOutQuint
      const easedValue = startValue + (value - startValue) * (1 - Math.pow(1 - percentage, 5));
      
      setDisplayValue(easedValue);

      if (progress < duration) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        setDisplayValue(value); // Ensure it ends on the exact value
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
        prevValueRef.current = value;
        cancelAnimationFrame(animationFrameId)
    };
  }, [value, duration]);

  return (
    <span {...props}>
      {Math.round(displayValue)}
    </span>
  );
};
AnimatedNumber.displayName = 'AnimatedNumber';

export { AnimatedNumber };
