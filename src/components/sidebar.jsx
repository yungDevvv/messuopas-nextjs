"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Edit } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebar-store';
import { NavUser } from './nav-user';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useModal } from '@/hooks/use-modal';
import { updateDocument } from '@/lib/appwrite/server';
import { useRouter } from 'next/navigation';

function Sidebar({ events, user }) {
    const { sections: sectionsFromProps, setSections: setSectionsInContext } = useAppContext();
    const { isCollapsed } = useSidebarStore();
    const pathname = usePathname();
    const { onOpen } = useModal();
    const [isEditing, setIsEditing] = useState(false);
    // Internal state for sections, synced with props
    const [sections, setSections] = useState(sectionsFromProps || []);
    const [preEditSections, setPreEditSections] = useState(null);
    const [activeEventId, setActiveEventId] = useState(user.activeEventId);
    const router = useRouter();
    // Load initial state from localStorage on client-side mount
    useEffect(() => {
        try {
            const savedStateJSON = localStorage.getItem('sidebarSelectionState');
            if (savedStateJSON) {
                const savedPaths = JSON.parse(savedStateJSON);

                const updatedSections = sectionsFromProps.map(section => ({
                    ...section,
                    initialSubsections: section.initialSubsections.map(subsection => ({
                        ...subsection,
                        // Mark as active if its path is in the saved list
                        isActive: savedPaths.includes(subsection.path),
                    })),
                }));

                setSections(updatedSections);
                setSectionsInContext(updatedSections); // Обновляем состояние в глобальном контексте
            }
        } catch (error) {
            console.error("Failed to load or parse sidebar state from localStorage:", error);
        }
    }, []); // Run only once on mount

    // Sync internal state with props from context
    useEffect(() => {
        if (sectionsFromProps) {
            setSections(sectionsFromProps);
        }
    }, [sectionsFromProps]);


    // Function to toggle subsection's isActive status
    const handleSubsectionToggle = (sectionIndex, subIndex) => {
        // In edit mode, only update the temporary state
        const newSections = JSON.parse(JSON.stringify(sections));
        const subsection = newSections[sectionIndex].initialSubsections[subIndex];
        subsection.isActive = !subsection.isActive;
        setSections(newSections);
        setSectionsInContext(newSections);
    };

    const handleSaveChanges = () => {
        // 1. Save to localStorage
        try {
            const activeSubsectionPaths = sections
                .flatMap(section => section.initialSubsections)
                .filter(sub => sub.isActive)
                .map(sub => sub.path);

            localStorage.setItem('sidebarSelectionState', JSON.stringify(activeSubsectionPaths));
        } catch (error) {
            console.error("Failed to save sidebar state to localStorage:", error);
        }

        // 2. Push changes to the parent (if needed for server-side update)
        // onUpdateSections(sections);

        // 3. Exit edit mode
        setIsEditing(false);
        setPreEditSections(null); // Clear the pre-edit state
    };

    const handleCancelEdit = () => {
        // Revert to the state before editing began
        if (preEditSections) {
            setSections(preEditSections);
            setSectionsInContext(preEditSections);
        }
        setIsEditing(false);
        setPreEditSections(null);
    };

    const handleToggleEditMode = () => {
        if (isEditing) {
            // This button now acts as a cancel button if already editing
            handleCancelEdit();
        } else {
            // Entering edit mode
            setPreEditSections(JSON.parse(JSON.stringify(sections))); // Save current state for potential cancel
            setIsEditing(true);
        }
    }
    const handleEventChange = async (eventId) => {
        setActiveEventId(eventId);

        try {
            await updateDocument('main_db', 'users', user.$id, { activeEventId: eventId });
            router.refresh();
        } catch (error) {
            toast.error("Messujen vaihto epäonnistui!");
            console.log('Error updating user document:', error);
        }
    }
    console.log(user)
    return (
        <div className={cn(
            "h-screen z-10 bg-white border-r border-[#eaeaea] transition-all duration-[400ms] ease-in-out flex flex-col max-md:absolute",
            isCollapsed ? "w-0 border-0 opacity-0 max-md:w-[320px] max-md:opacity-100 max-md:-translate-x-full" : "w-[350px] max-[1540px]:w-[320px] opacity-100"
        )}>
            {/* Header with collapse button */}
            <div className="flex items-center justify-end p-2 gap-2 border-b shrink-0">
                {(user.role === "admin" || user.role === "premium_user") && (
                    <Select value={activeEventId} onValueChange={handleEventChange}>
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Valitse messut" />
                        </SelectTrigger>
                        <SelectContent>
                            {events.map((event) => (
                                <SelectItem key={event.$id} value={event.$id}>
                                    {event.name}
                                </SelectItem>
                            ))}
                            <Button size="sm" className="w-full mt-2" onClick={() => onOpen("event-modal")}>Luo uudet messut</Button>
                        </SelectContent>
                    </Select>
                )}
                <div className={cn("flex items-center gap-2 transition-opacity duration-100", isCollapsed && "opacity-0")}>
                    {isEditing ? (
                        <>
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}>Peruuta</Button>
                            <Button size="sm" onClick={handleSaveChanges}>Tallenna</Button>
                        </>
                    ) : (
                        <Button variant="ghost" onClick={handleToggleEditMode}>
                            <Edit className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Navigation Content */}
            <div className={cn("overflow-y-auto overflow-x-hidden transition-opacity", isCollapsed ? "opacity-0" : "opacity-100")}>
                <nav className="space-y-4 py-2">
                    {/* <div className='relative my-2 md:hidden px-3'>
                        <Search className='absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400' />
                        <Input className='text-sm w-full h-full pl-10' type="search" placeholder="Search..." />
                    </div> */}
                    <div className='px-2'>
                        {sections.map((section, sectionIndex) => {
                            const hasActiveSubsections = section.initialSubsections?.some(sub => sub.isActive);
                            if (!isEditing && !hasActiveSubsections) return null;

                            return (
                                <div key={sectionIndex}>
                                    <div className="text-sm font-semibold text-black/60 px-4 max-[1540px]:px-1 py-2 tracking-wide uppercase whitespace-nowrap">{section.title}</div>
                                    {section?.initialSubsections && (
                                        <div className="py-1 space-y-1">
                                            {section?.initialSubsections?.map((subsection, subIndex) => {
                                                if (!isEditing && !subsection.isActive) return null;

                                                return (
                                                    <div key={subIndex} className={cn(
                                                        "flex items-center transition-colors rounded-md overflow-hidden",
                                                        pathname.includes(subsection.path) && !isEditing ? 'bg-green-100' : 'hover:bg-gray-100'
                                                    )}>
                                                        {isEditing && (
                                                            <div className="pl-4 flex items-center flex-shrink-0 pr-2">
                                                                <Checkbox
                                                                    id={`sub-${sectionIndex}-${subIndex}`}
                                                                    checked={subsection.isActive}
                                                                    onCheckedChange={() => handleSubsectionToggle(sectionIndex, subIndex)}
                                                                    className="cursor-pointer"
                                                                />
                                                            </div>
                                                        )}
                                                        <Link
                                                            href={process.env.NEXT_PUBLIC_MESSUOPAS_URL + subsection.path}
                                                            className={cn(
                                                                `block text-base py-3.5 leading-none font-normal flex-1 whitespace-nowrap`,
                                                                isEditing ? 'pl-2 pr-4' : 'pl-9 px-4',
                                                                pathname.includes(subsection.path) && !isEditing ? 'text-green-600 font-semibold border-l-4 border-green-500' : 'text-black/90',
                                                                isEditing && 'pointer-events-none'
                                                            )}
                                                        >
                                                            {subsection.title}
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </nav>
            </div>

            <NavUser user={user} />
        </div>
    );
};

export default Sidebar; 