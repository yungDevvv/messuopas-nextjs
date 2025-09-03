"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { createDocument, updateDocument, deleteDocument, createFile, listDocuments, createUser } from '@/lib/appwrite/server';
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";


export default function UsersModal({ open, onOpenChange, selectedUser, fetchUsers }) {
    const { user } = useAppContext();
    const { register, handleSubmit, watch, setValue, reset, unregister, clearErrors, getValues, formState: { errors } } = useForm({
        defaultValues: {
            role: "",
            eventId: "",
            organizationId: "",
            eventIds: [],
        },
    });
    const [eventType, setEventType] = useState('existing'); // 'existing' or 'new'
    const [userType, setUserType] = useState('private'); // 'private' or 'organization'
    const [events, setEvents] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [newEventName, setNewEventName] = useState('');
    const [loading, setLoading] = useState(false);
    const [eventsLoading, setEventsLoading] = useState(false);
    const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);
    const router = useRouter();
    const isEditing = !!selectedUser;
    const role = watch('role'); // observe current role
    // line comment: handle RHF submit errors explicitly to debug why onSubmit isn't called
    const onSubmitError = (errs) => {
        // line comment: if editing, ignore any password validation remnants
        if (isEditing && errs?.password) {
            delete errs.password;
        }
        console.log('RHF submit errors:', errs);
        const firstKey = Object.keys(errs)[0];
        if (firstKey) {
            toast.error(errs[firstKey]?.message || 'Täytä vaaditut kentät');
        }
    };

    // Ensure form knows about non-native controlled fields
    useEffect(() => {
        // line comment: register controlled values so handleSubmit includes them
        register('role');
        register('eventId');
        register('organizationId');
        register('eventIds');
    }, [register]);

    // line comment: ensure password is not validated in edit mode
    useEffect(() => {
        if (isEditing) {
            try {
                unregister('password');
                clearErrors('password');
                setValue('password', undefined, { shouldValidate: false, shouldDirty: false });
            } catch { }
        }
    }, [isEditing, unregister, clearErrors, setValue]);

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
                    const orgId = selectedUser.organization.$id ?? selectedUser.organization;
                    setSelectedOrganizationId(orgId);
                    setValue('organizationId', orgId);
                    // line comment: load events for the preselected organization so UI can show existing/new
                    if (orgId) {
                        loadEventsForOrganization(orgId);
                    }
                } else {
                    setUserType('private');
                }

                // Set active event if exists
                if (selectedUser.activeEventId) {
                    setValue('eventId', selectedUser.activeEventId);
                }

                // line comment: prefill multiselect for premium_user in organization
                if (selectedUser.role === 'premium_user' && selectedUser.organization) {
                    const ids = Array.isArray(selectedUser.accessibleEventsIds)
                        ? selectedUser.accessibleEventsIds.filter(Boolean)
                        : [];
                    if (ids.length) {
                        setValue('eventIds', ids);
                        // line comment: keep single-select in sync if not set yet
                        if (!selectedUser.activeEventId) {
                            setValue('eventId', ids[0]);
                        }
                    } else if (selectedUser.activeEventId) {
                        // line comment: fallback: seed eventIds from activeEventId when accessibleEventsIds missing
                        setValue('eventIds', [selectedUser.activeEventId]);
                    }
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

    // line comment: if organizations arrive after setting selected org, ensure value stays synced
    useEffect(() => {
        if (!isEditing) return;
        if (!selectedUser?.organization) return;
        const orgId = selectedUser.organization.$id ?? selectedUser.organization;
        if (orgId && !selectedOrganizationId) {
            setSelectedOrganizationId(orgId);
            setValue('organizationId', orgId);
        }
    }, [organizations, isEditing, selectedUser, selectedOrganizationId, setValue]);

    // React to role changes: admin hides organization and events; user hides everything
    useEffect(() => {
        if (role === 'admin') {
            // clear organization and event for admin
            setSelectedOrganizationId(null);
            setValue('organizationId', '');
            setValue('eventId', '');
            setValue('eventIds', []);
        }
        if (role === 'user') {
            // user hides all extra fields -> clear org and event
            setSelectedOrganizationId(null);
            setValue('organizationId', '');
            setValue('eventId', '');
            setValue('eventIds', []);
        }
        if (role === 'customer_admin') {
            // line comment: for customer_admin force organization flow; keep selected organization if already chosen
            setUserType('organization');
            // line comment: do NOT clear selectedOrganizationId to avoid flicker when switching from premium_user
            // setSelectedOrganizationId(null);
            // setValue('organizationId', '');
            // line comment: default to existing while events are loading to prevent flashing of 'new'
            setEventType('existing');
            setValue('eventId', '');
            setValue('eventIds', []);
        }
    }, [role, setValue]);

    // Auto-set eventType to 'new' for private users and clear events (skip when role is customer_admin)
    useEffect(() => {
        if (role === 'customer_admin') return; // line comment: customer_admin has its own flow
        // line comment: premium_user in organization must use existing events
        if (role === 'premium_user' && userType === 'organization') {
            setEventType('existing');
        }
        if (userType === 'private') {
            setEventType('new');
            setEvents([]); // Clear events for private users
            setSelectedOrganizationId(null); // Clear selected organization
        } else if (userType === 'organization') {
            // line comment: do NOT nuke events; if org selected, (re)load its events so labels stay visible
            if (selectedOrganizationId) {
                loadEventsForOrganization(selectedOrganizationId);
            } else {
                setEvents([]);
                if (!isEditing) setSelectedOrganizationId(null);
            }
        }
    }, [userType, role, selectedOrganizationId]);

    // line comment: stabilize messut when toggling to premium_user + organization
    useEffect(() => {
        if (role !== 'premium_user' || userType !== 'organization') return;
        if (selectedOrganizationId) {
            // ensure events loaded for current org
            loadEventsForOrganization(selectedOrganizationId);
        }
        // prefill selections in edit mode if empty
        if (isEditing && selectedUser) {
            const current = getValues('eventIds') || [];
            if (current.length === 0) {
                const ids = Array.isArray(selectedUser.accessibleEventsIds)
                    ? selectedUser.accessibleEventsIds.filter(Boolean)
                    : [];
                if (ids.length) {
                    setValue('eventIds', ids, { shouldDirty: false });
                    if (!getValues('eventId')) setValue('eventId', ids[0], { shouldDirty: false });
                } else if (selectedUser.activeEventId) {
                    setValue('eventIds', [selectedUser.activeEventId], { shouldDirty: false });
                    if (!getValues('eventId')) setValue('eventId', selectedUser.activeEventId, { shouldDirty: false });
                }
            }
        }
    }, [role, userType, selectedOrganizationId, isEditing, selectedUser, getValues, setValue]);

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
            setEventsLoading(true);
            const eventsRes = await listDocuments('main_db', 'events', [
                Query.equal('organization', organizationId)
            ]);
            const orgEvents = eventsRes.data || [];
            setEvents(orgEvents);
            // line comment: for customer_admin decide default mode based on presence of events
            if (role === 'customer_admin') {
                setEventType(orgEvents.length > 0 ? 'existing' : 'new');
            }
        } catch (error) {
            console.error('Error loading events for organization:', error);
            setEvents([]);
        } finally {
            setEventsLoading(false);
        }
    };

    const onSubmit = async (data) => {
        console.log("ASDASDASDASDASASDASD");
        try {
            // line comment: quick guard — require role
            if (!data.role) {
                toast.error('Rooli on pakollinen');
                return; // line comment: no loading yet, safe to return
            }
            setLoading(true);
            if (isEditing) {
                // Update existing user
                const updateData = {
                    name: data.name,
                    email: data.email,
                    role: data.role,
                };

                // Organization assignment
                if (userType === 'organization' && selectedOrganizationId) {
                    updateData.organization = selectedOrganizationId;
                } else {
                    updateData.organization = null;
                }

                // customer_admin: if org has events -> auto-pick first; if none -> require creating new
                if (data.role === 'customer_admin' && selectedOrganizationId) {
                    if (Array.isArray(events) && events.length > 0) {
                        updateData.activeEventId = events[0].$id;
                    } else {
                        // create new event under organization
                        if (!newEventName || newEventName.trim().length === 0) {
                            toast.error('Syötä uuden messun nimi');
                            setLoading(false);
                            return;
                        }
                        const { data: event, error } = await createDocument('main_db', 'events', {
                            body: { name: newEventName, organization: selectedOrganizationId }
                        });
                        if (error) {
                            console.error('Error creating event:', error);
                            toast.error('Virhe tapahtui messu luomisessa');
                            setLoading(false);
                            return;
                        }
                        updateData.activeEventId = event.$id;
                    }
                }

                // premium_user in organization: sync accessibleEventsIds and activeEventId
                if (data.role === 'premium_user' && userType === 'organization') {
                    const selectedIds = Array.isArray(data.eventIds) ? data.eventIds.filter(Boolean) : [];
                    if (selectedIds.length === 0) {
                        toast.error('Valitse vähintään yksi messu');
                        setLoading(false);
                        return;
                    }
                    updateData.accessibleEventsIds = selectedIds;
                    updateData.activeEventId = selectedIds[0];
                }

                try {
                    await updateDocument('main_db', 'users', selectedUser.$id, updateData);
                } catch (err) {
                    console.error('Error updating user:', err);
                    toast.error('Virhe käyttäjän päivittämisessä');
                    setLoading(false);
                    return;
                }

                fetchUsers?.();
                router.refresh();
                toast.success('Käyttäjä päivitetty onnistuneesti!');
                reset();
                onOpenChange(false);
            } else {
                // Create new user with new server logic (also creates users document)
                let newEventId = null;

                if (eventType === 'new') {
                    // line comment: create event for selected organization when customer_admin or organization user; else private user's event
                    const body = {
                        name: newEventName,
                    };
                    if (role === 'customer_admin' || userType === 'organization') {
                        body.organization = selectedOrganizationId;
                    } else {
                        body.user = user.$id;
                    }
                    const { data: event, error } = await createDocument('main_db', 'events', { body });

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

                const payload = {
                    name: data.name,
                    email: data.email,
                    password: data.password,
                    role: data.role,
                    // line comment: prefer created event, else selected single, else first from multiselect
                    activeEventId: newEventId ? newEventId : (data.eventId || (Array.isArray(data.eventIds) && data.eventIds[0]) || null),
                };

                if (userType === 'organization' && selectedOrganizationId) {
                    payload.organization = selectedOrganizationId;
                }

                // line comment: add accessibleEventsIds from multiselect for premium_user in organization
                if (data.role === 'premium_user' && userType === 'organization') {
                    const selectedIds = Array.isArray(data.eventIds) ? data.eventIds.filter(Boolean) : [];
                    if (selectedIds.length === 0) {
                        toast.error('Valitse vähintään yksi messu');
                        return;
                    }
                    payload.accessibleEventsIds = selectedIds;
                    // line comment: override activeEventId to the first accessible event for premium_user org
                    payload.activeEventId = selectedIds[0] || null;
                }

                // line comment: for customer_admin: if org already has events, force first event as active when nothing created
                if (data.role === 'customer_admin' && selectedOrganizationId && !newEventId) {
                    if (Array.isArray(events) && events.length > 0) {
                        payload.activeEventId = events[0].$id;
                    } else {
                        // no events exist -> require new event name
                        if (!newEventName || newEventName.trim().length === 0) {
                            toast.error('Syötä uuden messun nimi');
                            return;
                        }
                        const { data: event, error } = await createDocument('main_db', 'events', {
                            body: { name: newEventName, organization: selectedOrganizationId }
                        });
                        if (error) {
                            console.error('Error creating event:', error);
                            toast.error('Virhe tapahtui messu luomisessa');
                            return;
                        }
                        payload.activeEventId = event.$id;
                    }
                }

                const { data: created, error } = await createUser(payload);

                if (error) {
                    console.error('Error creating user:', error);
                    toast.error('Virhe käyttäjän luomisessa');
                    return;
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

                <form className="space-y-4" onSubmit={handleSubmit(onSubmit, onSubmitError)}>
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
                            onValueChange={(value) => setValue('role', value, { shouldDirty: true })}
                            value={role}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Valitse rooli" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="user" disabled={isEditing && selectedUser?.role === 'user'}>Käyttäjä</SelectItem>
                                <SelectItem value="premium_user" disabled={isEditing && selectedUser?.role === 'premium_user'}>Premium-käyttäjä</SelectItem>
                                <SelectItem value="customer_admin" disabled={isEditing && selectedUser?.role === 'customer_admin'}>Organisaation ylläpitäjä</SelectItem>
                                <SelectItem value="admin" disabled={isEditing && selectedUser?.role === 'admin'}>Ylläpitäjä</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.role && <span className="text-red-500 text-sm">Rooli on pakollinen</span>}
                    </div>

                    {role !== 'admin' && role !== 'user' && role !== 'customer_admin' && (
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
                    )}

                    {role === 'customer_admin' && (
                        <div className="space-y-3 py-2">
                            <Label>Organisaatio</Label>
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
                        </div>
                    )}

                    {/* Event selection - only show for private users or when organization is selected (exclude customer_admin) */}
                    {role !== 'admin' && role !== 'user' && role !== 'customer_admin' && (userType === 'private' || (userType === 'organization' && selectedOrganizationId)) && (
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
                                // For organization users
                                <>
                                    {role === 'premium_user' ? (
                                        // line comment: premium_user select multiple existing events using checkboxes (no search)
                                        <>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-between">
                                                        {(() => {
                                                            const ids = watch('eventIds') || [];
                                                            if (!ids.length) return 'Valitse messut';
                                                            const names = events.filter(e => ids.includes(e.$id)).map(e => e.name);
                                                            if (!names.length) {
                                                                // line comment: fallback while events are loading or filtered out
                                                                return `${ids.length} valittu`;
                                                            }
                                                            return names.length > 2 ? `${names.slice(0, 2).join(', ')} +${names.length - 2}` : names.join(', ');
                                                        })()}
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width]">
                                                    <div className="max-h-60 overflow-auto space-y-2 py-2">
                                                        {events.map((ev) => {
                                                            const selected = (watch('eventIds') || []).includes(ev.$id);
                                                            return (
                                                                <label key={ev.$id} className="flex items-center space-x-2 px-1 cursor-pointer">
                                                                    <Checkbox
                                                                        checked={selected}
                                                                        onCheckedChange={(checked) => {
                                                                            const current = watch('eventIds') || [];
                                                                            const next = checked ? [...current, ev.$id] : current.filter(id => id !== ev.$id);
                                                                            setValue('eventIds', next, { shouldDirty: true });
                                                                            // line comment: keep eventId synced to first selected for backward compatibility
                                                                            const first = next[0] || '';
                                                                            setValue('eventId', first, { shouldDirty: true });
                                                                        }}
                                                                    />
                                                                    <span className="text-sm">{ev.name}</span>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </>
                                    ) : (
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
                                                    onValueChange={(value) => setValue('eventId', value, { shouldDirty: true })}
                                                    value={watch('eventId')}
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
                                </>
                            )}
                        </div>
                    )}

                    {/* Event selection for customer_admin: only existing events of the selected organization */}
                    {role === 'customer_admin' && selectedOrganizationId && (
                        <div className="space-y-3">
                            <Label>Messut</Label>
                            {eventsLoading ? (
                                <div className="text-sm text-muted-foreground">Ladataan messuja…</div>
                            ) : Array.isArray(events) && events.length > 0 ? (
                                <div className="text-sm text-muted-foreground">
                                    Valitaan automaattisesti "{events[0]?.name}"
                                </div>
                            ) : (
                                // No events for organization -> only create new
                                <>
                                    <RadioGroup value="new" disabled>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="new" id="new-event-ca-only" />
                                            <Label htmlFor="new-event-ca-only" className="font-normal">Luo uusi messu</Label>
                                        </div>
                                    </RadioGroup>
                                    <Input
                                        placeholder="Uuden messun nimi"
                                        value={newEventName}
                                        onChange={(e) => setNewEventName(e.target.value)}
                                    />
                                </>
                            )}
                        </div>
                    )}


                    {/* User type selection */}


                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Peruuta</Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Tallennetaan...' : 'Tallenna'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}