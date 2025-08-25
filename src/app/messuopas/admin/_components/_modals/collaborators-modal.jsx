"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { createDocument, updateDocument, deleteDocument, createFile, listDocuments } from '@/lib/appwrite/server';
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import SVGComponent from "@/components/svg-image";

export default function CollaboratorModal({ open, onOpenChange, selectedCollaborator, onSave }) {
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [initialSectionValue, setInitialSectionValue] = useState("");
    const isEditing = !!selectedCollaborator;
    const { sections } = useAppContext();

    // Handle logo file selection
    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setLogoFile(file);
            // Create preview URL
            const previewUrl = URL.createObjectURL(file);
            setLogoPreview(previewUrl);
        }
    };

    // Pre-fill form when editing
    useEffect(() => {
        if (open) {
            if (selectedCollaborator) {
                setValue('name', selectedCollaborator.name);
                setValue('web', selectedCollaborator.web);
                setValue('description', selectedCollaborator.description);
                setValue('contact_email', selectedCollaborator.contact_email);
                setValue('contact_name', selectedCollaborator.contact_name);
                const initSectionId = selectedCollaborator?.initialSection?.$id || selectedCollaborator?.initialSection || "";
                setValue('initialSection', initSectionId);
                setInitialSectionValue(initSectionId);
                // Set logo preview if exists
                if (selectedCollaborator.logo) {
                    setLogoPreview(selectedCollaborator.logo);
                }
            } else {
                reset();
                setLogoFile(null);
                setLogoPreview(null);
                setInitialSectionValue("");
            }
        }
    }, [open, selectedCollaborator, setValue, reset]);

    const onSubmit = async (data) => {
        setLoading(true);
      
        try {
            let logoUrl = selectedCollaborator?.logo || null;

            // Upload logo file if selected
            if (logoFile) {
                const modifiedFile = new File([logoFile], `collaborators/${logoFile.name}`, {
                    type: logoFile.type,
                    lastModified: logoFile.lastModified
                });

                const { error, data: fileData } = await createFile("collaborators", modifiedFile);

                if (error) {
                    throw new Error(error.message || 'Logo upload failed');
                }

                logoUrl = fileData.$id;
            }

            if (isEditing) {
                await updateDocument('main_db', 'collobarators', selectedCollaborator.$id, {
                    name: data.name,
                    web: data.web,
                    description: data.description,
                    contact_email: data.contact_email,
                    contact_name: data.contact_name,
                    initialSection: data.initialSection,
                    logo: logoUrl,
                });
            } else {
                await createDocument('main_db', 'collobarators', {
                    body: {
                        name: data.name,
                        web: data.web,
                        description: data.description,
                        contact_email: data.contact_email,
                        contact_name: data.contact_name,
                        initialSection: data.initialSection,
                        logo: logoUrl,
                    }
                });
            }

            toast.success(isEditing ? 'Yhteistyökumppani päivitetty!' : 'Yhteistyökumppani luotu!');
            onSave();
            onOpenChange(false);
        } catch (error) {
            console.error('Error saving collaborator:', error);
            toast.error('Virhe tallentamisessa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>
                        {isEditing ? 'Muokkaa yhteistyökumppania' : 'Lisää uusi yhteistyökumppani'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nimi</Label>
                        <Input
                            id="name"
                            {...register('name', { required: true })}
                        />
                        {errors.name && <span className="text-red-500 text-sm">Nimi on pakollinen</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="web">Verkkosivun osoite</Label>
                        <Input
                            id="web"
                            type="text"
                            {...register('web')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Kuvaus</Label>
                        <Textarea
                            id="description"
                            {...register('description')}
                            className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Lyhyt kuvaus yhteistyökumppanista ja heidän palveluistaan..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact_name">Yhteyshenkilö</Label>
                        <Input
                            id="contact_name"
                            {...register('contact_name')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contact_email">Sähköposti</Label>
                        <Input
                            id="contact_email"
                            type="email"
                            {...register('contact_email')}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="initialSection">Osio</Label>
                        <Select
                            value={initialSectionValue}
                            onValueChange={(val) => {
                                setInitialSectionValue(val);
                                setValue('initialSection', val);
                            }}
                        >
                            <SelectTrigger className="w-full !h-10">
                                <SelectValue placeholder="Valitse osio" />
                            </SelectTrigger>
                            <SelectContent>
                                {sections?.map((section) => (
                                    <SelectItem key={section.$id} value={section.$id}>
                                        {section.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <input
                            type="hidden"
                            {...register('initialSection', { required: true })}
                            value={initialSectionValue}
                        />
                        {errors.initialSection && (
                            <span className="text-red-500 text-sm">Osio on pakollinen</span>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="logo">Logo</Label>
                        <div className="">
                            {logoPreview && (
                                <div className="flex items-start gap-2 my-2">
                                    <SVGComponent url={logoFile ? logoPreview : `/api/file/collaborators/${logoPreview}`} className="w-40 h-40 object-contain border rounded" />
                                  
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setLogoFile(null);
                                            setLogoPreview(null);
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <input
                                id="logo"
                                type="file"
                                accept="image/*"
                                onChange={handleLogoChange}
                                className="w-full text-sm border border-gray-200 cursor-pointer rounded-md py-2 px-2"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                            Peruuta
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Tallennetaan...' : 'Tallenna'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}