import { useState, useCallback } from "react";

export interface BatchItem {
  _id: string;
  status?: "pending" | "success" | "error";
}

export function useBatch<T extends BatchItem>() {
  const [queue, setQueue] = useState<T[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const add = useCallback((item: Omit<T, "_id" | "status">) => {
    setQueue((prev) => [...prev, { ...item, _id: `${Date.now()}-${Math.random()}`, status: "pending" } as T]);
  }, []);

  const remove = useCallback((id: string) => {
    setQueue((prev) => prev.filter((i) => i._id !== id));
  }, []);

  const clear = useCallback(() => setQueue([]), []);

  const clearSuccesses = useCallback(() => {
    setQueue((prev) => prev.filter((i) => i.status !== "success"));
  }, []);

  const run = useCallback(async (fn: (item: T) => Promise<boolean>) => {
    if (!queue.length) return null;
    setSubmitting(true);
    setProgress(0);
    let errors = 0;
    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];
      const ok = await fn(item).catch(() => false);
      setQueue((prev) =>
        prev.map((q) => q._id === item._id ? { ...q, status: ok ? "success" : "error" } : q)
      );
      if (!ok) errors++;
      setProgress(Math.round(((i + 1) / queue.length) * 100));
    }
    setSubmitting(false);
    return { total: queue.length, errors };
  }, [queue]);

  return { queue, submitting, progress, add, remove, clear, clearSuccesses, run };
}
