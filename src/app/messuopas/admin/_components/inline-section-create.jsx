"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X, Check } from "lucide-react";

export default function InlineSectionCreate({ onSubmit, onCancel, isSubmitting, nextOrder }) {
    const [title, setTitle] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        
        onSubmit({
            title: title.trim(),
            order: nextOrder
        });
        setTitle("");
    };

    return (
        <Card className="border-2 border-dashed border-blue-300 bg-blue-50">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <Input
                            placeholder="Osion nimi..."
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button 
                            type="submit" 
                            size="sm"
                            disabled={!title.trim() || isSubmitting}
                        >
                            <Check className="w-4 h-4 mr-1" />
                            {isSubmitting ? "Luodaan..." : "Luo osio"}
                        </Button>
                        <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            <X className="w-4 h-4 mr-1" />
                            Peruuta
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
