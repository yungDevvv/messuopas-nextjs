"use client";

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Edit, Trash2, FileText, GripVertical } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SubsectionCard({ 
    subsection, 
    subsectionIndex, 
    sectionIndex, 
    section, 
    startEditingSubsection, 
    deleteSubsection 
}) {
    const router = useRouter();
    
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: subsection.$id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
        >
            <div className="flex items-center space-x-2">
                <div
                    {...attributes}
                    {...listeners}
                    className="p-1.5 hover:bg-gray-200 rounded cursor-grab active:cursor-grabbing"
                >
                    <GripVertical className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-700 rounded text-xs font-medium">
                    {sectionIndex + 1}.{subsectionIndex + 1}
                </div>
                <FileText className="w-4 h-4 text-green-500" />
                <span className="font-medium text-base">{subsection.title}</span>
            </div>
            <div className="flex space-x-2">
                <Button
                    variant="ghost"
                    onClick={() => router.push(`/messuopas/admin/subsection/${subsection.$id}/edit`)}
                >
                    <Edit className="w-3 h-3" />
                </Button>
                <Button
                    variant="ghost"
                    onClick={() => deleteSubsection(section, subsection)}
                    className="text-red-600 hover:text-red-700"
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </div>
        </div>
    );
}
