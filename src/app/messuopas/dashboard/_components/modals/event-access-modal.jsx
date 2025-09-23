"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Crown, Mail, Shield, Check, X } from "lucide-react";
import { toast } from "sonner";
import { updateDocument } from "@/lib/appwrite/server";

export default function EventAccessModal({ open, onOpenChange, event, members, user, onSave }) {
    const [selectedUserIds, setSelectedUserIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // Initialize selected users when modal opens
    useEffect(() => {
        if (open && event && members) {
            // Find users who have access to this event
            const usersWithAccess = members.filter(member => 
                member.accessibleEventsIds && member.accessibleEventsIds.includes(event.$id)
            );
            setSelectedUserIds(usersWithAccess.map(u => u.$id));
            setErrorMessage(""); // Clear any previous error
        }
    }, [open, event, members]);

    const handleUserToggle = (userId, checked) => {
        setErrorMessage(""); // Clear error when user makes changes
        if (checked) {
            setSelectedUserIds(prev => [...prev, userId]);
        } else {
            setSelectedUserIds(prev => prev.filter(id => id !== userId));
        }
    };

    const handleSave = async () => {
        if (!event) return;
        
        
        setErrorMessage(""); // Clear any previous error
        setLoading(true);
        
        try {
            // First, validate all changes and collect errors
            const membersToUpdate = [];
            
            for (const member of members) {
                
                
                const shouldHaveAccess = selectedUserIds.includes(member.$id);
                const currentAccess = member.accessibleEventsIds || [];
                const hasAccess = currentAccess.includes(event.$id);
                
                
                
              
                // Skip if no change needed or if user is admin (admins have access to all)
                if (member.role === "customer_admin" || shouldHaveAccess === hasAccess) {
                    continue;
                }
                
                let newAccessibleEventsIds;
                let updateData = {};

                if (shouldHaveAccess) {
                    // Add access
                    newAccessibleEventsIds = [...currentAccess, event.$id];
                } else {
                    // Remove access
                    newAccessibleEventsIds = currentAccess.filter(id => id !== event.$id);
                    
                    // Check if user would have no events left - prevent this
                    if (newAccessibleEventsIds.length === 0) {
                        setErrorMessage(`Käyttäjä "${member.name}" tarvitsee vähintään yhden messun käyttöoikeuden`);
                        setLoading(false);
                        return;
                    }

                    // Check if we're removing the user's active event
                    
                    
                    if (member.activeEventId === event.$id) {
                        // Set new active event to the first available event
                        const newActiveEventId = newAccessibleEventsIds[0];
                        updateData.activeEventId = newActiveEventId;
                        toast.info(`Käyttäjän "${member.name}" aktiivinen messu vaihdettu`);
                    } else {
                        
                    }
                }

                updateData.accessibleEventsIds = newAccessibleEventsIds;
                membersToUpdate.push({ member, updateData });
            }

            // If validation passed, update all members
            
            
            if (membersToUpdate.length > 0) {
                const updatePromises = membersToUpdate.map(({ member, updateData }) => {
                    return updateDocument("main_db", "users", member.$id, updateData);
                });

                const results = await Promise.all(updatePromises);
            } else {
                
            }
            
            toast.success("Käyttöoikeudet päivitetty onnistuneesti");
            onSave?.();
            onOpenChange(false);
        } catch (error) {
            console.error("Error updating event access:", error);
            toast.error("Virhe käyttöoikeuksien päivityksessä");
        } finally {
            setLoading(false);
        }
    };

    const isOwner = (member) => {
        return user?.organization?.owners?.map(o => o.$id).includes(member.$id);
    };

    if (!event) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        Hallitse käyttöoikeuksia
                    </DialogTitle>
                    <DialogDescription>
                        Valitse ketkä käyttäjät voivat käyttää messua "{event.name}"
                    </DialogDescription>
                </DialogHeader>

                {errorMessage && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {errorMessage}
                    </div>
                )}

                <ScrollArea className="max-h-96">
                    <div className="space-y-3">
                        {members.length === 0 ? (
                            <div className="text-center py-6">
                                <Users className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground text-sm">Ei käyttäjiä organisaatiossa</p>
                            </div>
                        ) : (
                            members.filter(member => !isOwner(member)).map((member) => {
                                const isAdmin = member.role === "customer_admin";
                                const hasAccess = selectedUserIds.includes(member.$id);

                                return (
                                    <div key={member.$id} className="flex items-center space-x-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-semibold">
                                                {member.name?.charAt(0)?.toUpperCase() || 'U'}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-base truncate">{member.name}</span>
                                                    {isAdmin && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            Admin
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    <span className="truncate">{member.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center">
                                            {isAdmin ? (
                                                <div className="text-xs text-muted-foreground font-medium">
                                                    Automaattinen
                                                </div>
                                            ) : (
                                                <Checkbox
                                                    checked={hasAccess}
                                                    onCheckedChange={(checked) => handleUserToggle(member.$id, checked)}
                                                />
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                        Peruuta
                    </Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading ? "Tallennetaan..." : "Tallenna"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
