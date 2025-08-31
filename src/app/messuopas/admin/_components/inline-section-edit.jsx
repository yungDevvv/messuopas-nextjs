"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { X, Check } from "lucide-react";

export default function InlineSectionEdit({ section, onSubmit, onCancel, isSubmitting }) {
    const [title, setTitle] = useState(section?.title || "");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        
        onSubmit({
            title: title.trim(),
            order: section.order
        });
    };

    return (
        <Card className="border-2 border-orange-300 bg-orange-50">
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
                            {isSubmitting ? "Tallennetaan..." : "Tallenna"}
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
