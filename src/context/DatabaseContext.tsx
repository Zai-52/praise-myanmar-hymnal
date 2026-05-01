import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type * as SQLite from "expo-sqlite";
import hymnsData from "../../assets/hymns.json";
import { initDatabase } from "../db/database";
import type { HymnJson } from "../types/hymn";

type Ctx = {
  db: SQLite.SQLiteDatabase | null;
  ready: boolean;
  error: Error | null;
};

const DatabaseContext = createContext<Ctx>({ db: null, ready: false, error: null });

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [db, setDb] = useState<SQLite.SQLiteDatabase | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const database = await initDatabase(hymnsData as HymnJson[]);
        if (!cancelled) {
          setDb(database);
          setReady(true);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => ({ db, ready, error }), [db, ready, error]);
  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase() {
  return useContext(DatabaseContext);
}
