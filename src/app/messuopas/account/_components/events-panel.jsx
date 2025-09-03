"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

/* Block comment: A reusable dialog to manage member's access to organization events */
export default function EventsAccessDialog({
  open,
  onOpenChange,
  member,              // { name, email, accessibleEventsIds, $id }
  events = [],         // array of events: [{ $id, name }, ...]
  onSave,              // (selectedIds: string[]) => void
}) {
  const [selected, setSelected] = useState([]);
console.log(member, "member123123")
  // Inline comment: initialize from member when dialog opens or member changes
  useEffect(() => {
    if (open) {
      setSelected(Array.isArray(member?.accessibleEventsIds) ? member.accessibleEventsIds : []);
    }
  }, [open, member]);

  // Inline comment: toggle helper
  const toggle = (id) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
console.log(selected, "asdasdasdasdasdasd")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Messujen käyttöoikeudet</DialogTitle>
          <DialogDescription>
            {/* Inline comment: member label */}
            {member ? `${member.name || member.email} – valitse tapahtumat` : ""}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-64 pr-2">
          <div className="space-y-2">
            {Array.isArray(events) && events.length > 0 ? (
              events.map((ev) => (
                <label key={ev.$id} className="flex items-start gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 p-2">
                  <Checkbox
                    checked={selected.includes(ev.$id)}
                    onCheckedChange={() => toggle(ev.$id)}
                  />
                  <div className="leading-tight">
                    <div className="text-sm font-medium">{ev.name}</div>
                    <div className="text-xs text-muted-foreground">{ev.$id}</div>
                  </div>
                </label>
              ))
            ) : (
              <div className="text-sm text-muted-foreground">Ei messuja organisaatiossa</div>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange?.(false)}>Peruuta</Button>
          <Button onClick={() => onSave?.(selected)}>Tallenna</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}