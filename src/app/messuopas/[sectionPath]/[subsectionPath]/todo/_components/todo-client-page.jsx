"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Calendar, Trash2 } from 'lucide-react';
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useAppContext } from '@/context/app-context';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { useModal } from '@/hooks/use-modal';
import { createDocument, deleteDocument, updateDocument } from '@/lib/appwrite/server';
import { cn } from '@/lib/utils';

// Form validation schema for TODO
const todoSchema = z.object({
    name: z.string().min(1, "Tämä kenttä on pakollinen").max(100, "Nimi on liian pitkä"),
    text: z.string().min(1, "Tämä kenttä on pakollinen").max(500, "Kuvaus on liian pitkä")
});


export default function TodoClientPage({ todos, additionalSectionTodos, subsectionId, sectionPath }) {
    const { onOpen } = useModal();
    const [tab, setTab] = useState(1);
    const [isUploading, setIsUploading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    const router = useRouter();
    const { user, currentSection, currentSubSection } = useAppContext();
    const isAdditionalSection = currentSubSection?.$collectionId === "additional_subsections";
   
    // Use appropriate todos based on section type
    const allTodos = isAdditionalSection ? (additionalSectionTodos || []) : (todos || []);
    
    // Filter todos based on status
    const filteredTodos = statusFilter === 'all'
        ? allTodos
        : allTodos.filter(todo => todo.status === statusFilter);

    const form = useForm({
        resolver: zodResolver(todoSchema),
        defaultValues: {
            name: '',
            text: ''
        }
    });

    const onSubmit = async (values) => {
        // isAdditionalSection
        try {
            setIsUploading(true);
            const body = {
                ...values,
                event: user.activeEventId
            }
            if (isAdditionalSection) {
                body.additionalSubsection = currentSubSection.$id
            } else {
                body.initialSubsection = currentSubSection.$id
            }
          
            const { error, data } = await createDocument("main_db", "todos", {body});

            if (error) {
                console.error('TODO creation error:', error);
                toast.error('Tehtävän luonti epäonnistui!');
                return;
            }

            toast.success('Tehtävä on luotu onnistuneesti!');
            form.reset();
            setTab(1);
            router.refresh();
        } catch (error) {
            console.error('TODO creation error:', error);
            toast.error('Tehtävän luonti epäonnistui!');
        } finally {
            setIsUploading(false);
        }
    };

    const handleStatusChange = async (todoId, newStatus) => {
        console.log('Status change:', todoId, newStatus);
        try {
            const { error, data } = await updateDocument("main_db", "todos", todoId, {
                status: newStatus
            });

            if (error) {
                console.error('TODO update error:', error);
                toast.error('Tehtävän päivitys epäonnistui!');
                return;
            }

            toast.success('Tehtävä on päivitetty onnistuneesti!');
            router.refresh();
        } catch (error) {
            console.error('TODO update error:', error);
            toast.error('Tehtävän päivitys epäonnistui!');
        }
    };

    const handleEdit = (todoId) => {
        console.log('Edit todo:', todoId);
        // Логика будет добавлена позже
    };

    const handleDelete = async (id) => {
        try {
            const { error: documentError } = await deleteDocument("main_db", "todos", id);

            if (documentError) {
                console.log(documentError);
                toast.error("Tehtävän poistaminen epäonnistui!");
                return;
            }

            toast.success("Tehtävä poistettu!");
            router.refresh();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error("Tehtävän poistaminen epäonnistui!");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex border-b border-gray-200">
                <button
                    onClick={() => setTab(1)}
                    className={`px-3 py-2 -mb-px font-medium ${tab === 1
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                        }`}
                >
                    Tehtävät
                </button>
                <button
                    onClick={() => setTab(2)}
                    className={`px-3 py-2 -mb-px font-medium ${tab === 2
                        ? 'text-green-600 border-b-2 border-green-600'
                        : 'text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent'
                        }`}
                >
                    Luo uusi tehtävä
                </button>
            </div>

            {tab === 2 && (
                <div className="space-y-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nimi *</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                disabled={isUploading}
                                            />
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
                                        <FormLabel>Kuvaus *</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Lisätietoja tehtävästä"
                                                className="min-h-[100px]"
                                                {...field}
                                                disabled={isUploading}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="flex justify-end">
                                <Button
                                    type="submit"
                                    disabled={isUploading}
                                >
                                    {isUploading ? 'Luodaan...' : 'Luo tehtävä'}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </div>
            )}

            {tab === 1 && (
                <div className="space-y-4">
                    {/* Filter buttons */}
                    <div className="flex gap-2 mb-6">
                        <Button
                            variant={statusFilter === 'all' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('all')}
                        >
                            Kaikki ({allTodos.length})
                        </Button>
                        <Button
                            variant={statusFilter === 'pending' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('pending')}
                        >
                            Odottaa ({allTodos.filter(t => t.status === 'pending').length})
                        </Button>
                        <Button
                            variant={statusFilter === 'in-progress' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('in-progress')}
                        >
                            Käynnissä ({allTodos.filter(t => t.status === 'in-progress').length})
                        </Button>
                        <Button
                            variant={statusFilter === 'completed' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setStatusFilter('completed')}
                        >
                            Valmis ({allTodos.filter(t => t.status === 'completed').length})
                        </Button>
                    </div>

                    {/* Simple todo list */}
                    <div className="space-y-3">
                        {filteredTodos?.length > 0 ?
                            filteredTodos.map((todo) => (
                                <Card key={todo.$id} className={`border-l-4 gap-0 ${todo.status === 'completed' ? 'border-l-green-500' :
                                    todo.status === 'in-progress' ? 'border-l-blue-500' :
                                        'border-l-gray-300'
                                    }`}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <CardTitle className={`text-base ${todo.status === 'completed'
                                                        ? 'line-through text-gray-500'
                                                        : 'text-gray-900'
                                                        }`}>
                                                        {todo.name}
                                                    </CardTitle>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Select
                                                    value={todo.status}
                                                    onValueChange={(value) => handleStatusChange(todo.$id, value)}
                                                >
                                                    <SelectTrigger className={cn("w-32 h-8 text-sm", todo.status === "pending" ? "border-gray-600 text-gray-600" : todo.status === "in-progress" ? "border-blue-600 text-blue-600" : "border-green-600 text-green-600")}>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="pending">Odottaa</SelectItem>
                                                        <SelectItem value="in-progress">Käynnissä</SelectItem>
                                                        <SelectItem value="completed">Valmis</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                {/* <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(todo.$id)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button> */}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => onOpen("confirm-modal", {
                                                        title: "Poista tehtävä",
                                                        description: `Haluatko varmasti poistaa tehtävän "${todo.name}"?`,
                                                        callback: () => handleDelete(todo.$id)
                                                    })}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardHeader>

                                    <CardContent>
                                        {todo.text && (
                                            <CardDescription className="mb-3">
                                                {todo.text}
                                            </CardDescription>
                                        )}

                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                Luotu: {format(new Date(todo.$createdAt), 'dd.MM.yyyy HH:mm')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Päivitetty: {format(new Date(todo.$updatedAt), 'dd.MM.yyyy HH:mm')}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            )) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">
                                        {statusFilter === 'all' ? 'Ei tehtäviä vielä.' : `Ei tehtäviä tilassa "${statusFilter}".`}
                                    </p>
                                    <Button onClick={() => setTab(2)} variant="link" className="text-green-600">
                                        Luo uusi tehtävä
                                    </Button>
                                </div>
                            )}
                    </div>
                </div>
            )}
        </div>
    );
}