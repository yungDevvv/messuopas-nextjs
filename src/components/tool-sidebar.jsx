"use client";

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BookText, NotebookPen, FileUp, ListTodo, X, LayoutList } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';

// This is now a 'dumb' presentational component.
// It receives all data and callbacks as props.
export default function ToolSidebar({ onLinkClick, showCloseButton = false, onClose }) {
    const { sectionPath, subsectionPath } = useParams();
    const pathname = usePathname();
    
    // It shouldn't render if we're not on a page that needs it.
    if (!sectionPath || !subsectionPath) {
        return null;
    }

    const baseUrl = `/messuopas/${sectionPath}/${subsectionPath}`;

    const tools = [
        { id: 'opas', href: baseUrl, icon: BookText, label: 'Opas' },
        { id: 'notes', href: `${baseUrl}/notes`, icon: NotebookPen, label: 'Muistiinpanot' },
        { id: 'documents', href: `${baseUrl}/documents`, icon: FileUp, label: 'Liitteet' },
        { id: 'todo', href: `${baseUrl}/todo`, icon: ListTodo, label: 'Tehtävälista' }
    ];

    const activeTool = tools.slice().reverse().find(tool => pathname === tool.href || (tool.id === 'opas' && pathname.startsWith(baseUrl)));

    return (
        <>
            <div className="flex flex-col gap-4 p-4 w-[225px] h-full bg-white max-xl:hidden xl:flex border-r">
                <div className="flex justify-between items-center">
                    <h2 className="text-lg font-semibold px-3 text-gray-800">Työkalut</h2>
                    {showCloseButton && (
                        <button
                            onClick={onClose}
                            className="p-1"
                            aria-label="Close tools menu"
                        >
                            <X className="h-6 w-6 text-gray-600" />
                        </button>
                    )}
                </div>
                <nav className="flex flex-col gap-1">
                    {tools.map((tool) => (
                        <Link
                            key={tool.id}
                            href={tool.href}
                            onClick={onLinkClick}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900",
                                activeTool?.id === tool.id
                                    ? "bg-green-100 text-green-700 font-semibold"
                                    : "font-medium"
                            )}
                        >
                            <tool.icon className="w-5 h-5" />
                            <span>{tool.label}</span>
                        </Link>
                    ))}
                </nav>
            </div>
            <DropdownMenu>
                <div className="max-xl:block xl:hidden fixed right-4 top-2 z-50">
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <LayoutList />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <nav className="flex flex-col gap-1">
                            {tools.map((tool) => (
                                <Link
                                    key={tool.id}
                                    href={tool.href}
                                    onClick={onLinkClick}
                                    className={cn(
                                        "flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900",
                                        activeTool?.id === tool.id
                                            ? "bg-green-100 text-green-700 font-semibold"
                                            : "font-medium"
                                    )}
                                >
                                    <tool.icon className="w-5 h-5" />
                                    <span>{tool.label}</span>
                                </Link>
                            ))}
                        </nav>
                    </DropdownMenuContent>
                </div>
            </DropdownMenu>
        </>

    );
}