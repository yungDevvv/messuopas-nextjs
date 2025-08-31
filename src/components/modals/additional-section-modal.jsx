"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
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
})

export default function AdditionalSectionModal() {

    const { user } = useAppContext();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
        },
    })

    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter();
    const { type, isOpen, onClose, data } = useModal();
    const isModalOpen = isOpen && type === "additional-section-modal";

    async function onSubmit(values) {

        setIsLoading(true);

        const collectionId = "additional_sections";

        const body = {
            ...values,
            path: slugify(values.title)
        }

        if (user.organization) {
            body.organization = user.organization.$id;
        } else {
            body.user = user.$id;
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
            const { error } = await createDocument("main_db", collectionId, { body: { ...body } })

            if (error) {
                toast.error("Osion luonti epäonnistui!");
                console.error("Error creating section:", error)
            }

            toast.success("Osio on luotu onnistuneesti!");
            router.refresh();
            window.location.reload();
            form.reset();
            onClose();
        }

        setIsLoading(false);
    }

    useEffect(() => {

        if (data?.section) {
            form.reset({
                title: data.section.title || "",
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