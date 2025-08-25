"use client";

import { useState } from "react";
import { useAppContext } from "@/context/app-context";
import CollaboratorsTab from "./_components/collaborators-tab";
import OrganizationsTab from "./_components/organizations-tab";
import UsersTab from "./_components/users-tab";

export default function AdminPage() {
    const { user } = useAppContext();
    const [tab, setTab] = useState(1);


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
                        onClick={() => setTab(2)}
                        className={`px-3 py-2 -mb-px font-medium cursor-pointer ${tab === 2
                            ? 'text-green-600 border-b-2 border-green-600'
                            : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                            }`}
                    >
                        Yhteistyökumppanit
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
                </div>

                {tab === 1 && (
                    <UsersTab />
                )}

                {tab === 2 && (
                    <CollaboratorsTab />
                )}

                {tab === 3 && (
                    <OrganizationsTab />
                )}


            </div>
          
        </div>
    );
}

