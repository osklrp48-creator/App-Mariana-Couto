import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

interface Entity {
  id: string;
}

interface CollectionConfig<Row extends object, T extends Entity> {
  table: string;
  mapRow: (row: Row) => T;
  mirror?: (rows: T[]) => void | Promise<void>;
}

interface CollectionResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
}

/**
 * Loads a table scoped to the signed-in user (enforced by RLS) and keeps it
 * live across devices via Supabase Realtime. Optionally mirrors the full
 * list into a local store (Dexie) as a read-only cache for the service
 * worker's notification checks.
 */
export function useCloudCollection<Row extends object, T extends Entity>({
  table,
  mapRow,
  mirror,
}: CollectionConfig<Row, T>): CollectionResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let channelName = "";

    async function init() {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId || !active) {
        setLoading(false);
        return;
      }

      const { data: rows, error: fetchError } = await supabase.from(table).select("*");
      if (!active) return;

      if (fetchError) {
        setError(fetchError.message);
        setLoading(false);
        return;
      }

      const entities = ((rows ?? []) as Row[]).map(mapRow);
      setData(entities);
      mirror?.(entities);
      setLoading(false);

      channelName = `${table}-${userId}`;
      const channel = supabase
        .channel(channelName)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table, filter: `user_id=eq.${userId}` },
          (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
            setData((prev) => {
              let next: T[];
              if (payload.eventType === "DELETE") {
                const oldId = (payload.old as Partial<Entity>).id;
                next = prev.filter((e) => e.id !== oldId);
              } else {
                const entity = mapRow(payload.new as Row);
                const idx = prev.findIndex((e) => e.id === entity.id);
                next = idx >= 0 ? [...prev.slice(0, idx), entity, ...prev.slice(idx + 1)] : [...prev, entity];
              }
              mirror?.(next);
              return next;
            });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }

    const cleanupPromise = init();

    return () => {
      active = false;
      cleanupPromise.then((cleanup) => cleanup?.());
    };
  }, [table]);

  return { data, loading, error };
}
