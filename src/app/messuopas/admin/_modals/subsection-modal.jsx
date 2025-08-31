"use client";

import { useForm, Controller } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CKeditor from "@/components/rich-text-editor";

export default function SubsectionModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    editingSubsection = null,
    selectedSection = null,
    isSubmitting = false 
}) {
    const form = useForm({
        defaultValues: {
            title: editingSubsection?.title || '',
            html: editingSubsection?.html || '',
            order: editingSubsection?.order || selectedSection?.initialSubsections?.length || 0
        }
    });

    const handleSubmit = (data) => {
        onSubmit(data);
        form.reset();
    };

    const handleClose = () => {
        form.reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {editingSubsection ? 
                            'Muokkaa alaosiot' : 
                            `Luo uusi alaosio - ${selectedSection?.title}`
                        }
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subsection-title">Alaosion nimi</Label>
                        <Input
                            id="subsection-title"
                            {...form.register('title', { required: 'Nimi on pakollinen' })}
                        />
                        {form.formState.errors.title && (
                            <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subsection-order">Järjestys</Label>
                        <Input
                            id="subsection-order"
                            type="number"
                            {...form.register('order', { valueAsNumber: true })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Sisältö</Label>
                        <Controller
                            name="html"
                            control={form.control}
                            rules={{ required: 'Sisältö on pakollinen' }}
                            render={({ field }) => (
                                <CKeditor
                                    content={field.value}
                                    handleChange={(event, editor, data) => field.onChange(data)}
                                    uploadBucketId="sections"
                                />
                            )}
                        />
                        {form.formState.errors.html && (
                            <p className="text-sm text-red-500">{form.formState.errors.html.message}</p>
                        )}
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Peruuta
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 
                                (editingSubsection ? 'Päivitetään...' : 'Luodaan...') : 
                                (editingSubsection ? 'Päivitä' : 'Luo')
                            }
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
