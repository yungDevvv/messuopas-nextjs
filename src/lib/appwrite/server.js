"use server";

import { cache } from 'react';
import { cookies } from 'next/headers';
import { Account, Client, Databases, ID, Query, Storage, Users } from 'node-appwrite';

// Initialize the Appwrite client once and reuse it
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

// Initialize the Databases service once
const databases = new Databases(client);
const storage = new Storage(client);
const account = new Account(client);
// The services are available within this module to the exported functions.

/**
 * Fetches notes for a specific subsection.
 * @param {string} subsectionId - The ID of the subsection.
 * @returns {Promise<Array>}
 */

// export const testEvent = "68743aa1001f60428450"

/**
 * Fetches a single initial subsection by its slug.
 * @param {string} slug - The URL slug of the subsection.
 * @returns {Promise<object|null>}
 */

export const createUser = async (data) => {
    const users = new Users(client);
    const userId = ID.unique()
    try {
        const response = await users.create(
            userId,
            data.email,
            undefined, // phone - optional
            data.password,
            data.name
        );

        const databases = new Databases(client);
        const { password, ...body } = data;

        console.log(body, "body123123123123123");

        await databases.createDocument(
            'main_db',
            'users',
            userId,
            {
                ...body
            }
        );
        return { data: response, error: null };
    } catch (error) {
        console.log(`Failed create user:`, error);
        return { data: null, error: error }
    }
}

// Delete Appwrite global user by ID (Appwrite Users API)
export const deleteUserById = async (userId) => {
    const users = new Users(client);
    try {
        const response = await users.delete(userId);
        return { data: response, error: null };
    } catch (error) {
        console.log(`Failed delete global user by id ${userId}:`, error);
        return { data: null, error };
    }
}

// Find Appwrite global user by email and delete it
// line comment: we search, then pick exact email match and delete
export const deleteUserByEmail = async (email) => {
    const users = new Users(client);
    try {
        // Try to search by email; fallback-safe to exact filter if supported
        let list;
        try {
            list = await users.list([Query.search('email', email)]);
        } catch (e) {
            // Some SDK versions accept object form
            list = await users.list();
        }

        const found = (list?.users || list?.total ? list.users : list?.documents || [])
            .find((u) => u.email && u.email.toLowerCase() === String(email).toLowerCase());

        if (!found) {
            return { data: null, error: new Error('Global user not found by email') };
        }

        const resp = await users.delete(found.$id);
        return { data: resp, error: null };
    } catch (error) {
        console.log(`Failed delete global user by email ${email}:`, error);
        return { data: null, error };
    }
}

export const listDocuments = cache(async (db, collection, queries) => {
    try {
        const databases = new Databases(client);
        const response = await databases.listDocuments(db, collection, queries);

        return { data: response.documents, error: null };
    } catch (error) {
        console.log(`Failed to list documents in collection ${collection}:`, error)
        return { data: null, error: error }
    }
});

/**
 * Fetches initial sections filtered by user's organization
 * Block comment: This function automatically filters initial_sections based on appliedOrganizations
 * Admin users see all sections, organization users see only sections applied to their org
 * @param {object} user - The logged in user object
 * @returns {Promise<{data: Array, error: any}>}
 */
export const getFilteredInitialSections = cache(async (user) => {
    try {
        const databases = new Databases(client);
        const response = await databases.listDocuments('main_db', 'initial_sections');
        
        let filteredSections = response.documents;

        // Filter based on user role and organization
        if (user.role === 'admin') {
            // Admin sees all initial sections
            filteredSections = response.documents;
        } else if (user.organization?.$id) {
            // Filter by organization - only show sections where user's org is in appliedOrganizations
            filteredSections = response.documents.filter(section => {
                if (!section.appliedOrganizations || !Array.isArray(section.appliedOrganizations)) {
                    return false;
                }
                return section.appliedOrganizations.some(org => {
                    const orgId = org.$id || org;
                    return orgId === user.organization.$id;
                });
            });
        } else {
            // User has no organization, show no initial sections
            filteredSections = [];
        }

        return { data: filteredSections, error: null };
    } catch (error) {
        console.log('Failed to get filtered initial sections:', error);
        return { data: null, error: error };
    }
});

export async function createDocument(db_id, collection_id, { document_id, body }) {
    const databases = new Databases(client);

    try {
        const response = await databases.createDocument(
            db_id,
            collection_id,
            document_id || ID.unique(),
            {
                ...body
            }
        );

        return { data: response, error: null };
    } catch (error) {
        console.error(`Failed create document in collection ${collection_id}:`, error);
        return { data: null, error: error }
    }
}
export async function getDocument(db, collection, document_id) {
    const databases = new Databases(client);

    try {
        const response = await databases.getDocument(
            db,
            collection,
            document_id,
        );

        return { data: response, error: null };
    } catch (error) {
        console.log(`Failed get document in collection ${collection}:`, error);
        return { data: null, error: error }
    }
}
export async function updateDocument(db_id, collection_id, document_id, values) {
    try {
        const { databases } = await createSessionClient();

        const response = await databases.updateDocument(
            db_id,
            collection_id,
            document_id,
            values
        );

        return response;
    } catch (error) {
        console.log(`Error updating document in collection ${collection_id}:`, error);
        throw error;
    }
}
export async function deleteDocument(db_id, collection_id, document_id) {
    const databases = new Databases(client);

    try {

        const response = await databases.deleteDocument(
            db_id,
            collection_id,
            document_id
        );

        return { error: null };
    } catch (error) {
        console.log(`Failed delete document in collection ${collection_id}:`, error);
        return { error: error }
    }
}

export const getInitialSubsectionBySlug = async (slug) => {
    if (!slug) return null;

    try {
        const response = await databases.listDocuments(
            'main_db',
            'initial_subsections',
            [Query.equal('slug', slug), Query.limit(1)]
        );
        return response.documents[0] || null;
    } catch (error) {
        console.error(`Failed to fetch subsection by slug ${slug}:`, error);
        return null;
    }
};
export const getTodosFromInitialSection = async (subsectionId, messuopas) => {
    try {
        const { documents: todos } = await databases.listDocuments(
            "main_db",
            "todos",
            [
                Query.equal('event', messuopas),
                Query.equal('initialSubsection', subsectionId)
            ]
        );

        return { data: todos, error: null };
    } catch (error) {
        console.error(`Failed to fetch todos for subsection ${subsectionId}:`, error);
        return { data: null, error: error }; // Return empty array on error to prevent UI crashes
    }
}

export async function createFile(bucket_id, file) {
    const { storage } = await createSessionClient();

    try {
        const response = await storage.createFile(bucket_id, ID.unique(), file);

        return { data: response, error: null };
    } catch (error) {
        console.log('Error updating profile:', error);
        return { data: null, error: error };
    }

}

export async function deleteFile(bucket_id, file) {
    const { storage } = await createSessionClient();

    try {
        const response = await storage.deleteFile(bucket_id, file);

        return { data: response, error: null };
    } catch (error) {
        console.log('Error updating profile:', error);
        return { data: null, error: error };
    }

}

export const getFileDownload = async (bucket_id, fileId) => {
    const { storage } = await createSessionClient();

    try {
        const response = await storage.getFileDownload(bucket_id, fileId);

        return { data: response, error: null };
    } catch (error) {
        console.log('Error updating profile:', error);
        return { data: null, error: error };
    }
}

export const getFileInfo = async (bucket_id, fileId) => {
    const { storage } = await createSessionClient();

    try {
        const response = await storage.getFile(bucket_id, fileId);

        return { data: response, error: null };
    } catch (error) {
        console.log('Error getting file info:', error);
        return { data: null, error: error };
    }
}

export const getDocumentsFromInitialSection = async (subsectionId, eventId) => {
    try {
        const { documents: notes } = await databases.listDocuments(
            "main_db",
            "documents",
            [
                Query.equal('event', eventId),
                Query.equal('initialSubsectionId', subsectionId)
            ]
        );

        return { data: notes, error: null };
    } catch (error) {
        console.error(`Failed to fetch notes for subsection ${subsectionId}:`, error);
        return { data: null, error: error }; // Return empty array on error to prevent UI crashes
    }
}

export const getNotesFromInitialSection = async (subsectionId, eventId) => {

    try {
        const { documents: notes } = await databases.listDocuments(
            "main_db",
            "notes",
            [
                Query.equal('event', eventId),
                Query.equal('initialSubsectionId', subsectionId)
            ]
        );

        return { data: notes, error: null };
    } catch (error) {
        console.error(`Failed to fetch notes for subsection ${subsectionId}:`, error);
        return { data: null, error: error }; // Return empty array on error to prevent UI crashes
    }
};


export async function createSessionClient() {
    const client = new Client()
        .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
        .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

    let session = await cookies();

    session = session.get("messuopas-session");

    if (!session) {
        console.log("NO SESSION");

        return {
            sessionExists: false
        };
    }

    client.setSession(session.value);

    return {
        sessionExists: true,
        get account() {
            return new Account(client);
        },
        get storage() {
            return new Storage(client);
        },
        get databases() {
            return new Databases(client);
        }
    };
}

export async function signInWithEmail(email, password) {
    try {
        const session = await account.createEmailPasswordSession(email, password);

        const cookieStore = await cookies();

        if (cookieStore) {
            cookieStore.set("messuopas-session", session.secret, {
                path: "/",
                httpOnly: true,
                sameSite: "lax",
                secure: process.env.NODE_ENV === "production",
            });
        }
        return { error: null, success: true };
    } catch (error) {
        return { error: error.message, success: false };
    }
}

export async function signOut() {
    try {
        const { sessionExists, account } = await createSessionClient();

        if (!sessionExists) {
            return { error: "No active session", success: false };
        }

        // Delete the session from Appwrite
        await account.deleteSession('current');

        // Remove the cookie
        const cookieStore = await cookies();
        if (cookieStore) {
            cookieStore.delete("messuopas-session");
        }

        return { error: null, success: true };
    } catch (error) {
        console.error('Error signing out:', error);
        return { error: error.message, success: false };
    }
}


export const getLoggedInUser = cache(async () => {
    try {
        const { sessionExists, account } = await createSessionClient();

        if (!sessionExists) return null;


        const user = await account.get();

        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY);

        const databases = new Databases(client);

        const response = await databases.getDocument(
            "main_db",
            "users",
            user.$id
        );

        return { ...response };
    } catch (error) {
        console.log(error, "APPWRITE getLoggedInUserProfile()");
        return null;
    }
});

export async function createUserRecoveryPassword(redirectUrl) {
    try {
        const user = await getLoggedInUser();

        const { account } = await createSessionClient();

        const res = await account.createRecovery(user.email, redirectUrl);

        return { error: null, success: true };
    } catch (error) {
        console.log(error, "APPWRITE createUserRecoveryPassword()");
        return { error: error, success: false };
    }
}

export async function updateRecoveryPassword(secret, user_id, password) {
    try {
        const { account } = await createSessionClient();

        await account.updateRecovery(
            user_id,
            secret,
            password
        );

        return { error: null, success: true };
    } catch (error) {
        console.log(error, "APPWRITE updateRecoveryPassword()");
        return { error: error, success: false };
    }
}

export const getTodosFromAdditionalSection = async (subsectionId, eventId) => {
    try {
        const { databases } = await createSessionClient();
        
        // First, try to find the additional subsection by path
        const { documents: subsections } = await databases.listDocuments(
            "main_db", 
            "additional_subsections",
            [Query.equal('path', subsectionId)]
        );
        
        console.log('Found subsections:', subsections, "for path:", subsectionId);
        
        if (subsections.length === 0) {
            console.log('No additional subsection found for path:', subsectionId);
            return { data: [], error: null };
        }
        
        const subsection = subsections[0];
        console.log('Using subsection ID:', subsection.$id);
        
        // Now fetch todos for this subsection
        const { documents: todos } = await databases.listDocuments(
            "main_db",
            "todos",
            [
                Query.equal('event', eventId),
                Query.equal('additionalSubsection', subsection.$id)
            ]
        );

        console.log('Found todos for additional section:', todos.length);
        return { data: todos, error: null };
    } catch (error) {
        console.error(`Failed to fetch todos for subsection ${subsectionId}:`, error);
        return { data: [], error: error }; // Return empty array on error to prevent UI crashes
    }
}

export const getDocumentsFromAdditionalSection = async (subsectionId, eventId) => {
    try {
        const { databases } = await createSessionClient();
        
        // First, try to find the additional subsection by path
        const { documents: subsections } = await databases.listDocuments(
            "main_db", 
            "additional_subsections",
            [Query.equal('path', subsectionId)]
        );
        
        console.log('Found subsections:', subsections, "for path:", subsectionId);
        
        if (subsections.length === 0) {
            console.log('No additional subsection found for path:', subsectionId);
            return { data: [], error: null };
        }
        
        const subsection = subsections[0];
        console.log('Using subsection ID:', subsection.$id);
        
        // Now fetch todos for this subsection
        const { documents: documents } = await databases.listDocuments(
            "main_db",
            "documents",
            [
                Query.equal('event', eventId),
                Query.equal('additionalSubsection', subsection.$id)
            ]
        );

        console.log('Found documents for additional section:', documents.length);
        return { data: documents, error: null };
    } catch (error) {
        console.error(`Failed to fetch documents for subsection ${subsectionId}:`, error);
        return { data: [], error: error }; // Return empty array on error to prevent UI crashes
    }
}

export const getNotesFromAdditionalSection = async (subsectionId, eventId) => {
    try {
        const { databases } = await createSessionClient();
        
        // First, try to find the additional subsection by path
        const { documents: subsections } = await databases.listDocuments(
            "main_db", 
            "additional_subsections",
            [Query.equal('path', subsectionId)]
        );
        
        console.log('Found subsections:', subsections, "for path:", subsectionId);
        
        if (subsections.length === 0) {
            console.log('No additional subsection found for path:', subsectionId);
            return { data: [], error: null };
        }
        
        const subsection = subsections[0];
        console.log('Using subsection ID:', subsection.$id);
        
        // Now fetch todos for this subsection
        const { documents: documents } = await databases.listDocuments(
            "main_db",
            "notes",
            [
                Query.equal('event', eventId),
                Query.equal('additionalSubsectionId', subsection.$id)
            ]
        );

        console.log('Found notes for additional section:', documents.length);
        return { data: documents, error: null };
    } catch (error) {
        console.error(`Failed to fetch notes for subsection ${subsectionId}:`, error);
        return { data: [], error: error }; // Return empty array on error to prevent UI crashes
    }
}