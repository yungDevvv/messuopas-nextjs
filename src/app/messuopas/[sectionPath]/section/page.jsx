import ClientSectionPage from "./_components/client-section-page";
import { getDocument } from "@/lib/appwrite/server";

export default async function SectionPage({ params }) {
    const { sectionPath } = await params;
    const { data: currentSection, error } = await getDocument('main_db', 'initial_sections', sectionPath);
    console.log(currentSection, "11111111111111111");

    if(error) {
        return <div className="text-red-500 text-2xl font-bold">INTERNAL SERVER ERROR 500</div>
    }
    
    return <ClientSectionPage section={currentSection} />;
}