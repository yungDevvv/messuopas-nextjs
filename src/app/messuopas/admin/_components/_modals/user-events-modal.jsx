"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/context/app-context";
import { updateDocument, listDocuments } from '@/lib/appwrite/server';
import { Query } from "node-appwrite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Settings, Star, StarOff, Eye, Loader2, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useModal } from "@/hooks/use-modal";
import EventModal from "@/components/modals/event-modal";

export default function UserEventsModal({ open, onOpenChange, selectedUser, fetchUsers }) {
    const { user } = useAppContext();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [eventsLoading, setEventsLoading] = useState(false);
    const router = useRouter();
    const { onOpen } = useModal();

    // line comment: handle edit event
    const handleEditEvent = (eventId) => {
        const ev = Array.isArray(events) ? events.find(e => e.$id === eventId) : null;
        if (!ev) return;
        onOpen("event-modal", { event: ev, fetchAll: fetchUserEvents });
    };

    // line comment: fetch all events that user has access to
    const fetchUserEvents = async () => {
        if (!selectedUser) return;
       
        setEventsLoading(true);
        try {
            let queries = [];

            // line comment: if user belongs to organization, get org events
            if (selectedUser.organization?.$id) {
                queries.push(Query.equal('organization', selectedUser.organization.$id));
            }

            // line comment: also get events where user is direct owner
            queries.push(Query.equal('user', selectedUser.$id));

            // line comment: get events from accessibleEventsIds if available
            // if (selectedUser.accessibleEventsIds && selectedUser.accessibleEventsIds.length > 0) {
            //     queries.push(Query.equal('$id', selectedUser.accessibleEventsIds));
            // }

            const { data: userEvents, error } = await listDocuments("main_db", "events", queries);
            console.log("User events123123123123123123123123", userEvents);
            if (error) {
                console.error('Error fetching user events:', error);
                toast.error('Virhe tapahtumien latauksessa');
                return;
            }

            // line comment: remove duplicates by $id
            const uniqueEvents = userEvents?.documents?.reduce((acc, event) => {
                if (!acc.find(e => e.$id === event.$id)) {
                    acc.push(event);
                }
                return acc;
            }, []) || [];

            setEvents(userEvents);
        } catch (error) {
            console.error('Error fetching events:', error);
            toast.error('Virhe tapahtumien latauksessa');
        } finally {
            setEventsLoading(false);
        }
    };

    // line comment: set active event for user
    const handleSetActiveEvent = async (eventId) => {
        if (!selectedUser) return;

        setLoading(true);
        try {
            const { error } = await updateDocument("main_db", "users", selectedUser.$id, {
                activeEventId: eventId
            });

            if (error) {
                console.error('Error setting active event:', error);
                toast.error('Virhe aktiivisen tapahtuman asettamisessa');
                return;
            }

            toast.success('Aktiivinen tapahtuma asetettu onnistuneesti!');

            // line comment: refresh user data
            if (fetchUsers) {
                fetchUsers();
            }

            // line comment: update local selectedUser state if needed
            if (selectedUser) {
                selectedUser.activeEventId = eventId;
            }

        } catch (error) {
            console.error('Error setting active event:', error);
            toast.error('Virhe aktiivisen tapahtuman asettamisessa');
        } finally {
            setLoading(false);
        }
    };

    // line comment: remove active event
    const handleRemoveActiveEvent = async () => {
        if (!selectedUser) return;

        setLoading(true);
        try {
            const { error } = await updateDocument("main_db", "users", selectedUser.$id, {
                activeEventId: null
            });

            if (error) {
                console.error('Error removing active event:', error);
                toast.error('Virhe aktiivisen tapahtuman poistamisessa');
                return;
            }

            toast.success('Aktiivinen tapahtuma poistettu onnistuneesti!');

            // line comment: refresh user data
            if (fetchUsers) {
                fetchUsers();
            }

            // line comment: update local selectedUser state if needed
            if (selectedUser) {
                selectedUser.activeEventId = null;
            }

        } catch (error) {
            console.error('Error removing active event:', error);
            toast.error('Virhe aktiivisen tapahtuman poistamisessa');
        } finally {
            setLoading(false);
        }
    };

    // line comment: format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'Ei päivämäärää';
        try {
            return new Date(dateString).toLocaleDateString('fi-FI', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return 'Virheellinen päivämäärä';
        }
    };

    // line comment: get event owner display name
    const getEventOwner = (event) => {
        if (event.organization?.name) {
            return event.organization.name;
        }
        if (event.user?.name) {
            return event.user.name;
        }
        return 'Tuntematon omistaja';
    };

    useEffect(() => {
        if (open && selectedUser) {
            fetchUserEvents();
        }
    }, [open, selectedUser]);

    if (!selectedUser) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="!max-w-xl !w-full max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Messujen hallinta - {selectedUser.name}
                    </DialogTitle>
                    <p className="text-red-500">KESKEN VIELÄ</p>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Events table */}
                    <div className="border-none shadow-none !p-0">
                    <div className="w-full flex items-center justify-end mb-4">
                        <Button
                            onClick={() => {
                                // line comment: pass selectedUser as owner for new event creation
                                const eventData = selectedUser.organization
                                    ? { organization: selectedUser.organization, fetchAll: fetchUserEvents }
                                    : { user: selectedUser, fetchAll: fetchUserEvents };
                                onOpen("event-modal", eventData);
                            }}
                        >
                            Luo uudet messut
                        </Button>
                    </div>
                        <div className="!p-0">
                            {eventsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                    <span className="ml-2">Ladataan tapahtumia...</span>
                                </div>
                            ) : events?.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                    <p>Käyttäjällä ei ole käytettävissä olevia messuja</p>
                                </div>
                            ) : (
                                <div className="border rounded-lg">
                                        
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Nimi</TableHead>
                                                {/* <TableHead className="text-right">Toiminnot</TableHead> */}
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {console.log("Events12312312312", events)}
                                            {events?.map((event) => {
                                                const isActive = selectedUser.activeEventId === event.$id;
                                                return (
                                                    <TableRow key={event.$id} className={isActive ? "bg-green-50 dark:bg-green-950/20" : ""}>
                                                        <TableCell className="font-medium">
                                                            <div className="flex items-center gap-2">
                                                                {isActive && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                                                                {event.name}
                                                                {isActive && (
                                                                    <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 ml-2">
                                                                        Aktiivinen
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" size="sm" disabled={loading}>
                                                                        <Settings className="w-4 h-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem
                                                                        className="gap-2"
                                                                        onClick={() => handleEditEvent(event.$id)}
                                                                    >
                                                                        <Settings className="h-4 w-4" />
                                                                        Muokkaa
                                                                    </DropdownMenuItem>
                                                                    {!isActive ? (
                                                                        <DropdownMenuItem
                                                                            className="gap-2"
                                                                            onClick={() => handleSetActiveEvent(event.$id)}
                                                                        >
                                                                            <Star className="h-4 w-4" />
                                                                            Aseta aktiiviseksi
                                                                        </DropdownMenuItem>
                                                                    ) : (
                                                                        <DropdownMenuItem
                                                                            className="gap-2"
                                                                            onClick={handleRemoveActiveEvent}
                                                                        >
                                                                            <StarOff className="h-4 w-4" />
                                                                            Poista aktiivisuus
                                                                        </DropdownMenuItem>
                                                                    )}
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </div>
                    </div>
                    
                </div>
            </DialogContent>
            <EventModal />
        </Dialog>
    );
}
