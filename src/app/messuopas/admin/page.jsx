"use client";

import { useState, useEffect } from "react";
import { useAppContext } from "@/context/app-context";
import { createDocument, createUser, listDocuments } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building, Eye } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

export default function AdminPage() {
    const { user } = useAppContext();
    const [tab, setTab] = useState(1);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [organizations, setOrganizations] = useState([]);
    const [events, setEvents] = useState([]);
    const [userModalOpen, setUserModalOpen] = useState(false);

    // Load users from Appwrite
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
            console.log(data, "ORGGGGGGGGGGG!123")
        } catch (error) {
            console.error('Error loading organizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEvents = async () => {
        setLoading(true);
        try {
            const { data } = await listDocuments('main_db', 'events');
            setEvents(data || []);
            console.log(events, "ORGGGGGGGGGGG!123")
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tab === 1) {
            fetchUsers();
        }
        if (tab === 3) {
            fetchOrganizations();
        }
        fetchEvents();
    }, [tab]);

    return (
        <div className="w-full p-6 space-y-6 max-w-7xl">
            <h1 className="text-2xl font-semibold">Hallintapaneeli</h1>
            <div className="space-y-6">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setTab(1)}
                        className={`px-3 py-2 -mb-px font-medium ${tab === 1
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Käyttäjät
                    </button>
                    <button
                        onClick={() => setTab(3)}
                        className={`px-3 py-2 -mb-px font-medium ${tab === 3
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Organisaatiot
                    </button>
                </div>

                {tab === 1 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2">

                            <h2 className="text-lg font-medium">Käyttäjät</h2>
                            <Button onClick={() => setUserModalOpen(true)}>Lisää uusi käyttäjä</Button>
                        </div>

                        {loading ? (
                            <div className="text-center py-8">Ladataan...</div>
                        ) : (
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Nimi</TableHead>
                                            <TableHead>Email</TableHead>
                                            <TableHead>Rooli</TableHead>
                                            <TableHead>Organisaatio</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.map((user) => (
                                            <TableRow key={user.$id}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'premium_user' ? 'default' : 'secondary'}>
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{user.organization?.name || '-'}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </div>
                )}



                {tab === 3 && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-2">

                            <h2 className="text-lg font-medium">Organisaatiot</h2>

                        </div>

                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {organizations.map((org) => (
                                <Card key={org.$id} className="hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            <span>{org.name}</span>
                                            {/* <Badge variant="outline">{org.memberCount} jäsentä</Badge> */}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {users.filter(user => user.organization?.$id === org?.$id)?.map((user) => (
                                            <div key={user.$id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                                <div>
                                                    <div className="font-medium">{user.name}</div>
                                                    <div className="text-gray-500">{user.email}</div>
                                                </div>
                                                <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'premium_user' ? 'default' : 'secondary'} size="sm">
                                                    {user.role}
                                                </Badge>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}


            </div>
            <AddUserModal open={userModalOpen} onOpenChange={setUserModalOpen} user={user} />
        </div>
    );
}

function AddUserModal({ open, onOpenChange, user }) {
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm();
    const [eventType, setEventType] = useState('existing'); // 'existing' or 'new'
    const [userType, setUserType] = useState('private'); // 'private' or 'organization'
    const [events, setEvents] = useState([]);
    const [organizations, setOrganizations] = useState([]);
    const [newEventName, setNewEventName] = useState('');
    const [loading, setLoading] = useState(false);
    const [selectedOrganizationId, setSelectedOrganizationId] = useState(null);

    // Load events and organizations when modal opens
    useEffect(() => {
        if (open) {
            loadModalData();
        }
    }, [open]);

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
        console.log(userType, "selectedOrganizationIdselectedOrganizationIdselectedOrganizationId");
        try {
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

            // Password validation
            if (data.password.length < 6) {
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
                    body: {...newUserData}
                })

                if (error) {
                    console.error('Error creating user:', error);
                    toast.error('Virhe käyttäjän luomisessa');
                    return;
                }
            }

            console.log('Form data:', data);
            console.log('Event type:', eventType);
            console.log('User type:', userType);
            console.log('New event name:', newEventName);

            // TODO: Implement user creation logic here
            toast.success('Käyttäjä luotu onnistuneesti!');
            reset();
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating user:', error);
            toast.error('Virhe käyttäjän luomisessa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Lisää uusi käyttäjä</DialogTitle>
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
                            placeholder="email@example.com"
                        />
                        {errors.email && <span className="text-red-500 text-sm">Sähköposti on pakollinen</span>}
                    </div>



                    <div className="space-y-2">
                        <Label htmlFor="password">Salasana *</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register('password', { required: true, minLength: 6 })}
                        />
                        {errors.password && <span className="text-red-500 text-sm">Salasana on pakollinen (min. 6 merkkiä)</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Rooli *</Label>
                        <Select onValueChange={(value) => setValue('role', value)}>
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
                            <Select onValueChange={(value) => {
                                setValue('organizationId', value);
                                setSelectedOrganizationId(value);
                                loadEventsForOrganization(value);
                            }}>
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
                                        <Select onValueChange={(value) => setValue('eventId', value)}>
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
