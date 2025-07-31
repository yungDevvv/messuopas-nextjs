"use client";

import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function Breadcrumbs() {
    const pathname = usePathname();
    const router = useRouter();

    const lastSegment = pathname.split('/').pop();
    const showBackButton = ['notes', 'documents', 'todo', 'history', 'section'].includes(lastSegment);

    if (!showBackButton) {
        return null;
    }
    const handleBackClick = () => {
        const parentPath = pathname.substring(0, pathname.lastIndexOf('/'));
        router.push(parentPath);
    };

    return (
        <div className="mb-4">
            <Button variant="ghost" onClick={handleBackClick} className="text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Takaisin
            </Button>
        </div>
    );
}
