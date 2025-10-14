import { NextResponse } from 'next/server';
import { listDocuments } from '@/lib/appwrite/server';
import { Query } from 'node-appwrite';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const sectionId = searchParams.get('sectionId');

        if (!sectionId) {
            return NextResponse.json(
                { error: 'Section ID is required' },
                { status: 400 }
            );
        }

        // Load all data in parallel
        const [orgsResult, usersResult, tokensResult] = await Promise.all([
            listDocuments("main_db", "organizations"),
            listDocuments("main_db", "users"),
            listDocuments("main_db", "new_section_tokens", [
                Query.equal('sectionId', sectionId)
            ])
        ]);

        return NextResponse.json({
            success: true,
            organizations: orgsResult.data || [],
            users: usersResult.data || [],
            tokens: tokensResult.data || [],
        });

    } catch (error) {
        console.error('Error loading section permissions data:', error);
        return NextResponse.json(
            { error: 'Failed to load data' },
            { status: 500 }
        );
    }
}
