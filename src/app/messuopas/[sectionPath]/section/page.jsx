import ClientSectionPage from "./_components/client-section-page";
import { getDocument } from "@/lib/appwrite/server";

export default async function SectionPage({ params }) {
    const { sectionPath } = await params;
    // Try initial_sections first
    let { data: currentSection, error } = await getDocument('main_db', 'additional_sections', sectionPath);
    
    // If not found, fall back to additional_sections
    if (!currentSection) {
        const fallback = await getDocument('main_db', 'initial_sections', sectionPath);
        currentSection = fallback.data;
        if (fallback.error && !currentSection) {
            return <div className="text-red-500 text-2xl font-bold">INTERNAL SERVER ERROR 500</div>
        }
    } else if (error) {
        return <div className="text-red-500 text-2xl font-bold">INTERNAL SERVER ERROR 500</div>
    }

    return <ClientSectionPage section={currentSection} />;
}