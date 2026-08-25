import { useEffect, useRef } from 'react';
import { reconnectSupabaseAuth } from '@/react-app/supabase';

// Watchdog global de reconexão. Resolve o problema de troca de rede (Wi-Fi -> 4G no Android):
//  1. Valida e renova a sessão JWT autêntica
//  2. Dispara os callbacks de refetch registrados pelas telas
const listeners = new Set<() => void>();
let lastTrigger = 0;

export async function triggerReconnect() {
  const now = Date.now();
  // Evita disparos em rajada (online + visibilitychange + focus juntos)
  if (now - lastTrigger < 1500) return;
  lastTrigger = now;

  await reconnectSupabaseAuth();

  // Notifica todas as telas registradas para refazerem as consultas
  listeners.forEach((cb) => {
    try {
      cb();
    } catch (e) {
      console.warn(e);
    }
  });
}

export function useNetworkReconnect(onReconnect: () => void) {
  const cbRef = useRef(onReconnect);
  cbRef.current = onReconnect;

  useEffect(() => {
    const handler = () => cbRef.current();
    listeners.add(handler);

    const onOnline = () => { triggerReconnect(); };
    const onVisibility = () => {
      if (document.visibilityState === 'visible') triggerReconnect();
    };

    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      listeners.delete(handler);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);
}
