"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import CollaboratorsTab from "./_components/collaborators-tab";
import OrganizationsTab from "./_components/organizations-tab";
import UsersTab from "./_components/users-tab";
import SectionsTab from "./_components/sections-tab";
import UsersModal from "./_components/_modals/users-modal";

// Tab configuration - single source of truth
const TAB_CONFIG = {
    kayttajat: { number: 1, label: 'Käyttäjät' },
    organisaatiot: { number: 3, label: 'Organisaatiot' },
    yhteistyokumppanit: { number: 2, label: 'Yhteistyökumppanit' },
    osiot: { number: 4, label: 'Palvelun osiot' }
};

const DEFAULT_TAB = 'kayttajat';

export default function AdminPage() {
    const { user } = useAppContext();
    if (user.role !== "admin") return null;
    
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // Centralized UsersModal control
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [fetchUsersFn, setFetchUsersFn] = useState(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    // Get current active tab directly from URL
    const tabParam = searchParams.get('tab') || DEFAULT_TAB;
    const activeTab = TAB_CONFIG[tabParam]?.number || TAB_CONFIG[DEFAULT_TAB].number;

    // Redirect to default if invalid tab
    useEffect(() => {
        const currentTab = searchParams.get('tab');
        if (!currentTab || !TAB_CONFIG[currentTab]) {
            router.replace(`${pathname}?tab=${DEFAULT_TAB}`);
        }
    }, [searchParams, router, pathname]);

    const handleEditUser = useCallback((u) => {
        setSelectedUser(u || null);
        setUserModalOpen(true);
    }, []);

    const handleRegisterFetchUsers = useCallback((fn) => {
        setFetchUsersFn(() => fn);
    }, []);

    // Simple tab change - just update URL, activeTab will update automatically
    const handleTabChange = useCallback((tabName) => {
        router.push(`${pathname}?tab=${tabName}`);
    }, [router, pathname]);


    return (
        <div className="w-full p-6 space-y-6 max-w-[1500px]">
            <h1 className="text-2xl font-semibold">Hallintapaneeli</h1>
            <div className="space-y-6">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => handleTabChange('kayttajat')}
                        className={`px-3 py-2 -mb-px font-medium cursor-pointer ${activeTab === 1
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Käyttäjät
                    </button>
                    <button
                        onClick={() => handleTabChange('organisaatiot')}
                        className={`px-3 py-2 -mb-px font-medium cursor-pointer ${activeTab === 3
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Organisaatiot
                    </button>
                    <button
                        onClick={() => handleTabChange('yhteistyokumppanit')}
                        className={`px-3 py-2 -mb-px font-medium cursor-pointer ${activeTab === 2
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Yhteistyökumppanit
                    </button>
                    <button
                        onClick={() => handleTabChange('osiot')}
                        className={`px-3 py-2 -mb-px font-medium cursor-pointer ${activeTab === 4
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Palvelun osiot
                    </button>
                </div>

                {activeTab === 1 && mounted && (
                    <UsersTab onEditUser={handleEditUser} onRegisterFetchUsers={handleRegisterFetchUsers} />
                )}

                {activeTab === 2 && mounted && (
                    <CollaboratorsTab />
                )}

                {activeTab === 3 && mounted && (
                    <OrganizationsTab onEditUser={handleEditUser} />
                )}

                {activeTab === 4 && mounted && (
                    <SectionsTab />
                )}
            </div>
            {/* Centralized Users modal */}
            {mounted && (
                <UsersModal
                    open={userModalOpen}
                    selectedUser={selectedUser}
                    fetchUsers={fetchUsersFn || undefined}
                    onOpenChange={(open) => {
                        setUserModalOpen(open);
                        if (!open) setSelectedUser(null);
                    }}
                />
            )}
        </div>
    );
}

