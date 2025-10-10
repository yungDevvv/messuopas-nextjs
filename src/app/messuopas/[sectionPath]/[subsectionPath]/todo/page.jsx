
import Breadcrumbs from "@/components/breadcrumbs";
import TodoClientPage from "./_components/todo-client-page";
import { getTodosFromInitialSection, getLoggedInUser, getTodosFromAdditionalSection } from "@/lib/appwrite/server";

export default async function TodoPage({ params }) {
    // TODO: Fetch todo items for the specific subsection from your database
    const { sectionPath, subsectionPath } = await params;
    const user = await getLoggedInUser();

    const { data, error } = await getTodosFromInitialSection(subsectionPath, user.activeEventId);
    const { data: additionalSectionTodos, error: additionalSectionError } = await getTodosFromAdditionalSection(subsectionPath, user.activeEventId);

    if (error) {
        console.log(error)
        return (
            <div className="text-red-500 text-2xl font-bold">INTERNAL SERVER ERROR 500</div>
        )
    }

    return (
        <div className="w-full max-w-7xl mx-auto">
            <Breadcrumbs section={data.section} subsection={subsectionPath} />
            <h1 className="text-2xl font-bold mb-4">Tehtävälista</h1>
            <p className="text-gray-600 mb-6">Tähän tulee tehtävälista liittyen tähän osioon.</p>

            {/* Render the Client Component and pass initial data to it */}
            <TodoClientPage subsectionId={subsectionPath} sectionPath={sectionPath} todos={data?.length > 0 ? data : additionalSectionTodos?.length > 0 ? additionalSectionTodos : []} additionalSectionTodos={additionalSectionTodos} user={user} />
        </div>
    );
}
