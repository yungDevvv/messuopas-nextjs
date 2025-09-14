"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { createDocument, updateDocument, deleteDocument, createFile, listDocuments } from '@/lib/appwrite/server';
import { Query } from "node-appwrite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building, Eye, EllipsisVertical, Edit2, X, Settings, Trash2, Check } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/utils/debounce";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from "@/components/ui/textarea";
import OrganizationModal from "./_modals/organization-modal";
import { getRoleLabelFi } from "@/lib/constants/roles";
import { useModal } from "@/hooks/use-modal";

export default function OrganizationsTab({ onEditUser }) {
    const [organizations, setOrganizations] = useState([]);
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [organizationModalOpen, setOrganizationModalOpen] = useState(false);
    const [confirmDeleteEventId, setConfirmDeleteEventId] = useState(null);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await listDocuments('main_db', 'users');
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            const { data } = await listDocuments('main_db', 'organizations');
            setOrganizations(data || []);

        } catch (error) {
            console.error('Error loading organizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        try {
            const { data } = await listDocuments('main_db', 'events');
            setEvents(data || []);
        } catch (error) {
            console.error('Error loading events:', error);
            setEvents([]);
        }
    };
    const fetchAll = () => {
        fetchUsers();
        fetchOrganizations();
        fetchEvents();
    };

    useEffect(() => {
        fetchAll();

    }, []);

    const { onOpen } = useModal();

    const handleEditEvent = (eventId) => {
        const ev = Array.isArray(events) ? events.find(e => e.$id === eventId) : null;
        if (!ev) return;
        onOpen("event-modal", { event: ev, fetchAll });
    };

    const handleDeleteEvent = async (eventId) => {
        const { error } = await deleteDocument('main_db', 'events', eventId);
        if (error) {
            console.error('Error deleting event:', error);
            toast.error('Tapahtui virhe. Tapahtuman poistaminen ei onnistunut.');
            return;
        }
        toast.success('Messujen poistaminen onnistui!');
        setConfirmDeleteEventId(null);
        fetchAll();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 justify-between">
                <h2 className="text-lg font-medium">Organisaatiot</h2>
                <Button onClick={() => setOrganizationModalOpen(true)}>Luo uusi organisaatio</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organizations.map((org) => (
                    <Card key={org.$id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span className="font-semibold">{org.name}</span>
                                <span className="text-sm text-muted-foreground">
                                    {users.filter(u => u.organization?.$id === org?.$id && u.role !== 'admin').length} käyttäjää · {events.filter(e => (e.organization?.$id ?? e.organization) === org?.$id).length} messua
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-muted-foreground">Käyttäjät</div>
                                {users.filter(user => user.organization?.$id === org?.$id && user.role !== 'admin').length === 0 ? (
                                    <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-zinc-900 rounded p-2">Ei käyttäjiä vielä</div>
                                ) : (
                                    users
                                        .filter(user => user.organization?.$id === org?.$id && user.role !== 'admin')
                                        .map((user) => (
                                            <div key={user.$id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-zinc-900 p-2 rounded">
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-gray-500">{user.email}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={
                                                            user.role === 'admin'
                                                                ? 'text-red-600'
                                                                : user.role === 'customer_admin'
                                                                    ? 'text-blue-600'
                                                                    : user.role === 'premium_user'
                                                                        ? 'text-yellow-600'
                                                                        : ''
                                                        }
                                                    >
                                                        {getRoleLabelFi(user.role)}
                                                    </span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => onEditUser?.(user)}
                                                        title="Muokkaa käyttäjää"
                                                    >
                                                        <Settings className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-muted-foreground">Messut</h3>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onOpen("event-modal", { organization: org, fetchAll })}
                                        title="Lisää uudet messut"
                                    >
                                        Lisää uudet messut
                                    </Button>
                                </div>
                                {events.filter(ev => (ev.organization?.$id ?? ev.organization) === org?.$id).length === 0 ? (
                                    <div className="text-sm text-muted-foreground bg-gray-50 dark:bg-zinc-900 rounded p-2">Ei messuja vielä</div>
                                ) : (
                                    events
                                        .filter(ev => (ev.organization?.$id ?? ev.organization) === org?.$id)
                                        .map((ev) => (
                                            <div key={ev.$id} className="flex items-center justify-between text-sm bg-gray-50 dark:bg-zinc-900 p-2 rounded">
                                                <div className="font-medium">{ev.name}</div>
                                                <div className="flex items-center gap-1">
                                                    {confirmDeleteEventId === ev.$id ? (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteEvent(ev.$id)}
                                                                title="Vahvista poisto"
                                                            >
                                                                <Check className="w-4 h-4 text-green-600" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setConfirmDeleteEventId(null)}
                                                                title="Peruuta"
                                                            >
                                                                <X className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditEvent(ev.$id)}
                                                                title="Muokkaa messuja"
                                                            >
                                                                <Settings className="w-4 h-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => setConfirmDeleteEventId(ev.$id)}
                                                                title="Poista messu"
                                                            >
                                                                <Trash2 className="w-4 h-4 text-red-500" />
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <OrganizationModal
                open={organizationModalOpen}
                onOpenChange={setOrganizationModalOpen}
                fetchOrganizations={fetchOrganizations}
            />
        </div>
    );
}