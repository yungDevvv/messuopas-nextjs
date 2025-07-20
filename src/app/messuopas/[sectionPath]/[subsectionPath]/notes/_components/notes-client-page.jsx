"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { MoreVertical, Edit2, Trash } from "lucide-react";
import { createDocument, deleteDocument, updateDocument } from "@/lib/appwrite/server";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useModal } from "@/hooks/use-modal";
import { useAppContext } from "@/context/app-context";

// 1. Define the form schema with Zod
const noteFormSchema = z.object({
    title: z.string().min(1, { message: "Tämä kenttä on pakollinen" }),
    text: z.string().min(10, { message: "Muistiinpano on oltava vähintään 10 merkkiä pitkä." }),
});


export default function NotesClientPage({ notes, subsectionId }) {
    const [tab, setTab] = useState(1);
    const router = useRouter();
    const { onOpen } = useModal();
    const { user } = useAppContext();
    const [editNote, setEditNote] = useState(null);

    console.log(user, "use1231231r")
    // 2. Initialize the form with useForm
    const form = useForm({
        resolver: zodResolver(noteFormSchema),
        defaultValues: {
            title: "",
            text: "",
        },
    });

    const { formState: { isSubmitting } } = form;

    // 3. Define the submit handler
    async function onSubmit(values) {
        // `values` are validated and type-safe
        console.log('Saving note for subsection:', subsectionId, values);

        if (!user.activeEventId) {
            toast.error("Valitse messut ensin!");
            return;
        }
        if (editNote) {
            const { error, data } = await updateDocument("main_db", "notes", editNote.$id, {
                ...values,
            });

            if (error) {
                console.log("Failed to update note:", error);
                toast.error("Muistiinpanon päivitys epäonnistui!");
                return;
            }
            toast.success("Muistiinpano on päivitetty onnistuneesti!");
            setTab(1); // Switch back to notes view
            form.reset(); // Reset form fields
            router.refresh();
            setEditNote(null);
            return;
        }
        // TODO: Add subsectionId and eventId to the document body
        const { error, data } = await createDocument("main_db", "notes", {
            body: {
                ...values,
                initialSubsectionId: subsectionId,
                event: user.activeEventId
            }
        });

        console.log(data, "data123ASD")
        if (error) {
            console.log("Failed to create note:", error);
            toast.error("Muistiinpanon luonti epäonnistui!");
            return;
        }
        form.reset(); // Reset form fields
        setTab(1); // Switch back to notes view
        toast.success("Muistiinpano on luotu onnistuneesti!");
        router.refresh();

    }

    const handleDelete = async (noteId) => {
        const { error, data } = await deleteDocument("main_db", "notes", noteId);

        if (error) {
            console.log("Failed to delete note:", error);
            toast.error("Muistiinpanon poistaminen epäonnistui!");
            return;
        }
        toast.success("Muistiinpano on poistettu onnistuneesti!");
        router.refresh();
    };
    
    const handleEditNote = (note) => {
        setEditNote(note);
        form.reset({
            title: note.title,
            text: note.text,
        });
        setTab(2);
    };

    return (
        <div className="space-y-6">
            <div className="flex">
                <button
                    onClick={() => setTab(1)}
                    className={`px-3 py-2 -mb-px font-medium cursor-pointer ${tab === 1
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                        }`}
                >
                    Muistiinpanot
                </button>
                <button
                    onClick={() => setTab(2)}
                    className={`px-3 py-2 -mb-px font-medium cursor-pointer ${tab === 2
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                        }`}
                >
                    Luo uusi muistiinpano
                </button>
            </div>

            <div className="space-y-4">
                {tab === 2 && (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-white">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Otsikko</FormLabel>
                                        <FormControl>
                                            <Input {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="text"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Teksti</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                className="min-h-[150px] resize-none"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end">
                                <Button type="submit" disabled={isSubmitting} className="bg-green-500 hover:bg-green-600 text-white">
                                    {editNote 
                                        ? (isSubmitting ? "Tallennetaan..." : "Tallenna")
                                        : (isSubmitting ? "Luodaan..." : "Luo muistiinpano")
                                    }
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
                {tab === 1 && (
                    notes && notes.length > 0 ? (
                        notes.map((note) => (
                            <div key={note.$id} className="bg-white p-6 rounded-lg border border-gray-200">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-medium text-lg text-gray-900">{note.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-gray-500">{note.date}</span>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreVertical className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem className="gap-2" onClick={() => handleEditNote(note)}>
                                                            <Edit2 className="h-4 w-4" /> Muokkaa
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="gap-2 text-red-600"
                                                            onClick={() => onOpen("confirm-modal", { title: "Poista muistiinpano", description: `Haluatko varmasti poistaa muistiinpanon "${note.title}"?`, callback: () => handleDelete(note.$id) })}
                                                        >
                                                            <Trash className="h-4 w-4" /> Poista
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        <p className="text-gray-600 whitespace-pre-wrap">{note.text}</p>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-10">
                            <p className="text-gray-500">Ei muistiinpanoja vielä.</p>
                            <Button onClick={() => setTab(2)} variant="link" className="text-green-600">
                                Luo ensimmäinen muistiinpano
                            </Button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
