import React, { useEffect, useState, useRef } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  formatString?: (val: number) => string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({ value, duration = 1500, formatString }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Reset animation if target value changes
    startTimeRef.current = null;
    countRef.current = count;
    
    const animate = (time: number) => {
      if (!startTimeRef.current) startTimeRef.current = time;
      const progress = time - startTimeRef.current;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function (easeOutExpo) for a smooth finish
      const easeProgress = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      
      const nextCount = Math.floor(countRef.current + (value - countRef.current) * easeProgress);
      setCount(nextCount);
      
      if (progress < duration) {
        requestRef.current = requestAnimationFrame(animate);
      } else {
        setCount(value);
      }
    };
    
    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [value, duration]);

  if (formatString) {
    return <span>{formatString(count)}</span>;
  }
  
  return <span>{count.toLocaleString()}</span>;
};

export default AnimatedCounter;
