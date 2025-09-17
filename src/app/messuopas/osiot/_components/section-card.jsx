"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Edit, Trash2, FolderOpen, ChevronDown, ChevronRight, GripVertical } from "lucide-react";
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
const SortableSubsection = ({ subsection, subsectionIndex, sectionIndex, section, onDelete }) => {
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
            className="flex items-center gap-3 p-3 bg-gray-50 rounded-md border border-green-200 hover:border-green-300 transition-colors"
        >
            <div
                {...attributes}
                {...listeners}
                className="p-1 hover:bg-green-100 rounded cursor-grab active:cursor-grabbing"
            >
                <GripVertical className="w-4 h-4 text-gray-400" />
            </div>

            <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded-sm text-sm font-medium">
                {sectionIndex + 1}.{subsectionIndex + 1}
            </div>

            <FolderOpen className="w-5 h-5 text-green-500" />

            <div className="flex-1">
                <h4 className="font-medium text-gray-900">
                    {subsection.title}
                </h4>
            </div>

            <div className="flex items-center gap-1">
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
            </div>
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
    onSubsectionDragEnd
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
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-2 hover:bg-gray-100 rounded cursor-grab active:cursor-grabbing"
                        >
                            <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>
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
                        <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-700 rounded-sm text-sm font-medium">
                            {sectionIndex + 1}
                        </div>
                        <FolderOpen className="w-5 h-5 text-blue-500" />
                        <CardTitle className="text-base">{section.title}</CardTitle>
                        <span className="text-sm text-gray-500">
                            ({section.subsections?.length || 0} alaosiot)
                        </span>
                    </div>
                    <div className="flex space-x-1">
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
                    </div>
                </div>
            </CardHeader>

            {isExpanded && (
                <CardContent className="pt-0">
                    <div className="ml-6">
                        {!hasSubsections ? (
                            <p className="text-gray-500 text-sm py-4">Ei alaosioita</p>
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
