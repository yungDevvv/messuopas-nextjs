"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useAppContext } from "@/context/app-context";
import CollaboratorsTab from "./_components/collaborators-tab";
import OrganizationsTab from "./_components/organizations-tab";
import UsersTab from "./_components/users-tab";
import SectionsTab from "./_components/sections-tab";
import UsersModal from "./_components/_modals/users-modal";

export default function AdminPage() {
    const { user } = useAppContext();
    const searchParams = useSearchParams();
    const [tab, setTab] = useState(1);

    // Centralized UsersModal control
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [fetchUsersFn, setFetchUsersFn] = useState(null); // receives from UsersTab
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const handleEditUser = useCallback((u) => {
        setSelectedUser(u || null);
        setUserModalOpen(true);
    }, []);

    // stable registration function to hand down to UsersTab
    const handleRegisterFetchUsers = useCallback((fn) => {
        // store function in state using functional update to avoid stale closures
        setFetchUsersFn(() => fn);
    }, []);

    // Check URL parameter and set appropriate tab
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'osiot') {
            setTab(4); // Osiot tab
        } else if (tabParam === 'kayttajat') {
            setTab(1); // Käyttäjät tab
        } else if (tabParam === 'yhteistyokumppanit') {
            setTab(2); // Yhteistyökumppanit tab
        } else if (tabParam === 'organisaatiot') {
            setTab(3); // Organisaatiot tab
        }
    }, [searchParams]);


    return (
        <div className="w-full p-6 space-y-6 max-w-[1500px]">
            <h1 className="text-2xl font-semibold">Hallintapaneeli</h1>
            <div className="space-y-6">
                <div className="flex border-b border-gray-200">
                    <button
                        onClick={() => setTab(1)}
                        className={`px-3 py-2 -mb-px font-medium cursor-pointer ${tab === 1
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Käyttäjät
                    </button>
                    <button
                        onClick={() => setTab(3)}
                        className={`px-3 py-2 -mb-px font-medium cursor-pointer ${tab === 3
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Organisaatiot
                    </button>
                    <button
                        onClick={() => setTab(2)}
                        className={`px-3 py-2 -mb-px font-medium cursor-pointer ${tab === 2
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Yhteistyökumppanit
                    </button>
                    <button
                        onClick={() => setTab(4)}
                        className={`px-3 py-2 -mb-px font-medium cursor-pointer ${tab === 4
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Osiot
                    </button>
                </div>

                {tab === 1 && mounted && (
                    <UsersTab onEditUser={handleEditUser} onRegisterFetchUsers={handleRegisterFetchUsers} />
                )}

                {tab === 2 && mounted && (
                    <CollaboratorsTab />
                )}

                {tab === 3 && mounted && (
                    <OrganizationsTab onEditUser={handleEditUser} />
                )}

                {tab === 4 && mounted && (
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

