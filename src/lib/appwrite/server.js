"use server";

import { cache } from 'react';
import { cookies } from 'next/headers';
import { Account, Client, Databases, ID, Query, Storage, Users } from 'node-appwrite';

// Initialize the Appwrite client once and reuse it
const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
    .setSelfSigned(); // Use only on dev mode

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

    try {
        const response = await users.create(
            ID.unique(),
            data.email,
            undefined, // phone - optional
            data.password,
            data.name
        );

        return { data: response, error: null };
    } catch (error) {
        console.log(`Failed create user:`, error);
        return { data: null, error: error }
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
        console.log(`Failed create document in collection ${collection_id}:`, error);
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
                sameSite: "strict",
                secure: true,
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
        console.log(user, "user user useruser useruser userv useruseruseruseruseruser")
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