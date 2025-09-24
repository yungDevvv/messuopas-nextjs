"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { Edit, Edit2, Plus, X } from 'lucide-react';
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
import { toast } from 'sonner';

function Sidebar({ events, user, organizations = [], privateUsers = [], sections }) {
    const { setSections: setSectionsInContext, setCurrentSection, setCurrentSubSection } = useAppContext();

    const { isCollapsed } = useSidebarStore();
    const pathname = usePathname();
    const { onOpen } = useModal();
    const [isEditing, setIsEditing] = useState(false);

    // Use sections directly from props (already processed in layout.jsx)
    const [preEditSections, setPreEditSections] = useState(null);
    const [activeEventId, setActiveEventId] = useState(user.activeEventId);
    // Admin-only: selected owner to filter events (organization or user without organization)
    const [selectedOwner, setSelectedOwner] = useState(() => {
        // line comment: initialize from props to have value on first render
        const orgId = user?.organization?.$id ?? user?.organization ?? null;
        if (orgId) return { type: 'org', id: orgId };
        const activeUserId = user?.activeUserId ?? null;
        if (activeUserId) return { type: 'user', id: activeUserId };
        return null;
    }); // { type: 'org'|'user', id: string }
    const router = useRouter();
    // No need for localStorage anymore - data comes with isActive from layout

    // Keep context in sync for other components
    useEffect(() => {
        if (sections) {
            setSectionsInContext(sections);
        }
    }, [sections, setSectionsInContext]);

    // Initialize owner selection from current user
    useEffect(() => {
        // prefer organization if present, else activeUserId
        const orgId = user?.organization?.$id ?? user?.organization ?? null;
        if (orgId) {
            setSelectedOwner({ type: 'org', id: orgId });
            return;
        }
        const activeUserId = user?.activeUserId ?? null;
        if (activeUserId) {
            setSelectedOwner({ type: 'user', id: activeUserId });
            return;
        }
        setSelectedOwner(null);
    }, [user]);

    // Keep local activeEventId in sync with user prop updates
    useEffect(() => {
        // line comment: ensure Select reflects new active event after create/refresh
        const nextId = user?.activeEventId || "";
        setActiveEventId(nextId);
    }, [user?.activeEventId]);

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

            {/* Admin-only: Owner selector (organizations + users without organization) */}
            {user.role === "admin" && !isEditing && (
                <div className="p-2">
                    <Select
                        value={selectedOwner ? `${selectedOwner.type}:${selectedOwner.id}` : undefined}
                        onValueChange={async (val) => {
                            // Parse value like 'org:<id>' or 'user:<id>'
                            const [type, id] = val.split(":");
                            setSelectedOwner({ type, id });
                            // reset active event selection when owner changes
                            setActiveEventId("");
                            // If admin selected an organization as owner, also persist it on the current user
                            if (type === 'org') {
                                try {
                                    // Update user's active organization
                                    await updateDocument("main_db", "users", user.$id, { organization: id, activeUserId: null }); // line comment: set org and clear activeUserId
                                    toast.success("Organisaatio käyttäjälle on päivitetty");
                                    router.refresh();
                                    // Auto-select first event for this organization
                                    let filtered = Array.isArray(events) ? events : [];
                                    filtered = filtered.filter(e => {
                                        const orgId = e.organization?.$id || e.organization;
                                        return orgId === id;
                                    });
                                    const first = filtered[0];
                                    if (first?.$id) {
                                        await handleEventChange(first.$id); // line comment: set first event active
                                    }
                                } catch (err) {
                                    console.error(err);
                                    toast.error("Organisaation käyttäjälle ei voitu päivittää");
                                }
                            } else if (type === 'user') {
                                try {
                                    // Clear user's organization when selecting user owner
                                    await updateDocument("main_db", "users", user.$id, { organization: null, activeUserId: id }); // line comment: detach organization and set activeUserId
                                    toast.success("Käyttäjän aktiivinen käyttäjä on asetettu ja organisaatio poistettu"); // line comment: success toast
                                    router.refresh(); // line comment: refresh view
                                    // Auto-select first event for this user
                                    let filtered = Array.isArray(events) ? events : [];
                                    filtered = filtered.filter(e => {
                                        const userId = e.user?.$id || e.user;
                                        return userId === id;
                                    });
                                    const first = filtered[0];
                                    if (first?.$id) {
                                        await handleEventChange(first.$id); // line comment: set first event active
                                    }
                                } catch (err) {
                                    console.error(err);
                                    toast.error("Aktiivista käyttäjää ei voitu asettaa / organisaatiota poistaa");
                                }
                            }
                        }}
                    >
                        <SelectTrigger className="w-full max-md:w-[calc(100%-40px)] max-md:ml-10 max-md:mr-10">
                            <SelectValue placeholder="Valitse omistaja" />
                        </SelectTrigger>
                        <SelectContent>
                            {/* Organizations */}
                            {Array.isArray(organizations) && organizations.map((org) => (
                                <SelectItem key={org.$id} value={`org:${org.$id}`}>
                                    {org.name}
                                </SelectItem>
                            ))}
                            {/* Users without organization */}
                            {Array.isArray(privateUsers) && privateUsers.map((u) => (
                                <SelectItem key={u.$id} value={`user:${u.$id}`}>
                                    {u.email}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

            )}
            {/* Header with collapse button */}
            <div className={cn("flex items-center justify-end p-2 gap-2 border-b shrink-0", !isEditing && "justify-between")}>

                {(user.role === "admin" || user.role === "premium_user" || user.role === "customer_admin") && !isEditing && (
                    <Select value={activeEventId} onValueChange={handleEventChange}>
                        {console.log(activeEventId, "events123123123")}
                        <SelectTrigger className="w-full max-md:ml-10">
                            <SelectValue placeholder="Valitse messut" />
                        </SelectTrigger>
                        <SelectContent>
                            {(() => {
                                // Compute filtered events
                                let filtered = Array.isArray(events) ? events : [];
                                if (user.role === 'admin' && selectedOwner) {
                                    if (selectedOwner.type === 'org') {
                                        filtered = filtered.filter(e => {
                                            const orgId = e.organization?.$id || e.organization;
                                            return orgId === selectedOwner.id;
                                        });
                                    } else if (selectedOwner.type === 'user') {
                                        const ownerId = selectedOwner.id;
                                        filtered = filtered.filter(e => {
                                            const userId = e.user?.$id || e.user;
                                            return userId === ownerId;
                                        });
                                    }
                                } else if (user.role === 'premium_user') {
                                    // line comment: for premium_user only, restrict by accessibleEventsIds if provided
                                    const allowed = Array.isArray(user.accessibleEventsIds) ? user.accessibleEventsIds : [];
                                    console.log("allowed", allowed);
                                    if (allowed.length > 0) {
                                        filtered = filtered.filter(e => allowed.includes(e.$id));
                                    }
                                }
                                return filtered.map((event) => (
                                    <SelectItem key={event.$id} value={event.$id}>
                                        {event.name}
                                    </SelectItem>
                                ));
                            })()}
                            {/* {user.role === 'admin' || user.role === 'customer_admin' && (
                                <Button size="sm" className="w-full mt-2" onClick={() => onOpen("event-modal")}>Luo uudet messut</Button>
                            )} */}
                        </SelectContent>
                    </Select>
                )}
                <div className={cn("flex w-full items-center justify-between gap-2 transition-opacity duration-100", isCollapsed && "opacity-0", !isEditing && "w-fit", isEditing && "max-md:mt-10")}>
                    <div className="flex items-center gap-1">
                        {/* {user.role === "admin" || user.role === "customer_admin" && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    title="Muokkaa messut"
                                    onClick={(e) => {
                                        e.preventDefault(); // line comment: do not select item
                                        e.stopPropagation(); // line comment: keep dropdown state controlled by Select
                                        onOpen("event-modal", { event: events.find(e => e.$id === activeEventId) });
                                    }}
                                >
                                    <Edit2 className="h-4 w-4" />
                                </Button>
                            )} */}
                        {/* <Button variant="ghost" size="sm" onClick={handleToggleEditMode}>
                            <Edit className="h-4 w-4" />
                        </Button> */}
                    </div>
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
                         
                            const hasActiveSubsections = section.initialSubsections?.some(sub => sub.isActive === true);
                            const hasSubsections = (section.initialSubsections && section.initialSubsections.length > 0) || (section.additionalSubsections && section.additionalSubsections.length > 0);
                            
                            // Debug log for sidebar
                            if (section.title === "Myynnillinen Asiakashankinta") {
                                console.log(`Sidebar - Section "${section.title}":`, {
                                    hasActiveSubsections,
                                    hasSubsections,
                                    subsections: section.initialSubsections?.map(sub => ({ title: sub.title, isActive: sub.isActive }))
                                });
                            }
                            
                            // Check if current page is collaborators page
                            const isCollaboratorsPage = pathname.includes('/collaborators');
                            
                            // Hide additional_sections when on collaborators page
                            if (isCollaboratorsPage && section.$collectionId === "additional_sections") return null;

                            // Show section if: editing mode OR has active subsections OR has no subsections but is a main section
                            if (!hasActiveSubsections || !hasSubsections) return null;
                            // For additional sections, show even if no subsections present when not editing
                            if (!hasSubsections && !section.isAdditional) return null;

                            if (section.eventId && section.eventId !== user.activeEventId) return null;

                            return section;
                        }).filter(Boolean).map((section, displayIndex) => {
                            const hasSubsections = (section.initialSubsections && section.initialSubsections.length > 0) || (section.additionalSubsections && section.additionalSubsections.length > 0);
                            
                            return (
                                <div key={section.$id || displayIndex}>
                                    {/* {(section.$collectionId === "additional_sections" && sections[displayIndex - 1].$collectionId === "initial_sections") && <div className='pb-3 border-t mt-2 border-gray-200'></div>} */}
                                    <div className="text-[15px] font-bold text-black/60 px-1 max-[1540px]:px-1 py-2 tracking-wide uppercase whitespace-nowrap">
                                        {displayIndex + 1}. {section.title}
                                    </div>

                                    {/* Render subsections if they exist */}
                                    {hasSubsections && (
                                        <div className="py-1 space-y-1">
                                            {section.initialSubsections.map((subsection, subIndex) => {
                                                // In view mode, only show active subsections

                                                if (subsection.isActive !== true) return null;

                                                // Get current path segments and check if last segment is documents/notes/todos/collaborators
                                                const pathSegments = pathname.split('/').filter(Boolean);
                                                const lastSegment = pathSegments[pathSegments.length - 1];
                                                const isSpecialSegment = ['documents', 'notes', 'todo', 'collaborators'].includes(lastSegment);

                                                // Resolve ids/paths for section and subsection
                                                const sectionKey = section.path ?? section.$id;
                                                const subKey = subsection.path ?? subsection.$id;

                                                // Build the base path using path when available
                                                let fullPath = `/${sectionKey}/${subKey}`;

                                                // If current URL ends with documents/notes/todos/collaborators, keep it in the URL
                                                if (isSpecialSegment) {
                                                    fullPath += `/${lastSegment}`;
                                                }

                                                // Check if current path matches this subsection
                                                const isCurrentPath = pathname === `/messuopas${fullPath}`;

                                                return (
                                                    <div key={(subsection.$id || subsection.path || subIndex)} className={cn(
                                                        "flex items-center transition-colors rounded-md overflow-hidden",
                                                        isCurrentPath && !isEditing ? 'bg-green-100' : 'hover:bg-gray-100'
                                                    )}>

                                                        {/* Navigation link */}
                                                        <Link
                                                            href={process.env.NEXT_PUBLIC_MESSUOPAS_URL + fullPath}
                                                            onClick={() => {
                                                                setCurrentSection(section);
                                                                setCurrentSubSection(subsection);
                                                            }}
                                                            className={cn(
                                                                "block text-base py-3.5 leading-none font-normal flex-1 whitespace-nowrap transition-colors",
                                                                isEditing ? 'pl-2 pr-4' : ' px-4',
                                                                isCurrentPath && !isEditing
                                                                    ? 'text-green-600 font-semibold border-l-4 border-green-500'
                                                                    : 'text-black/90',
                                                                isEditing && 'pointer-events-none cursor-default'
                                                            )}
                                                        >
                                                            {displayIndex + 1}.{subIndex + 1} {subsection.title}
                                                        </Link>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* {isEditing && (user.role === "admin" || user.role === "customer_admin") && (
                                        <div className="ml-2">
                                            <Button className="w-full justify-start !px-2" variant="ghost" onClick={() => {
                                                const sectionKey = section.path ?? section.$id;
                                                router.push(`/messuopas/${sectionKey}/section`);
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
                                    )} */}
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