import { createContext, Fragment, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

const DataRootContext = createContext<{ reloadAll: () => void } | null>(null);

/**
 * Wraps all data providers. Bumping the epoch remounts them, so they reload their data from storage
 * (used after importing a backup).
 */
export function DataRoot({ children }: { children: ReactNode }) {
  const [epoch, setEpoch] = useState(0);
  const reloadAll = useCallback(() => setEpoch((e) => e + 1), []);
  const value = useMemo(() => ({ reloadAll }), [reloadAll]);
  return (
    <DataRootContext.Provider value={value}>
      <Fragment key={epoch}>{children}</Fragment>
    </DataRootContext.Provider>
  );
}

export function useDataReload(): () => void {
  const ctx = useContext(DataRootContext);
  if (!ctx) throw new Error('useDataReload must be used inside <DataRoot>');
  return ctx.reloadAll;
}
