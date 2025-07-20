import NotesView from '@/app/messuopas/[sectionPath]/[subsectionPath]/notes/_components/notes-client-page';
import { getLoggedInUser, getNotesFromInitialSection } from '@/lib/appwrite/server';
import Breadcrumbs from '@/components/breadcrumbs';

// This is a Server Component
export default async function NotesPage({ params }) {
    const { subsectionPath } = await params;

    const user = await getLoggedInUser();

    const { data, error } = await getNotesFromInitialSection(subsectionPath, user.activeEventId);
    
    if (error) {
        console.log(error)
        return (
            <div className="text-red-500 text-2xl font-bold">INTERNAL SERVER ERROR 500</div>
        )
    }

    return (
        <div className="w-full max-w-7xl mx-auto">
            <Breadcrumbs section={data.section} subsection={subsectionPath} />
            <h1 className="text-2xl font-bold mb-4">Muistiinpanot</h1>
            <p className="text-gray-600 mb-6">Tähän tulee muistiinpanot liittyen tähän osioon.</p>

            {/* Render the Client Component and pass initial data to it */}
            <NotesView notes={data} subsectionId={subsectionPath} />
        </div>
    );
}
