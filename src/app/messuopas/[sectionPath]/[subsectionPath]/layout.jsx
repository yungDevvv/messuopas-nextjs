"use client";

import { useSidebarStore } from '@/stores/sidebar-store';
import { Button } from '@/components/ui/button';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';

export default function SubsectionLayout({ children }) {
    const { isCollapsed, toggleCollapse } = useSidebarStore();

    return (
        <div className="flex-1 flex flex-col">
            <div className="p-2 border-b xl:hidden">
                <Button
                    onClick={toggleCollapse}
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 relative z-20"
                >
                    {isCollapsed ? <ChevronsRight className="h-5 w-5" /> : <ChevronsLeft className="h-5 w-5" />}
                </Button>
            </div>
            <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
