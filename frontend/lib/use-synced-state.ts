import { useState, type Dispatch, type SetStateAction } from "react";

/** Local editable copy of `value` that snaps back in sync whenever `value` changes externally. */
export function useSyncedState<T>(value: T): [T, Dispatch<SetStateAction<T>>] {
  const [local, setLocal] = useState(value);
  const [prev, setPrev] = useState(value);

  if (value !== prev) {
    setPrev(value);
    setLocal(value);
  }

  return [local, setLocal];
}
