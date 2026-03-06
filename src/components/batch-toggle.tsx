"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function BatchToggle({ id, checked, onCheckedChange }: { id: string; checked: boolean; onCheckedChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor={id} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground cursor-pointer select-none">
        Modo Lote
      </Label>
    </div>
  );
}
