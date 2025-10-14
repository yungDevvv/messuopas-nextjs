import { listDocuments } from '@/lib/appwrite/server';
import Breadcrumbs from '@/components/breadcrumbs';
import { getLoggedInUser } from '@/lib/appwrite/server';
import { Query } from 'node-appwrite';

export default async function SubsectionPage({ params }) {
    const { sectionPath, subsectionPath } = await params;
    const user = await getLoggedInUser();
    // Fetch both sets: initial and additional
    const { data: initialSections } = await listDocuments('main_db', 'initial_sections');

    let additionalSections = null;
    
    if (user?.organization) {
        const { data } = await listDocuments('main_db', 'additional_sections', [Query.equal('organization', user.organization.$id)]);
        additionalSections = data;
    } else {
        const { data } = await listDocuments('main_db', 'additional_sections', [Query.equal('user', user.$id)]);
        additionalSections = data;
    }


    // 1) Try initial by $id
    let currentSection = initialSections.find(s => s.$id === sectionPath);
    let isAdditional = false;

    // 2) If not found, try additional by path (preferred) or $id (fallback)
    if (!currentSection && Array.isArray(additionalSections)) {
        currentSection = additionalSections.find(s => (s.path === sectionPath) || (s.$id === sectionPath));
        if (currentSection) isAdditional = true;
    }

    if (!currentSection) {
        return <div>Sivua ei löydy</div>;
    }

    // Find subsection depending on collection type
    let currentSubsection = null;
    if (!isAdditional) {
        // initial: match by $id
        currentSubsection = currentSection.initialSubsections?.find(sub => sub.$id === subsectionPath) || null;
    } else {
        // additional: subsections come in additionalSubsections; match by path (primary) or $id (fallback)
        const subs = Array.isArray(currentSection.additionalSubsections) ? currentSection.additionalSubsections : [];
        currentSubsection = subs.find(sub => (sub?.path === subsectionPath) || (sub?.$id === subsectionPath)) || null;
    }

    if (!currentSubsection) {
        return <div>Sivua ei löydy</div>;
    }

    // Prepare data for breadcrumbs
    // Sanitize HTML for browser compatibility: replace JSX-style 'className' with standard 'class'
    const sanitizedHtml = (currentSubsection.html || '').replace(/className=/g, 'class=');

    return (
        <div className="p-8 max-[1540px]:p-2 max-xl:p-0">
            <Breadcrumbs pathTitle={currentSubsection.title} />

            <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />

            {/* <NotesView subsectionId={currentSubsection.$id} /> */}
        </div>
    );
}