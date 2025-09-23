"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, FolderOpen, ChevronDown, ChevronRight, GripVertical, Shield, Settings } from "lucide-react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useRouter } from 'next/navigation';
import { useModal } from '@/hooks/use-modal';

// Sortable subsection component
const SortableSubsection = ({ subsection, subsectionIndex, sectionIndex, section, onDelete, activeEditMode, toggleSubsectionActive }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: subsection.$id });
    const router = useRouter();
    const { onOpen } = useModal();

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };


    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-3 p-3 bg-white rounded-md border transition-colors ${
                section.type === 'initial' 
                    ? 'border-blue-200 hover:border-blue-300' 
                    : 'border-green-200 hover:border-green-300'
            }`}
        >
            {!activeEditMode && (
                <div
                    {...attributes}
                    {...listeners}
                    className={`p-1 rounded cursor-grab active:cursor-grabbing ${
                        section.type === 'initial' 
                            ? 'hover:bg-blue-100' 
                            : 'hover:bg-green-100'
                    }`}
                >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                </div>
            )}

            {activeEditMode ? (
                <div className="flex items-center justify-center w-8 h-8">
                    <Checkbox
                        checked={subsection.active !== false}
                        onCheckedChange={() => toggleSubsectionActive(section.$id, subsection.$id)}
                        className="w-4 h-4"
                    />
                </div>
            ) : (
                <div className={`flex items-center justify-center w-8 h-8 rounded-sm text-sm font-medium ${
                    section.type === 'initial' 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'bg-green-100 text-green-700'
                }`}>
                    {sectionIndex + 1}.{subsectionIndex + 1}
                </div>
            )}

            <FolderOpen className={`w-5 h-5 ${
                section.type === 'initial' ? 'text-blue-500' : 'text-green-500'
            }`} />

            <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                    {subsection.title}
                </h4>
            </div>

            {!activeEditMode && (
                <div className="flex items-center gap-1">
                    {/* Show edit/delete buttons only for additional sections */}
                    {section.type === 'additional' && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/messuopas/osiot/subsection/${subsection.$id}/edit`)}
                                className="h-8 w-8 p-0"
                            >
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onOpen("confirm-modal", {
                                    title: "Poista alaosio",
                                    description: `Haluatko varmasti poistaa alaosion "${subsection.title}"?`,
                                    callback: () => onDelete(subsection)
                                })}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </>
                    )}
                    {/* Show lock icon for initial sections */}
                    {section.type === 'initial' && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded text-blue-600">
                            <Shield className="w-3 h-3" />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default function SectionCard({
    section,
    sectionIndex,
    expandedSections,
    toggleSection,
    startEditingSection,
    deleteSection,
    deleteSubsection,
    onSubsectionDragEnd,
    activeEditMode,
    toggleSectionActive,
    toggleSubsectionActive
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.$id });
    const router = useRouter();
    // Create sensors for subsection DnD context
    const subsectionSensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const isExpanded = expandedSections.has(section.$id);
    const hasSubsections = section.subsections?.length > 0;

    return (
        <Card ref={setNodeRef} style={style} className="overflow-hidden">
            <CardHeader className="gap-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        {!activeEditMode && (
                            <div
                                {...attributes}
                                {...listeners}
                                className="p-2 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
                            >
                                <GripVertical className="w-4 h-4 text-gray-400" />
                            </div>
                        )}
                        <button
                            onClick={() => toggleSection(section.$id)}
                            className="p-2 hover:bg-gray-100 rounded"
                        >
                            {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronRight className="w-4 h-4" />
                            )}
                        </button>
                        {activeEditMode ? (
                            <div className="flex items-center justify-center w-8 h-8">
                                <Checkbox
                                    checked={section.active !== false}
                                    onCheckedChange={() => toggleSectionActive(section.$id)}
                                    className="w-5 h-5"
                                />
                            </div>
                        ) : (
                            <div className={`flex items-center justify-center w-8 h-8 rounded-sm text-sm font-medium ${section.type === 'initial'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-green-100 text-green-700'
                                }`}>
                                {sectionIndex + 1}
                            </div>
                        )}
                        <FolderOpen className={`w-5 h-5 ${section.type === 'initial' ? 'text-blue-500' : 'text-green-500'
                            }`} />
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">
                                ({section.subsections?.length || 0} alaosiot)
                            </span>

                        </div>
                    </div>
                    {!activeEditMode && (
                        <div className="flex space-x-1">
                            {/* Section type indicator */}
                            {section.type === 'initial' ? (
                                <div className="flex items-center gap-1 px-2 py-2 bg-blue-50 rounded text-blue-600">
                                    <Shield className="w-4 h-4" />
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 px-2 py-1 bg-green-50 rounded text-green-600">
                                    <Settings className="w-3 h-3" />
                                    <span className="text-xs font-medium">Mukautettu</span>
                                </div>
                            )}
                            {/* Show buttons only for additional sections */}
                            {section.type === 'additional' && (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={() => router.push(`/messuopas/osiot/subsection/create?sectionId=${section.$id}`)}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Alaosio
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => startEditingSection(section)}
                                >
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    onClick={() => deleteSection(section)}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </>
                        )}
                        </div>
                    )}
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0">
                    <div className="ml-6">
                        {!hasSubsections ? (
                            <p className="text-gray-500 text-sm py-4">Ei alaosioita</p>
                        ) : activeEditMode ? (
                            <div className="space-y-2">
                                {section.subsections?.map((subsection, subsectionIndex) => (
                                    <SortableSubsection
                                        key={subsection.$id}
                                        subsection={subsection}
                                        subsectionIndex={subsectionIndex}
                                        sectionIndex={sectionIndex}
                                        section={section}
                                        onDelete={deleteSubsection}
                                        activeEditMode={activeEditMode}
                                        toggleSubsectionActive={toggleSubsectionActive}
                                    />
                                ))}
                            </div>
                        ) : (
                            <DndContext
                                sensors={subsectionSensors}
                                collisionDetection={closestCenter}
                                onDragEnd={(event) => onSubsectionDragEnd(event, section)}
                            >
                                <SortableContext
                                    items={section.subsections?.map(sub => sub.$id) || []}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2">
                                        {section.subsections?.map((subsection, subsectionIndex) => (
                                            <SortableSubsection
                                                key={subsection.$id}
                                                subsection={subsection}
                                                subsectionIndex={subsectionIndex}
                                                sectionIndex={sectionIndex}
                                                section={section}
                                                onDelete={deleteSubsection}
                                                activeEditMode={activeEditMode}
                                                toggleSubsectionActive={toggleSubsectionActive}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
