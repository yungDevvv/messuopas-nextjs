"use server";

import { getLoggedInUser, listDocuments } from "@/lib/appwrite/server";
import { AppProvider } from "@/context/app-context";
import MainLayout from "@/components/main-layout";
import { Toaster } from "@/components/ui/sonner"
import { ModalProvider } from "@/components/providers/modal-provider";
import { Query } from "node-appwrite";

export default async function Layout({ children }) {
    const user = await getLoggedInUser();

    if (!user) return "NO SESSION"

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
    console.log(events, "ASD12312312312")
    if (eventsError) {
        console.error('Error fetching events data:', eventsError);
        // Optionally, render an error state
        return (
            <p className="text-red-500 text-2xl font-bold">Internal Server Error 500</p>
        );
    }


    return (
        <AppProvider initialUser={user} initialSections={data} initialEvents={events}>
            <MainLayout sections={data} user={user} events={events}>
                {children}
            </MainLayout>
            <Toaster />
            <ModalProvider />
        </AppProvider>
    );
}