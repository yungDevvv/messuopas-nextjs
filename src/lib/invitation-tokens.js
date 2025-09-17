import { createDocument, getDocument, deleteDocument, listDocuments, updateDocument } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";
import crypto from "crypto";

// Generate secure random token
function generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Create invitation token
export async function createInvitationToken(email, organizationId, eventIds, inviterUserId) {
    try {
        const token = generateSecureToken();
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 72); // Token expires in 72 hours

        const { data: tokenDoc, error } = await createDocument("main_db", "invitation_tokens", {
            body: {
                token,
                email,
                organizationId,
                eventIds: Array.isArray(eventIds) ? eventIds : [],
                inviterUserId,
                expiresAt: expiresAt.toISOString(),
                used: false,
                // createdAt: new Date().toISOString()
            }
        });

        if (error) throw error;
        return { token, tokenDoc };
    } catch (error) {
        console.error('Error creating invitation token:', error);
        throw error;
    }
}

// Validate and consume invitation token
export async function validateInvitationToken(token) {
    try {
        // Find token document
        const { data: tokens, error } = await listDocuments("main_db", "invitation_tokens", [
            Query.equal("token", token),
            Query.equal("used", false)
        ]);

        if (error) throw error;
        if (!tokens || tokens.length === 0) {
            return { valid: false, error: "Token ei löytynyt tai se on jo käytetty" };
        }

        const tokenDoc = tokens[0];
        
        // Check if token is expired
        const now = new Date();
        const expiresAt = new Date(tokenDoc.expiresAt);
        
        if (now > expiresAt) {
            return { valid: false, error: "Token on vanhentunut" };
        }

        return { 
            valid: true, 
            tokenData: {
                email: tokenDoc.email,
                organizationId: tokenDoc.organizationId,
                eventIds: tokenDoc.eventIds || [],
                inviterUserId: tokenDoc.inviterUserId,
                tokenId: tokenDoc.$id
            }
        };
    } catch (error) {
        console.error('Error validating invitation token:', error);
        return { valid: false, error: "Virhe tokenin validoinnissa" };
    }
}

// Mark token as used
export async function markTokenAsUsed(tokenId) {
    try {
        const { error } = await updateDocument("main_db", "invitation_tokens", tokenId, {
            used: true,
            usedAt: new Date().toISOString()
        });

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Error marking token as used:', error);
        throw error;
    }
}

// Clean up expired tokens (can be called periodically)
export async function cleanupExpiredTokens() {
    try {
        const now = new Date().toISOString();
        const { data: expiredTokens, error } = await listDocuments("main_db", "invitation_tokens", [
            Query.lessThan("expiresAt", now)
        ]);

        if (error) throw error;
        if (!expiredTokens || expiredTokens.length === 0) return;

        // Delete expired tokens
        const deletePromises = expiredTokens.map(token => 
            deleteDocument("main_db", "invitation_tokens", token.$id)
        );

        await Promise.all(deletePromises);
        console.log(`Cleaned up ${expiredTokens.length} expired tokens`);
    } catch (error) {
        console.error('Error cleaning up expired tokens:', error);
    }
}
