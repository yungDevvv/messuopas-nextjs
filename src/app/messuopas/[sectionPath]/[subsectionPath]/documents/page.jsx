"use server";
import { getDocumentsFromInitialSection, getLoggedInUser } from "@/lib/appwrite/server";
import Breadcrumbs from "@/components/breadcrumbs";
import DocumentsClientPage from "./_components/documents-client-page";

export default async function Page({ params }) {
    const { subsectionPath } = await params;

    const user = await getLoggedInUser();

    const { data, error } = await getDocumentsFromInitialSection(subsectionPath, user.activeEventId);
console.log(data, "data")
    if (error) {
        console.log(error)
        return (
            <div className="text-red-500 text-2xl font-bold">INTERNAL SERVER ERROR 500</div>
        )
    }
    return (
        <div className="w-full max-w-7xl mx-auto">
            <Breadcrumbs section={data.section} subsection={subsectionPath} />
            <h1 className="text-2xl font-bold mb-4">Liitteet</h1>
            <p className="text-gray-600 mb-6">Tähän tulee liitteet liittyen tähän osioon.</p>
           
            <DocumentsClientPage documents={data} subsectionId={subsectionPath} />

        </div>
    );
};