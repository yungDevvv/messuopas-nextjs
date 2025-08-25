import { getLoggedInUser, listDocuments } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";

export default async function Page() {
    const user = await getLoggedInUser();

    const { data, error: initialSectionsError } = await listDocuments('main_db', 'initial_sections');

    return redirect(process.env.NEXT_PUBLIC_MESSUOPAS_URL + "/" + data[data.length - 1].$id + "/" + data[data.length - 1].initialSubsections[0].$id);
}