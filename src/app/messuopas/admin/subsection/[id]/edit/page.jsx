"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { listDocuments, updateDocument, deleteDocument } from "@/lib/appwrite/server";
import CKeditor from "@/components/rich-text-editor";

export default function EditSubsectionPage() {
    const router = useRouter();
    const params = useParams();
    const subsectionId = params.id;
    
    const [title, setTitle] = useState("");
    const [html, setHtml] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editorApi, setEditorApi] = useState(null); // line comments in English
    const [subsection, setSubsection] = useState(null);
    const [section, setSection] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load subsection info
    useEffect(() => {
        const loadSubsection = async () => {
            if (!subsectionId) {
                toast.error("Alaosion ID puuttuu");
                router.push("/messuopas/admin?tab=osiot");
                return;
            }

            try {
                // Load subsections
                const { data: subsections } = await listDocuments('main_db', 'initial_subsections', []);
                const foundSubsection = subsections?.find(s => s.$id === subsectionId);
                
                if (!foundSubsection) {
                    toast.error("Alaosiota ei löytynyt");
                    router.push("/messuopas/admin?tab=osiot");
                    return;
                }
                
                setSubsection(foundSubsection);
                setTitle(foundSubsection.title || "");
                setHtml(foundSubsection.html || "");

                // Find parent section
                const { data: sections } = await listDocuments('main_db', 'initial_sections', []);
                const parentSection = sections?.find(s => 
                    s.initialSubsections?.some(sub => sub.$id === subsectionId)
                );
                
                if (parentSection) {
                    setSection(parentSection);
                }
                
            } catch (error) {
                console.error('Error loading subsection:', error);
                toast.error("Virhe alaosion lataamisessa");
                router.push("/messuopas/admin?tab=osiot");
            } finally {
                setLoading(false);
            }
        };

        loadSubsection();
    }, [subsectionId, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !html.trim()) {
            toast.error("Täytä kaikki kentät");
            return;
        }

        try {
            setIsSubmitting(true);
            
            // Resolve pending uploads from editor first
            let finalHtml = html;
            try {
                if (editorApi && typeof editorApi.resolvePendingUploads === 'function') {
                    finalHtml = await editorApi.resolvePendingUploads();
                }
            } catch (err) {
                console.error('Error resolving pending uploads:', err);
                toast.error('Virhe kuvien latauksessa');
                setIsSubmitting(false);
                return;
            }

            const { error } = await updateDocument('main_db', 'initial_subsections', subsectionId, {
                title: title.trim(),
                html: finalHtml,
                order: subsection.order
            });

            if (error) {
                toast.error('Virhe alaosion päivittämisessä');
                console.error(error);
                return;
            }

            toast.success('Alaosio päivitetty onnistuneesti');
            router.push("/messuopas/admin?tab=osiot");
        } catch (error) {
            console.error('Error updating subsection:', error);
            toast.error('Virhe alaosion päivittämisessä');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Haluatko varmasti poistaa alaosion "${subsection?.title}"?`)) {
            return;
        }

        try {
            setIsSubmitting(true);
            
            // Delete subsection
            const { error } = await deleteDocument('main_db', 'initial_subsections', subsectionId);

            if (error) {
                toast.error('Virhe alaosion poistamisessa');
                console.error(error);
                return;
            }

            // Update parent section to remove subsection reference
            if (section) {
                const updatedSubsections = section.initialSubsections.filter(sub => sub.$id !== subsectionId);
                await updateDocument('main_db', 'initial_sections', section.$id, {
                    initialSubsections: updatedSubsections.map(sub => sub.$id)
                });
            }

            toast.success('Alaosio poistettu onnistuneesti');
            router.push("/messuopas/admin?tab=osiot");
        } catch (error) {
            console.error('Error deleting subsection:', error);
            toast.error('Virhe alaosion poistamisessa');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditorChange = (event, editor, data) => {
        setHtml(data);
    };

    if (loading) {
        return <div className="flex justify-center py-8">Ladataan...</div>;
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <Button 
                        variant="ghost" 
                        onClick={() => router.push("/messuopas/admin?tab=osiot")}
                        disabled={isSubmitting}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Takaisin hallintapaneeliin
                    </Button>
            <div className="flex items-center justify-between">
                
                <div className="flex items-center space-x-4">
                   
                    <div>
                        <h1 className="text-2xl font-bold">Muokkaa alaosiota</h1>
                        <p className="text-gray-600">
                            Osio: {section?.title || "Tuntematon"}
                        </p>
                    </div>
                </div>
                <Button 
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Poista
                </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Perustiedot</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">
                                Alaosion nimi
                            </label>
                            <Input
                                placeholder="Syötä alaosion nimi..."
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                disabled={isSubmitting}
                                required
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Sisältö</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <CKeditor
                            content={html}
                            handleChange={(event, editor, data) => {
                                setHtml(data);
                            }}
                            onAPI={(api) => setEditorApi(api)}
                            uploadBucketId="sections"
                        />
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex justify-end space-x-4">
                    <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => router.push("/messuopas/admin?tab=osiot")}
                        disabled={isSubmitting}
                    >
                        Peruuta
                    </Button>
                    <Button 
                        type="submit"
                        disabled={!title.trim() || !html.trim() || isSubmitting}
                    >
                        
                        {isSubmitting ? "Tallennetaan..." : "Tallenna muutokset"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
