import { listDocuments } from '@/lib/appwrite/server';
import Breadcrumbs from '@/components/breadcrumbs';
import NotesView from '@/app/messuopas/[sectionPath]/[subsectionPath]/notes/_components/notes-client-page';

// Helper to create URL-friendly slugs from titles
function slugify(text) {
    if (!text) return '';
    const a = 'àáâäæãåāăąçćčđďèéêëēėęěğǵḧîïíīįìłḿñńǹňôöòóœøōõőṕŕřßśšşșťțûüùúūǘůűųẃẍÿýžźż·/_,:;'
    const b = 'aaaaaaaaaacccddeeeeeeeegghiiiiiilmnnnnoooooooooprrsssssttuuuuuuuuuwxyyzzz------'
    const p = new RegExp(a.split('').join('|'), 'g')

    return text.toString().toLowerCase()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(p, c => b.charAt(a.indexOf(c))) // Replace special characters
        .replace(/&/g, '-and-') // Replace & with 'and'
        .replace(/[^\w\-]+/g, '') // Remove all non-word chars
        .replace(/\-\-+/g, '-') // Replace multiple - with single -
        .replace(/^-+/, '') // Trim - from start of text
        .replace(/-+$/, '') // Trim - from end of text
}

export default async function SubsectionPage({ params }) {
    const { data: sectionsResponse, error } = await listDocuments('main_db', 'initial_sections');
    const { sectionPath, subsectionPath } = await params;

    // Find the current section by matching the slugified title with the path
    const currentSection = sectionsResponse.find(section => {
        const titlePart = section.title.split('. ')[1] || '';
        return slugify(titlePart) === sectionPath;
    });

    // Find the current subsection within that section
    const currentSubsection = currentSection?.initialSubsections.find(sub =>
        sub.path === `/${sectionPath}/${subsectionPath}`
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