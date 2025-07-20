"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Trash, MoreVertical, Plus } from 'lucide-react';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { createDocument, createFile, deleteDocument, deleteFile, getFileDownload, getFileInfo } from "@/lib/appwrite/server";
import { useAppContext } from '@/context/app-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { useModal } from '@/hooks/use-modal';

// Allowed file types for upload
const ALLOWED_FILE_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/quicktime'
];

// Form validation schema
const documentSchema = z.object({
    name: z.string().min(1, 'Nimi on pakollinen').max(100, 'Nimi on liian pitkä'),
    description: z.string().max(500, 'Kuvaus on liian pitkä').optional(),
    file: z.instanceof(File, { message: 'Tiedosto on pakollinen' })
        .refine((file) => file.size <= 50 * 1024 * 1024, 'Tiedosto on liian suuri (max 50MB)')
        .refine((file) => ALLOWED_FILE_TYPES.includes(file.type), 'Tiedostotyyppi ei ole sallittu')
});

export default function DocumentsClientPage({ documents, subsectionId }) {
    const { onOpen } = useModal();
    const [tab, setTab] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const router = useRouter();
    const { user } = useAppContext();

    const form = useForm({
        resolver: zodResolver(documentSchema),
        defaultValues: {
            name: '',
            description: '',
            file: undefined
        }
    });

    const onSubmit = async (values) => {
        setIsUploading(true);

        try {
            // Add subsection prefix to filename for organization
            const modifiedFile = new File([values.file], `${subsectionId}/${values.file.name}`, {
                type: values.file.type,
                lastModified: values.file.lastModified
            });

            // Upload file using the existing createFile function
            const { error, data } = await createFile("files", modifiedFile);

            if (error) {
                throw new Error(error.message || 'Upload failed');
            }

            const document_id = data.$id;

            // Create document record in database with name and description
            await createDocument("main_db", "documents", {
                body: {
                    file_id: document_id,
                    name: values.name,
                    description: values.description || '',
                    initialSubsectionId: subsectionId,
                    event: user.activeEventId
                }
            });

            toast.success(`Dokumentti ${values.name} ladattu onnistuneesti!`);
            form.reset(); // Reset form
            setTab(1); // Switch to files view
            router.refresh(); // Refresh page to show new files

        } catch (error) {
            console.error('Document upload error:', error);
            toast.error(`Dokumentin lataus epäonnistui: ${error.message}`);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownloadFile = async (fileId, fileName) => {
        try {
            // First get file info to get the MIME type
            const { data: fileInfo, error: infoError } = await getFileInfo("files", fileId);

            if (infoError) {
                console.log(infoError);
                toast.error("Tiedoston tietojen haku epäonnistui!");
                return;
            }

            // Then get the file data
            const { data, error } = await getFileDownload("files", fileId);

            if (error) {
                console.log(error);
                toast.error("Tiedoston lataus epäonnistui!");
                return;
            }

            // Create Blob with correct MIME type
            const blob = new Blob([data], { type: fileInfo.mimeType });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = fileName || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Clean up the URL object
            URL.revokeObjectURL(url);

            toast.success("Tiedosto ladattu!");
        } catch (error) {
            console.error('Download error:', error);
            toast.error("Tiedoston lataus epäonnistui!");
        }
    };

    const handleDelete = async (id) => {
        try {
            const { error: documentError } = await deleteDocument("main_db", "documents", id);

            if (documentError) {
                console.log(documentError);
                toast.error("Tiedoston poistaminen epäonnistui!");
                return;
            }

            const { error: fileError } = await deleteFile("files", id);

            if (fileError) {
                console.log(fileError);
                toast.error("Tiedoston poistaminen epäonnistui!");
                return;
            }

            toast.success("Tiedosto poistettu!");
            router.refresh();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error("Tiedoston poistaminen epäonnistui!");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setTab(1)}
                    className={`px-3 py-2 -mb-px font-medium ${tab === 1
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                        }`}
                >
                    Tiedostot
                </button>
                <button
                    onClick={() => setTab(2)}
                    className={`px-3 py-2 -mb-px font-medium ${tab === 2
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                        }`}
                >
                    Lataa tiedosto
                </button>
            </div>

            {tab === 2 && (
                <div className="space-y-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nimi *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isUploading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kuvaus</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Lisätietoja dokumentista (valinnainen)"
                                                className="min-h-[100px]"
                                                {...field}
                                                disabled={isUploading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="file"
                                render={({ field: { onChange, value, ...field } }) => (
                                    <FormItem>
                                        <FormLabel>Tiedosto *</FormLabel>
                                        <FormControl>
                                            <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isUploading
                                                ? 'border-blue-300 bg-blue-50 cursor-not-allowed'
                                                : 'border-gray-200 hover:border-green-500 cursor-pointer'
                                                }`}>
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    id="fileUpload"
                                                    onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) onChange(file);
                                                    }}
                                                    disabled={isUploading}
                                                    {...field}
                                                />
                                                <label htmlFor="fileUpload" className="cursor-pointer">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-center">
                                                            <div className={`p-3 rounded-full ${isUploading ? 'bg-blue-50' : 'bg-green-50'
                                                                }`}>
                                                                <Plus className={`w-6 h-6 ${isUploading ? 'text-blue-600 animate-spin' : 'text-green-600'
                                                                    }`} />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">
                                                                {value ? value.name : 'Valitse tiedosto'}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                PDF, Word, Excel, kuvat tai videot (max 50MB)
                                                            </p>
                                                        </div>
                                                    </div>
                                                </label>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Ladataan...' : 'Lataa liite'}
                                </Button>
                                {/* <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        form.reset();
                                        setTab(1);
                                    }}
                                    disabled={isUploading}
                                >
                                    Peruuta
                                </Button> */}
                            </div>
                        </form>
                    </Form>
                </div>
            )}

            {tab === 1 && (
                <div className="space-y-3">
                    {documents?.length > 0 ?
                        documents.map((file) => (
                            <div key={file.$id} className="bg-white p-4 rounded-lg border border-gray-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="bg-gray-100 p-2 rounded mt-1">
                                            <FileUp className="w-5 h-5 text-gray-600" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-medium text-gray-900 mb-1">{file.name}</h3>
                                            {file.description && (
                                                <p className="text-sm text-gray-600 mb-2 leading-relaxed">
                                                    {file.description.length > 150
                                                        ? `${file.description.substring(0, 150)}...`
                                                        : file.description
                                                    }
                                                </p>
                                            )}
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>{format(file.$createdAt, 'dd.MM.yyyy')}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="gap-2"
                                                    onClick={() => handleDownloadFile(file.file_id, file.name)}>
                                                    <FileUp className="h-4 w-4" /> Lataa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="gap-2 text-red-600"
                                                    onClick={() => onOpen("confirm-modal",
                                                        {
                                                            title: "Poista liite",
                                                            description: `Haluatko varmasti poistaa liitteen "${file.name}"?`,
                                                            callback: () => handleDelete(file.$id)
                                                        }
                                                    )}
                                                >
                                                    <Trash className="h-4 w-4" /> Poista
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="text-center py-10">
                                <p className="text-gray-500">Ei liitteitä vielä.</p>
                                <Button onClick={() => setTab(2)} variant="link" className="text-green-600">
                                    Luo ensimmäinen liite
                                </Button>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}