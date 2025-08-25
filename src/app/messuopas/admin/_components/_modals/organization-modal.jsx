"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { createDocument, updateDocument, deleteDocument, createFile, listDocuments } from '@/lib/appwrite/server';
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function OrganizationModal({ open, onOpenChange }) {
    const { user } = useAppContext();
    const { register, handleSubmit, reset, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const { data: organization, error } = await createDocument('main_db', 'organizations', {
                body: {
                    name: data.name,
                }
            });

            if (error) {
                console.error('Error creating organization:', error);
                toast.error('Virhe organisaation luomisessa');
                return;
            }
            console.log('Organization created:', organization);
            toast.success('Organisaatio luotu onnistuneesti!');
            router.refresh();
            reset();
            onOpenChange(false);
        } catch (error) {
            console.error('Error creating organization:', error);
            toast.error('Virhe organisaation luomisessa');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Lisää uusi organisaatio</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Organisaation nimi *</Label>
                        <Input
                            id="name"
                            {...register('name', { required: true })}
                        />
                        {errors.name && <span className="text-red-500 text-sm">Organisaation nimi on pakollinen</span>}
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline" type="button">Peruuta</Button>
                        </DialogClose>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Tallennetaan...' : 'Tallenna'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}