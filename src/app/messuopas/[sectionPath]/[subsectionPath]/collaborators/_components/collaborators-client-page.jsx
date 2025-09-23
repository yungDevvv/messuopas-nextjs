"use client";

import { Button } from "@/components/ui/button";
import { Building2, Mail, Globe, Users, Handshake } from "lucide-react";
import Link from "next/link";
import SVGComponent from "@/components/svg-image";
import { useState } from "react";

export default function CollaboratorsClientPage({ collaborators, sectionData, allInitialSectionCollaborators, currentSubSectionData, allSectionCollaborators }) {
    // State for switching between subsection and section view
    const [showAllSection, setShowAllSection] = useState(false);
    
    // Collaborators are already filtered by subsection in the parent component
    const subsectionCollaborators = collaborators || [];
    const sectionFallback = allSectionCollaborators || []; // Use section collaborators as fallback
    const totalCollaborators = subsectionCollaborators?.length || 0;
    
    // Determine which collaborators to show and current context
    const displayCollaborators = showAllSection ? sectionFallback : subsectionCollaborators;
    const currentContext = showAllSection ? sectionData : currentSubSectionData?.title;
    const hasSubsectionCollaborators = totalCollaborators > 0;
    
    // Format slugs: decode, replace dashes with spaces, capitalize first letter
    // This improves readability for values coming from URL params
    const formatLabel = (value) => {
        if (!value) return "";
        const decoded = decodeURIComponent(String(value));
        const spaced = decoded.replace(/-/g, " ");
        return spaced.charAt(0).toUpperCase() + spaced.slice(1);
    };
    
    return (
        <div className="space-y-6">
            {/* Dynamic Header */}
            <div className="space-y-2">
                <h1 className="text-2xl font-bold">
                    Yhteistyökumppanit - {formatLabel(currentContext)}
                </h1>
                
                {/* Toggle Button - only show if subsection has collaborators */}
                {hasSubsectionCollaborators && (
                    <Button
                        variant="ghost"
                        onClick={() => setShowAllSection(!showAllSection)}
                        className="flex items-center gap-2"
                    >
                        <Handshake className="w-4 h-4" />
                        {showAllSection 
                            ? `Näytä vain "${formatLabel(currentSubSectionData?.title)}" -aliosion kumppanit`
                            : `Näytä kaikki "${formatLabel(sectionData)}"-osion yhteistyökumppanit`
                        }
                    </Button>
                )}
            </div>
            
            {/* Description */}
            <p className="text-gray-600 !mb-3">
                {showAllSection 
                    ? `Kaikki yhteistyökumppanit osiosta "${formatLabel(sectionData)}".`
                    : hasSubsectionCollaborators 
                        ? `Yhteistyökumppanit aliosiosta "${formatLabel(currentSubSectionData?.title)}".`
                        : ``
                }
            </p>
            {displayCollaborators?.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {displayCollaborators.map((collaborator) => (
                        <div
                            key={collaborator.$id}
                            className="group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 h-[420px] overflow-hidden"
                        >
                            {/* Image */}
                            <div className="w-full h-40 overflow-hidden flex items-center justify-center">
                                {collaborator.logo ? (
                                    <SVGComponent
                                        bucketId="collaborators"
                                        fileId={collaborator.logo}
                                        className="w-full h-full object-cover"
                                        useSSR={true}
                                    />
                                ) : (
                                    <Building2 className="w-12 h-12 text-gray-300" />
                                )}
                            </div>

                            {/* Body */}
                            <div className="flex-1 flex flex-col gap-3 p-5">
                                <h3 className="text-[17px] font-semibold text-gray-900 leading-tight group-hover:text-green-700 transition-colors">
                                    {collaborator.name}
                                </h3>
                                <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                                    {collaborator.description}
                                </p>

                                {/* Contact Info */}
                                <div className="space-y-2 pt-2 border-t mt-auto">
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
                                {collaborator.web && collaborator.web !== '#' && (
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="default"
                                            size="sm"
                                            className="flex-1 bg-green-600 hover:bg-green-700"
                                            asChild
                                        >
                                            <Link
                                                href={collaborator.web}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-center gap-2"
                                            >
                                                <Globe className="w-4 h-4" />
                                                Verkkosivu
                                            </Link>
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-6">
                    {sectionFallback?.length > 0 ? (
                        <>
                            {/* subtle hint instead of explicit empty-state */}
                            <div className="text-sm text-gray-500 py-1 px-1">Ei löytynyt aliosiosta "{formatLabel(currentSubSectionData?.title)}" – näytetään kaikki yhteistyökumppanit osiosta <span className="font-semibold">"{formatLabel(sectionData)}"</span>.</div>
                            <div className="grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {sectionFallback.map((collaborator) => (
                                    <div
                                        key={collaborator.$id}
                                        className="group flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-1 h-[420px] overflow-hidden"
                                    >
                                        {/* Image */}
                                        <div className="w-full h-40 overflow-hidden flex items-center justify-center">
                                            {collaborator.logo ? (
                                                <SVGComponent
                                                    bucketId="collaborators"
                                                    fileId={collaborator.logo}
                                                    className="w-full h-full object-cover"
                                                    useSSR={true}
                                                />
                                            ) : (
                                                <Building2 className="w-12 h-12 text-gray-300" />
                                            )}
                                        </div>

                                        {/* Body */}
                                        <div className="flex-1 flex flex-col gap-3 p-5">
                                            <h3 className="text-[17px] font-semibold text-gray-900 leading-tight group-hover:text-green-700 transition-colors">
                                                {collaborator.name}
                                            </h3>
                                            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
                                                {collaborator.description}
                                            </p>

                                            {/* Contact Info */}
                                            <div className="space-y-2 pt-2 border-t mt-auto">
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
                                            {collaborator.web && collaborator.web !== '#' && (
                                                <div className="flex gap-3 pt-2">
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="flex-1 bg-green-600 hover:bg-green-700"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={collaborator.web}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="flex items-center justify-center gap-2"
                                                        >
                                                            <Globe className="w-4 h-4" />
                                                            Verkkosivu
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-10 text-gray-600">
                            <div className="max-w-2xl mx-auto">
                                <Building2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <h3 className="text-lg font-semibold mb-2 text-gray-800">Ei yhteistyökumppaneita tässä osiossa</h3>
                                <p className="leading-relaxed">Tältä osiolta ei löytynyt yhtään yhteistyökumppania. Voit palata myöhemmin – lisäämme kumppaneita aktiivisesti.</p>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

