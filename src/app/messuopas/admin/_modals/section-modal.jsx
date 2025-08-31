"use client";

import { useForm } from 'react-hook-form';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function SectionModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    editingSection = null,
    isSubmitting = false 
}) {
    const form = useForm({
        defaultValues: {
            title: editingSection?.title || '',
            order: editingSection?.order || 0
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
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {editingSection ? 'Muokkaa osiota' : 'Luo uusi osio'}
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="section-title">Osion nimi</Label>
                        <Input
                            id="section-title"
                            {...form.register('title', { required: 'Nimi on pakollinen' })}
                        />
                        {form.formState.errors.title && (
                            <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="section-order">Järjestys</Label>
                        <Input
                            id="section-order"
                            type="number"
                            {...form.register('order', { valueAsNumber: true })}
                        />
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Peruuta
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? 
                                (editingSection ? 'Päivitetään...' : 'Luodaan...') : 
                                (editingSection ? 'Päivitä' : 'Luo osio')
                            }
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
