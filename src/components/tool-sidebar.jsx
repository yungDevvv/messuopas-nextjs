"use client";

import { usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { BookText, NotebookPen, FileUp, ListTodo, X, LayoutList, ShieldUser, Handshake } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { useAppContext } from '@/context/app-context';
// This is now a 'dumb' presentational component.
// It receives all data and callbacks as props.
export default function ToolSidebar({ onLinkClick, showCloseButton = false, onClose }) {
    const { sectionPath, subsectionPath } = useParams();
    const pathname = usePathname();
    const { user, sections } = useAppContext();
    
    // It shouldn't render if we're not on a page that needs it.
    if (!sectionPath || !subsectionPath) {
        if (!pathname.includes('/admin')) {
            return null;
        }
    }

    // Handle different base URLs based on current page
    const isNotSectionPage = pathname.includes('/admin');
    const baseUrl = isNotSectionPage ? '/messuopas' : `/messuopas/${sectionPath}/${subsectionPath}`;
    const firstSection = sections.find(section => section.order === 0);
    const tools = [
        { id: 'opas', href: isNotSectionPage ? `/messuopas/${firstSection.$id}/${firstSection.initialSubsections[0].$id}` : baseUrl, icon: BookText, label: 'Opas' },
        { id: 'notes', href: isNotSectionPage ? `/messuopas/${firstSection.$id}/${firstSection.initialSubsections[0].$id}/notes` : `${baseUrl}/notes`, icon: NotebookPen, label: 'Muistiinpanot' },
        { id: 'documents', href: isNotSectionPage ? `/messuopas/${firstSection.$id}/${firstSection.initialSubsections[0].$id}/documents` : `${baseUrl}/documents`, icon: FileUp, label: 'Liitteet' },
        { id: 'todo', href: isNotSectionPage ? `/messuopas/${firstSection.$id}/${firstSection.initialSubsections[0].$id}/todo` : `${baseUrl}/todo`, icon: ListTodo, label: 'Tehtävälista' },
        { id: 'collaborators', href: isNotSectionPage ? `/messuopas/${firstSection.$id}/${firstSection.initialSubsections[0].$id}/collaborators` : `${baseUrl}/collaborators`, icon: Handshake, label: 'Yhteistyökumppanit' },
    ];

    const activeTool = tools.slice().reverse().find(tool => pathname === tool.href || (tool.id === 'opas' && pathname.startsWith(baseUrl)));
    const isAdminActive = pathname === "/messuopas/admin";

    return (
        <>
            <div className="flex flex-col gap-4 p-4 w-[235px] h-screen bg-white max-xl:hidden xl:flex border-r">
                <div className="flex justify-between items-center">
                    <div>
                        <img src="/logo.png" alt="" />
                    </div>
                    {/* <h2 className="text-lg font-semibold px-3 text-gray-800">Työkalut</h2> */}
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
                                activeTool?.id === tool.id && !isAdminActive
                                    ? "bg-green-100 text-green-700 font-semibold"
                                    : "font-medium"
                            )}
                        >
                            <tool.icon className="w-5 h-5" />
                            <span>{tool.label}</span>
                        </Link>
                    ))}
                    {/* <div className='border-t pt-2 pb-0 mt-1'>
                        <Link
                            href="/messuopas/collaborators"
                            onClick={onLinkClick}
                            className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900",
                                pathname === "/messuopas/collaborators"
                                    ? "bg-green-100 text-green-700 font-semibold"
                                    : "font-medium"
                            )}
                        >
                            <Handshake className="w-5 h-5 shrink-0" />
                            <span>Yhteistyökumppanit</span>
                        </Link>
                    </div> */}
                    {user.role === "admin" && (
                        <div className='border-t pt-2 pb-1 my-1'>
                            <Link
                                href="/messuopas/admin"
                                onClick={onLinkClick}
                                className={cn(
                                    "flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900",
                                    isAdminActive
                                        ? "bg-green-100 text-green-700 font-semibold"
                                        : "font-medium"
                                )}
                            >
                                <ShieldUser className="w-5 h-5" />
                                <span>Hallintapaneeli</span>
                            </Link>
                        </div>
                    )}
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
                                        activeTool?.id === tool.id && !isAdminActive
                                            ? "bg-green-100 text-green-700 font-semibold"
                                            : "font-medium"
                                    )}
                                >
                                    <tool.icon className="w-5 h-5" />
                                    <span>{tool.label}</span>
                                </Link>
                            ))}
                            {user.role === "admin" && (
                                <div className='border-t pt-2 pb-1 my-1'>
                                    <Link
                                        href="/messuopas/admin"
                                        onClick={onLinkClick}
                                        className={cn(
                                            "flex items-center gap-3 rounded-md px-3 py-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900",
                                            isAdminActive
                                                ? "bg-green-100 text-green-700 font-semibold"
                                                : "font-medium"
                                        )}
                                    >
                                        <ShieldUser className="w-5 h-5" />
                                        <span>Hallintapaneeli</span>
                                    </Link>
                                </div>
                            )}
                        </nav>
                    </DropdownMenuContent>
                </div>
            </DropdownMenu>
        </>

    );
}