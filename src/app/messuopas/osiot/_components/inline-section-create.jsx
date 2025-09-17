"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function InlineSectionCreate({ onSave, onCancel, isSubmitting }) {
    const [title, setTitle] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (title.trim()) {
            onSave(title.trim());
            setTitle('');
        }
    };

    return (
        <Card className="border-2 border-dashed border-green-300 bg-green-50/50">
            <CardContent className="p-4">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Osion nimi
                        </label>
                        <Input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-white"
                            autoFocus
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            disabled={!title.trim() || isSubmitting}
                        >
                            {isSubmitting ? 'Luodaan...' : 'Luo osio'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Peruuta
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
