import { NextResponse } from 'next/server';
import { updateDocument } from '@/lib/appwrite/server';

export async function POST(request) {
    try {
        const { tokenId, status, acceptedAt, declinedAt } = await request.json();

        if (!tokenId || !status) {
            return NextResponse.json(
                { error: 'Token ID and status are required' },
                { status: 400 }
            );
        }

        // Prepare update data
        const updateData = { status };
        
        if (acceptedAt) {
            updateData.acceptedAt = acceptedAt;
        }
        
        if (declinedAt) {
            updateData.declinedAt = declinedAt;
        }

        // Update token in database
        const { error } = await updateDocument('main_db', 'new_section_tokens', tokenId, updateData);

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
