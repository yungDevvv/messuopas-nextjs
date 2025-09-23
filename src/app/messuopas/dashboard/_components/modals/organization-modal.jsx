"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * OrganizationModal
 * Reusable modal to edit organization name.
 */
export default function OrganizationModal({ open, onOpenChange, defaultName = "", onSave, title = "Muokkaa organisaation nimeä" }) {
  const [name, setName] = useState(defaultName);

  // Inline comment: sync local state when defaultName changes or when opened
  useEffect(() => {
    setName(defaultName || "");
  }, [defaultName, open]);

  const handleSave = async () => {
    // Inline comment: minimal validation
    const next = (name || "").trim();
    if (!next) return;
    await onSave?.(next);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-2 mt-2">
          <Label htmlFor="org-name-input">Organisaation nimi</Label>
          <Input id="org-name-input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost" type="button">Peruuta</Button>
          </DialogClose>
          <Button type="button" onClick={handleSave} disabled={!name.trim()}>Tallenna</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
//TODO: 