import { getLoggedInUser, getFilteredInitialSections } from "@/lib/appwrite/server";
import { redirect } from "next/navigation";

export default async function Page() {
    const user = await getLoggedInUser();
    
    if (!user) return redirect("/login");

    const { data, error } = await getFilteredInitialSections(user);

    if (error) {
        console.log(error);
        return (
            <div>
                <h1>INTERNAL SERVER ERROR 500</h1>
            </div>
        )
    }

    const firstSection = data.find(section => section.order === 0);

    if (!firstSection || !firstSection.initialSubsections || firstSection.initialSubsections.length === 0) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold">Ei saatavilla olevia osioita</h1>
                <p className="text-muted-foreground mt-2">Organisaatiollesi ei ole vielä määritetty osioita.</p>
            </div>
        );
    }

    return redirect(process.env.NEXT_PUBLIC_MESSUOPAS_URL + "/" + firstSection.$id + "/" + firstSection.initialSubsections[0].$id);
}