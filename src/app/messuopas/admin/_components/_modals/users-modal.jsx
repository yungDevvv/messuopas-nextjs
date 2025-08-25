"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { createDocument, updateDocument, deleteDocument, createFile, listDocuments } from '@/lib/appwrite/server';
import { Query } from "node-appwrite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building, Eye, EllipsisVertical, Edit2, X } from "lucide-react";
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

export default function UsersModal({ open, onOpenChange, selectedUser }) {
    const { user } = useAppContext();
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm();
    const [eventType, setEventType] = useState('existing'); // 'existing' or 'new'
    const [userType, setUserType] = useState('private'); // 'private' or 'organization'
    const [events, setEvents] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [newEventName, setNewEventName] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
    const router = useRouter();
    const isEditing = !!selectedUser;

    // Load events and organizations when modal opens
    useEffect(() => {
        if (open) {
            loadModalData();
            // Pre-fill form if editing
            if (selectedUser) {
                setValue('name', selectedUser.name);
                setValue('email', selectedUser.email);
                setValue('role', selectedUser.role);

                // Set user type based on organization
                if (selectedUser.organization) {
                    setUserType('organization');
                    setSelectedOrganizationId(selectedUser.organization.$id);
                    setValue('organizationId', selectedUser.organization.$id);
                } else {
                    setUserType('private');
                }

                // Set active event if exists
                if (selectedUser.activeEventId) {
                    setValue('eventId', selectedUser.activeEventId);
                }
            } else {
                // Reset form for new user
                setUserType('private');
                setSelectedOrganizationId(null);
                setEventType('existing');
                setNewEventName('');
            }
        }
    }, [open, selectedUser, setValue]);

    // Auto-set eventType to 'new' for private users and clear events
    useEffect(() => {
        if (userType === 'private') {
            setEventType('new');
            setEvents([]); // Clear events for private users
            setSelectedOrganizationId(null); // Clear selected organization
        } else if (userType === 'organization') {
            setEvents([]); // Clear events until organization is selected
            setSelectedOrganizationId(null); // Reset organization selection
        }
    }, [userType]);

    const loadModalData = async () => {
        try {
            // Always load organizations
            const orgsRes = await listDocuments('main_db', 'organizations');
            setOrganizations(orgsRes.data || []);
        } catch (error) {
            console.error('Error loading modal data:', error);
        }
    };

    // Load events when organization is selected
    const loadEventsForOrganization = async (organizationId) => {
        try {
            const eventsRes = await listDocuments('main_db', 'events', [
                Query.equal('organization', organizationId)
            ]);
            setEvents(eventsRes.data || []);
        } catch (error) {
            console.error('Error loading events for organization:', error);
            setEvents([]);
        }
    };

    const onSubmit = async (data) => {
        setLoading(true);
        
        try {
            if (isEditing) {
                // Update existing user
                const updateData = {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                };

                if (userType === 'organization' && selectedOrganizationId) {
                    updateData.organization = selectedOrganizationId;
                } else {
                    updateData.organization = null;
                }

                // TODO: Add updateDocument function call here
                console.log('Updating user:', selectedUser.$id, updateData);

                // Placeholder for actual update call:
                // const { data: updatedUser, error } = await updateDocument('main_db', 'users', selectedUser.$id, {
                //     body: updateData
                // });

                // if (error) {
                //     console.error('Error updating user:', error);
                //     toast.error('Virhe käyttäjän päivittämisessä');
                //     return;
                // }

                router.refresh();
                toast.success('Käyttäjä päivitetty onnistuneesti!');
                reset();
                onOpenChange(false);
            } else {
                // Create new user (existing logic)
                let newEventId = null;

                if (eventType === 'new') {
                    const { data: event, error } = await createDocument('main_db', 'events', {
                        body: {
                            name: newEventName,
                            user: user.$id,
                        }
                    })

                    if (error) {
                        console.error('Error creating event:', error);
                        toast.error('Virhe tapahtui messu luomisessa');
                        return;
                    }

                    newEventId = event.$id;
                }

                // Password validation for new users
                if (!data.password || data.password.length < 6) {
                    toast.error('Salasanan tulee olla vähintään 6 merkkiä');
                    return;
                }

                const { data: newUser, error } = await createUser({
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: data.role,
                })

                const newUserData = {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                    activeEventId: newEventId ? newEventId : data.eventId,
                };

                if (userType === 'organization') {
                    newUserData.organization = selectedOrganizationId;
                }

                if (newUser && newUser.$id) {
                    const { data: user, error } = await createDocument('main_db', 'users', {
                        body: { ...newUserData }
                    })

                    if (error) {
                        console.error('Error creating user:', error);
                        toast.error('Virhe käyttäjän luomisessa');
                        return;
                    }
                }

                router.refresh();
                toast.success('Käyttäjä luotu onnistuneesti!');
                reset();
                onOpenChange(false);
            }
        } catch (error) {
            console.error('Error with user operation:', error);
            toast.error(isEditing ? 'Virhe käyttäjän päivittämisessä' : 'Virhe käyttäjän luomisessa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEditing ? 'Muokkaa käyttäjää' : 'Lisää uusi käyttäjä'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Basic user info */}

                    <div className="space-y-2">
                        <Label htmlFor="name">Nimi *</Label>
                        <Input
                            id="name"
                            {...register('name', { required: true })}
                        />
                        {errors.name && <span className="text-red-500 text-sm">Nimi on pakollinen</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Sähköposti *</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email', { required: true })}

                        />
                        {errors.email && <span className="text-red-500 text-sm">Sähköposti on pakollinen</span>}
                    </div>



                    {!isEditing && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Salasana *</Label>
                            <Input
                                id="password"
                                type="password"
                                {...register('password', { required: !isEditing, minLength: 6 })}
                            />
                            {errors.password && <span className="text-red-500 text-sm">Salasana on pakollinen (min. 6 merkkiä)</span>}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="role">Rooli *</Label>
                        <Select
                            onValueChange={(value) => setValue('role', value)}
                            value={selectedUser?.role || ''}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Valitse rooli" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user">User</SelectItem>
                                <SelectItem value="premium_user">Premium User</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && <span className="text-red-500 text-sm">Rooli on pakollinen</span>}
                    </div>

                    <div className="space-y-3 py-2">
                        <Label>Käyttäjätyyppi</Label>
                        <RadioGroup value={userType} onValueChange={setUserType}>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="private" id="private-user" />
                                <Label htmlFor="private-user" className="font-normal">Yksityinen käyttäjä</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="organization" id="org-user" />
                                <Label htmlFor="org-user" className="font-normal">Organisaation jäsen</Label>
                            </div>
                        </RadioGroup>

                        {userType === 'organization' && (
                            <Select
                                onValueChange={(value) => {
                                    setValue('organizationId', value);
                                    setSelectedOrganizationId(value);
                                    loadEventsForOrganization(value);
                                }}
                                value={selectedOrganizationId || ''}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Valitse organisaatio" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map((org) => (
                                        <SelectItem key={org.$id} value={org.$id}>
                                            {org.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {/* Event selection - only show for private users or when organization is selected */}
                    {(userType === 'private' || (userType === 'organization' && selectedOrganizationId)) && (
                        <div className="space-y-3">
                            <Label>Messut</Label>
                            {userType === 'private' ? (
                                // For private users, only show "Create new event" option
                                <div className="space-y-3">
                                    <RadioGroup value={eventType} onValueChange={setEventType}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="new" id="new-event" />
                                            <Label htmlFor="new-event" className="font-normal">Luo uudet messut</Label>
                                        </div>
                                    </RadioGroup>
                                    <Input
                                        placeholder="Uuden messun nimi"
                                        value={newEventName}
                                        onChange={(e) => setNewEventName(e.target.value)}
                                    />
                                </div>
                            ) : (
                                // For organization users, show both options (only when org is selected)
                                <>
                                    <RadioGroup value={eventType} onValueChange={setEventType}>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="existing" id="existing-event" />
                                            <Label htmlFor="existing-event" className="font-normal">Valitse olemassa olevat messut</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="new" id="new-event" />
                                            <Label htmlFor="new-event" className="font-normal">Luo uusi messu</Label>
                                        </div>
                                    </RadioGroup>

                                    {eventType === 'existing' && (
                                        <Select
                                            onValueChange={(value) => setValue('eventId', value)}
                                            value={selectedUser?.activeEventId || ''}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Etsi ja valitse messu" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {events.map((event) => (
                                                    <SelectItem key={event.$id} value={event.$id}>
                                                        {event.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                    {eventType === 'new' && (
                                        <Input
                                            placeholder="Uuden messun nimi"
                                            value={newEventName}
                                            onChange={(e) => setNewEventName(e.target.value)}
                                        />
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {/* User type selection */}


                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Peruuta</Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Tallennetaan...' : 'Tallenna'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}