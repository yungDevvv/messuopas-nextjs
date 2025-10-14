"use client"

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useModal } from "@/hooks/use-modal";
import { listDocuments, updateDocument } from "@/lib/appwrite/server";
import { toast } from "sonner";
import { Loader2, Building2, Info, Shield, Mail, CheckSquare } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import { Query } from "node-appwrite";

export default function SectionPermissionsModal() {
  const { type, isOpen, onClose, data } = useModal();
  const isModalOpen = isOpen && type === "section-permissions-modal";

  const section = data?.section || null;

  const [isLoading, setIsLoading] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [users, setUsers] = useState([]);
  const [tokens, setTokens] = useState([]); // new_section_tokens for this section
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]); // org ids that have access now
  const [bulkMode, setBulkMode] = useState(false); // bulk enable mode
  const [bulkSelection, setBulkSelection] = useState([]); // orgs selected for bulk action
  const [emailMode, setEmailMode] = useState(false); // email mode
  const [emailSelection, setEmailSelection] = useState([]); // orgs selected for email
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
        
        // Load tokens for this section
        const { data: tokensData = [] } = section?.$id 
          ? await listDocuments("main_db", "new_section_tokens", [
              Query.equal('sectionId', section.$id)
            ])
          : { data: [] };
        
        if (!cancelled) {
          setOrganizations(orgs || []);
          setUsers(usersData || []);
          setTokens(tokensData || []);
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

  // bulk enable selected organizations
  const handleBulkEnable = async () => {
    if (!section?.$id || bulkSelection.length === 0) return;
    setIsLoading(true);
    try {
      const next = Array.from(new Set([...selected, ...bulkSelection]));
      const { error } = await updateDocument("main_db", "initial_sections", section.$id, {
        appliedOrganizations: next,
      });
      if (error) throw error;
      setSelected(next);
      setBulkSelection([]);
      setBulkMode(false);
      router.refresh();
      toast.success(`Otettu käyttöön ${bulkSelection.length} organisaatiossa`);
    } catch (e) {
      console.error("Failed to bulk enable", e);
      toast.error("Massaottaminen epäonnistui");
    } finally {
      setIsLoading(false);
    }
  };

  // check if organization has email
  const hasOrgEmail = (org) => {
    return org.organizationEmail && org.organizationEmail.trim() !== '';
  };

  // send email to selected organizations
  const handleSendEmail = async () => {
    if (emailSelection.length === 0) {
      toast.error("Valitse vähintään yksi organisaatio");
      return;
    }

    setIsLoading(true);
    try {
      const selectedOrgs = organizations.filter((org) => emailSelection.includes(org.$id));
      
      // Generate content link for the new section
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

      // Send email to each organization with unique links
      const response = await fetch('/api/send-section-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organizations: selectedOrgs.map((org) => ({
            id: org.$id,
            email: org.organizationEmail,
            name: org.name,
            contentLink: `${baseUrl}/new-section?sectionId=${section.$id}&organizationId=${org.$id}`,
          })),
          sectionId: section.$id,
          sectionTitle: section.title,
        }),
      });

      if (!response.ok) {
        throw new Error('Email sending failed');
      }

      // Reload tokens to show updated status
      const { data: tokensData = [] } = await listDocuments("main_db", "new_section_tokens", [
        Query.equal('sectionId', section.$id)
      ]);
      setTokens(tokensData || []);

      toast.success(`Viesti lähetetty ${emailSelection.length} organisaatiolle`);
      
      // Reset state
      setEmailSelection([]);
      setEmailMode(false);
    } catch (error) {
      console.error('Failed to send emails:', error);
      toast.error('Viestien lähetys epäonnistui');
    } finally {
      setIsLoading(false);
    }
  };

  // toggle organization in email mode
  const toggleOrgInEmailMode = (orgId) => {
    setEmailSelection((prev) => 
      prev.includes(orgId) 
        ? prev.filter((id) => id !== orgId)
        : [...prev, orgId]
    );
  };


  // toggle all filtered organizations in current mode
  const toggleAll = () => {
    if (bulkMode) {
      const notInUse = filtered.filter((org) => !selected.includes(org.$id)).map((org) => org.$id);
      if (bulkSelection.length === notInUse.length) {
        setBulkSelection([]);
      } else {
        setBulkSelection(notInUse);
      }
    } else if (emailMode) {
      const orgsWithEmail = filtered.filter((org) => hasOrgEmail(org));
      const allOrgIds = orgsWithEmail.map((org) => org.$id);
      
      // check if all are selected
      const allAreSelected = allOrgIds.every((orgId) => emailSelection.includes(orgId));
      
      if (allAreSelected) {
        // deselect all
        setEmailSelection([]);
      } else {
        // select all orgs with email
        setEmailSelection(allOrgIds);
      }
    }
  };

  // check if all are selected
  const allSelected = useMemo(() => {
    if (bulkMode) {
      const notInUse = filtered.filter((org) => !selected.includes(org.$id));
      return notInUse.length > 0 && bulkSelection.length === notInUse.length;
    } else if (emailMode) {
      const orgsWithEmail = filtered.filter((org) => hasOrgEmail(org));
      if (orgsWithEmail.length === 0) return false;
      return orgsWithEmail.every((org) => emailSelection.includes(org.$id));
    }
    return false;
  }, [bulkMode, emailMode, filtered, selected, bulkSelection, emailSelection, organizations]);


 
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
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Hae organisaatioita..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="flex-1"
              />
              {/* <Button
                variant={bulkMode ? "default" : "outline"}
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setEmailMode(false);
                  setBulkSelection([]);
                  setEmailSelection([]);
                }}
                className="gap-2"
              >
                <CheckSquare className="w-4 h-4" />
                Massaottaminen
              </Button> */}
              <Button
                variant={emailMode ? "default" : "outline"}
                onClick={() => {
                  setEmailMode(!emailMode);
                  setBulkMode(false);
                  setBulkSelection([]);
                  setEmailSelection([]);
                }}
                className="gap-2"
              >
                <Mail className="w-4 h-4" />
                Lähetä viesti
              </Button>
            </div>

            {/* Bulk/Email mode actions */}
            {(bulkMode || emailMode) && (
              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id="select-all"
                    checked={allSelected}
                    onCheckedChange={toggleAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                    Valitse kaikki
                  </label>
                  <span className="text-sm text-muted-foreground">
                    ({bulkMode ? `${bulkSelection.length} org` : `${emailSelection.length} organisaatiota`})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setBulkMode(false);
                      setEmailMode(false);
                      setBulkSelection([]);
                      setEmailSelection([]);
                    }}
                  >
                    Peruuta
                  </Button>
                  {bulkMode && (
                    <Button
                      size="sm"
                      onClick={handleBulkEnable}
                      disabled={bulkSelection.length === 0 || isLoading}
                    >
                      Ota käyttöön ({bulkSelection.length})
                    </Button>
                  )}
                  {emailMode && (
                    <Button
                      size="sm"
                      onClick={handleSendEmail}
                      disabled={emailSelection.length === 0}
                    >
                      Lähetä viesti ({emailSelection.length})
                    </Button>
                  )}
                </div>
              </div>
            )}
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
                  const isBulkSelected = bulkSelection.includes(org.$id);
                  const isEmailSelected = emailSelection.includes(org.$id);
                  const hasEmail = hasOrgEmail(org);
                  
                  // Find token for this organization
                  const orgToken = tokens.find(t => t.organizationId === org.$id);
                  
                  return (
                    <li key={org.$id} className="p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          {/* Checkbox for bulk/email mode */}
                          {bulkMode && !inUse && (
                            <Checkbox
                              checked={isBulkSelected}
                              onCheckedChange={(checked) => {
                                setBulkSelection((prev) =>
                                  checked
                                    ? [...prev, org.$id]
                                    : prev.filter((id) => id !== org.$id)
                                );
                              }}
                            />
                          )}
                          {emailMode && hasEmail && (
                            <Checkbox
                              checked={isEmailSelected}
                              onCheckedChange={() => toggleOrgInEmailMode(org.$id)}
                            />
                          )}
                          
                          <div className="flex items-center gap-2">
                            {/* <Building2 className="w-4 h-4 text-muted-foreground" /> */}
                            <div className="font-medium">{org.name}</div>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${inUse ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {inUse ? 'Käytössä' : 'Ei käytössä'}
                          </span>
                          {emailMode && (
                            <span className="text-xs text-muted-foreground">
                              {hasEmail ? org.organizationEmail : 'Ei sähköpostia'}
                            </span>
                          )}
                          {/* Token status badge */}
                          {orgToken && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              orgToken.status === 'accepted' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                              orgToken.status === 'declined' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                              orgToken.status === 'viewed' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                              'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            }`}>
                              {orgToken.status === 'sent' && 'Lähetetty'}
                              {orgToken.status === 'viewed' && 'Katsottu'}
                              {orgToken.status === 'accepted' && 'Hyväksytty'}
                              {orgToken.status === 'declined' && 'Hylätty'}
                            </span>
                          )}
                        </div>
                        
                        {/* Action buttons (only in normal mode) */}
                        {!bulkMode && !emailMode && (
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
                          </div>
                        )}
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
