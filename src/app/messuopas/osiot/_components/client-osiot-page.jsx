"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { updateDocument, deleteDocument, createDocument } from "@/lib/appwrite/server";
import { slugify } from "@/lib/utils";
import SectionCard from "./section-card";
import InlineSectionCreate from "./inline-section-create";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useRouter } from "next/navigation";


export default function ClientSectionsPage({ additionalSections, user, events }) {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createMode, setCreateMode] = useState(null); // 'section' | 'subsection' | null
    const [editMode, setEditMode] = useState(null); // { type: 'section'|'subsection', item: object } | null
    const router = useRouter();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Process sections
    const processSections = () => {

        try {
            setLoading(true);

            const processedSections = (additionalSections || []).map((section, index) => ({
                ...section,
                order: index,
                subsections: (section.additionalSubsections || []).sort((a, b) => (a.order || 0) - (b.order || 0))
            }));
            setSections(processedSections);
        } catch (error) {
            console.error('Error processing sections:', error);
            toast.error('Virhe osioiden käsittelyssä');
        } finally {
            setLoading(false);
        }
    };

    // Handle section drag end
    const handleSectionDragEnd = async (event) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = sections.findIndex(section => section.$id === active.id);
            const newIndex = sections.findIndex(section => section.$id === over.id);

            const newSections = arrayMove(sections, oldIndex, newIndex);
            setSections(newSections);

            // Update order in database
            try {
                const updatePromises = newSections.map((section, index) =>
                    updateDocument('main_db', 'additional_sections', section.$id, { order: index })
                );

                await Promise.all(updatePromises);
                toast.success('Osioiden järjestys päivitetty');
            } catch (error) {
                console.error('Error updating section order:', error);
                toast.error('Virhe järjestyksen päivittämisessä');
                // Reload sections to revert changes
                router.refresh();
            }
        }
    };

    // Edit handlers
    const startEditingSection = (section) => {
        const newTitle = prompt('Muokkaa osion nimeä:', section.title);
        if (newTitle && newTitle.trim() && newTitle.trim() !== section.title) {
            handleEditSection(section, newTitle.trim());
        }
    };

    // Handle edit section
    const handleEditSection = async (section, newTitle) => {
        try {
            setIsSubmitting(true);
            const { error } = await updateDocument('main_db', 'additional_sections', section.$id, {
                title: newTitle
            });

            if (error) {
                toast.error('Virhe osion päivittämisessä');
                console.error(error);
                return;
            }

            toast.success('Osio päivitetty onnistuneesti');
            router.refresh();
            processSections();
        } catch (error) {
            console.error('Error updating section:', error);
            toast.error('Virhe osion päivittämisessä');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete section
    const deleteSection = async (section) => {
        if (!confirm(`Haluatko varmasti poistaa osion "${section.title}"?`)) {
            return;
        }

        try {
            setIsSubmitting(true);
            const { error } = await deleteDocument('main_db', 'additional_sections', section.$id);

            if (error) {
                toast.error('Virhe osion poistamisessa');
                console.error(error);
                return;
            }

            toast.success('Osio poistettu onnistuneesti');
            router.refresh();
            processSections();
        } catch (error) {
            console.error('Error deleting section:', error);
            toast.error('Virhe osion poistamisessa');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete subsection
    const deleteSubsection = async (subsection) => {
        if (!confirm(`Haluatko varmasti poistaa alaosion "${subsection.title}"?`)) {
            return;
        }

        try {
            setIsSubmitting(true);
            const { error } = await deleteDocument('main_db', 'additional_subsections', subsection.$id);

            if (error) {
                toast.error('Virhe alaosion poistamisessa');
                console.error(error);
                return;
            }

            toast.success('Alaosio poistettu onnistuneesti');
            router.refresh();
            processSections();
        } catch (error) {
            console.error('Error deleting subsection:', error);
            toast.error('Virhe alaosion poistamisessa');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle subsection drag end
    const handleSubsectionDragEnd = async (event, section) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const subsections = section.subsections || [];
            const oldIndex = subsections.findIndex(sub => sub.$id === active.id);
            const newIndex = subsections.findIndex(sub => sub.$id === over.id);

            const newSubsections = arrayMove(subsections, oldIndex, newIndex);

            // Update local state
            const updatedSections = sections.map(s =>
                s.$id === section.$id
                    ? { ...s, subsections: newSubsections }
                    : s
            );
            setSections(updatedSections);

            // Update order in database
            try {
                const updatePromises = newSubsections.map((subsection, index) =>
                    updateDocument('main_db', 'additional_subsections', subsection.$id, { order: index })
                );

                await Promise.all(updatePromises);
                toast.success('Alaosioiden järjestys päivitetty');
            } catch (error) {
                console.error('Error updating subsection order:', error);
                toast.error('Virhe alaosioiden järjestyksen päivittämisessä');
                // Reload sections to revert changes
                router.refresh();
            }
        }
    };

    // Create new section
    const handleCreateSection = async (title) => {
        try {
            setIsSubmitting(true);

            const newSection = {
                title,
                path: slugify(title),
                order: sections.length,
                eventId: user.activeEventId
            };

            if (user?.organization) {
                newSection.organization = user.organization.$id;
            } else {
                newSection.user = user.$id;
            }

            await createDocument('main_db', 'additional_sections', { body: newSection });
            toast.success('Osio luotu onnistuneesti');
            router.refresh();
            processSections();

            setCreateMode(null);
        } catch (error) {
            console.error('Error creating section:', error);
            toast.error('Virhe osion luomisessa');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Toggle section expansion
    const toggleSection = (sectionId) => {
        setExpandedSections(prev => {
            const newSet = new Set(prev);
            if (newSet.has(sectionId)) {
                newSet.delete(sectionId);
            } else {
                newSet.add(sectionId);
            }
            return newSet;
        });
    };

    useEffect(() => {
        processSections();
    }, [additionalSections]);

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <div className="flex items-center justify-between mb-6">
                    <h1 className="text-2xl font-bold">Osioiden hallinta</h1>
                </div>
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="animate-pulse">
                            <CardContent className="p-4">
                                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                                <div className="h-4 bg-gray-100 rounded w-1/4"></div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold">Osioiden hallinta</h2>
                    <p><span className="font-bold"> {events.find(event => event.$id === user.activeEventId)?.name}</span> messun osiot</p>
                </div>

                <Button onClick={() => setCreateMode('section')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Luo uusi osio
                </Button>
            </div>

            <div className="space-y-4">
                {/* Inline Section Create */}
                {createMode === 'section' && (
                    <InlineSectionCreate
                        onSave={handleCreateSection}
                        onCancel={() => setCreateMode(null)}
                        isSubmitting={isSubmitting}
                    />
                )}

                {sections.length === 0 && createMode !== 'section' ? (
                    <Card>
                        <CardContent className="py-8 text-center text-gray-500">
                            <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p>Ei osioita vielä luotu</p>
                        </CardContent>
                    </Card>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleSectionDragEnd}
                    >
                        <SortableContext
                            items={sections.map(section => section.$id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="space-y-4">
                                {sections.map((section, sectionIndex) => (
                                    <SectionCard
                                        key={section.$id}
                                        section={section}
                                        sectionIndex={sectionIndex}
                                        expandedSections={expandedSections}
                                        toggleSection={toggleSection}
                                        startEditingSection={startEditingSection}
                                        deleteSection={deleteSection}
                                        deleteSubsection={deleteSubsection}
                                        onSubsectionDragEnd={handleSubsectionDragEnd}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Add section at the end if not in create mode */}
            {createMode !== 'section' && sections.length > 0 && (
                <div className="pt-4">
                    <Button
                        variant="outline"
                        className="w-full border-dashed"
                        onClick={() => setCreateMode('section')}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Lisää uusi osio
                    </Button>
                </div>
            )}
        </div>
    );
}