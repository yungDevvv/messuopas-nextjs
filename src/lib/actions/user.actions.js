"use server";

import { revalidatePath } from "next/cache";
import { getLoggedInUser, updateDocument } from "../appwrite/server";

/**
 * Updates the sidebar preferences for the logged-in user.
 * @param {object} newPrefs - The new preferences object to save.
 * @returns {Promise<{success: boolean, data: object|null, error: string|null}>}
 */
export async function updateUserSidebarPrefs(newPrefs) {
    try {
        const loggedInUser = await getLoggedInUser();
        if (!loggedInUser) {
            throw new Error("User not logged in");
        }

        // The 'prefs' field in Appwrite should be a JSON string.
        const prefsString = JSON.stringify(newPrefs);

        const { data, error } = await updateDocument(
            "main_db",
            "users",
            loggedInUser.$id,
            { prefs: prefsString } // Pass prefs as a stringified JSON
        );

        if (error) {
            throw error;
        }

        // Revalidate the layout to apply changes immediately.
        revalidatePath("/messuopas", "layout");

        return { success: true, data, error: null };
    } catch (error) {
        console.error("Failed to update user preferences:", error);
        return { success: false, data: null, error: error.message };
    }
}
