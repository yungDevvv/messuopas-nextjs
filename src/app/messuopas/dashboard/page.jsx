import ClientDashboardPage from "./_components/client-dashboard-page";
import { getLoggedInUser, listDocuments, deleteDocument, getFilteredInitialSections } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";
import { redirect } from "next/navigation";
import { getRoleLabelFi } from "@/lib/constants/roles";

// Block comment: mark page dynamic to avoid static prerender when cookies() is used
export const dynamic = 'force-dynamic';
export default async function Page({ params }) {
    // Fetch current user on server
    const user = await getLoggedInUser();

    // Inline comment: If not logged in, redirect before any property access
    if (!user) return redirect("/login");

    // Resolve organization id safely
    const orgIdSafe = user?.organization?.$id ?? user?.organization ?? null;

    // Fetch organization members on server, only if org exists
    let organizationMembers = [];
    let organizationEvents = [];
    if (orgIdSafe) {
        const { data: orgMembersData } = await listDocuments(
            "main_db",
            "users",
            [Query.equal("organization", orgIdSafe)]
        );
        organizationMembers = orgMembersData || [];

        const { data: orgEventsData } = await listDocuments(
            "main_db",
            "events",
            [Query.equal("organization", orgIdSafe)]
        );
        organizationEvents = orgEventsData || [];
    }

    // Derive server-side props for client
    const planLabel = getRoleLabelFi(user?.role);

    const hideSubscription = user?.role === "admin" || user?.role === "customer_admin";
    const orgName = user?.organization?.name || "";
    const orgEmail = user?.organization?.organizationEmail || "";
    const orgId = orgIdSafe || "";
    const ownerIds = (user?.organization?.owners || []).map((o) => (typeof o === "string" ? o : o?.$id)).filter(Boolean);
    const isOrgOwner = Boolean(user?.organization && ownerIds.includes(user.$id));

    // Normalize members for client table
    const members = (organizationMembers || []).filter((m) => m.$id !== user.$id && m.role !== "admin").map((m) => ({
        $id: m.$id,
        name: m.name,
        email: m.email,
        role: m.role || "user",
        accessibleEventsIds: m.accessibleEventsIds,
        activeEventId: m.activeEventId
    }));

    const sectionsQuery = [];
    const eventsQuery = [];

    if (user?.organization) {
        sectionsQuery.push(Query.equal('organization', user.organization.$id));
        sectionsQuery.push(Query.equal('eventId', user.activeEventId));
        eventsQuery.push(Query.equal('organization', user.organization.$id));
    } else {
        sectionsQuery.push(Query.equal('user', user.$id));
        sectionsQuery.push(Query.equal('eventId', user.activeEventId));
        eventsQuery.push(Query.equal('user', user.$id));
    }

    const { data, error } = await listDocuments('main_db', 'additional_sections', sectionsQuery);
    const { data: initialSectionsData, error: initialSectionsError } = await getFilteredInitialSections(user);
    const { data: eventsData, error: eventsError } = await listDocuments("main_db", "events", eventsQuery);

    // Get user section preferences for ordering
    let userSectionPreferences = null;
    try {
        const preferencesQuery = [];
        
        // Only user + event are the key variables now
        preferencesQuery.push(Query.equal('user', user.$id));
        
        if (user?.activeEventId) {
            preferencesQuery.push(Query.equal('event', user.activeEventId));
        }

        const { data: preferencesData } = await listDocuments('main_db', 'user_section_preferences', preferencesQuery);
        userSectionPreferences = preferencesData?.[0] || null;
        
        console.log('User section preferences query (user + event only):', preferencesQuery);
        console.log('Found preferences:', userSectionPreferences);
    } catch (preferencesError) {
        console.error('Error fetching user section preferences:', preferencesError);
    }

    // Combine and order sections based on preferences
    const combineSections = () => {
        const allSections = [];

        // Add initial sections with type marker
        (initialSectionsData || []).forEach(section => {
            allSections.push({
                ...section,
                type: 'initial',
                subsections: section.initialSubsections || []
            });
        });

        // Add additional sections with type marker
        (data || []).forEach(section => {
            allSections.push({
                ...section,
                type: 'additional',
                subsections: section.additionalSubsections || []
            });
        });

        // If no preferences found, return sections in default order
        if (!userSectionPreferences || !userSectionPreferences.orderedActiveSections) {
            console.log('No user preferences found, using default order');
            return allSections.sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        // Parse ordered sections from preferences
        let orderedSectionsData = [];
        try {
            orderedSectionsData = JSON.parse(userSectionPreferences.orderedActiveSections);
        } catch (e) {
            console.error('Error parsing orderedActiveSections:', e);
            return allSections.sort((a, b) => (a.order || 0) - (b.order || 0));
        }

        console.log('Parsed orderedSectionsData:', orderedSectionsData);
        console.log('All sections before ordering:', allSections.map(s => ({ id: s.$id, title: s.title, type: s.type })));

        // Order sections based on preferences structure: { id, order, subsections: [{id, order, active}] }
        const orderedSections = [];
        const unorderedSections = [...allSections];

        // Sort by order from preferences
        orderedSectionsData
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .forEach(sectionPref => {
                const sectionIndex = unorderedSections.findIndex(s => s.$id === sectionPref.id);
                if (sectionIndex !== -1) {
                    const section = unorderedSections.splice(sectionIndex, 1)[0];

                    // Apply subsection ordering and active state if available
                    if (sectionPref.subsections && Array.isArray(sectionPref.subsections)) {
                        const orderedSubsections = [];
                        const unorderedSubsections = [...(section.subsections || [])];

                        // Order subsections based on preferences
                        sectionPref.subsections
                            .sort((a, b) => (a.order || 0) - (b.order || 0))
                            .forEach(subPref => {
                                const subIndex = unorderedSubsections.findIndex(sub => sub.$id === subPref.id);
                                if (subIndex !== -1) {
                                    const subsection = unorderedSubsections.splice(subIndex, 1)[0];
                                    orderedSubsections.push({
                                        ...subsection,
                                        active: subPref.active || false
                                    });
                                }
                            });

                        // Add any remaining subsections that weren't in preferences
                        orderedSubsections.push(...unorderedSubsections);

                        section.subsections = orderedSubsections;
                    }

                    orderedSections.push(section);
                }
            });

        // Add any remaining sections that weren't in preferences
        // But still apply subsection ordering if available
        unorderedSections.forEach(section => {
            // Check if there's subsection ordering for this section
            const sectionPref = orderedSectionsData.find(pref => pref.id === section.$id);
            if (sectionPref && sectionPref.subsections && Array.isArray(sectionPref.subsections)) {
                const orderedSubsections = [];
                const unorderedSubsections = [...(section.subsections || [])];

                // Order subsections based on preferences
                sectionPref.subsections
                    .sort((a, b) => (a.order || 0) - (b.order || 0))
                    .forEach(subPref => {
                        const subIndex = unorderedSubsections.findIndex(sub => sub.$id === subPref.id);
                        if (subIndex !== -1) {
                            const subsection = unorderedSubsections.splice(subIndex, 1)[0];
                            orderedSubsections.push({
                                ...subsection,
                                active: subPref.active || false
                            });
                        }
                    });

                // Add any remaining subsections that weren't in preferences
                orderedSubsections.push(...unorderedSubsections);
                section.subsections = orderedSubsections;
            }
            orderedSections.push(section);
        });

        console.log('Final ordered sections:', orderedSections.map(s => ({ 
            id: s.$id, 
            title: s.title, 
            type: s.type, 
            subsections: s.subsections?.map(sub => ({ id: sub.$id, title: sub.title })) 
        })));
        
        return orderedSections;
    };

    const combinedSections = combineSections();

    const clientProps = {
        user,
        planLabel,
        hideSubscription,
        orgName,
        orgEmail,
        orgId,
        isOrgOwner,
        members,
        organizationEvents,
        additionalSections: data,
        initialSectionsData,
        events: eventsData,
        combinedSections,
        userSectionPreferences
    };
    
    const { data: invitation_tokens } = await listDocuments('main_db', 'invitation_tokens', [Query.equal('organizationId', orgId)]);

    // Inline comment: Step 1 - compute pendingInvitations without deleting tokens
    const allTokenEmails = Array.from(new Set((invitation_tokens || []).map(t => (t.email || '').toLowerCase()).filter(Boolean)));
    let existingUsersByEmail = new Set();
    if (allTokenEmails.length > 0) {
        try {
            // Inline comment: query users collection by email list
            const { data: usersByEmail } = await listDocuments('main_db', 'users', [
                Query.equal('email', allTokenEmails)
            ]);
            existingUsersByEmail = new Set((usersByEmail || []).map(u => (u.email || '').toLowerCase()).filter(Boolean));
        } catch (e) {
            console.error('Error checking users by email for invitations:', e);
        }
    }

    const pendingInvitations = (invitation_tokens || [])
        .filter(t => {
            const emailLc = (t.email || '').toLowerCase();
            // Inline comment: pending if email not found in users collection
            return emailLc && !existingUsersByEmail.has(emailLc);
        })
        .map(t => ({
            $id: t.$id,
            email: t.email,
            eventIds: t.eventIds,
            expiresAt: t.expiresAt,
            used: t.used,
            usedAt: t.usedAt,
            inviterUserId: t.inviterUserId
        }));

    // Inline comment: Step 3 - auto-delete tokens for emails already present in members list
    try {
        const memberEmails = new Set((members || []).map(m => (m.email || '').toLowerCase()).filter(Boolean));
        for (const tok of (invitation_tokens || [])) {
            const elc = (tok.email || '').toLowerCase();
            if (elc && memberEmails.has(elc)) {
                await deleteDocument('main_db', 'invitation_tokens', tok.$id);
            }
        }
    } catch (delErr) {
        console.error('Error auto-deleting invitation tokens for existing members:', delErr);
    }

    return (
        <ClientDashboardPage {...clientProps} pendingInvitations={pendingInvitations} />
    );
}