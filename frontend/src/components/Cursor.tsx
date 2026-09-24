import { useEffect, useState, useRef } from 'react';

const Cursor = () => {
  const [isVisible, setIsVisible] = useState(false);
  
  const cursorOutlineRef = useRef<HTMLDivElement>(null);
  const cursorDotRef = useRef<HTMLDivElement>(null);
  
  const endX = useRef(0);
  const endY = useRef(0);
  const _x = useRef(0);
  const _y = useRef(0);
  const requestRef = useRef<number | null>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      endX.current = e.clientX;
      endY.current = e.clientY;
      setIsVisible(true);
      
      if (cursorDotRef.current) {
        // Dot is 8x8 (w-2 h-2), so center offset is 4px
        cursorDotRef.current.style.transform = `translate3d(${e.clientX - 4}px, ${e.clientY - 4}px, 0)`;
      }
    };

    const animate = () => {
      _x.current += (endX.current - _x.current) / 3;
      _y.current += (endY.current - _y.current) / 3;
      
      if (cursorOutlineRef.current) {
        // Outline is 32x32 (w-8 h-8), so center offset is 16px
        cursorOutlineRef.current.style.transform = `translate3d(${_x.current - 16}px, ${_y.current - 16}px, 0)`;
      }
      
      requestRef.current = requestAnimationFrame(animate);
    };

    const onMouseLeave = () => setIsVisible(false);
    const onMouseEnter = () => setIsVisible(true);

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseleave', onMouseLeave);
    document.addEventListener('mouseenter', onMouseEnter);
    requestRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);
      document.removeEventListener('mouseenter', onMouseEnter);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <>
      <div 
        ref={cursorDotRef}
        className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999]"
        style={{ backgroundColor: 'var(--color-primary)' }}
      />
      <div 
        ref={cursorOutlineRef}
        className="fixed top-0 left-0 w-8 h-8 bg-transparent border-[1.5px] rounded-full pointer-events-none z-[9998] transition-transform duration-100 ease-out"
        style={{ borderColor: 'var(--color-primary)' }}
      />
      <style>{`
        @media (pointer: fine) {
          body * {
            cursor: none !important;
          }
        }
      `}</style>
    </>
  );
};

export default Cursor;
