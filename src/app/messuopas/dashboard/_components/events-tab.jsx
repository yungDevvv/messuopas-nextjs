import { Button } from "@/components/ui/button";
import { DropdownMenuItem, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { Calendar, MoreVertical, Plus, Settings, Shield, Trash2 } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { toast } from "sonner";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteDocument } from "@/lib/appwrite/server";
import EventAccessModal from "./modals/event-access-modal";

export default function EventsTab({ organizationEvents, user, members }) {
    const { onOpen } = useModal();
    const [targetEvent, setTargetEvent] = useState(null);
    const [eventAccessOpen, setEventAccessOpen] = useState(false);
    const router = useRouter();
    const [confirmDeleteEventId, setConfirmDeleteEventId] = useState(null);
    // line comment: open EventModal to edit an existing event by id
    const handleEditEvent = (eventId) => {
        if (!eventId) return;
        const ev = Array.isArray(organizationEvents)
            ? organizationEvents.find((e) => e?.$id === eventId)
            : null;
        if (!ev) {
            toast.error("Messua ei löydy");
            return;
        }
        onOpen("event-modal", { event: ev });
    };

    // line comment: remove event with confirmation and refresh UI
    const handleRemoveEvent = async (eventId) => {
        try {
            const { error } = await deleteDocument("main_db", "events", eventId);

            if (error) {
                toast.error("Messun poistaminen epäonnistui");
                return;
            }

            router.refresh();
            toast.success("Messu poistettu");
        } catch (e) {
            console.error(e);
            toast.error("Tapahtui virhe");
        } finally {
            setConfirmDeleteEventId(null);
        }
    };
    // Inline comment: open event access modal for managing event permissions
    const openEventAccessModal = (event) => {
        setTargetEvent(event);
        setEventAccessOpen(true);
    };
    return (
        <div>
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h3 className="text-base font-semibold flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Messujen hallinta
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            Luo ja hallitse organisaatiosi messuja
                        </p>
                    </div>
                    <Button onClick={() => onOpen("event-modal")} className="gap-2">
                        <Plus className="w-4 h-4" />
                        Luo uudet messut
                    </Button>
                </div>

                <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                    {(!organizationEvents || organizationEvents.length === 0) ? (
                        <div className="text-center py-8">
                            <Calendar className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                            <p className="text-muted-foreground">Ei messuja vielä</p>
                            <p className="text-sm text-muted-foreground mt-1">Luo ensimmäiset messut yllä olevalla painikkeella</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {organizationEvents.map((ev) => (
                                <div key={ev.$id} className="p-4 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div className="space-y-1">
                                                <div className="font-medium">{ev.name}</div>

                                            </div>
                                        </div>

                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditEvent(ev.$id)}>
                                                    <Settings className="w-4 h-4 mr-2" />
                                                    Muokkaa messua
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => openEventAccessModal(ev)}>
                                                    <Shield className="w-4 h-4 mr-2" />
                                                    Hallitse käyttöoikeuksia
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => onOpen("confirm-modal",
                                                        {
                                                            title: "Poista messut",
                                                            description: `Haluatko varmasti poistaa messut "${ev.name}"?`,
                                                            callback: () => handleRemoveEvent(ev.$id)
                                                        }
                                                    )}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Poista messu
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
             {/* Event Access Management Modal */}
             <EventAccessModal
                open={eventAccessOpen}
                onOpenChange={setEventAccessOpen}
                event={targetEvent}
                members={members}
                user={user}
                onSave={() => {
                    router.refresh();
                    setEventAccessOpen(false);
                }}
            />
        </div>
    );
}