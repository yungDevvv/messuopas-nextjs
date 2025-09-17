import { NextResponse } from "next/server";
import { createInvitationToken } from "@/lib/invitation-tokens";
import { mauticEmailService } from "@/lib/mautic/mautic";
import { getDocument } from "@/lib/appwrite/server";

export async function POST(request) {
    try {
        const { email, organizationId, eventIds, inviterUserId, inviterName } = await request.json();

        if (!email || !organizationId || !inviterUserId || !inviterName) {
            return NextResponse.json(
                { error: "Email, organizationId, inviterUserId ja inviterName ovat pakollisia" },
                { status: 400 }
            );
        }

        // Get organization details for email
        const { data: organization } = await getDocument("main_db", "organizations", organizationId);

        // Create invitation token with array of event IDs
        const { token } = await createInvitationToken(email, organizationId, eventIds || [], inviterUserId);

        // Create registration link with token
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const registrationLink = `${baseUrl}/register?token=${token}`;

        // Send invitation email through Mautic
        await mauticEmailService.sendInvitationEmail({
            reciever_email: email,
            organization_name: organization?.name || 'Organisaatio',
            registration_link: registrationLink
        });

        return NextResponse.json({
            success: true,
            message: "Kutsu lähetetty onnistuneesti"
        });

    } catch (error) {
        console.error("Invitation sending error:", error);
        return NextResponse.json(
            { error: "Virhe kutsun lähettämisessä" },
            { status: 500 }
        );
    }
}
