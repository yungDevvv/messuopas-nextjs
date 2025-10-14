"use server";

import { updateDocument } from "@/lib/appwrite/server";
import { revalidatePath } from "next/cache";

export async function confirmSection(sectionId, organizationId) {
  try {
    // Get current section to read appliedOrganizations
    const { getDocument } = await import("@/lib/appwrite/server");
    const { data: section, error: fetchError } = await getDocument(
      "main_db",
      "initial_sections",
      sectionId
    );

    if (fetchError || !section) {
      return { success: false, error: "Section not found" };
    }

    // Add organization to appliedOrganizations
    const currentOrgs = section.appliedOrganizations?.map((org) => org.$id || org) || [];
    const updatedOrgs = Array.from(new Set([...currentOrgs, organizationId]));

    const { error } = await updateDocument(
      "main_db",
      "initial_sections",
      sectionId,
      {
        appliedOrganizations: updatedOrgs,
      }
    );

    if (error) {
      return { success: false, error: error.message || "Update failed" };
    }

    revalidatePath("/messuopas");
    return { success: true };
  } catch (error) {
    console.error("Failed to confirm section:", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
