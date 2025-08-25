"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Building2, Mail, Globe, Users } from "lucide-react";
import Link from "next/link";
import SVGComponent from "@/components/svg-image";

export default function CollaboratorsClientPage({ collaborators }) {
    const { sections } = useAppContext();
    const [selectedSection, setSelectedSection] = useState(null);
    const [filteredCollaborators, setFilteredCollaborators] = useState([]);

    // Get collaborators grouped by section - memoized to prevent infinite re-renders
    const collaboratorsBySection = useMemo(() => {
        return collaborators?.reduce((acc, collaborator) => {
            const sectionId = collaborator.initialSection?.$id;
            if (sectionId) {
                if (!acc[sectionId]) {
                    acc[sectionId] = {
                        section: collaborator.initialSection,
                        collaborators: []
                    };
                }
                acc[sectionId].collaborators.push(collaborator);
            }
            return acc;
        }, {}) || {};
    }, [collaborators]);

    // Filter collaborators based on selected section
    useEffect(() => {
        if (selectedSection) {
            const sectionData = collaboratorsBySection[selectedSection];
            setFilteredCollaborators(sectionData?.collaborators || []);
        } else {
            setFilteredCollaborators([]);
        }
    }, [selectedSection, collaboratorsBySection]);
   
    // Get sections that have collaborators - memoized
    const availableSections = useMemo(() => {
        return Object.values(collaboratorsBySection).map(item => item.section);
    }, [collaboratorsBySection]);
    
    // Get total collaborators count
    const totalCollaborators = collaborators?.length || 0;
    return (
        <div className="w-full p-6 space-y-8 max-w-[1500px]">
            {/* Header */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900">Yhteistyökumppanit</h1>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{totalCollaborators} kumppania yhteensä</span>
                    </div>
                </div>
                <p className="text-gray-600 max-w-2xl">
                    Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quod.
                </p>
            </div>

            {/* Section Selection */}
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-800">Valitse kategoria:</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {availableSections.map((section, index) => {
                        const isSelected = selectedSection === section.$id;
                        const collaboratorCount = collaboratorsBySection[section.$id]?.collaborators.length || 0;
                        
                        return (
                            <Card 
                                key={section.$id}
                                className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                                    isSelected ? 'ring-2 ring-green-500 bg-green-50 shadow-lg' : 'hover:shadow-md'
                                }`}
                                onClick={() => setSelectedSection(section.$id)}
                            >
                                <CardHeader className="pb-4">
                                    <CardTitle className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${
                                                isSelected ? 'bg-green-200' : 'bg-gray-100'
                                            }`}>
                                                <Building2 className={`w-5 h-5 ${
                                                    isSelected ? 'text-green-700' : 'text-gray-600'
                                                }`} />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="text-base font-semibold text-gray-900 leading-tight">
                                                    {section.title}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {collaboratorCount} {collaboratorCount === 1 ? 'kumppani' : 'kumppania'}
                                                </p>
                                            </div>
                                        </div>
                                       
                                    </CardTitle>
                                </CardHeader>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Collaborators List */}
            {selectedSection && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div>
                            <h2 className="text-2xl font-semibold text-gray-900">
                                {collaboratorsBySection[selectedSection]?.section.title}
                            </h2>
                            <p className="text-gray-600 mt-1">
                                Yhteistyökumppanit tässä kategoriassa
                            </p>
                        </div>
                        <Badge variant="outline" className="text-sm px-3 py-1">
                            {filteredCollaborators.length} {filteredCollaborators.length === 1 ? 'kumppani' : 'kumppania'}
                        </Badge>
                    </div>

                    {filteredCollaborators.length > 0 ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredCollaborators.map((collaborator) => (
                                <Card key={collaborator.$id} className="hover:shadow-lg transition-all duration-200 hover:-translate-y-1 group">
                                    <CardHeader className="pb-4">
                                        <div className="flex items-start gap-4">
                                            <div className="w-16 h-16 rounded-xl border-2 border-gray-100 overflow-hidden bg-white flex items-center justify-center group-hover:border-green-200 transition-colors">
                                                {collaborator.logo ? (
                                                    <SVGComponent 
                                                        bucketId="collaborators"
                                                        fileId={collaborator.logo}
                                                        className="w-12 h-12 object-contain"
                                                        useSSR={true}
                                                    />
                                                ) : (
                                                    <Building2 className="w-8 h-8 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="text-lg font-semibold text-gray-900 leading-tight group-hover:text-green-700 transition-colors">
                                                    {collaborator.name}
                                                </CardTitle>
                                                <Badge variant="secondary" className="mt-2 text-xs">
                                                    {collaborator.initialSection.title}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                                            {collaborator.description}
                                        </p>
                                        
                                        {/* Contact Info */}
                                        <div className="space-y-2 pt-2 border-t">
                                            {collaborator.contact_name && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center">
                                                        <div className="w-2 h-2 rounded-full bg-green-600"></div>
                                                    </div>
                                                    <span>{collaborator.contact_name}</span>
                                                </div>
                                            )}
                                            {collaborator.contact_email && (
                                                <div className="flex items-center gap-2 text-sm text-gray-600">
                                                    <Mail className="w-4 h-4 text-gray-400" />
                                                    <span className="truncate">{collaborator.contact_email}</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        {/* Actions */}
                                        <div className="flex gap-2 pt-2">
                                            {collaborator.web && collaborator.web !== '#' && (
                                                <Button 
                                                    variant="default" 
                                                    size="sm" 
                                                    className="w-1/2 bg-green-600 hover:bg-green-700"
                                                    asChild
                                                >
                                                    <Link 
                                                        href={collaborator.web} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2"
                                                    >
                                                        <Globe className="w-4 h-4" />
                                                        Verkkosivu
                                                    </Link>
                                                </Button>
                                            )}
                                            
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                            <h3 className="text-lg font-medium mb-2">Ei yhteistyökumppaneita</h3>
                            <p>Tässä kategoriassa ei ole vielä yhteistyökumppaneita.</p>
                        </div>
                    )}
                </div>
            )}

            {!selectedSection && (
                <div className="text-center py-16 text-gray-500">
                    <div className="max-w-md mx-auto">
                        <Building2 className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                        <h3 className="text-xl font-semibold mb-3 text-gray-700">Valitse kategoria</h3>
                        <p className="text-gray-600 leading-relaxed">
                            Klikkaa yllä olevaa kategoriaa nähdäksesi alan yhteistyökumppanit ja heidän yhteystietonsa.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
