import { useEffect, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  enabled?: boolean;
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 80, 
  enabled = true 
}: UsePullToRefreshOptions) {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const isRefreshing = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing.current) return;
    
    const container = containerRef.current;
    if (!container) return;

    // Only trigger if at the top of the scrollable area
    if (container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
    }
  }, [enabled]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || isRefreshing.current || startY.current === 0) return;
    
    const container = containerRef.current;
    if (!container) return;

    currentY.current = e.touches[0].clientY;
    const deltaY = currentY.current - startY.current;

    // Only allow downward pull when at the top
    if (container.scrollTop <= 0 && deltaY > 0) {
      e.preventDefault();
      
      // Add visual feedback
      const pullDistance = Math.min(deltaY, threshold);
      const scale = 1 + (pullDistance / threshold) * 0.1;
      
      container.style.transform = `scale(${scale})`;
      container.style.transition = 'transform 0.1s ease-out';
    }
  }, [enabled, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || isRefreshing.current || startY.current === 0) return;
    
    const container = containerRef.current;
    if (!container) return;

    const deltaY = currentY.current - startY.current;
    
    // Reset visual feedback
    container.style.transform = '';
    container.style.transition = '';

    // Trigger refresh if threshold is met
    if (deltaY >= threshold) {
      isRefreshing.current = true;
      
      try {
        await onRefresh();
      } finally {
        isRefreshing.current = false;
      }
    }

    // Reset values
    startY.current = 0;
    currentY.current = 0;
  }, [enabled, threshold, onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return { containerRef, isRefreshing: isRefreshing.current };
}

