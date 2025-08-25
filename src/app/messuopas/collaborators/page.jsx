import { listDocuments } from "@/lib/appwrite/server";
import CollaboratorsClientPage from "./_components/collaborators-client-page";

export default async function CollaboratorsPage() {
    const { data: collaboratorsResponse, error } = await listDocuments('main_db', 'collobarators');
    if(error){
        console.log(error)
        return <div>Error loading collaborators</div>
    }
    return <CollaboratorsClientPage collaborators={collaboratorsResponse} />
}