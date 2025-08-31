"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useModal } from "@/hooks/use-modal"
import { createDocument, updateDocument, getDocument } from "@/lib/appwrite/server"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/context/app-context"
import { toast } from "sonner"

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Tämä kenttä on pakollinen",
    }),
})

export default function EventModal() {

    const { user, events, setEvents } = useAppContext();
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    })

    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter();
    const { type, isOpen, onClose, data } = useModal();
    const isModalOpen = isOpen && type === "event-modal";

    async function onSubmit(values) {
        try {
            setIsLoading(true);
            if(user.role === "admin") {
                // Build body depending on current admin owner selection
                const orgId = user?.organization?.$id ?? null; // organization owner
                const selectedUserId = user?.activeUserId ?? null; // user owner

                if (!orgId && !selectedUserId) {
                    toast.error("Valitse ensin omistaja (organisaatio tai käyttäjä)");
                    return;
                }
                const body = {
                    ...values,
                    organization: orgId || null,
                    user: selectedUserId || null,
                };

                if (data.event) {
                    await updateDocument("main_db", "events", data.event.$id, body);
                    // line comment: update local events list to reflect new name instantly
                    if (setEvents) {
                        setEvents((prev = []) => prev.map(e => e.$id === data.event.$id ? { ...e, ...body } : e));
                    }
                } else {
                    const { data: created, error: createErr } = await createDocument("main_db", "events", { body });
                    if (createErr) throw createErr;
                    if (created?.$id) {
                        await updateDocument("main_db", "users", user.$id, { activeEventId: created.$id }); // line comment: set newly created event active
                        if (setEvents && created) {
                            setEvents((prev = []) => [...prev, created]); // line comment: append newly created event
                        }
                    }
                }
                
                router.refresh();
                form.reset();
                toast.success("Messut ovat luotu onnistuneesti!");
                return;
            }
            if (data.event) {
                await updateDocument("main_db", "events", data.event.$id, {
                    ...values
                })
                // line comment: update local events list for non-admin path
                if (setEvents) {
                    setEvents((prev = []) => prev.map(e => e.$id === data.event.$id ? { ...e, ...values } : e));
                }
            } else {
                const { data: created, error: createErr } = await createDocument("main_db", "events", {
                    body: {
                        ...values,
                        user: user.$id
                    }
                });
                if (createErr) throw createErr;
                if (created?.$id) {
                    await updateDocument("main_db", "users", user.$id, { activeEventId: created.$id }); // line comment: set newly created event active for normal user
                    if (setEvents && created) {
                        setEvents((prev = []) => [...prev, created]);
                    }
                }
            }
            router.refresh();
            form.reset();
            toast.success("Messut ovat luotu onnistuneesti!");
        } catch (error) {
            console.log("Error creating / updating event:", error)
            toast.error("Messujen luonti epäonnistui!");
        } finally {
            router.refresh();
            setIsLoading(false);
            onClose();
        }

    }

    useEffect(() => {
        let cancelled = false; // line comment: avoid state update if unmounted
        const load = async () => {
            try {
                if (data?.event) {
                    if (!cancelled) {
                        form.reset({ name: data.event.name || "" });
                    }
                    return;
                }
                if (data?.activeEventId) {
                    const { data: ev } = await getDocument("main_db", "events", data.activeEventId);
                    if (!cancelled && ev) {
                        form.reset({ name: ev.name || "" });
                    }
                }
            } catch (e) {
                console.log("Failed to load event for modal", e);
            }
        };
        load();
        return () => { cancelled = true };
    }, [data, form])
    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{data?.event ? "Muokkaa messujen tietoja" : "Luo uudet messut"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-3">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nimi</FormLabel>
                                    <FormControl>
                                        <Input className="!mt-1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isLoading}>
                                {data?.event ? "Tallenna" : "Luo"}
                                {isLoading ? (
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                ) : null}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}