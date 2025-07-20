import { listDocuments } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";

export default async function Page() {
    const { data, error: initialSectionsError } = await listDocuments('main_db', 'initial_sections');

    return redirect(process.env.NEXT_PUBLIC_MESSUOPAS_URL + data[0].initialSubsections[0].path);
}