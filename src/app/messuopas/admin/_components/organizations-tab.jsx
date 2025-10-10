"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { createDocument, updateDocument, deleteDocument, createFile, listDocuments } from '@/lib/appwrite/server';
import { Query } from "node-appwrite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building, Eye, EllipsisVertical, Edit2, X, Settings, Trash2, Check, ChevronDown, ChevronRight, Search, Calendar } from "lucide-react";
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
import UserEventsModal from "./_modals/user-events-modal";
import OrganizationUserModal from "./_modals/organization-user-modal";
import { getRoleLabelFi } from "@/lib/constants/roles";
import { useModal } from "@/hooks/use-modal";

export default function OrganizationsTab({ onEditUser }) {
    const [organizations, setOrganizations] = useState([]);
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [organizationModalOpen, setOrganizationModalOpen] = useState(false);
    const [confirmDeleteEventId, setConfirmDeleteEventId] = useState(null);
    const [userEventsModalOpen, setUserEventsModalOpen] = useState(false);
    const [selectedUserForEvents, setSelectedUserForEvents] = useState(null);
    const [organizationUserModalOpen, setOrganizationUserModalOpen] = useState(false);
    const [selectedOrganizationForUser, setSelectedOrganizationForUser] = useState(null);
    const [expandedOrgs, setExpandedOrgs] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');

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

    const toggleOrganization = (orgId) => {
        setExpandedOrgs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(orgId)) {
                newSet.delete(orgId);
            } else {
                newSet.add(orgId);
            }
            return newSet;
        });
    };

    // Filter organizations based on search query
    const filteredOrganizations = useMemo(() => {
        if (!searchQuery.trim()) return organizations;
        
        const query = searchQuery.toLowerCase();
        return organizations.filter(org => {
            // Search by organization name
            if (org.name?.toLowerCase().includes(query)) return true;
            
            // Search by user names or emails
            const orgUsers = users.filter(u => u.organization?.$id === org?.$id && u.role !== 'admin');
            const hasMatchingUser = orgUsers.some(user => 
                user.name?.toLowerCase().includes(query) || 
                user.email?.toLowerCase().includes(query)
            );
            if (hasMatchingUser) return true;
            
            // Search by event names
            const orgEvents = events.filter(e => (e.organization?.$id ?? e.organization) === org?.$id);
            const hasMatchingEvent = orgEvents.some(event => 
                event.name?.toLowerCase().includes(query)
            );
            if (hasMatchingEvent) return true;
            
            return false;
        });
    }, [organizations, users, events, searchQuery]);

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 justify-between">
                <h2 className="text-lg font-medium">Organisaatiot</h2>
                <Button onClick={() => setOrganizationModalOpen(true)}>Luo uusi organisaatio</Button>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Hae organisaatioita, käyttäjiä tai messuja..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
                {searchQuery && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                        onClick={() => setSearchQuery('')}
                    >
                        <X className="w-4 h-4" />
                    </Button>
                )}
            </div>

            {/* Results count */}
            {searchQuery && (
                <div className="text-sm text-muted-foreground">
                    Löytyi {filteredOrganizations.length} organisaatiota
                </div>
            )}

            <div className="space-y-2">
                {filteredOrganizations.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Building className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">Ei tuloksia</p>
                        <p className="text-sm">Yritä eri hakusanalla</p>
                    </div>
                ) : (
                    filteredOrganizations.map((org) => {
                    const isExpanded = expandedOrgs.has(org.$id);
                    const orgUsers = users.filter(u => u.organization?.$id === org?.$id && u.role !== 'admin');
                    const orgEvents = events.filter(e => (e.organization?.$id ?? e.organization) === org?.$id);

                    return (
                        <div key={org.$id} className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900 transition-all">
                            {/* Collapsed Row */}
                            <div
                                className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors"
                                onClick={() => toggleOrganization(org.$id)}
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30">
                                        <Building className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-base">{org.name}</h3>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-0.5">
                                            <span className="flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {orgUsers.length} käyttäjää
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {orgEvents.length} messua
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {isExpanded ? (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                    ) : (
                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                    )}
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {isExpanded && (
                                <div className="border-t bg-green-50 dark:bg-zinc-900/50 p-4 space-y-6 animate-in slide-in-from-top-2 duration-200">
                                    {/* Users Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <Users className="w-4 h-4" />
                                                Käyttäjät
                                            </h4>
                                            <Button
                                                // variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedOrganizationForUser(org);
                                                    setOrganizationUserModalOpen(true);
                                                }}
                                            >
                                                Lisää käyttäjä
                                            </Button>
                                        </div>

                                        {orgUsers.length === 0 ? (
                                            <div className="text-sm text-muted-foreground bg-white dark:bg-zinc-900 rounded-lg p-3 text-center border border-dashed">
                                                Ei käyttäjiä vielä
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {orgUsers.map((user) => (
                                                    <div
                                                        key={user.$id}
                                                        className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-lg border hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
                                                    >
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">{user.name}</div>
                                                            <div className="text-xs text-muted-foreground">{user.email}</div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={`text-xs font-medium px-2 py-1 rounded ${
                                                                    user.role === 'admin'
                                                                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                                        : user.role === 'customer_admin'
                                                                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                                                            : user.role === 'premium_user'
                                                                                ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                                }`}
                                                            >
                                                                {getRoleLabelFi(user.role)}
                                                            </span>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                        title="Toiminnot"
                                                                    >
                                                                        <EllipsisVertical className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        className="gap-2"
                                                                        onClick={() => onEditUser?.(user)}
                                                                    >
                                                                        <Edit2 className="h-4 w-4" />
                                                                        Muokkaa
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem
                                                                        className="gap-2"
                                                                        onClick={() => {
                                                                            setSelectedUserForEvents(user);
                                                                            setUserEventsModalOpen(true);
                                                                        }}
                                                                    >
                                                                        <Settings className="h-4 w-4" />
                                                                        Hallitse messuja
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Events Section */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-semibold flex items-center gap-2">
                                                <Building className="w-4 h-4" />
                                                Messut
                                            </h4>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onOpen("event-modal", { organization: org, fetchAll });
                                                }}
                                                title="Lisää uudet messut"
                                            >
                                                Lisää uudet messut
                                            </Button>
                                        </div>

                                        {orgEvents.length === 0 ? (
                                            <div className="text-sm text-muted-foreground bg-white dark:bg-zinc-900 rounded-lg p-3 text-center border border-dashed">
                                                Ei messuja vielä
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {orgEvents.map((ev) => (
                                                    <div
                                                        key={ev.$id}
                                                        className="flex items-center justify-between bg-white dark:bg-zinc-900 p-3 rounded-lg border hover:border-gray-300 dark:hover:border-zinc-700 transition-colors"
                                                    >
                                                        <div className="font-medium text-sm">{ev.name}</div>
                                                        <div className="flex items-center gap-1">
                                                            {confirmDeleteEventId === ev.$id ? (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleDeleteEvent(ev.$id);
                                                                        }}
                                                                        title="Vahvista poisto"
                                                                    >
                                                                        <Check className="w-4 h-4 text-green-600" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setConfirmDeleteEventId(null);
                                                                        }}
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
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleEditEvent(ev.$id);
                                                                        }}
                                                                        title="Muokkaa messuja"
                                                                    >
                                                                        <Settings className="w-4 h-4" />
                                                                    </Button>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setConfirmDeleteEventId(ev.$id);
                                                                        }}
                                                                        title="Poista messu"
                                                                    >
                                                                        <Trash2 className="w-4 h-4 text-red-500" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                    })
                )}
            </div>

            <OrganizationModal
                open={organizationModalOpen}
                onOpenChange={setOrganizationModalOpen}
                fetchOrganizations={fetchOrganizations}
            />
            <UserEventsModal
                open={userEventsModalOpen}
                onOpenChange={setUserEventsModalOpen}
                selectedUser={selectedUserForEvents}
                fetchUsers={fetchUsers}
            />
            <OrganizationUserModal
                open={organizationUserModalOpen}
                onOpenChange={setOrganizationUserModalOpen}
                organization={selectedOrganizationForUser}
                fetchUsers={fetchUsers}
            />
        </div>
    );
}