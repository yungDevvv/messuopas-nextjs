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

    const { data, error: initialSectionsError } = await listDocuments('main_db', 'initial_sections');

    if (initialSectionsError) {
        console.error('Error fetching initial data:', initialSectionsError);
        // Optionally, render an error state
        return (
            <p className="text-red-500 text-2xl font-bold">Internal Server Error 500</p>
        );
    }

    const { data: events, error: eventsError } = await listDocuments('main_db', 'events', [
        Query.equal('user', user.$id)
    ]);

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

    return (
        <AppProvider initialUser={user} initialSections={orderedSections} initialEvents={events}>
            <MainLayout sections={orderedSections} user={user} events={events} activeSubsectionsDocument={activeSubsections.length === 0 ? null : activeSubsections[0]}>
                {children}
            </MainLayout>
            <Toaster />
            <ModalProvider />
        </AppProvider>
    );
}