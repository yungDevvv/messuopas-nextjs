"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Crown, Mail, Shield, Users, KeyRound, Pencil, Building2, Trash2, Settings, Check, X, Calendar, Plus, UserPlus, Send, MoreVertical } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import OrganizationModal from "./modals/organization-modal";
import EventsAccessDialog from "./modals/events-panel";
import EventAccessModal from "./modals/event-access-modal";
import InviteUserModal from "@/components/modals/invite-user-modal";
import { updateDocument, deleteDocument } from "@/lib/appwrite/server";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal";
import { createUserRecoveryPassword } from "@/lib/appwrite/server";
// Inline comment: Client receives fully derived props from server
export default function ClientAccountPage({ user, orgName, orgId, isOrgOwner, members, organizationEvents }) {

    const [loading, setLoading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const router = useRouter();
    const { onOpen } = useModal();
    const [memberBusy, setMemberBusy] = useState(null); // Inline comment: track busy member id
    const [orgDisplayName, setOrgDisplayName] = useState(orgName || ""); // Inline comment: shown org title
    const [editOpen, setEditOpen] = useState(false); // Inline comment: edit modal visibility
    const [editName, setEditName] = useState(orgName || ""); // Inline comment: edit field value
    const [accessOpen, setAccessOpen] = useState(false); // Inline comment: access modal visibility
    const [targetMember, setTargetMember] = useState(null); // Inline comment: member being edited
    const [selectedEventIds, setSelectedEventIds] = useState([]); // Inline comment: checked events for member
    const [confirmDeleteEventId, setConfirmDeleteEventId] = useState(null); // Inline comment: event delete confirm state
    const [eventAccessOpen, setEventAccessOpen] = useState(false); // Inline comment: event access modal visibility
    const [targetEvent, setTargetEvent] = useState(null); // Inline comment: event being managed




    const handleInvite = async (email, selectedEventIds) => {
        try {
            const response = await fetch("/api/invite/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    organizationId: orgId,
                    eventIds: selectedEventIds, // Changed from eventId to eventIds array
                    inviterUserId: user.$id,
                    inviterName: user.name
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Virhe kutsun lähettämisessä");
            }

            toast.success("Kutsu lähetetty onnistuneesti!");
            router.refresh(); // Refresh to update member list if needed
        } catch (error) {
            console.error("Invitation error:", error);
            toast.error(error.message || "Virhe kutsun lähettämisessä");
            throw error; // Re-throw to let modal handle loading state
        }
    };

    // Inline comment: stub save from modal
    const handleSaveOrgFromModal = async () => {
        try {
            // await fetch(`/api/organization/${orgId}`, { method: 'PATCH', body: JSON.stringify({ name: editName }) });
            setOrgDisplayName(editName);
            toast.success("Organisaation nimi tallennettu");
            setEditOpen(false);
        } catch (e) {
            console.error(e);
            toast.error("Tallennus epäonnistui");
        }
    };

    // Inline comment: open access modal for a member
    const openAccessModal = (member) => {
        setTargetMember(member);
        setSelectedEventIds(Array.isArray(member?.accessibleEventsIds) ? member.accessibleEventsIds : []);
        setAccessOpen(true);
    };


    const handleRemoveMember = async (memberId) => {
        setMemberBusy(memberId);
        try {
            // await fetch(`/api/organization/members/${memberId}`, { method: 'DELETE' });
            toast.success("Käyttäjä poistettu");
            // Inline comment: ideally refresh organization from backend or mutate context
        } catch (e) {
            console.error(e);
            toast.error("Poistaminen epäonnistui");
        } finally {
            setMemberBusy(null);
        }
    };

    // Inline comment: resolve event titles from accessible ids
    const getEventTitles = (ids) => {
        if (!Array.isArray(ids) || ids.length === 0) return " —";
        const names = ids
            .map((id) => organizationEvents?.find?.((e) => e.$id === id)?.name)
            .filter(Boolean);
        if (names.length === 0) return " —";
        return names.join(", ");
    };

   

    const handleSetOwner = async (memberId) => {

        try {
            await updateDocument('main_db', 'organizations', orgId, {
                owners: [...user.organization.owners, memberId]
            });
            router.refresh();
            toast.success("Käyttäjä on asetettu omistajaksi");
            // Inline comment: ideally refresh organization from backend or mutate context
        } catch (e) {
            console.error(e);
            toast.error("Tapahtui virhe");
        }
    };
    return (
        <div className="w-full max-w-7xl space-y-6">

            {/* Organization owner tools */}
            {isOrgOwner && (
                <div>
                    <div className="space-y-1 mb-4">
                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                            <Building2 className="w-5 h-5" />
                            Organisaatio
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Hallitse organisaatiosi asetuksia, käyttäjiä ja messuja
                        </p>
                    </div>

                    <div className="space-y-8">
                        {/* Organization info card */}
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="text-sm text-muted-foreground">Organisaation nimi</div>
                                    <div className="text-base font-medium">{orgDisplayName || "—"}</div>
                                </div>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => { setEditName(orgDisplayName); setEditOpen(true); }}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Edit organization name modal */}
                        <OrganizationModal
                            open={editOpen}
                            onOpenChange={setEditOpen}
                            defaultName={editName}
                            onSave={handleSaveOrgFromModal}
                            title="Muokkaa organisaation nimeä"
                        />

                        {/* Users management section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <h3 className="text-base font-semibold flex items-center gap-2">
                                        <Users className="w-4 h-4" />
                                        Käyttäjien hallinta
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Hallitse organisaatiosi jäseniä ja heidän käyttöoikeuksiaan
                                    </p>
                                </div>
                                <Button
                                    className="gap-2"
                                    onClick={() => onOpen("invite-user-modal", {
                                        onInvite: handleInvite,
                                        events: organizationEvents
                                    })}
                                >
                                    <Plus className="w-4 h-4" />
                                    Kutsu käyttäjä palveluun
                                </Button>
                            </div>

                            {/* Users list */}
                            <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                                {members.length === 0 ? (
                                    <div className="text-center py-8">
                                        <Users className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                                        <p className="text-muted-foreground">Ei käyttäjiä vielä</p>
                                        <p className="text-sm text-muted-foreground mt-1">Kutsu ensimmäinen käyttäjä alla olevalla lomakkeella</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                                        {members.filter((m) => m.$id !== user.$id).map((m, idx) => {
                                            const isOwner = user.organization.owners.map((o) => o.$id).includes(m.$id);
                                            return (
                                                <div key={m.$id || idx} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm font-medium">
                                                                {m.name?.charAt(0)?.toUpperCase() || 'U'}
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-medium">{m.name}</span>
                                                                    {isOwner && (
                                                                        <Badge variant="secondary" className="text-green-600">
                                                                            {/* <Crown className="w-3 h-3 mr-1" /> */}
                                                                            Omistaja
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                                <div className="text-sm">{m.email}</div>
                                                                <div className="text-xs text-muted-foreground flex items-center">
                                                                    Sallitut messut: {m.role === "customer_admin" ? "Kaikki" : <p className="ml-1 text-sm text-black">{getEventTitles(m.accessibleEventsIds)}</p>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="sm">
                                                                    <MoreVertical className="w-4 h-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                {!isOwner && (
                                                                    <>
                                                                        <DropdownMenuItem
                                                                            onClick={() => onOpen("confirm-modal", {
                                                                                type: "confirm",
                                                                                title: "Aseta käyttäjä organisaation omistajaksi",
                                                                                description: `Haluatko varmasti asettaa käyttäjän "${m.name}" organisaation omistajaksi?`,
                                                                                callback: () => handleSetOwner(m.$id)
                                                                            })}
                                                                        >
                                                                            <Crown className="w-4 h-4 mr-2" />
                                                                            Aseta omistajaksi
                                                                        </DropdownMenuItem>
                                                                        <DropdownMenuItem onClick={() => openAccessModal(m)}>
                                                                            <Shield className="w-4 h-4 mr-2" />
                                                                            Hallitse käyttöoikeuksia
                                                                        </DropdownMenuItem>
                                                                    </>
                                                                )}
                                                                <DropdownMenuItem
                                                                    className="text-red-600"
                                                                    disabled={memberBusy === (m.$id)}
                                                                    onClick={() => handleRemoveMember(m.$id)}
                                                                >
                                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                                    Poista käyttäjä
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                            </div>
                        </div>

                       
                    </div>
                </div>
            )}
            {/* Access management modal */}
            <EventsAccessDialog
                open={accessOpen}
                onOpenChange={setAccessOpen}
                member={targetMember}
                events={organizationEvents}
                onSave={async (selectedIds, newActiveEventId) => {


                    const updateData = { accessibleEventsIds: selectedIds };

                    // If we need to update the active event as well
                    if (newActiveEventId) {
                        updateData.activeEventId = newActiveEventId;
                    }

                    const { error } = await updateDocument("main_db", "users", targetMember.$id, updateData);
                    if (error) {
                        console.error("Update error:", error);
                        toast.error("Messujen käyttöoikeuksien tallennus epäonnistui");
                        return;
                    }

                    router.refresh();
                    toast.success("Messujen käyttöoikeudet tallennettu");
                    setAccessOpen(false);
                }}
            />

           

            {/* Invite User Modal */}
            <InviteUserModal />
        </div>
    );
}