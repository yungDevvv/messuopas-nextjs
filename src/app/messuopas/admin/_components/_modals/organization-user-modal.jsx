"use client";

import { useState, useEffect } from "react";
import { createUser, listDocuments } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Check } from "lucide-react";

export default function OrganizationUserModal({ open, onOpenChange, organization, fetchUsers }) {
    const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
        defaultValues: {
            role: "",
            eventIds: [],
        },
    });
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [eventsLoading, setEventsLoading] = useState(false);
    const role = watch('role');
    const eventIds = watch('eventIds') || [];

    useEffect(() => {
        register('role');
        register('eventIds');
    }, [register]);

    const loadEvents = async () => {
        if (!organization?.$id) return;

        setEventsLoading(true);
        try {
            const { data: orgEvents } = await listDocuments("main_db", "events", [
                Query.equal('organization', organization.$id)
            ]);
            setEvents(orgEvents || []);
        } catch (error) {
            console.error('Error loading events:', error);
            toast.error('Virhe messujen latauksessa');
        } finally {
            setEventsLoading(false);
        }
    };

    useEffect(() => {
        if (open && organization) {
            loadEvents();
            reset();
            setValue('role', '');
            setValue('eventIds', []);
        }
    }, [open, organization, reset, setValue]);

    const toggleEvent = (eventId) => {
        const current = eventIds || [];
        const newSelection = current.includes(eventId)
            ? current.filter(id => id !== eventId)
            : [...current, eventId];
        setValue('eventIds', newSelection);
    };

    const onSubmit = async (data) => {
        try {
            if (!data.name || !data.email || !data.password || !data.role) {
                toast.error('Täytä kaikki pakolliset kentät');
                return;
            }

            if (data.password.length < 6) {
                toast.error('Salasanan tulee olla vähintään 6 merkkiä');
                return;
            }

            setLoading(true);

            const payload = {
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role,
                organization: organization.$id,
            };

            if (data.role === 'customer_admin') {
                if (events.length === 0) {
                    toast.error('Organisaatiolla ei ole messuja. Luo ensin messu.');
                    setLoading(false);
                    return;
                }
                payload.accessibleEventsIds = events.map(e => e.$id);
                payload.activeEventId = events[0].$id;
            }

            if (data.role === 'premium_user') {
                const selectedIds = Array.isArray(data.eventIds) ? data.eventIds.filter(Boolean) : [];
                if (selectedIds.length === 0) {
                    toast.error('Valitse vähintään yksi messu');
                    setLoading(false);
                    return;
                }
                payload.accessibleEventsIds = selectedIds;
                payload.activeEventId = selectedIds[0];
            }

            const { data: newUser, error } = await createUser(payload);

            if (error) {
                console.error('Error creating user:', error);
                toast.error('Virhe käyttäjän luomisessa');
                setLoading(false);
                return;
            }

            toast.success('Käyttäjä luotu onnistuneesti!');
            fetchUsers?.();
            reset();
            onOpenChange(false);
        } catch (error) {
            console.error('Error in onSubmit:', error);
            toast.error('Virhe käyttäjän luomisessa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Lisää käyttäjä - {organization?.name}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Nimi *</Label>
                        <Input
                            id="name"
                            {...register('name', { required: true })}
                
                            disabled={loading}
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">Sähköposti *</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register('email', { required: true })}
                        
                            disabled={loading}
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <Label htmlFor="password">Salasana *</Label>
                        <Input
                            id="password"
                            type="password"
                            {...register('password', { required: true, minLength: 6 })}
                            placeholder="Vähintään 8 merkkiä"
                            disabled={loading}
                        />
                    </div>

                    {/* Role */}
                    <div className="space-y-2">
                        <Label>Rooli *</Label>
                        <Select
                            value={role}
                            onValueChange={(val) => setValue('role', val)}
                            disabled={loading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Valitse rooli" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="customer_admin">Organisaation ylläpitäjä</SelectItem>
                                <SelectItem value="premium_user">Premium käyttäjä</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Event selection for premium_user */}
                    {role === 'premium_user' && (
                        <div className="space-y-2">
                            <Label>Messut *</Label>
                            {eventsLoading ? (
                                <div className="text-sm text-muted-foreground">Ladataan messuja...</div>
                            ) : events.length === 0 ? (
                                <div className="text-sm text-red-500">
                                    Organisaatiolla ei ole messuja. Luo ensin messu.
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
                                    {events.map((event) => (
                                        <label
                                            key={event.$id}
                                            className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                        >
                                            <Checkbox
                                                checked={eventIds.includes(event.$id)}
                                                onCheckedChange={() => toggleEvent(event.$id)}
                                                disabled={loading}
                                            />
                                            <div className="flex items-center gap-2 flex-1">
                                                <span className="text-sm">{event.name}</span>
                                                {eventIds.includes(event.$id) && (
                                                    <Check className="w-4 h-4 text-green-600" />
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            )}
                            {eventIds.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    Valittu {eventIds.length} messua. Ensimmäinen asetetaan aktiiviseksi.
                                </p>
                            )}
                        </div>
                    )}

                    {/* Info for customer_admin */}
                    {role === 'customer_admin' && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                Organisaation ylläpitäjällä on automaattisesti pääsy kaikkiin organisaation messuihin.
                            </p>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            disabled={loading}
                        >
                            Peruuta
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Luodaan...' : 'Luo käyttäjä'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}