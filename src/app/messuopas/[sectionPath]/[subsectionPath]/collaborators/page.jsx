"use server";
import { listDocuments, getDocument } from "@/lib/appwrite/server";
import Breadcrumbs from "@/components/breadcrumbs";
import CollaboratorsClientPage from "./_components/collaborators-client-page";
import { Query } from "node-appwrite";

export default async function Page({ params }) {
    const { subsectionPath, sectionPath } = await params;

    // const user = await getLoggedInUser();

    // Get all collaborators and filter on client side since subSection is a virtual relationship attribute
    const { data: allCollaborators, error: subSectionError } = await listDocuments('main_db', 'collobarators', []);
    const { data: allInitialSectionCollaborators, error: initialSectionError } = await listDocuments('main_db', 'collobarators');
    const { data: currentSubSectionData, error: additionalSectionError } = await getDocument('main_db', 'initial_subsections', subsectionPath);
    // Filter collaborators by subsection on server side since we can't query virtual relationship attributes
    const subSectionCollaborators = allCollaborators?.filter(collaborator => 
        collaborator.subSection?.some(sub => sub.$id === subsectionPath || sub.slug === subsectionPath)
    ) || [];
    
    const allSectionCollaborators = allCollaborators?.filter(collaborator => 
        collaborator.initialSection?.$id === sectionPath || collaborator.initialSection?.slug === sectionPath
    ) || [];
    
    if (subSectionError || initialSectionError) {
        console.log(subSectionError || initialSectionError)
        return (
            <div className="text-red-500 text-2xl font-bold">INTERNAL SERVER ERROR 500</div>
        )
    }

    return (
        <div className="w-full max-w-7xl mx-auto">
            {/* <Breadcrumbs section={data.section} subsection={subsectionPath} /> */}
            <CollaboratorsClientPage
                collaborators={subSectionCollaborators}
                sectionData={sectionPath}
                allInitialSectionCollaborators={allInitialSectionCollaborators}
                currentSubSectionData={currentSubSectionData}
                allSectionCollaborators={allSectionCollaborators}
            />
        </div>
    );
};