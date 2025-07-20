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

const formSchema = z.object({
    name: z.string().min(2, {
        message: "Tämä kenttä on pakollinen",
    }),
})

export default function EventModal() {

    const { user } = useAppContext();
console.log(user, "USER12312312312")
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
        },
    })

    const [isLoading, setIsLoading] = useState(false)

    const router = useRouter();
    const { type, isOpen, onClose, data } = useModal();
    const isModalOpen = isOpen && type === "event-modal";

    async function onSubmit(values) {
        try {
            setIsLoading(true);

            if (data.event) {
                await updateDocument("main_db", "events", data.event.$id, {
                    ...values
                })
            } else {
                await createDocument("main_db", "events", {
                    body: {
                        ...values,
                        user: user.$id
                    }
                })
            }

            form.reset();
            toast.success("Messut ovat luotu onnistuneesti!");
        } catch (error) {
            console.log("Error creating / updating event:", error)
            toast.error("Messujen luonti epäonnistui!");
        } finally {
            router.refresh();
            setIsLoading(false);
            onClose();
        }

    }

    useEffect(() => {

        if (data?.event) {
            form.reset({
                name: data.event.name || ""
            })
        }
    }, [data])
    return (
        <Dialog open={isModalOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{data?.event ? "Muokkaa messujen tietoja" : "Luo uudet messut"}</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 mt-3">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nimi</FormLabel>
                                    <FormControl>
                                        <Input className="!mt-1" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex justify-end">
                            <Button type="submit" disabled={isLoading}>
                                {data?.event ? "Tallenna" : "Luo"}
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