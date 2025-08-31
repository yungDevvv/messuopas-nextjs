import { listDocuments } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";

export default async function Page() {
    const { data, error } = await listDocuments('main_db', 'initial_sections');

    const firstSection = data.find(section => section.order === 0);

    if (error) {
        console.log(error);
        return (
            <div>
                <h1>INTERNAL SERVER ERROR 500</h1>
            </div>
        )
    }

    return redirect(process.env.NEXT_PUBLIC_MESSUOPAS_URL + "/" + firstSection.$id + "/" + firstSection.initialSubsections[0].$id);
}