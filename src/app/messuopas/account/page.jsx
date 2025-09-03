import { getLoggedInUser, listDocuments } from "@/lib/appwrite/server";
import { Query } from "node-appwrite";
import ClientAccountPage from "./_components/client-account-page";

export default async function AccountPage() {
    // Fetch current user on server
    const user = await getLoggedInUser();

    // Fetch organization members on server
    const { data: organizationMembers } = await listDocuments(
        "main_db",
        "users",
        [Query.equal("organization", user.organization.$id)]
    );

    const { data: organizationEvents } = await listDocuments(
        "main_db",
        "events",
        [Query.equal("organization", user.organization.$id)]
    );

    // Derive server-side props for client
    const planLabel = (() => {
        switch (user?.role) {
            case "premium_user":
                return "Premium";
            case "customer_admin":
                return "Organisaation ylläpitäjä";
            case undefined:
            case null:
                return "Ei määritetty";
            default:
                return "Perus käyttäjä";
        }
    })();

    const hideSubscription = user?.role === "admin" || user?.role === "customer_admin";
    const orgName = user?.organization?.name || "";
    const orgId = user?.organization?.$id || "";
    const ownerIds = (user?.organization?.owners || []).map((o) => (typeof o === "string" ? o : o?.$id)).filter(Boolean);
    const isOrgOwner = Boolean(user?.organization && ownerIds.includes(user.$id));

    // Normalize members for client table
    const members = (organizationMembers || []).map((m) => ({
        $id: m.$id,
        name: m.name,
        email: m.email,
        role: m.role || "user",
        accessibleEventsIds: m.accessibleEventsIds,
    }));

    const clientProps = {
        user: {
            $id: user.$id,
            name: user.name,
            email: user.email,
            role: user.role,
            accessibleEventsIds: user.accessibleEventsIds,
        },
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