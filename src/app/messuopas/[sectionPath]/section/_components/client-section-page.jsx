"use client"

import { useForm, Controller } from 'react-hook-form';
import { useRouter, usePathname } from 'next/navigation';
import CKeditor from "@/components/rich-text-editor";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { createDocument, updateDocument } from '@/lib/appwrite/server';
import { toast } from 'sonner';
import { slugify } from '@/lib/utils';

export default function ClientSectionPage({ section }) {
    const router = useRouter();

    // React Hook Form setup
    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
        watch,
    } = useForm({
        defaultValues: {
            title: '',
            html: ''
        }
    });

    // Handle form submission - here you get all values
    const onSubmit = async (data) => {
        
        const submissionData = {
            title: data.title,
            html: data.html,
            order: section.additionalSubsections.length,
            path: slugify(data.title)
        };

        const { data: newSubsection, error } = await createDocument('main_db', 'additional_subsections', {
            body: submissionData
        });

        if (error) {
            toast.error('Tapahtui virhe alaosion luomisessa');
            console.error(error);
            return;
        }

        await updateDocument('main_db', 'additional_sections', section.$id, {
            additionalSubsections: [...section.additionalSubsections, newSubsection.$id]
        });
        toast.success('Alaosio on luotu onnistuneesti');
        reset();
        router.push(`/messuopas/${section.$id}/${newSubsection.$id}`);
    };

    return (
        <div className="flex-1 p-6 max-w-7xl w-full space-y-4">
            <Button variant="ghost" onClick={() => router.push(`/messuopas/${section.$id}/${section.initialSubsections[0].$id}`)} className="text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Takaisin
            </Button>
            {/* Show which section this subsection will be created for */}
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md w-fit">
                <p className="text-sm text-blue-800">
                    Luodaan uusi alaosio kategorialle: <strong className="capitalize">{section.title}</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="section-title">Osion otsikko</Label>
                    <Input
                        type="text"
                        id="section-title"
                        {...register('title', {
                            required: 'Otsikko on pakollinen',
                            minLength: {
                                value: 3,
                                message: 'Otsikon tulee olla vähintään 3 merkkiä pitkä'
                            }
                        })}
                        className={errors.title ? 'border-red-500' : ''}
                    />
                    {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label>Sisältö</Label>
                    <div className={errors.html ? 'border border-red-500 rounded-md' : ''}>
                        <Controller
                            name="html"
                            control={control}
                            rules={{
                                required: 'Sisältö on pakollinen',
                                minLength: {
                                    value: 10,
                                    message: 'Sisällön tulee olla vähintään 10 merkkiä pitkä'
                                }
                            }}
                            render={({ field }) => (
                                <CKeditor
                                    content={field.value}
                                    handleChange={(event, editor, data) => field.onChange(data)}
                                    uploadBucketId="sections"
                                />
                            )}
                        />
                    </div>
                    {errors.html && <p className="text-sm text-red-500">{errors.html.message}</p>}
                </div>
                <div className="flex justify-end">
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Tallennetaan...' : 'Tallenna'}
                    </Button>
                </div>
            </form>
        </div>
    );
}