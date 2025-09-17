"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

/* Block comment: A reusable dialog to manage member's access to organization events */
export default function EventsAccessDialog({
  open,
  onOpenChange,
  member,              // { name, email, accessibleEventsIds, $id }
  events = [],         // array of events: [{ $id, name }, ...]
  onSave,              // (selectedIds: string[]) => void
}) {
  const [selected, setSelected] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");

  // Inline comment: initialize from member when dialog opens or member changes
  useEffect(() => {
    if (open) {
      setSelected(Array.isArray(member?.accessibleEventsIds) ? member.accessibleEventsIds : []);
      setErrorMessage(""); // Clear any previous error
    }
  }, [open, member]);

  // Inline comment: toggle helper
  const toggle = (id) => {
    setErrorMessage(""); // Clear error when user makes changes
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  // Handle save with validation and active event management
  const handleSave = () => {
    console.log("=== EVENTS PANEL SAVE ===");
    console.log("Member:", member);
    console.log("Selected events:", selected);
    console.log("Member activeEventId:", member?.activeEventId);

    // Check if user would have no events left - prevent this
    if (selected.length === 0) {
      console.log("ERROR: User would have no events left!");
      setErrorMessage(`Käyttäjä "${member?.name || member?.email}" tarvitsee vähintään yhden messun käyttöoikeuden`);
      return;
    }

    // Check if we're removing the user's active event
    const isRemovingActiveEvent = member?.activeEventId && !selected.includes(member.activeEventId);
    console.log("Is removing active event?", isRemovingActiveEvent);

    if (isRemovingActiveEvent) {
      // Set new active event to the first available event
      const newActiveEventId = selected[0];
      console.log(`🔄 CHANGING ACTIVE EVENT for ${member?.name} from ${member.activeEventId} to ${newActiveEventId}`);
      toast.info(`Käyttäjän "${member?.name || member?.email}" aktiivinen messu vaihdettu`);
      
      // Call onSave with both selected events and new active event
      onSave?.(selected, newActiveEventId);
    } else {
      console.log("Active event is NOT being removed, no change needed");
      // Call onSave with just selected events
      onSave?.(selected);
    }
  };

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

        {errorMessage && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
            {errorMessage}
          </div>
        )}

        <ScrollArea className="max-h-64 pr-2">
          <div className="space-y-2">
            {Array.isArray(events) && events.length > 0 ? (
              events.map((ev) => (
                <label key={ev.$id} className="flex items-start gap-3 rounded-md border border-zinc-200 dark:border-zinc-800 p-4">
                  <Checkbox
                    checked={selected.includes(ev.$id)}
                    onCheckedChange={() => toggle(ev.$id)}
                  />
                  <div className="leading-tight">
                    <div className="text-sm font-medium">{ev.name}</div>
                    {/* <div className="text-xs text-muted-foreground">{ev.$id}</div> */}
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
          <Button onClick={handleSave}>Tallenna</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}