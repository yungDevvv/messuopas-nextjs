import { NextResponse } from "next/server";
import { validateInvitationToken, markTokenAsUsed } from "@/lib/invitation-tokens";
import { createDocument, getDocument } from "@/lib/appwrite/server";
import { Account, Client, ID } from "node-appwrite";

export async function POST(request) {
    try {
        const { token, password, name } = await request.json();

        if (!token || !password || !name) {
            return NextResponse.json(
                { error: "Token, salasana ja nimi ovat pakollisia" },
                { status: 400 }
            );
        }

        // Validate invitation token
        const validation = await validateInvitationToken(token);
        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        const { email, organizationId, eventIds, inviterUserId, tokenId } = validation.tokenData;

        // Create Appwrite client for user creation
        const client = new Client()
            .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
            .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
            .setKey(process.env.APPWRITE_API_KEY); // Server API key

        const account = new Account(client);

        // Create user account
        const userId = ID.unique();
        const user = await account.create(userId, email, password, name);

        // Create user document in database
        const { data: userDoc, error: userDocError } = await createDocument("main_db", "users", {
            document_id: userId,
            body: {
                name: name,
                email: email,
                organization: organizationId,
                activeEventId: eventIds[0],
                accessibleEventsIds: eventIds || [],
                role: "premium_user",
            }
        });

        if (userDocError) {
            console.error("Error creating user document:", userDocError);
            // Try to delete the created account if user doc creation fails
            try {
                await account.delete(user.$id);
            } catch (deleteError) {
                console.error("Error deleting user after failed doc creation:", deleteError);
            }
            throw userDocError;
        }

        // Mark token as used
        await markTokenAsUsed(tokenId);

        return NextResponse.json({
            success: true,
            message: "Käyttäjä rekisteröity onnistuneesti",
            user: {
                id: user.$id,
                email: user.email,
                name: name
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        
        // Handle specific Appwrite errors
        if (error.code === 409) {
            return NextResponse.json(
                { error: "Käyttäjä tällä sähköpostilla on jo olemassa" },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { error: "Virhe käyttäjän rekisteröinnissä" },
            { status: 500 }
        );
    }
}
