import NetInfo, { type NetInfoState } from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';

/**
 * Connectivity state for the header chip and the Ask flow.
 *
 * NetInfo reports `isInternetReachable` as null while it is still testing, so a
 * null value is treated as "assume online" to avoid a false offline label.
 */
export function useNetworkStatus(): {
  isOnline: boolean;
  isChecking: boolean;
  connectionType: string;
  refresh: () => void;
} {
  const [state, setState] = useState<NetInfoState | null>(null);
  const [isChecking, setChecking] = useState(true);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((next) => {
      setState(next);
      setChecking(false);
    });
    NetInfo.fetch()
      .then((next) => {
        setState(next);
        setChecking(false);
      })
      .catch(() => setChecking(false));
    return unsubscribe;
  }, []);

  const refresh = useCallback(() => {
    setChecking(true);
    NetInfo.fetch()
      .then((next) => setState(next))
      .catch(() => undefined)
      .finally(() => setChecking(false));
  }, []);

  const isOnline = state
    ? Boolean(state.isConnected) && state.isInternetReachable !== false
    : true;

  return {
    isOnline,
    isChecking,
    connectionType: state?.type ?? 'unknown',
    refresh,
  };
}
