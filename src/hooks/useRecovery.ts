import { useEffect } from 'react';
import type { AppEvent } from '../types';
import { loadSession } from '../lib/storage';

export function useRecovery(dispatch: React.Dispatch<AppEvent>): void {
  useEffect(() => {
    const session = loadSession();
    if (session) {
      dispatch({ type: 'RESTORE', session });
    }
  }, [dispatch]);
}
