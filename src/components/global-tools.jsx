"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft } from 'lucide-react';
// TODO: Replace with your actual state management (e.g., Zustand or Context)
// import { useAppStore } from '@/store/useAppStore';

// Mock store for demonstration purposes
const useAppStore = () => ({
    messut: [{ $id: '1', name: 'Messu 1' }, { $id: '2', name: 'Messu 2' }],
    activeMessu: { $id: '1', name: 'Messu 1' },
    fetchMessut: () => console.log('Fetching messut...'),
    setActiveMessu: (id) => console.log('Setting active messu to:', id),
});

export default function GlobalTools() {
    const [isToolsOpen, setIsToolsOpen] = useState(false);
    const { messut, activeMessu, fetchMessut, setActiveMessu } = useAppStore();

    useEffect(() => {
        fetchMessut();
    }, [fetchMessut]);

    return (
        <div className="fixed right-4 top-1/2 -translate-y-1/2 z-50">
            <div className="relative">
                <Button
                    onClick={() => setIsToolsOpen(!isToolsOpen)}
                    className="bg-gradient-to-r from-green-400 to-green-500 hover:from-green-500 hover:to-green-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg transition-all duration-300 relative"
                >
                    <ChevronLeft
                        className={cn(
                            'w-8 h-8 transition-transform duration-300',
                            isToolsOpen ? 'rotate-180' : ''
                        )}
                    />
                </Button>

                <div className={cn(
                    "absolute right-full top-0 mr-2 bg-white rounded-lg shadow-lg border p-2 w-64",
                    "transform transition-all duration-300 origin-right",
                    isToolsOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
                )}>
                    <Select value={activeMessu?.$id || ''} onValueChange={setActiveMessu}>
                        <SelectTrigger className="font-normal text-base mb-2">
                            <SelectValue className="text-base" placeholder="Valitse tapahtuma" />
                        </SelectTrigger>
                        <SelectContent>
                            {messut.map(messu => (
                                <SelectItem key={messu.$id} value={messu.$id} className="text-base p-3">
                                    {messu.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {/* The tool buttons are no longer needed here, as they are in the subsection layout */}
                </div>
            </div>
        </div>
    );
}
