/**
 * Simple toast hook - temporary implementation
 * TODO: Replace with proper toast library like react-hot-toast
 */
export function useToast() {
  return {
    success: (message: string) => {
      console.log('[SUCCESS]:', message);
      // Temporary: Using alert for now
      if (typeof window !== 'undefined') {
        // You can replace this with a proper toast notification later
        const event = new CustomEvent('toast', {
          detail: { type: 'success', message }
        });
        window.dispatchEvent(event);
      }
    },
    error: (message: string) => {
      console.error('[ERROR]:', message);
      // Temporary: Using alert for now
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toast', {
          detail: { type: 'error', message }
        });
        window.dispatchEvent(event);
      }
    },
    info: (message: string) => {
      console.info('[INFO]:', message);
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toast', {
          detail: { type: 'info', message }
        });
        window.dispatchEvent(event);
      }
    },
    warning: (message: string) => {
      console.warn('[WARNING]:', message);
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('toast', {
          detail: { type: 'warning', message }
        });
        window.dispatchEvent(event);
      }
    },
  };
}
