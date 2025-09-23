"use client";

import { useState, useEffect, useMemo } from "react";
import { createDocument, updateDocument, deleteDocument, createFile, listDocuments } from '@/lib/appwrite/server';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building, Eye, Edit2, Trash2, Link, Mail, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/utils/debounce";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import CollaboratorModal from "./_modals/collaborators-modal";
import SVGComponent from "@/components/svg-image";
import { useModal } from "@/hooks/use-modal";
import { useAppContext } from "@/context/app-context";

export default function CollaboratorsTab() {
    const { sections } = useAppContext();
    const [collaborators, setCollaborators] = useState([]);
    const [loading, setLoading] = useState(false);
    const [collabQuery, setCollabQuery] = useState("");
    const [debouncedCollabQuery, setDebouncedCollabQuery] = useState("");
    const debouncedSetQuery = useMemo(() => debounce(setDebouncedCollabQuery, 300), []);
    const [collaboratorModalOpen, setCollaboratorModalOpen] = useState(false);
    const [selectedCollaborator, setSelectedCollaborator] = useState(null);
    const [selectedSections, setSelectedSections] = useState([]);
    const { onOpen } = useModal();

    const fetchCollaborators = async () => {
        setLoading(true);
        try {
            const { data } = await listDocuments('main_db', 'collobarators');
            setCollaborators(data || []);
        } catch (error) {
            console.error('Error loading collaborators:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCollaborator = async (collaboratorId) => {
        try {
            await deleteDocument('main_db', 'collobarators', collaboratorId);
            setCollaborators(prev => prev.filter(c => c.$id !== collaboratorId));
        } catch (error) {
            console.error('Error deleting collaborator:', error);
            alert('Virhe poistettaessa yhteistyökumppania');
        }
    };

    useEffect(() => {
        fetchCollaborators();
    }, []);

    useEffect(() => {
        debouncedSetQuery(collabQuery);
        return () => debouncedSetQuery.cancel && debouncedSetQuery.cancel();
    }, [collabQuery, debouncedSetQuery]);

    const filteredCollaborators = useMemo(() => {
        let filtered = collaborators;
        
        // Filter by sections
        if (selectedSections.length > 0) {
            filtered = filtered.filter((c) => 
                selectedSections.includes(c?.initialSection?.$id)
            );
        }
        
        // Filter by search query
        const q = (debouncedCollabQuery || "").trim().toLowerCase();
        if (q) {
            filtered = filtered.filter((c) => {
                const hay = [
                    c?.name,
                    c?.contact_name,
                    c?.contact_email,
                    c?.email,
                    c?.web,
                    c?.description,
                ]
                    .map((v) => (v || "").toString().toLowerCase());
                return hay.some((text) => text.includes(q));
            });
        }
        
        return filtered;
    }, [collaborators, debouncedCollabQuery, selectedSections]);

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-medium">Yhteistyökumppanit</h2>


            <div className="flex justify-between items-center gap-2 w-full">
                <Input
                    placeholder="Hae kumppaneita..."
                    value={collabQuery}
                    onChange={(e) => setCollabQuery(e.target.value)}
                    className="sm:w-72"
                />
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="h-10">
                                <SlidersHorizontal className="w-4 h-4 " />
                                {selectedSections.length !== 0 ? `(${selectedSections.length})` : ""}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[300px]">
                            <div className="p-2">
                                <div className="text-sm font-medium mb-2">Suodata osiot:</div>
                                {sections.map((section) => (
                                    <DropdownMenuCheckboxItem
                                        key={section.$id}
                                        checked={selectedSections.includes(section.$id)}
                                        onCheckedChange={(checked) => {
                                            if (checked) {
                                                setSelectedSections(prev => [...prev, section.$id]);
                                            } else {
                                                setSelectedSections(prev => prev.filter(id => id !== section.$id));
                                            }
                                        }}
                                        onSelect={(e) => e.preventDefault()}
                                        className="flex items-center gap-2 py-2 pl-2"
                                    >
                                        <span className="text-sm">{section.order + 1}. {section.title}</span>
                                    </DropdownMenuCheckboxItem>
                                ))}
                                {selectedSections.length > 0 && (
                                    <div className="pt-2 mt-2 border-t">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSelectedSections([])}
                                            className="w-full text-sm"
                                        >
                                            Tyhjennä suodattimet
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    <Button className="h-10" onClick={() => setCollaboratorModalOpen(true)}>Lisää uusi yhteistyökumppani</Button>
                </div>

            </div>


            {loading ? (
                <div className="text-center py-8">Ladataan...</div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredCollaborators.map((collaborator) => (
                        <Card key={collaborator.$id} className="group relative bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-200 overflow-hidden">
                            {/* Header with Logo and Actions */}
                            <CardHeader className="bg-gradient-to-r from-gray-50 to-white">
                                <div className="flex items-start gap-4">
                                    <div className="w-20 h-20 rounded-xl border-2 border-gray-200 bg-white flex items-center justify-center overflow-hidden shadow-sm">
                                        {collaborator.logo ? (
                                            <SVGComponent
                                                bucketId="collaborators"
                                                fileId={collaborator.logo}
                                                className="w-full h-full object-cover"
                                                alt={`${collaborator.name} logo`}
                                            />
                                        ) : (
                                            <div className="text-center">
                                                <Building className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                                                <span className="text-[10px] text-gray-400">Logo</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg font-semibold text-gray-900 leading-tight truncate mb-2">
                                            {collaborator.name}
                                        </CardTitle>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                                <span className="text-sm text-gray-600 truncate">
                                                    {collaborator.contact_name || 'Ei yhteyshenkilöä'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-400"><Mail className="w-4 h-4 text-gray-400 flex-shrink-0" /></span>
                                                <span className="text-sm text-gray-600 truncate">
                                                    {collaborator.contact_email || 'Ei sähköpostia'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </CardHeader>

                            {/* Content */}
                            <CardContent>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
                                        {collaborator.description || '-'}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-sm text-gray-600 font-medium">{collaborator.initialSection?.order + 1}. {collaborator.initialSection?.title}</p>
                                    <div className="flex items-center gap-0.5">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="px-3 h-9 text-gray-600 hover:text-green-700 hover:bg-green-50"
                                            disabled={!collaborator.web}
                                            onClick={() => {
                                                if (!collaborator.web) return;
                                                const url = collaborator.web.startsWith('http') ? collaborator.web : `https://${collaborator.web}`;
                                                window.open(url, '_blank');
                                            }}
                                        >
                                            <Link className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="px-3 h-9 text-gray-600 hover:text-green-700 hover:bg-green-50"
                                            onClick={() => {
                                                setSelectedCollaborator(collaborator);
                                                setCollaboratorModalOpen(true);
                                            }}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-9 w-9 rounded-lg hover:bg-red-50 hover:text-red-600"
                                            onClick={() => onOpen("confirm-modal",
                                                {
                                                    title: "Poista yhteistyökumppani",
                                                    description: `Haluatko varmasti poistaa yhteistyökumppanin "${collaborator.name}"?`,
                                                    callback: () => handleDeleteCollaborator(collaborator.$id)
                                                }
                                            )}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <CollaboratorModal
                open={collaboratorModalOpen}
                onOpenChange={setCollaboratorModalOpen}
                selectedCollaborator={selectedCollaborator}
                onSave={() => {
                    fetchCollaborators();
                    setSelectedCollaborator(null);
                }}
            />
        </div>
    );
}