import { getDocument } from "@/lib/appwrite/server";
import NewSectionClient from "./new-section-client";

export default async function NewSectionPage({ searchParams }) {
  // Get section ID from URL params
  const sectionId = await searchParams.sectionId;
  const organizationId = await searchParams.organizationId;

  if (!sectionId || !organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Virheelliset parametrit</h1>
          <p className="text-muted-foreground mt-2">Puuttuvat tarvittavat tiedot</p>
        </div>
      </div>
    );
  }

  // Fetch section data with subsections
  const { data: section, error: sectionError } = await getDocument(
    "main_db",
    "initial_sections",
    sectionId
  );

  if (sectionError || !section) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Osiota ei löytynyt</h1>
          <p className="text-muted-foreground mt-2">Pyydettyä osiota ei löydy järjestelmästä</p>
        </div>
      </div>
    );
  }

  // Fetch subsections if they exist
  const subsections = section.initialSubsections || [];

  // Fetch organization data
  const { data: organization, error: orgError } = await getDocument(
    "main_db",
    "organizations",
    organizationId
  );

  if (orgError || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Organisaatiota ei löytynyt</h1>
          <p className="text-muted-foreground mt-2">Pyydettyä organisaatiota ei löydy järjestelmästä</p>
        </div>
      </div>
    );
  }

  return (
    <NewSectionClient
      section={section}
      subsections={subsections}
      organization={organization}
      organizationId={organizationId}
      sectionId={sectionId}
    />
  );
}