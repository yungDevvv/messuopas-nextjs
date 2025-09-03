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
import { Crown, Mail, Shield, Users, KeyRound, Pencil, Building2, Trash2, Settings } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import OrganizationModal from "./organization-modal";
import EventsAccessDialog from "./events-panel";
import { updateDocument } from "@/lib/appwrite/server";
import { useRouter } from "next/navigation";
// Inline comment: Client receives fully derived props from server
export default function ClientAccountPage({ user, planLabel, hideSubscription, orgName, orgId, isOrgOwner, members, organizationEvents }) {
    const [loading, setLoading] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const router = useRouter();
    const [memberBusy, setMemberBusy] = useState(null); // Inline comment: track busy member id
    const [orgDisplayName, setOrgDisplayName] = useState(orgName || ""); // Inline comment: shown org title
    const [editOpen, setEditOpen] = useState(false); // Inline comment: edit modal visibility
    const [editName, setEditName] = useState(orgName || ""); // Inline comment: edit field value
    const [accessOpen, setAccessOpen] = useState(false); // Inline comment: access modal visibility
    const [targetMember, setTargetMember] = useState(null); // Inline comment: member being edited
    const [selectedEventIds, setSelectedEventIds] = useState([]); // Inline comment: checked events for member

    const handlePasswordReset = async () => {
        setLoading(true);
        try {
            // await fetch("/api/account/password/reset", { method: "POST" });
            toast.success("Palautuslinkki lähetetty");
        } catch (e) {
            console.error(e);
            toast.error("Virhe linkin lähetyksessä");
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // await fetch("/api/organization/invite", { method: "POST", body: JSON.stringify({ email: inviteEmail }) });
            toast.success("Tämä funktio ei toimi vielä!");
            setInviteEmail("");
        } catch (e) {
            console.error(e);
            toast.error("Virhe kutsun lähettämisessä");
        } finally {
            setLoading(false);
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
        if (!Array.isArray(ids) || ids.length === 0) return "—";
        const names = ids
            .map((id) => organizationEvents?.find?.((e) => e.$id === id)?.name)
            .filter(Boolean);
        if (names.length === 0) return "—";
        return names.join(", ");
    };

    return (
        <div className="w-full max-w-7xl p-6 space-y-6">
            {/* Page heading */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">Tili</h1>
                <p className="text-sm text-muted-foreground">Hallinnoi profiilia, turvallisuutta ja tilauksia.</p>
            </div>

            {/* Profile summary */}


            {/* Main grid */}
            <div className="grid gap-5 grid-cols-2">
                {/* Profile */}
                <Card className="relative overflow-hidden border rounded-xl shadow-sm hover:shadow-md transition-all bg-gradient-to-br from-zinc-50 to-white dark:from-zinc-900 dark:to-zinc-950 border-zinc-200/80 dark:border-zinc-800">
                    <CardHeader className="flex items-start py-4 px-5 sm:px-6">
                        <div className="flex items-start gap-4">
                            <Avatar className="size-16 ring-2 ring-zinc-200 dark:ring-zinc-700 shadow-sm">
                                {/* Inline comment: show initials if no avatar image */}
                                <AvatarFallback className="text-sm font-medium">
                                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-2">
                                <CardTitle className="text-lg sm:text-xl font-semibold leading-tight tracking-tight">{user?.name}</CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700">
                                        <Mail className="w-4 h-4" /> {user?.email || "-"}
                                    </span>
                                </CardDescription>

                                {orgName && (
                                    <div className="flex items-center gap-2">
                                        {/* <Badge variant="outline" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"> */}
                                        <Building2 className="w-4 h-4" />
                                        {orgName}
                                        {/* </Badge> */}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </Card>


                {/* Security */}
                <Card className="bg-white border shadow-none border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="gap-4">
                        <CardTitle className="flex items-center gap-2">Salasanan palautus</CardTitle>
                        <CardDescription>Lähetämme palautuslinkki sähköpostitse salasanan palautusta varten.</CardDescription>

                    </CardHeader>
                    <CardFooter className="flex flex-col items-start gap-3">
                        <CardAction>
                            <Button disabled={loading} onClick={handlePasswordReset}>Lähetä palautuslinkki</Button>
                        </CardAction>
                        <div className="text-xs text-muted-foreground">Jos et saa viestiä, tarkista roskapostikansio.</div>

                    </CardFooter>

                </Card>
            </div>
            {/* Subscription management */}
            {/* {!hideSubscription && ( */}
            <Card className="bg-white border shadow-none border-zinc-200 dark:border-zinc-800 lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-500" /> Tilauksen hallinta</CardTitle>
                    {/* <CardDescription>Nykyinen paketti: <span className="font-medium text-foreground">{planLabel}</span></CardDescription> */}
                    {/* <CardAction>
                                {user?.role !== "premium_user" ? (
                                    <Button disabled={loading} onClick={handleUpgrade} className="bg-green-600 hover:bg-green-700">Päivitä Premiumiin</Button>
                                ) : (
                                    <Button variant="secondary" disabled={loading} onClick={handleDowngrade}>Alenna Perus-pakettiin</Button>
                                )}
                            </CardAction> */}
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-muted-foreground">Tilauksen hallinta saatavilla pian.</div>
                </CardContent>
            </Card>
            {/* )} */}
            {/* Organization owner tools */}
            {isOrgOwner && (
                <Card className="bg-white border shadow-none border-zinc-200 dark:border-zinc-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">Organisaatio</CardTitle>
                        <CardDescription className="hidden"></CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                        {/* Organization settings */}
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="space-y-2">
                                    <div className="text-sm text-muted-foreground">Organisaation nimi</div>
                                    <div className="text-base font-medium">{orgDisplayName || "—"}</div>
                                </div>
                                <Button size="sm" variant="ghost" onClick={() => { setEditName(orgDisplayName); setEditOpen(true); }}>
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

                        {/* Users management */}
                        <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3">
                                <div className="flex items-center gap-2 font-medium"><Users className="w-4 h-4" /> Käyttäjien hallinta</div>
                            </div>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nimi</TableHead>
                                        <TableHead>Sähköposti</TableHead>
                                        <TableHead>Messut</TableHead>
                                        <TableHead className="text-right"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">Ei käyttäjiä näytettäväksi</TableCell>
                                        </TableRow>
                                    ) : (
                                        members.map((m, idx) => (
                                            <TableRow key={m.$id || idx}>
                                                <TableCell>{m.name}</TableCell>
                                                <TableCell>{m.email}</TableCell>
                                                <TableCell className="max-w-[300px] whitespace-nowrap overflow-hidden text-ellipsis text-xs text-muted-foreground">
                                                    {getEventTitles(m.accessibleEventsIds)}
                                                </TableCell>
                                                <TableCell className="text-right space-x-2">
                                                    {m.$id === user.$id ? (
                                                        <></>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => openAccessModal(m)}
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={memberBusy === (m.$id)}
                                                                onClick={() => handleRemoveMember(m.$id)}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </>

                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Invite form */}
                        <form onSubmit={handleInvite} className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-4 space-y-3">
                            <div className="font-medium">Kutsu uusi käyttäjä</div>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <Input
                                    type="email"
                                    required

                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                                <Button type="submit" disabled={loading}>Lähetä kutsu</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}
            {/* Access management modal */}
            <EventsAccessDialog
                open={accessOpen}
                onOpenChange={setAccessOpen}
                member={targetMember}
                events={organizationEvents}
                onSave={async (selectedIds) => {
                    const { error } = await updateDocument("main_db", "users", targetMember.$id, { accessibleEventsIds: selectedIds });
                    if (error) {
                        toast.error("Messujen käyttöoikeuksien tallennus epäonnistui");
                        return;
                    }
                    router.refresh();
                    toast.success("Messujen käyttöoikeudet tallennettu");
                    setAccessOpen(false);
                }}
            />
        </div>
    );
}