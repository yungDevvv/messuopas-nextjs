"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/context/app-context";
import { updateDocument, listDocuments } from '@/lib/appwrite/server';
import { Query } from "node-appwrite";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Star, Loader2, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal";
import EventModal from "@/components/modals/event-modal";

export default function UserEventsModal({ open, onOpenChange, selectedUser, fetchUsers }) {
    const { user } = useAppContext();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [selectedAccessibleEvents, setSelectedAccessibleEvents] = useState([]);
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

            if (selectedUser && selectedUser.organization) {
                console.log("select123123123123edUser.organization?.$id");
                queries.push(Query.equal('organization', selectedUser.organization.$id));
            } else {
                queries.push(Query.equal('user', selectedUser.$id));
            }

            // console.log(selectedUser.organization.$id, "selectedUser.organization.$id");
            const { data: userEvents, error } = await listDocuments("main_db", "events", queries);

            if (error) {
                console.error('Error fetching user events:', error);
                toast.error('Virhe tapahtumien latauksessa');
                return;
            }

            setEvents(userEvents || []);
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

    // line comment: toggle accessible event permission
    const toggleAccessibleEvent = (eventId) => {
        // line comment: prevent removing active event from accessible events
        if (selectedUser.activeEventId === eventId && selectedAccessibleEvents.includes(eventId)) {
            toast.error('Aktiivista messua ei voi poistaa käyttöoikeuksista. Aseta ensin toinen messu aktiiviseksi.');
            return;
        }

        setSelectedAccessibleEvents((prev) => 
            prev.includes(eventId) 
                ? prev.filter((id) => id !== eventId) 
                : [...prev, eventId]
        );
    };

    // line comment: save accessible events permissions
    const handleSaveAccessibleEvents = async () => {
        if (!selectedUser) return;

        // line comment: validate that at least one event is selected
        if (selectedAccessibleEvents.length === 0) {
            toast.error('Käyttäjä tarvitsee vähintään yhden messun käyttöoikeuden');
            return;
        }

        setLoading(true);
        try {
            // line comment: check if we're removing the active event
            const isRemovingActiveEvent = selectedUser.activeEventId && !selectedAccessibleEvents.includes(selectedUser.activeEventId);
            
            const updateData = {
                accessibleEventsIds: selectedAccessibleEvents
            };

            // line comment: if removing active event, set new active to first available
            if (isRemovingActiveEvent) {
                updateData.activeEventId = selectedAccessibleEvents[0];
                toast.info(`Käyttäjän "${selectedUser.name}" aktiivinen messu vaihdettu`);
            }

            const { error } = await updateDocument("main_db", "users", selectedUser.$id, updateData);

            if (error) {
                console.error('Error updating accessible events:', error);
                toast.error('Virhe käyttöoikeuksien päivittämisessä');
                return;
            }

            toast.success('Käyttöoikeudet päivitetty onnistuneesti!');

            // line comment: refresh user data
            if (fetchUsers) {
                fetchUsers();
            }

            // line comment: update local selectedUser state
            if (selectedUser) {
                selectedUser.accessibleEventsIds = selectedAccessibleEvents;
                if (isRemovingActiveEvent) {
                    selectedUser.activeEventId = selectedAccessibleEvents[0];
                }
            }

            // line comment: close modal after successful save
            onOpenChange(false);

        } catch (error) {
            console.error('Error updating accessible events:', error);
            toast.error('Virhe käyttöoikeuksien päivittämisessä');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (open && selectedUser) {
            fetchUserEvents();
            // line comment: initialize accessible events from user data
            setSelectedAccessibleEvents(
                Array.isArray(selectedUser.accessibleEventsIds) 
                    ? selectedUser.accessibleEventsIds 
                    : []
            );
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
                   
                </DialogHeader>

                <div className="space-y-4">
                    {/* Events table */}
                    <div className="border-none shadow-none !p-0">
                        <div className="w-full flex items-center justify-end mb-4">
                            {!user.organization && (
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
                            )}
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
                                <div className="space-y-4">
                                    <div className="space-y-3">
                                        {events?.map((event) => {
                                            const isActive = selectedUser.activeEventId === event.$id;
                                            const hasAccess = selectedAccessibleEvents.includes(event.$id);
                                            const showAccessControl = selectedUser.role !== 'customer_admin' && selectedUser.role !== 'admin';
                                            
                                            return (
                                                <div
                                                    key={event.$id}
                                                    className={`p-4 border rounded-lg transition-all ${
                                                        isActive
                                                            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                                                            : hasAccess || !showAccessControl
                                                            ? "border-gray-200 dark:border-gray-800"
                                                            : "border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-900/30"
                                                    }`}
                                                >
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="flex items-start gap-3 flex-1">
                                                            {showAccessControl && (
                                                                <Checkbox
                                                                    id={`event-${event.$id}`}
                                                                    checked={hasAccess}
                                                                    onCheckedChange={() => toggleAccessibleEvent(event.$id)}
                                                                    disabled={loading || isActive}
                                                                    className="mt-1"
                                                                />
                                                            )}
                                                            <div className="flex-1">
                                                                <label 
                                                                    htmlFor={`event-${event.$id}`}
                                                                    className={`flex items-center gap-2 font-medium ${isActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                                >
                                                                    {!hasAccess && showAccessControl && (
                                                                        <Lock className="w-4 h-4 text-muted-foreground" />
                                                                    )}
                                                                    <span>{event.name}</span>
                                                                    {isActive && (
                                                                        <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                                                            Aktiivinen
                                                                        </Badge>
                                                                    )}
                                                                </label>
                                                                {showAccessControl && (
                                                                    <p className="text-xs text-muted-foreground mt-1">
                                                                        {isActive 
                                                                            ? "Aktiivinen messu - ei voi poistaa käyttöoikeuksia" 
                                                                            : hasAccess 
                                                                            ? "Käyttäjällä on pääsy tähän messuun" 
                                                                            : "Ei pääsyä"}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {!isActive && (hasAccess || !showAccessControl) && (
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleSetActiveEvent(event.$id)}
                                                                disabled={loading}
                                                                className="gap-2 whitespace-nowrap"
                                                            >
                                                                <Star className="h-4 w-4" />
                                                                Aseta aktiiviseksi
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {selectedUser.role !== 'customer_admin' && selectedUser.role !== 'admin' && (
                                        <div className="flex justify-end pt-2">
                                            <Button 
                                                onClick={handleSaveAccessibleEvents}
                                                disabled={loading || selectedAccessibleEvents.length === 0}
                                            >
                                                {loading ? 'Tallennetaan...' : 'Tallenna käyttöoikeudet'}
                                            </Button>
                                        </div>
                                    )}
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
