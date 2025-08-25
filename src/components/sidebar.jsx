"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Edit, Plus, X } from 'lucide-react';
import { Checkbox } from './ui/checkbox';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/app-context';
import { usePathname } from 'next/navigation';
import { useSidebarStore } from '@/stores/sidebar-store';
import { NavUser } from './nav-user';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useModal } from '@/hooks/use-modal';
import { updateDocument, createDocument } from '@/lib/appwrite/server';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';


function Sidebar({ events, user, activeSubsectionsDocument }) {
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
    // No need for localStorage anymore - data comes with isActive from layout

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

    const handleSaveChanges = async () => {
        // 1. Save to Appwrite
        const activeSubsectionPaths = sections
            .flatMap(section =>
                section.initialSubsections?.map(sub => ({
                    sectionId: section.$id,
                    subsectionId: sub.$id,
                    isActive: sub.isActive
                })) || []
            )
            .filter(sub => sub.isActive)
            .map(sub => sub.subsectionId);

        if (!activeSubsectionsDocument?.$id) {
            const { error } = await createDocument('main_db', 'active_event_subsections', {
                body: {
                    eventId: activeEventId,
                    userId: user.$id,
                    activeSubsections: activeSubsectionPaths
                }
            });

            if (error) {
                console.log(error);
                toast.error("Tapahtui virhe.")
                return;
            }
            router.refresh();
            toast.success("Osiot tallennettu onnistuneesti!")
            setIsEditing(false);
            setPreEditSections(null); // Clear the pre-edit state
            return;
        }


        const { error } = await updateDocument('main_db', 'active_event_subsections', activeSubsectionsDocument.$id, {
            activeSubsections: activeSubsectionPaths
        });

        if (error) {
            console.log(error);
            toast.error("Tapahtui virhe.")
            return;
        }

        setIsEditing(false);
        setPreEditSections(null); // Clear the pre-edit state
        toast.success("Osiot tallennettu onnistuneesti!")
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

        const { error } = await updateDocument('main_db', 'users', user.$id, { activeEventId: eventId });

        if (error) {
            console.error('Error updating user document:', error);
            toast.error("Tapahtui virhe.");
            return;
        }

        // Reload page to get updated sections for new event
        window.location.reload();
    }

    return (
        <div className={cn(
            "h-screen z-10 bg-white border-r border-[#eaeaea] transition-all duration-[400ms] ease-in-out flex flex-col max-md:absolute",
            isCollapsed ? "w-0 border-0 opacity-0 max-md:w-[320px] max-md:opacity-100 max-md:-translate-x-full" : "w-[350px] max-[1540px]:w-[320px] opacity-100"
        )}>
            {/* Header with collapse button */}
            <div className={cn("flex items-center justify-end p-2 gap-2 border-b shrink-0", !isEditing && "justify-between")}>
                {(user.role === "admin" || user.role === "premium_user") && !isEditing && (
                    <Select value={activeEventId} onValueChange={handleEventChange}>
                        <SelectTrigger className="w-full max-md:ml-10">
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
                <div className={cn("flex w-full items-center justify-between gap-2 transition-opacity duration-100", isCollapsed && "opacity-0", !isEditing && "w-fit", isEditing && "max-md:mt-10")}>
                    {isEditing ? (
                        <>
                            <div className="justify-self-start">
                                <Button size="sm" variant="ghost" onClick={() => onOpen("additional-section-modal")}>
                                    <Plus className="h-5 w-5 mr-2" /> Luo uusi osio
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" onClick={handleCancelEdit}><X className="h-5 w-5" /></Button>
                                <Button size="sm" onClick={handleSaveChanges}>Tallenna</Button>
                            </div>

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
                            const hasSubsections = section.initialSubsections && section.initialSubsections.length > 0;

                            // Show section if: editing mode OR has active subsections OR has no subsections but is a main section
                            if (!isEditing && !hasActiveSubsections && hasSubsections) return null;
                            if (!hasSubsections && !isEditing) return null;
                            return (
                                <div key={section.$id || sectionIndex}>
                                    <div className="text-sm font-semibold text-black/60 px-4 max-[1540px]:px-1 py-2 tracking-wide uppercase whitespace-nowrap">
                                        {sectionIndex + 1}. {section.title}
                                    </div>

                                    {/* Render subsections if they exist */}
                                    {hasSubsections && (
                                        <div className="py-1 space-y-1">
                                            {section.initialSubsections.map((subsection, subIndex) => {
                                                // In view mode, only show active subsections
                                           
                                                if (!isEditing && !subsection.isActive) return null;

                                                // Get current path segments and check if last segment is documents/notes/todos
                                                const pathSegments = pathname.split('/').filter(Boolean);
                                                const lastSegment = pathSegments[pathSegments.length - 1];
                                                const isSpecialSegment = ['documents', 'notes', 'todo'].includes(lastSegment);

                                                // Build the base path
                                                let fullPath = `/${section.$id}/${subsection.$id}`;

                                                // If current URL ends with documents/notes/todos, keep it in the URL
                                                if (isSpecialSegment) {
                                                    fullPath += `/${lastSegment}`;
                                                }
                                     
                                                // Check if current path matches this subsection
                                                const isCurrentPath = pathname === `/messuopas${fullPath}`;
                                               
                                                return (
                                                    <div key={subsection.$id || subIndex} className={cn(
                                                        "flex items-center transition-colors rounded-md overflow-hidden",
                                                        isCurrentPath && !isEditing ? 'bg-green-100' : 'hover:bg-gray-100'
                                                    )}>
                                                        {/* Checkbox for editing mode */}
                                                        {isEditing && (
                                                            <div className="pl-4 flex items-center flex-shrink-0 pr-2">
                                                                <Checkbox
                                                                    id={`sub-${sectionIndex}-${subIndex}`}
                                                                    checked={subsection.isActive || false}
                                                                    onCheckedChange={() => handleSubsectionToggle(sectionIndex, subIndex)}
                                                                    className="cursor-pointer"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Navigation link */}
                                                        <Link
                                                            href={process.env.NEXT_PUBLIC_MESSUOPAS_URL + fullPath}
                                                            className={cn(
                                                                "block text-base py-3.5 leading-none font-normal flex-1 whitespace-nowrap transition-colors",
                                                                isEditing ? 'pl-2 pr-4' : 'pl-9 px-4',
                                                                isCurrentPath && !isEditing
                                                                    ? 'text-green-600 font-semibold border-l-4 border-green-500'
                                                                    : 'text-black/90',
                                                                isEditing && 'pointer-events-none cursor-default'
                                                            )}
                                                        >
                                                            {sectionIndex + 1}.{subIndex + 1} {subsection.title}
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {isEditing && (
                                        <div className="ml-2">
                                            <Button className="w-full justify-start !px-2" variant="ghost" onClick={() => {
                                                router.push(`/messuopas/${section.$id}/section`);
                                                setTimeout(() => {
                                                    setIsEditing(false);
                                                }, 100);
                                            }}>
                                                <Plus className="h-4 w-4" />
                                                <div className="ml-2 !text-base">
                                                    {sectionIndex + 1}.{(section.initialSubsections?.length || 0) + 1} Uusi ali-osio
                                                </div>
                                            </Button>
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