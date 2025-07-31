"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"
import { useModal } from "@/hooks/use-modal"
import { createDocument, updateDocument } from "@/lib/appwrite/server"
import { useRouter } from "next/navigation"
import { useAppContext } from "@/context/app-context"
import { toast } from "sonner"
import { slugify } from "@/lib/utils"

const formSchema = z.object({
    title: z.string().min(2, {
        message: "Tämä kenttä on pakollinen",
    }),
    isInitial: z.boolean().default(false),
})

export default function AdditionalSectionModal() {

    const { user } = useAppContext();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            isInitial: false,
        },
    })

    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter();
    const { type, isOpen, onClose, data } = useModal();
    const isModalOpen = isOpen && type === "additional-section-modal";

    async function onSubmit(values) {

        setIsLoading(true);

        const collectionId = values.isInitial ? "initial_sections" : "additional_sections";

        const { isInitial, ...bodyValues } = values;

        const body = {
            ...bodyValues
        }
        
        if (!values.isInitial) {
            if (user.organization) {
                body.organization = user.organization.$id;
            } else {
                body.user = user.$id;
            }
        }

        if (data.section) {
            // const { error } = await updateDocument("main_db", "additional_sections", data.section.$id, {
            //     ...values
            // })

            if (error) {
                toast.error("Osion muokkaus epäonnistui!");
                console.error("Error updating section:", error)
            }

            toast.success("Osio on päivitetty onnistuneesti!");
            router.refresh();
            form.reset();
            onClose();
        } else {
            const { error } = await createDocument("main_db", collectionId, { document_id: slugify(values.title), body: { ...body } })

            if (error) {
                toast.error("Osion luonti epäonnistui!");
                console.error("Error creating section:", error)
            }

            toast.success("Osio on luotu onnistuneesti!");
            router.refresh();
            form.reset();
            onClose();
        }

        setIsLoading(false);
    }

    useEffect(() => {

        if (data?.section) {
            form.reset({
                title: data.section.title || "",
                isInitial: data.section.isInitial || false
            })
        }
    }, [data])
    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{data?.section ? "Muokkaa osion tietoja" : "Luo uusi osio"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-3">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Otsikko</FormLabel>
                                    <FormControl>
                                        <Input className="!mt-1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isInitial"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center gap-3">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormLabel className="text-base font-normal text-muted-foreground">
                                        Tee osio alkuperäiseksi
                                    </FormLabel>
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isLoading}>
                                {data?.section ? "Tallenna" : "Luo"}
                                {isLoading ? (
                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                ) : null}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}