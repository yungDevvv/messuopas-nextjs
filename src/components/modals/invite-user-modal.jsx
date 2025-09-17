"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { useModal } from "@/hooks/use-modal"
import { useState } from "react"
import { Send, UserPlus, Calendar, Check } from "lucide-react"
import { useAppContext } from "@/context/app-context"

export default function InviteUserModal() {
    const { type, isOpen, onClose, data } = useModal();
    const isModalOpen = isOpen && type === "invite-user-modal";
    const {user} = useAppContext();
    const [inviteEmail, setInviteEmail] = useState("");
    const [selectedEventIds, setSelectedEventIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [validationError, setValidationError] = useState("");
    
    const events = data?.events || [];

    // Handle checkbox toggle for events
    const handleEventToggle = (eventId, checked) => {
        if (checked) {
            setSelectedEventIds(prev => [...prev, eventId]);
        } else {
            setSelectedEventIds(prev => prev.filter(id => id !== eventId));
        }
        // Clear validation error when user selects an event
        if (checked && validationError) {
            setValidationError("");
        }
    };

    // Select/deselect all events
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedEventIds(events.map(event => event.$id));
            // Clear validation error when selecting all
            if (validationError) {
                setValidationError("");
            }
        } else {
            setSelectedEventIds([]);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        
        // Clear previous validation errors
        setValidationError("");
        
        // Validate email
        if (!inviteEmail.trim()) {
            setValidationError("Sähköposti on pakollinen");
            return;
        }
        
        // Validate event selection - required if events exist
        if (events.length > 0 && selectedEventIds.length === 0) {
            setValidationError("Valitse vähintään yksi messu");
            return;
        }

        try {
            setLoading(true);
            
            // Call the invite function passed from parent component with selected events
            if (data?.onInvite) {
                await data.onInvite(inviteEmail, selectedEventIds);
            }
           
            // Reset form and close modal
            setInviteEmail("");
            setSelectedEventIds([]);
            setValidationError("");
            onClose();
        } catch (error) {
            console.error("Error inviting user:", error);
            setValidationError("Virhe kutsun lähettämisessä");
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setInviteEmail("");
        setSelectedEventIds([]);
        setValidationError("");
        onClose();
    };

    return (
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md gap-6">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5" />
                        Kutsu uusi käyttäjä
                    </DialogTitle>
                </DialogHeader>

                <div className="">
                    <form onSubmit={handleInvite} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email">Sähköposti</Label>
                            <Input
                                id="email"
                                type="email"
                                required
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                placeholder="sahkoposti@esimerkki.fi"
                                className="w-full"
                            />
                        </div>

                        {/* Display validation error */}
                        {validationError && (
                            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-3">
                                {validationError}
                            </div>
                        )}

                        {events.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Valitse messut *
                                    </Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleSelectAll(selectedEventIds.length !== events.length)}
                                        className="text-xs h-7"
                                    >
                                        {selectedEventIds.length === events.length ? "Poista kaikki" : "Valitse kaikki"}
                                    </Button>
                                </div>
                                
                                <div className="space-y-3 max-h-48 overflow-y-auto">
                                    {events.map((event) => (
                                        <div 
                                            key={event.$id} 
                                            className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                                        >
                                            <Checkbox
                                                id={event.$id}
                                                checked={selectedEventIds.includes(event.$id)}
                                                onCheckedChange={(checked) => handleEventToggle(event.$id, checked)}
                                                className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                            />
                                            <Label 
                                                htmlFor={event.$id} 
                                                className="text-sm font-medium cursor-pointer flex-1 leading-relaxed"
                                            >
                                                {event.name}
                                            </Label>
                                            {selectedEventIds.includes(event.$id) && (
                                                <Check className="w-4 h-4 text-green-600" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                                
                                {selectedEventIds.length > 0 && (
                                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                        {selectedEventIds.length} messua valittu
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClose}
                                disabled={loading}
                            >
                                Peruuta
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || !inviteEmail.trim() || (events.length > 0 && selectedEventIds.length === 0)}
                            >
                                {loading ? "Lähetetään..." : "Lähetä kutsu"}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
