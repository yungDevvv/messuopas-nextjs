"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import OrganizationTab from "./organization-tab";
import SectionsTab from "./sections-tab";
import EventsTab from "./events-tab";

export default function ClientDashboardPage({ pendingInvitations = [], ...clientProps }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tabFromUrl = searchParams.get('tab');

    const [tab, setTab] = useState(tabFromUrl ? parseInt(tabFromUrl) : 1);
    const [mounted, setMounted] = useState(false);

    console.log(clientProps, "asdasdasdasdadsads213132132123123");
    console.log(pendingInvitations, "pendingInvitations: step1");

    useEffect(() => { setMounted(true); }, []);

    // Update URL when tab changes
    const handleTabChange = (newTab) => {
        setTab(newTab);
        router.push(`/messuopas/dashboard?tab=${newTab}`, { scroll: false });
    };

    return (
        <div className="w-full p-6 space-y-6 max-w-[1500px]">
            <h1 className="text-2xl font-semibold">Hallintapaneeli</h1>
            <div className="space-y-6">
                <div className="flex border-b border-gray-200">
                    {clientProps.user.organization.owners.find((owner) => owner.$id === clientProps.user.$id) ? (
                        <button
                            onClick={() => handleTabChange(1)}
                            className={`px-3 py-2 -mb-px font-medium cursor-pointer ${tab === 1
                                ? 'text-green-600 border-b-2 border-green-600'
                                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                                }`}
                        >
                            Organisaatio
                        </button>
                    ) : null}
                    <button
                        onClick={() => handleTabChange(2)}
                        className={`px-3 py-2 -mb-px font-medium cursor-pointer ${tab === 2
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Messut
                    </button>
                    <button
                        onClick={() => handleTabChange(3)}
                        className={`px-3 py-2 -mb-px font-medium cursor-pointer ${tab === 3
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Osiot
                    </button>
                </div>

                {tab === 1 && mounted && (
                    <OrganizationTab {...clientProps} pendingInvitations={pendingInvitations} />
                )}
                {tab === 2 && mounted && (
                    <EventsTab {...clientProps} />
                )}
                {tab === 3 && mounted && (
                    <SectionsTab {...clientProps} />
                )}
            </div>
        </div>
    );
}