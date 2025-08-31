"use server";

import { getLoggedInUser, listDocuments } from "@/lib/appwrite/server";
import { AppProvider } from "@/context/app-context";
import MainLayout from "@/components/main-layout";
import { Toaster } from "@/components/ui/sonner"
import { ModalProvider } from "@/components/providers/modal-provider";
import { Query } from "node-appwrite";
import { redirect } from "next/navigation";

export default async function Layout({ children }) {
    const user = await getLoggedInUser();

    if (!user) return redirect("/login");

    let organizations = null;
    let privateUsers = null;
    if (user.role === "admin") {
        const { data, error: organizationsError } = await listDocuments('main_db', 'organizations');
        // Users without organization
        const { data: privateUsersData, error: privateUsersError } = await listDocuments('main_db', 'users', [
            Query.isNull('organization')
        ]);
        if (organizationsError) console.error(organizationsError);
        if (privateUsersError) console.error(privateUsersError);
        organizations = data;
        privateUsers = privateUsersData;
    }

    const { data, error: initialSectionsError } = await listDocuments('main_db', 'initial_sections');

    if (initialSectionsError) {
        console.error('Error fetching initial data:', initialSectionsError);
        // Optionally, render an error state
        return (
            <p className="text-red-500 text-2xl font-bold">Internal Server Error 500</p>
        );
    }

    // Events: admin sees all, others only their own
    const { data: events, error: eventsError } = await listDocuments(
        'main_db',
        'events',
        user.role === 'admin' ? undefined : [Query.equal('user', user.$id)]
    );

    if (eventsError) {
        console.error('Error fetching events data:', eventsError);
        return (
            <p className="text-red-500 text-2xl font-bold">Internal Server Error 500</p>
        );
    }

    // Get active subsections for current user and active event
    let activeSubsectionPaths = [];

    const { data: activeSubsections, error: activeSubsectionsError } = await listDocuments('main_db', 'active_event_subsections', [
        Query.equal('userId', user.$id),
        Query.equal('eventId', user.activeEventId)
    ]);

    if (activeSubsections && activeSubsections.length > 0) {
        activeSubsectionPaths = activeSubsections[0].activeSubsections || [];
    }



    // Process sections and mark subsections as active based on Appwrite data
    const orderedSections = data.sort((a, b) => a.order - b.order).map(section => ({
        ...section,
        initialSubsections: section.initialSubsections?.map(subsection => {
            return {
                ...subsection,
                isActive: activeSubsections?.length > 0 ? activeSubsectionPaths.includes(subsection.$id) : true
            };
        }) || []
    }));

    // Fetch additional sections for organization and for private user, then merge
    let additionalSections = [];

    // Organization-level additional sections (visible to members)
    if (user.organization?.$id) {
        const { data: orgAdditional, error: orgAddErr } = await listDocuments('main_db', 'additional_sections', [
            Query.equal('organization', user.organization.$id)
        ]);
        if (!orgAddErr && Array.isArray(orgAdditional)) {
            additionalSections = additionalSections.concat(orgAdditional);
        }
    }

    // Private user additional sections
    {
        const { data: userAdditional, error: userAddErr } = await listDocuments('main_db', 'additional_sections', [
            Query.equal('user', user.$id)
        ]);
        if (!userAddErr && Array.isArray(userAdditional)) {
            // Avoid duplicates if any
            const existing = new Set(additionalSections.map(s => s.$id));
            additionalSections = additionalSections.concat(userAdditional.filter(s => !existing.has(s.$id)));
        }
    }

    // Normalize additional sections to the same shape used by Sidebar and mark ownership
    // Use `additionalSubsections` as source and expose them under `initialSubsections`
    const normalizedAdditionalSections = additionalSections.map((s, idx) => ({
        ...s,
        initialSubsections: Array.isArray(s.additionalSubsections)
            ? s.additionalSubsections.map(sub => {
                // sub can be an object (expanded doc) or a string (relation id)
                if (typeof sub === 'string') {
                    return {
                        $id: sub,
                        path: sub,
                        isActive: true,
                    };
                }
                return {
                    ...sub,
                    $id: sub.$id,
                    path: sub.path,
                    isActive: true,
                };
            })
            : [],
        isAdditional: true,
        ownerType: s.organization && !s.user ? 'organization' : 'user'
    }));

    // Combine initial and additional sections (additional appended at the end)
    const allSections = [...orderedSections, ...normalizedAdditionalSections];

    return (
        <AppProvider initialUser={user} initialSections={allSections} initialEvents={events}>
            <MainLayout sections={allSections} user={user} events={events} organizations={organizations} privateUsers={privateUsers} activeSubsectionsDocument={activeSubsections.length === 0 ? null : activeSubsections[0]}>
                {children}
            </MainLayout>
            <Toaster />
            <ModalProvider />
        </AppProvider>
    );
}