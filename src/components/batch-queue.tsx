"use client";

import { CheckCircle, XCircle, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { BatchItem } from "@/hooks/use-batch";

interface BatchQueueProps<T extends BatchItem> {
  items: T[];
  onRemove: (id: string) => void;
  onSubmit: () => void;
  submitting: boolean;
  progress: number;
  singular: string;
  plural: string;
  emptyHint?: string;
  renderItem: (item: T) => React.ReactNode;
}

export function BatchQueue<T extends BatchItem>({ items, onRemove, onSubmit, submitting, progress, singular, plural, emptyHint, renderItem }: BatchQueueProps<T>) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        {emptyHint || `Adicione ${plural} ao lote antes de enviar.`}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
        <span className="text-sm font-bold text-card-foreground">
          Lote — {items.length} {items.length === 1 ? singular : plural}
        </span>
        {submitting && <span className="text-xs text-muted-foreground">{progress}%</span>}
      </div>

      {submitting && <Progress value={progress} className="h-1 rounded-none" />}

      <div className="divide-y divide-border/50 max-h-72 overflow-y-auto">
        {items.map((item) => (
          <div key={item._id} className="flex items-start gap-3 px-4 py-3">
            <div className="flex-1 min-w-0">{renderItem(item)}</div>
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              {item.status === "success" && <CheckCircle className="h-4 w-4 text-emerald-500" />}
              {item.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
              {item.status !== "success" && !submitting && (
                <button onClick={() => onRemove(item._id)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-3 border-t border-border bg-muted/20">
        <Button onClick={onSubmit} disabled={submitting} className="w-full font-bold tracking-wide">
          {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> ENVIANDO...</> : `ENVIAR LOTE (${items.length})`}
        </Button>
      </div>
    </div>
  );
}
