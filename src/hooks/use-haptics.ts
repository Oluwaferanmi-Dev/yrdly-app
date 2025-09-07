import { useCallback } from 'react';

// Haptic feedback types
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export function useHaptics() {
  const triggerHaptic = useCallback(async (type: HapticType = 'light') => {
    try {
      // Only import and use Capacitor Haptics on mobile
      if (typeof window !== 'undefined' && 'Capacitor' in window) {
        const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
        
        switch (type) {
          case 'light':
            await Haptics.impact({ style: ImpactStyle.Light });
            break;
          case 'medium':
            await Haptics.impact({ style: ImpactStyle.Medium });
            break;
          case 'heavy':
            await Haptics.impact({ style: ImpactStyle.Heavy });
            break;
          case 'success':
            await Haptics.notification({ type: NotificationType.Success });
            break;
          case 'warning':
            await Haptics.notification({ type: NotificationType.Warning });
            break;
          case 'error':
            await Haptics.notification({ type: NotificationType.Error });
            break;
          default:
            await Haptics.impact({ style: ImpactStyle.Light });
        }
      }
    } catch (error) {
      // Fallback for web or if haptics fail
      console.log('Haptic feedback not available:', error);
    }
  }, []);

  return { triggerHaptic };
}
