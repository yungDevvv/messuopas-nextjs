import ClientSectionsPage from "./_components/client-osiot-page";
import { listDocuments } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";
import { getLoggedInUser } from "@/lib/appwrite/server";


export default async function SectionsPage() {
    const user = await getLoggedInUser();

    if (
        user.role !== "admin" &&
        user.role !== "customer_admin" &&
        user.role !== "premium_user"
    ) {
        return <h1>NO ACCESS TO THIS PAGE</h1>;
    }

    const sectionsQuery = [];
    const eventsQuery = [];

    if (user?.organization) {
        sectionsQuery.push(Query.equal('organization', user.organization.$id));
        sectionsQuery.push(Query.equal('eventId', user.activeEventId));
        eventsQuery.push(Query.equal('organization', user.organization.$id));
    } else {
        sectionsQuery.push(Query.equal('user', user.$id));
        sectionsQuery.push(Query.equal('eventId', user.activeEventId));
        eventsQuery.push(Query.equal('user', user.$id));
    }

    const { data, error } = await listDocuments('main_db', 'additional_sections', sectionsQuery);
    const { data: eventsData, error: eventsError } = await listDocuments("main_db", "events", eventsQuery);

    if (error) {
        console.error('Error loading sections:', error);
        return <h1>Virhe osioiden lataamisessa</h1>
    }
    return (
        <div className="p-6 max-w-7xl">
            <ClientSectionsPage additionalSections={data} user={user} events={eventsData} />
        </div>
    )
}