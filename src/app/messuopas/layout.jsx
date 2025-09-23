"use server";

import { getLoggedInUser, listDocuments } from "@/lib/appwrite/server";
import { AppProvider } from "@/context/app-context";
import MainLayout from "@/components/main-layout";
import { Toaster } from "@/components/ui/sonner"
import { ModalProvider } from "@/components/providers/modal-provider";
import { Query } from "node-appwrite";
import { redirect } from "next/navigation";

// Mark this segment as dynamic to prevent static prerender during build
// Block comment: This avoids DYNAMIC_SERVER_USAGE because getLoggedInUser() reads cookies()
// export const dynamic = 'force-dynamic';

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

    // Events by role
    let eventQueries = undefined; // line comment: undefined => fetch all (admin)
    if (user.role === 'admin') {
        eventQueries = undefined;
    } else if (user.role === 'customer_admin') {
        const orgId = user.organization?.$id ?? user.organization ?? null;
        eventQueries = orgId ? [Query.equal('organization', orgId)] : [Query.equal('user', user.$id)];
    } else if (user.role === 'premium_user') {
        const allowed = Array.isArray(user.accessibleEventsIds) ? user.accessibleEventsIds : [];
        eventQueries = allowed.length > 0 ? [Query.equal('$id', allowed)] : [Query.equal('user', user.$id)];
    } else {
        // regular user
        eventQueries = [Query.equal('user', user.$id)];
    }

    const { data: events, error: eventsError } = await listDocuments(
        'main_db',
        'events',
        eventQueries
    );

    if (eventsError) {
        console.error('Error fetching events data:', eventsError);
        return (
            <p className="text-red-500 text-2xl font-bold">Internal Server Error 500</p>
        );
    }

    // Get user section preferences for ordering and active states
    let userSectionPreferences = null;
    try {
        const preferencesQuery = [];
        
        // Only user + event are the key variables now
        preferencesQuery.push(Query.equal('user', user.$id));
        
        if (user?.activeEventId) {
            preferencesQuery.push(Query.equal('event', user.activeEventId));
        }

        const { data: preferencesData } = await listDocuments('main_db', 'user_section_preferences', preferencesQuery);
        userSectionPreferences = preferencesData?.[0] || null;
        
        console.log('Sidebar - User section preferences:', userSectionPreferences);
    } catch (preferencesError) {
        console.error('Error fetching user section preferences:', preferencesError);
    }




    // Fetch additional sections for current user and event (same logic as dashboard)
    let additionalSections = [];
    
    const sectionsQuery = [];
    if (user?.organization) {
        sectionsQuery.push(Query.equal('organization', user.organization.$id));
        sectionsQuery.push(Query.equal('eventId', user.activeEventId));
    } else {
        sectionsQuery.push(Query.equal('user', user.$id));
        sectionsQuery.push(Query.equal('eventId', user.activeEventId));
    }

    const { data: additionalSectionsData, error: additionalSectionsError } = await listDocuments('main_db', 'additional_sections', sectionsQuery);
    
    if (!additionalSectionsError && Array.isArray(additionalSectionsData)) {
        additionalSections = additionalSectionsData;
    }

    // Combine initial and additional sections with preferences logic (same as dashboard)
    const combineAllSections = () => {
        const allSections = [];

        // Add initial sections with type marker
        (data || []).forEach(section => {
            allSections.push({
                ...section,
                type: 'initial',
                subsections: section.initialSubsections || []
            });
        });

        // Add additional sections with type marker
        (additionalSections || []).forEach(section => {
            allSections.push({
                ...section,
                type: 'additional',
                subsections: section.additionalSubsections || [],
                isAdditional: true
            });
        });

        // If no preferences found, return sections in default order
        if (!userSectionPreferences || !userSectionPreferences.orderedActiveSections) {
            console.log('Sidebar - No user preferences found for combined sections, using default order');
            return allSections.sort((a, b) => (a.order || 0) - (b.order || 0)).map(section => ({
                ...section,
                initialSubsections: (section.subsections || []).map(sub => ({
                    ...sub,
                    isActive: true // Default to active
                }))
            }));
        }

        // Parse ordered sections from preferences
        let orderedSectionsData = [];
        try {
            orderedSectionsData = JSON.parse(userSectionPreferences.orderedActiveSections);
        } catch (e) {
            console.error('Sidebar - Error parsing orderedActiveSections for combined sections:', e);
            return allSections.sort((a, b) => (a.order || 0) - (b.order || 0)).map(section => ({
                ...section,
                initialSubsections: (section.subsections || []).map(sub => ({
                    ...sub,
                    isActive: true
                }))
            }));
        }

        // Order sections based on preferences
        const orderedSections = [];
        const unorderedSections = [...allSections];

        // Sort by order from preferences
        orderedSectionsData
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach(sectionPref => {
                const sectionIndex = unorderedSections.findIndex(s => s.$id === sectionPref.id);
                if (sectionIndex !== -1) {
                    const section = unorderedSections.splice(sectionIndex, 1)[0];
                    
                    // Apply subsection ordering and active state
                    if (sectionPref.subsections && Array.isArray(sectionPref.subsections)) {
                        const orderedSubsections = [];
                        const unorderedSubsections = [...(section.subsections || [])];
                        
                        // Order subsections based on preferences
                        sectionPref.subsections
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .forEach(subPref => {
                                const subIndex = unorderedSubsections.findIndex(sub => sub.$id === subPref.id);
                                if (subIndex !== -1) {
                                    const subsection = unorderedSubsections.splice(subIndex, 1)[0];
                                    orderedSubsections.push({
                                        ...subsection,
                                        isActive: subPref.active !== false
                                    });
                                }
                            });
                        
                        // Add any remaining subsections that weren't in preferences
                        orderedSubsections.push(...unorderedSubsections.map(sub => ({
                            ...sub,
                            isActive: true
                        })));
                        
                        section.initialSubsections = orderedSubsections;
                    } else {
                        // No subsection preferences, default all to active
                        section.initialSubsections = (section.subsections || []).map(sub => ({
                            ...sub,
                            isActive: true
                        }));
                    }
                    
                    orderedSections.push(section);
                }
            });

        // Add any remaining sections that weren't in preferences
        unorderedSections.forEach(section => {
            const sectionPref = orderedSectionsData.find(pref => pref.id === section.$id);
            if (sectionPref && sectionPref.subsections && Array.isArray(sectionPref.subsections)) {
                const orderedSubsections = [];
                const unorderedSubsections = [...(section.subsections || [])];

                sectionPref.subsections
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .forEach(subPref => {
                        const subIndex = unorderedSubsections.findIndex(sub => sub.$id === subPref.id);
                        if (subIndex !== -1) {
                            const subsection = unorderedSubsections.splice(subIndex, 1)[0];
                            orderedSubsections.push({
                                ...subsection,
                                isActive: subPref.active !== false
                            });
                        }
                    });

                orderedSubsections.push(...unorderedSubsections.map(sub => ({
                    ...sub,
                    isActive: true
                })));
                section.initialSubsections = orderedSubsections;
            } else {
                section.initialSubsections = (section.subsections || []).map(sub => ({
                    ...sub,
                    isActive: true
                }));
            }
            orderedSections.push(section);
        });

        return orderedSections;
    };

    // Use the combined sections logic
    const allSections = combineAllSections();

    return (
        <AppProvider initialUser={user} initialSections={allSections} initialEvents={events}>
            <ModalProvider />
            <MainLayout
                user={user}
                events={events}
                organizations={organizations}
                privateUsers={privateUsers}
                sections={allSections}
            >
                {children}
            </MainLayout>
            <Toaster />
        </AppProvider>
    );
}