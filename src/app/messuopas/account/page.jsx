import { getLoggedInUser, listDocuments } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";
import ClientAccountPage from "./_components/client-account-page";
import { redirect } from "next/navigation";
import { getRoleLabelFi } from "@/lib/constants/roles";

// Block comment: mark page dynamic to avoid static prerender when cookies() is used
export const dynamic = 'force-dynamic';

export default async function AccountPage() {
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

    const clientProps = {
        user,
        planLabel,
        hideSubscription,
        orgName,
        orgId,
        isOrgOwner,
        members,
        organizationEvents,
    };

    return <ClientAccountPage {...clientProps} />;
}