"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { createDocument, updateDocument, deleteDocument, createFile, listDocuments, createUser, deleteUserByEmail } from '@/lib/appwrite/server';
import { Query } from "node-appwrite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building, Eye, EllipsisVertical, Edit2, X, Trash } from "lucide-react";
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { debounce } from "@/lib/utils/debounce";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from "@/components/ui/textarea";
import UsersModal from "./_modals/users-modal";
import { useModal } from "@/hooks/use-modal";


export default function UsersTab() {
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const { onOpen } = useModal();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data } = await listDocuments('main_db', 'users');
            setUsers(data || []);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        
        fetchUsers();
    }, []);

    const handleDeleteUser = async (userId, email) => {
        try {
            // delete global Appwrite user by email if exists
            if (email) {
                await deleteUserByEmail(email);
            }
            await deleteDocument('main_db', 'users', userId);
            fetchUsers();
            toast.success('Käyttäjä poistettu');
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error('Käyttäjän poistaminen epäonnistui');
        }
    };
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">

                <h2 className="text-lg font-medium">Käyttäjät</h2>
                <Button onClick={() => setUserModalOpen(true)}>Lisää uusi käyttäjä</Button>
            </div>

            {loading ? (
                <div className="text-center py-8">Ladataan...</div>
            ) : (
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nimi</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rooli</TableHead>
                                <TableHead>Organisaatio</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.$id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'premium_user' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{user.organization?.name || '-'}</TableCell>
                                    {/* <TableCell>
                                                    <Button 
                                                        size="sm" 
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedUserForOrg(user);
                                                            setAddToOrgModalOpen(true);
                                                        }}
                                                    >
                                                        Lisää organisaatioon
                                                    </Button>
                                                </TableCell> */}
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <EllipsisVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="gap-2"
                                                    onClick={() => {
                                                        setSelectedUser(user);
                                                        setUserModalOpen(true);
                                                    }}>
                                                    <Edit2 className="h-4 w-4" /> Muokkaa
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="gap-2 text-red-600"
                                                    onClick={() => onOpen("confirm-modal",
                                                        {
                                                            title: "Poista käyttäjä",
                                                            description: `Haluatko varmasti poistaa käyttäjän "${user.name}"?`,
                                                            callback: () => handleDeleteUser(user.$id, user.email)
                                                        }
                                                    )}
                                                >
                                                    <Trash className="h-4 w-4" /> Poista
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}


            <UsersModal open={userModalOpen} fetchUsers={fetchUsers} onOpenChange={setUserModalOpen} selectedUser={selectedUser} />
        </div>
    );
}