"use client";

import { useState } from 'react';
import Sidebar from '@/components/sidebar';
import ToolSidebar from '@/components/tool-sidebar';
import { Menu } from 'lucide-react';
import GlobalTools from '@/components/global-tools';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

export default function MainLayout({ children, user, events, organizations, privateUsers, activeSubsectionsDocument, sections }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleClose = () => setIsMenuOpen(false);
    const pathname = usePathname();

    const pathCount = pathname.split('/').length;

    return (
        <>
            {/* --- Hamburger Button for screens smaller than xl --- */}
            
            {/* --- Mobile Flyout Menu (Overlay + Panel) --- */}
            <div className={cn(
                'xl:hidden fixed inset-0 z-40 transition-all duration-300 ease-in-out',
                isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            )}>
                {/* Overlay */}
                <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
                {/* Panel */}
                <div className={cn(
                    'relative z-50 h-full w-[280px] bg-white shadow-xl transition-transform duration-300 ease-in-out',
                    isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                )}>
                    <ToolSidebar showCloseButton={true} onClose={handleClose} onLinkClick={handleClose} />
                </div>
            </div>

            {/* --- Main Grid Layout --- */}
            <main className={cn("grid grid-cols-[auto_auto_1fr] max-xl:grid-cols-[auto_1fr]", pathCount >= 3 ? "flex" : "")}>
                {/* Static Sidebar for large screens */}
                {/* <div className="hidden xl:block w-[280px] max-[1540px]:w-[215px] h-screen border-r border-gray-200 flex-shrink-0"> */}
                    <ToolSidebar />
                {/* </div> */}

                <Sidebar user={user} events={events} organizations={organizations} privateUsers={privateUsers} activeSubsectionsDocument={activeSubsectionsDocument} sections={sections} />

                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>

                {/* <GlobalTools /> */}
            </main>
        </>
    );
}
