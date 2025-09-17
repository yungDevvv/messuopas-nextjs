"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, FolderOpen } from "lucide-react";
import { toast } from "sonner";
import { listDocuments, createDocument, updateDocument, deleteDocument } from "@/lib/appwrite/server";
import { slugify } from "@/lib/utils";
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
    verticalListSortingStrategy,
    sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';

// Import new components
import SectionCard from "./section-card";
import InlineSectionCreate from "./inline-section-create";
import InlineSectionEdit from "./inline-section-edit";


export default function SectionsTab() {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedSections, setExpandedSections] = useState(new Set());
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [createMode, setCreateMode] = useState(null); // 'section' | 'subsection' | null
    const [editMode, setEditMode] = useState(null); // { type: 'section'|'subsection', item: object } | null


    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Load sections with subsections
    const loadSections = async () => {
        try {
            setLoading(true);
            const { data: sectionsData, error } = await listDocuments('main_db', 'initial_sections', []);
            
            if (error) {
                console.error('Error loading sections:', error);
                toast.error('Virhe osioiden lataamisessa');
                return;
            }

            // Sort sections by order
            const sortedSections = (sectionsData || []).sort((a, b) => (a.order || 0) - (b.order || 0));
            
            // Sort subsections within each section by order
            const sectionsWithSortedSubsections = sortedSections.map(section => ({
                ...section,
                initialSubsections: (section.initialSubsections || []).sort((a, b) => (a.order || 0) - (b.order || 0))
            }));

            setSections(sectionsWithSortedSubsections);
        } catch (error) {
            console.error('Error loading sections:', error);
            toast.error('Virhe osioiden lataamisessa');
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
                    updateDocument('main_db', 'initial_sections', section.$id, { order: index })
                );
                
                await Promise.all(updatePromises);
                toast.success('Osioiden järjestys päivitetty');
            } catch (error) {
                console.error('Error updating section order:', error);
                toast.error('Virhe järjestyksen päivittämisessä');
                // Reload sections to revert changes
                loadSections();
            }
        }
    };

    // Handle subsection drag end
    const handleSubsectionDragEnd = async (event, section) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const subsections = section.initialSubsections || [];
            const oldIndex = subsections.findIndex(sub => sub.$id === active.id);
            const newIndex = subsections.findIndex(sub => sub.$id === over.id);

            const newSubsections = arrayMove(subsections, oldIndex, newIndex);
            
            // Update sections state
            const updatedSections = sections.map(s => 
                s.$id === section.$id 
                    ? { ...s, initialSubsections: newSubsections }
                    : s
            );
            setSections(updatedSections);

            // Update order in database
            try {
                const updatePromises = newSubsections.map((subsection, index) =>
                    updateDocument('main_db', 'initial_subsections', subsection.$id, { order: index })
                );
                
                await Promise.all(updatePromises);
                toast.success('Alaosioiden järjestys päivitetty');
            } catch (error) {
                console.error('Error updating subsection order:', error);
                toast.error('Virhe järjestyksen päivittämisessä');
                // Reload sections to revert changes
                loadSections();
            }
        }
    };

    useEffect(() => {
        loadSections();
    }, []);

    // Toggle section expansion
    const toggleSection = (sectionId) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    // Create section
    const onCreateSection = async (data) => {
        try {
            setIsSubmitting(true);
            const { data: newSection, error } = await createDocument('main_db', 'initial_sections', {
                document_id: slugify(data.title),
                body: {
                    title: data.title,
                    order: data.order,
                    initialSubsections: []
                }
            });

            if (error) {
                toast.error('Virhe osion luomisessa');
                console.error(error);
                return;
            }

            toast.success('Osio luotu onnistuneesti');
            setCreateMode(null);
            loadSections();
        } catch (error) {
            console.error('Error creating section:', error);
            toast.error('Virhe osion luomisessa');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Update section
    const onUpdateSection = async (data) => {
        try {
            setIsSubmitting(true);
            const { error } = await updateDocument('main_db', 'initial_sections', editMode.item.$id, {
                title: data.title,
                order: data.order
            });

            if (error) {
                toast.error('Virhe osion päivittämisessä');
                console.error(error);
                return;
            }

            toast.success('Osio päivitetty onnistuneesti');
            setEditMode(null);
            loadSections();
        } catch (error) {
            console.error('Error updating section:', error);
            toast.error('Virhe osion päivittämisessä');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete section
    const deleteSection = async (section) => {
        if (!confirm(`Haluatko varmasti poistaa osion "${section.title}"? Tämä poistaa myös kaikki sen alaosiot.`)) {
            return;
        }

        try {
            // Delete all subsections first
            if (section.initialSubsections?.length > 0) {
                for (const subsection of section.initialSubsections) {
                    await deleteDocument('main_db', 'initial_subsections', subsection.$id);
                }
            }

            // Delete section
            const { error } = await deleteDocument('main_db', 'initial_sections', section.$id);

            if (error) {
                toast.error('Virhe osion poistamisessa');
                console.error(error);
                return;
            }

            toast.success('Osio poistettu onnistuneesti');
            loadSections();
        } catch (error) {
            console.error('Error deleting section:', error);
            toast.error('Virhe osion poistamisessa');
        }
    };

    // Delete subsection
    const deleteSubsection = async (section, subsection) => {
        if (!confirm(`Haluatko varmasti poistaa alaosion "${subsection.title}"?`)) {
            return;
        }

        try {
            // Delete subsection
            const { error } = await deleteDocument('main_db', 'initial_subsections', subsection.$id);

            if (error) {
                toast.error('Virhe alaosion poistamisessa');
                console.error(error);
                return;
            }

            // Update section to remove subsection reference
            const updatedSubsections = section.initialSubsections.filter(sub => sub.$id !== subsection.$id);
            await updateDocument('main_db', 'initial_sections', section.$id, {
                initialSubsections: updatedSubsections.map(sub => sub.$id)
            });

            toast.success('Alaosio poistettu onnistuneesti');
            loadSections();
        } catch (error) {
            console.error('Error deleting subsection:', error);
            toast.error('Virhe alaosion poistamisessa');
        }
    };

    // Edit handlers
    const startEditingSection = (section) => {
        setEditMode({ type: 'section', item: section });
    };

    const startEditingSubsection = (subsection) => {
        setEditMode({ type: 'subsection', item: subsection });
    };

    const startCreatingSubsection = (section) => {
        setCreateMode('subsection');
        setEditMode({ type: 'subsection-parent', item: section });
    };

    if (loading) {
        return <div className="flex justify-center py-8">Ladataan osioita...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Osioiden hallinta</h2>
                <Button onClick={() => setCreateMode('section')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Luo uusi osio
                </Button>
            </div>

            <div className="space-y-4">
                {/* Inline Section Create */}
                {createMode === 'section' && (
                    <InlineSectionCreate
                        onSubmit={onCreateSection}
                        onCancel={() => setCreateMode(null)}
                        isSubmitting={isSubmitting}
                        nextOrder={sections.length}
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
                                {sections.map((section, sectionIndex) => {
                                    // Check if this section is being edited
                                    if (editMode?.type === 'section' && editMode.item.$id === section.$id) {
                                        return (
                                            <InlineSectionEdit
                                                key={section.$id}
                                                section={section}
                                                onSubmit={onUpdateSection}
                                                onCancel={() => setEditMode(null)}
                                                isSubmitting={isSubmitting}
                                            />
                                        );
                                    }

                                    return (
                                        <SectionCard
                                            key={section.$id}
                                            section={section}
                                            sectionIndex={sectionIndex}
                                            expandedSections={expandedSections}
                                            toggleSection={toggleSection}
                                            startEditingSection={startEditingSection}
                                            deleteSection={deleteSection}
                                            startCreatingSubsection={startCreatingSubsection}
                                            startEditingSubsection={startEditingSubsection}
                                            deleteSubsection={deleteSubsection}
                                            onSubsectionDragEnd={handleSubsectionDragEnd}
                                        />
                                    );
                                })}
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
