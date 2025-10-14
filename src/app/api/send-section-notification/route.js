import { NextResponse } from 'next/server';
import { mauticEmailService } from '@/lib/mautic/mautic';
import { createDocument } from '@/lib/appwrite/server';
import { ID } from 'node-appwrite';

export async function POST(request) {
    try {
        const { organizations, sectionTitle, sectionId } = await request.json();

        if (!organizations || !Array.isArray(organizations) || organizations.length === 0) {
            return NextResponse.json(
                { error: 'No organizations provided' },
                { status: 400 }
            );
        }

        if (!sectionId) {
            return NextResponse.json(
                { error: 'Section ID is required' },
                { status: 400 }
            );
        }

        // Send email to each organization and create tokens
        const results = await Promise.allSettled(
            organizations.map(async (org) => {
                if (!org.email || !org.contentLink) {
                    throw new Error(`Organization ${org.name} has no email or content link`);
                }

                // Send email with unique link
                await mauticEmailService.sendNewSectionNotification({
                    reciever_email: org.email,
                    content_link: org.contentLink,
                    reciever_name: org.name,
                });

                // Create token in database
                const tokenId = ID.unique();
                const { error } = await createDocument('main_db', 'new_section_tokens', {
                    document_id: tokenId,
                    body: {
                        organizationId: org.id,
                        organizationEmail: org.email,
                        organizationName: org.name,
                        sectionId: sectionId,
                        sectionTitle: sectionTitle,
                        sentAt: new Date().toISOString(),
                        status: 'sent', // sent, viewed, accepted, declined
                        contentLink: org.contentLink,
                    }
                });

                if (error) {
                    console.error('Failed to create token:', error);
                }

                return { organizationId: org.id, success: true };
            })
        );

        // Check for failures
        const failures = results.filter((result) => result.status === 'rejected');
        
        if (failures.length > 0) {
            console.error('Some emails failed to send:', failures);
            
            if (failures.length === results.length) {
                // All failed
                return NextResponse.json(
                    { error: 'All emails failed to send' },
                    { status: 500 }
                );
            }
            
            // Partial success
            return NextResponse.json({
                success: true,
                message: `Sent ${results.length - failures.length} out of ${results.length} emails`,
                failures: failures.length,
            });
        }

        // All succeeded
        return NextResponse.json({
            success: true,
            message: `Successfully sent ${results.length} emails`,
        });

    } catch (error) {
        console.error('Error sending section notifications:', error);
        return NextResponse.json(
            { error: 'Failed to send notifications' },
            { status: 500 }
        );
    }
}
