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
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";
import SVGComponent from "@/components/svg-image";

export default function CollaboratorModal({ open, onOpenChange, selectedCollaborator, onSave }) {
    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [logoFile, setLogoFile] = useState(null);
    const [logoPreview, setLogoPreview] = useState(null);
    const [selectedInitialSection, setSelectedInitialSection] = useState(null);
    const [selectedSubSections, setSelectedSubSections] = useState([]);
    const isEditing = !!selectedCollaborator;
    const { sections } = useAppContext();

    // Get subsections for selected initial section
    const availableSubSections = useMemo(() => {
        return selectedInitialSection?.initialSubsections || [];
    }, [selectedInitialSection]);

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
                
                // Find and set initial section object
                const initSectionId = selectedCollaborator?.initialSection?.$id || selectedCollaborator?.initialSection || "";
                const initSectionObj = sections?.find(section => section.$id === initSectionId);
                setSelectedInitialSection(initSectionObj || null);
                setValue('initialSection', initSectionId);
                
                // Handle subSections array
                let subSectionsArray = [];
                if (selectedCollaborator?.subSection) {
                    if (Array.isArray(selectedCollaborator.subSection)) {
                        subSectionsArray = selectedCollaborator.subSection;
                    } else {
                        // Convert single subSection to array for backwards compatibility
                        subSectionsArray = [selectedCollaborator.subSection];
                    }
                }
                
                setSelectedSubSections(subSectionsArray);
                setValue('subSection', subSectionsArray.map(sub => sub.$id || sub));
                
                // Set logo preview if exists
                if (selectedCollaborator.logo) {
                    setLogoPreview(selectedCollaborator.logo);
                }
            } else {
                reset();
                setLogoFile(null);
                setLogoPreview(null);
                setSelectedInitialSection(null);
                setSelectedSubSections([]);
            }
        }
    }, [open, selectedCollaborator, setValue, reset, sections]);
    // Reset form when modal closes
    useEffect(() => {
        if (!open) {
            reset();
            setLogoFile(null);
            setLogoPreview(null);
            setSelectedInitialSection(null);
            setSelectedSubSections([]);
        }
    }, [open, reset]);

    // Reset subSection when initialSection changes
    useEffect(() => {
        if (selectedInitialSection && !selectedCollaborator) {
            setSelectedSubSections([]);
            setValue('subSection', []);
        }
    }, [selectedInitialSection, setValue, selectedCollaborator]);

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

            // Prepare subSection IDs array
            const subSectionIds = selectedSubSections.map(sub => sub.$id || sub);

            // Prepare contact_email - send null if empty string
            const contactEmail = data.contact_email?.trim() === '' ? null : data.contact_email;

            if (isEditing) {
                await updateDocument('main_db', 'collobarators', selectedCollaborator.$id, {
                    name: data.name,
                    web: data.web,
                    description: data.description,
                    contact_email: contactEmail,
                    contact_name: data.contact_name,
                    initialSection: data.initialSection,
                    subSection: subSectionIds,
                    logo: logoUrl,
                });
            } else {
                await createDocument('main_db', 'collobarators', {
                    body: {
                        name: data.name,
                        web: data.web,
                        description: data.description,
                        contact_email: contactEmail,
                        contact_name: data.contact_name,
                        initialSection: data.initialSection,
                        subSection: subSectionIds,
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
                            value={selectedInitialSection?.$id || ""}
                            onValueChange={(val) => {
                                const sectionObj = sections?.find(section => section.$id === val);
                                setSelectedInitialSection(sectionObj || null);
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
                            value={selectedInitialSection?.$id || ""}
                        />
                        {errors.initialSection && (
                            <span className="text-red-500 text-sm">Osio on pakollinen</span>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subSection">Ali-osiot</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={`w-full justify-between h-10 ${!selectedInitialSection || availableSubSections.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={!selectedInitialSection || availableSubSections.length === 0}
                                >
                                    <span className="truncate font-normal">
                                        {selectedSubSections.length === 0
                                            ? (!selectedInitialSection 
                                                ? "Valitse ensin osio" 
                                                : availableSubSections.length === 0 
                                                    ? "Ei ali-osioita saatavilla" 
                                                    : "Valitse ali-osiot")
                                            : selectedSubSections.length === 1
                                                ? selectedSubSections[0].title
                                                : `${selectedSubSections.length} ali-osiota valittu`
                                        }
                                    </span>
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-1 max-w-md" align="start">
                                <div className="max-h-80 overflow-auto">
                                    {availableSubSections.length === 0 ? (
                                        <div className="p-4 text-sm text-gray-500 text-center">
                                            Ei ali-osioita saatavilla
                                        </div>
                                    ) : (
                                        <div className="p-2 space-y-1">
                                            {availableSubSections.map((subSection) => {
                                                const isSelected = selectedSubSections.some(selected => selected.$id === subSection.$id);
                                                return (
                                                    <div
                                                        key={subSection.$id}
                                                        className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-md cursor-pointer"
                                                        onClick={() => {
                                                            let newSelected;
                                                            if (isSelected) {
                                                                // Remove from selection
                                                                newSelected = selectedSubSections.filter(selected => selected.$id !== subSection.$id);
                                                            } else {
                                                                // Add to selection
                                                                newSelected = [...selectedSubSections, subSection];
                                                            }
                                                            setSelectedSubSections(newSelected);
                                                            setValue('subSection', newSelected.map(sub => sub.$id));
                                                        }}
                                                    >
                                                        
                                                        <span className="text-sm flex-1">{subSection.title}</span>
                                                        <Checkbox
                                                            checked={isSelected}
                                                            onChange={() => {}} // Handled by parent div onClick
                                                            className="ml-14"
                                                        />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </PopoverContent>
                        </Popover>
                        <input
                            type="hidden"
                            {...register('subSection', { required: availableSubSections.length > 0 })}
                            value={JSON.stringify(selectedSubSections.map(sub => sub.$id))}
                        />
                        {errors.subSection && availableSubSections.length > 0 && (
                            <span className="text-red-500 text-sm">Vähintään yksi ali-osio on pakollinen</span>
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
                            <Input
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