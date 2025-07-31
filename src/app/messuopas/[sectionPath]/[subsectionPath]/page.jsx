import { listDocuments } from '@/lib/appwrite/server';
import Breadcrumbs from '@/components/breadcrumbs';



export default async function SubsectionPage({ params }) {
    const { data: sectionsResponse, error } = await listDocuments('main_db', 'initial_sections');
    const { sectionPath, subsectionPath } = await params;

    // Find the current section by matching the $id with the sectionPath
    const currentSection = sectionsResponse.find(section => 
        section.$id === sectionPath
    );

    // Find the current subsection within that section by matching the $id
    const currentSubsection = currentSection?.initialSubsections?.find(sub =>
        sub.$id === subsectionPath
    );
    console.log(currentSubsection, "currentSubsectioncurrentSubsectioncurrentSubsectioncurrentSubsection")
    if (!currentSubsection) {
        return <div>Sivua ei löydy</div>;
    }

    // Prepare data for breadcrumbs
    // Sanitize HTML for browser compatibility: replace JSX-style 'className' with standard 'class'
    const sanitizedHtml = currentSubsection.html.replace(/className=/g, 'class=');

    return (
        <div className="p-8 max-[1540px]:p-2 max-xl:p-0">
            <Breadcrumbs pathTitle={currentSubsection.title} />

            <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />

            {/* <NotesView subsectionId={currentSubsection.$id} /> */}
        </div>
    );
}