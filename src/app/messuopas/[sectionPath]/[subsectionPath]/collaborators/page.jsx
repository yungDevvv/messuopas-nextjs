"use server";
import { listDocuments } from "@/lib/appwrite/server";
import Breadcrumbs from "@/components/breadcrumbs";
import CollaboratorsClientPage from "./_components/collaborators-client-page";
import { Query } from "node-appwrite";

export default async function Page({ params }) {
    const { subsectionPath, sectionPath } = await params;

    // const user = await getLoggedInUser();

    const { data: subSectionCollaborators, error: subSectionError } = await listDocuments('main_db', 'collobarators', [
        Query.equal('subSection', subsectionPath)
    ]);
    const { data: allInitialSectionCollaborators, error: initialSectionError } = await listDocuments('main_db', 'collobarators', [
        Query.equal('initialSection', sectionPath)
    ]);
    // console.log(allInitialSectionCollaborators, "allInitialSectionCollaborators")
    console.log(subSectionCollaborators, "subSectionCollaborators")
    if (subSectionError || initialSectionError) {
        console.log(subSectionError || initialSectionError)
        return (
            <div className="text-red-500 text-2xl font-bold">INTERNAL SERVER ERROR 500</div>
        )
    }

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* <Breadcrumbs section={data.section} subsection={subsectionPath} /> */}
            <h1 className="text-2xl font-bold mb-4">Yhteistyökumppanit</h1>
            <p className="text-gray-600 mb-6">Tähän tulee yhteistyökumppanit liittyen tähän osioon.</p>

            <CollaboratorsClientPage
                collaborators={subSectionCollaborators}
                subsectionData={subsectionPath}
                sectionData={sectionPath}
                allInitialSectionCollaborators={allInitialSectionCollaborators}
            />
        </div>
    );
};