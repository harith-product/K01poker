import { useState, useCallback } from 'react';

export function useToast() {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const toast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  }, []);

  return { message, toast };
}
