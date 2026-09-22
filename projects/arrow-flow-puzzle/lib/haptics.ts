// Haptic feedback engine for Android native + Mobile Web fallback

export async function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'selection' | 'error') {
  if (typeof window === 'undefined') return;

  try {
    const { Haptics, ImpactStyle, NotificationType } = await import('@capacitor/haptics');
    if (Haptics) {
      if (type === 'light') {
        await Haptics.impact({ style: ImpactStyle.Light });
        return;
      } else if (type === 'medium') {
        await Haptics.impact({ style: ImpactStyle.Medium });
        return;
      } else if (type === 'heavy') {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        return;
      } else if (type === 'selection') {
        await Haptics.selectionChanged();
        return;
      } else if (type === 'error') {
        await Haptics.notification({ type: NotificationType.Error });
        return;
      }
    }
  } catch {
    // Fallback to browser vibration API if Capacitor is unavailable or on web
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        if (type === 'light') navigator.vibrate(15);
        else if (type === 'medium') navigator.vibrate(35);
        else if (type === 'heavy') navigator.vibrate(70);
        else if (type === 'error') navigator.vibrate([30, 40, 30]);
      }
    } catch {
      // Ignore vibration error
    }
  }
}
