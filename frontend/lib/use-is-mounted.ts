import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

/** True only after client-side hydration; avoids SSR/CSR mismatches without setState-in-effect. */
export function useIsMounted(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
