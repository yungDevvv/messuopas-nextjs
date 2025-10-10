"use client"

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useModal } from "@/hooks/use-modal";
import { listDocuments, updateDocument } from "@/lib/appwrite/server";
import { toast } from "sonner";
import { Loader2, Building2, Info, Shield } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";

export default function SectionPermissionsModal() {
  const { type, isOpen, onClose, data } = useModal();
  const isModalOpen = isOpen && type === "section-permissions-modal";

  const section = data?.section || null;

  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]); // org ids that have access now
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifySelection, setNotifySelection] = useState([]);
  const router = useRouter();
  // filter
  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return organizations;
    return organizations.filter((o) => (o.name || "").toLowerCase().includes(s));
  }, [organizations, search]);

  // load orgs and current permissions from section
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        if (!isModalOpen) return;
        setIsLoading(true);
        const { data: orgs = [] } = await listDocuments("main_db", "organizations");
        const { data: usersData = [] } = await listDocuments("main_db", "users");
        if (!cancelled) {
          setOrganizations(orgs || []);
          setUsers(usersData || []);
        }
        // prefill from section.appliedOrganizations
        const applied = Array.isArray(section?.appliedOrganizations)
          ? section.appliedOrganizations.map((o) => o?.$id ?? o)
          : [];
        if (!cancelled) setSelected(applied);
      } catch (e) {
        console.error("Failed to load organizations", e);
        toast.error("Organisaatioiden lataus epäonnistui");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    load();
    return () => { cancelled = true };
  }, [isModalOpen, section?.$id]);

  // set access now (manual) with optimistic save to initial_sections
  const setAccessNow = async (orgId) => {
    if (!section?.$id) return;
    setSelected((prev) => (prev.includes(orgId) ? prev : [...prev, orgId]));
    try {
      const next = (prev => (prev.includes(orgId) ? prev : [...prev, orgId]))(selected);
      const { error } = await updateDocument("main_db", "initial_sections", section.$id, {
        appliedOrganizations: next,
      });
      if (error) throw error;
      router.refresh();
      toast.success("Otettu käyttöön");
    } catch (e) {
      // rollback
      setSelected((prev) => prev.filter((id) => id !== orgId));
      console.error("Failed to enable org", e);
      toast.error("Käyttöönotto epäonnistui");
    }
  }; 

  // remove access now (manual) with optimistic save to initial_sections
  const removeAccess = async (orgId) => {
    if (!section?.$id) return;
    const prevSnapshot = selected;
    setSelected((prev) => prev.filter((id) => id !== orgId));
    try {
      const next = prevSnapshot.filter((id) => id !== orgId);
      const { error } = await updateDocument("main_db", "initial_sections", section.$id, {
        appliedOrganizations: next,
      });
      if (error) throw error;
      router.refresh();
      toast.success("Poistettu käytöstä");
    } catch (e) {
      // rollback
      setSelected(prevSnapshot);
      console.error("Failed to disable org", e);
      toast.error("Poisto epäonnistui");
    }
  };

 
  return (
    <Dialog open={isModalOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Osion käyttöoikeudet
            <span className="text-muted-foreground">— {section?.title}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info banner */}
          <div className="flex items-start gap-2 rounded-md border p-3 bg-amber-50 dark:bg-zinc-900/40">
            <Info className="w-4 h-4 mt-0.5 text-amber-600" />
            <div className="text-sm leading-snug">
              <div className="font-medium">Uusi osio EI ole oletuksena käytössä missään organisaatiossa</div>
              <div className="text-muted-foreground">
                Valitse organisaatiot, joille osio otetaan heti käyttöön, tai laadi viesti asiakasadmineille, jotta he voivat päättää käyttöönotosta.
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 justify-between">
            <Input
              placeholder="Hae organisaatioita..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="!mt-1"
            />
            {/* <Popover open={notifyOpen} onOpenChange={setNotifyOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline">Luo viestiluonnos – valitse vastaanottajat</Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-96 p-3 space-y-3">
                <div className="text-sm font-medium">Valitse organisaatiot viestin vastaanottajiksi</div>
                <div className="border rounded max-h-64 overflow-auto">
                  <ul className="divide-y">
                    {(organizations || []).map((org) => {
                      const checked = notifySelection.includes(org.$id);
                      return (
                        <li key={org.$id} className="flex items-center gap-2 p-2">
                          <Checkbox
                            id={`notify-${org.$id}`}
                            checked={checked}
                            onCheckedChange={(v) => {
                              setNotifySelection((prev) =>
                                v ? Array.from(new Set([...prev, org.$id])) : prev.filter((x) => x !== org.$id)
                              );
                            }}
                          />
                          <label htmlFor={`notify-${org.$id}`} className="text-sm cursor-pointer">
                            {org.name}
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Valittuna: {notifySelection.length}</span>
                  <Button size="sm" variant="ghost" onClick={() => setNotifySelection([])}>Tyhjennä</Button>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setNotifyOpen(false)}>Peruuta</Button>
                  <Button size="sm" onClick={buildNotificationDraft}>Luo luonnos</Button>
                </div>
              </PopoverContent>
            </Popover> */}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-auto rounded border">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ladataan...
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">Ei organisaatioita</div>
            ) : (
              <ul className="divide-y">
                {filtered.map((org) => {
                  const inUse = selected.includes(org.$id);
                  return (
                    <li key={org.$id} className="flex items-center justify-between p-3 gap-3">
                      <div className="flex items-center gap-3">
                        <div className="font-medium">{org.name}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${inUse ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {inUse ? 'Käytössä' : 'Ei käytössä'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {!inUse ? (
                          <Button size="sm" variant="default" onClick={() => setAccessNow(org.$id)}>
                            Ota käyttöön nyt
                          </Button>
                        ) : (
                          <Button size="sm" variant="destructive" onClick={() => removeAccess(org.$id)}>
                            Poista käytöstä
                          </Button>
                        )}
                        {/* <Button size="sm" variant="ghost" onClick={() => {
                          setNotifySelection((prev) => Array.from(new Set([...prev, org.$id])));
                          setNotifyOpen(true);
                        }}>
                          Lähetä viesti
                        </Button> */}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isLoading}>Peruuta</Button>
            {/* <Button onClick={onSubmit} disabled={isLoading}>
              Tallenna muutokset
              {isLoading ? (<Loader2 className="ml-2 h-4 w-4 animate-spin" />) : null}
            </Button> */}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
