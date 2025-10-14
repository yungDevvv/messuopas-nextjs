import { NextResponse } from 'next/server';
import { updateDocument, listDocuments } from '@/lib/appwrite/server';
import { Query } from 'node-appwrite';

export async function POST(request) {
    try {
        const { organizationId, sectionId, status } = await request.json();

        if (!organizationId || !sectionId || !status) {
            return NextResponse.json(
                { error: 'Organization ID, section ID and status are required' },
                { status: 400 }
            );
        }

        // Find token by organizationId and sectionId
        const { data: tokens } = await listDocuments('main_db', 'new_section_tokens', [
            Query.equal('organizationId', organizationId),
            Query.equal('sectionId', sectionId),
        ]);

        const token = tokens?.[0];

        if (!token) {
            return NextResponse.json(
                { error: 'Token not found' },
                { status: 404 }
            );
        }

        // Prepare update data
        const updateData = { status };
        
        if (status === 'viewed') {
            updateData.viewedAt = new Date().toISOString();
        } else if (status === 'accepted') {
            updateData.acceptedAt = new Date().toISOString();
        } else if (status === 'declined') {
            updateData.declinedAt = new Date().toISOString();
        }

        // Update token in database
        const { error } = await updateDocument('main_db', 'new_section_tokens', token.$id, updateData);

        if (error) {
            console.error('Failed to update token:', error);
            return NextResponse.json(
                { error: 'Failed to update token' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Token updated successfully',
        });

    } catch (error) {
        console.error('Error updating token:', error);
        return NextResponse.json(
            { error: 'Failed to update token' },
            { status: 500 }
        );
    }
}
