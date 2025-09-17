"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";
import { createDocument, listDocuments, updateDocument } from "@/lib/appwrite/server";
import { slugify } from "@/lib/utils";
import CKeditor from "@/components/rich-text-editor";

export default function CreateSubsectionPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const sectionId = searchParams.get('sectionId');

    const [title, setTitle] = useState("");
    const [html, setHtml] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editorApi, setEditorApi] = useState(null); // line comments in English
    const [section, setSection] = useState(null);
    const [loading, setLoading] = useState(true);

    // Load section info
    useEffect(() => {
        const loadSection = async () => {
            if (!sectionId) {
                toast.error("Osion ID puuttuu");
                router.push("/messuopas/admin?tab=osiot");
                return;
            }

            try {
                const { data: sections } = await listDocuments('main_db', 'additional_sections', []);
                const foundSection = sections?.find(s => s.$id === sectionId);

                if (!foundSection) {
                    toast.error("Osiota ei löytynyt");
                    // router.push("/messuopas/admin?tab=osiot");
                    return;
                }

                setSection(foundSection);
            } catch (error) {
                console.error('Error loading section:', error);
                toast.error("Virhe osion lataamisessa");
                // router.push("/messuopas/admin?tab=osiot");
            } finally {
                setLoading(false);
            }
        };

        loadSection();
    }, [sectionId, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim() || !html.trim()) {
            toast.error("Täytä kaikki kentät");
            return;
        }

        try {
            setIsSubmitting(true);

            // Resolve pending uploads from editor to replace blob: with SSR URLs
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

            // Create subsection
            const { data: newSubsection, error } = await createDocument('main_db', 'additional_subsections', {
                body: {
                    title: title.trim(),
                    html: finalHtml,
                    order: section.additionalSubsections?.length || 0,
                    path: slugify(title)
                }
            });

            if (error) {
                toast.error('Virhe alaosion luomisessa');
                console.error(error);
                return;
            }

            // Update section to include new subsection
            const updatedSubsections = [...(section.additionalSubsections || []), newSubsection.$id];
            await updateDocument('main_db', 'additional_sections', section.$id, {
                additionalSubsections: updatedSubsections
            });

            toast.success('Alaosio luotu onnistuneesti');
            router.push("/messuopas/osiot");
            router.refresh();
        } catch (error) {
            console.error('Error creating subsection:', error);
            toast.error('Virhe alaosion luomisessa');
        } finally {
            setIsSubmitting(false);
        }
    };


    if (loading) {
        return <div className="flex justify-center py-8">Ladataan...</div>;
    }

    return (
        <div className="max-w-7xl p-6 space-y-6">
            <Button
                variant="ghost"
                onClick={() => router.push("/messuopas/osiot")}
                disabled={isSubmitting}
            >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Takaisin
            </Button>
            {/* Header */}
            <div className="flex items-center justify-between">

                <div className="flex items-center space-x-4">

                    <div>
                        <h1 className="text-2xl font-bold">Luo alaosio</h1>
                        <p className="text-gray-600">Osio: {section?.title}</p>
                    </div>
                </div>
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
                        {isSubmitting ? "Luodaan..." : "Luo"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
