"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { createDocument, updateDocument, deleteDocument, createFile, listDocuments, createUser, deleteUserByEmail } from '@/lib/appwrite/server';
import { Query } from "node-appwrite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building, Eye, EllipsisVertical, Edit2, X, Trash, Settings, Search } from "lucide-react";
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
import UserEventsModal from "./_modals/user-events-modal";
import { useModal } from "@/hooks/use-modal";
import { getRoleLabelFi } from "@/lib/constants/roles";

export default function UsersTab({ onEditUser, onRegisterFetchUsers }) {
    const [userModalOpen, setUserModalOpen] = useState(false);
    const [userEventsModalOpen, setUserEventsModalOpen] = useState(false);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedUserForEvents, setSelectedUserForEvents] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    const { onOpen } = useModal();

    const fetchUsers = async () => {
        setLoading(true);
        try {
            console.log("LOADING 1")
            const { data } = await listDocuments('main_db', 'users');
            setUsers(data || []);
            console.log("END LOADING 2")
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        // line comment: expose fetchUsers to parent so AdminPage can refresh after modal actions
        if (typeof onRegisterFetchUsers === 'function') {
            onRegisterFetchUsers(fetchUsers);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // line comment: filter users based on search query
    const filteredUsers = useMemo(() => {
        if (!searchQuery.trim()) return users;
        
        const query = searchQuery.toLowerCase();
        
        return users.filter(user => 
            user.name?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.organization?.name?.toLowerCase().includes(query) ||
            getRoleLabelFi(user.role)?.toLowerCase().includes(query)
        );
    }, [users, searchQuery]);
    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-lg font-medium">Käyttäjät</h2>
                <Button onClick={() => setUserModalOpen(true)}>Lisää uusi käyttäjä</Button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Hae käyttäjiä nimellä, sähköpostilla, organisaatiolla tai roolilla..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
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
                            {filteredUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        {searchQuery ? 'Ei hakutuloksia' : 'Ei käyttäjiä'}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers.map((user) => (
                                <TableRow key={user.$id}>
                                    <TableCell className="font-medium">{user.name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <span
                                            className={
                                                user.role === 'admin'
                                                    ? 'text-red-600'
                                                    : user.role === 'customer_admin'
                                                        ? 'text-blue-600'
                                                        : user.role === 'premium_user'
                                                            ? 'text-yellow-600'
                                                            : ''
                                            }
                                        >
                                            {getRoleLabelFi(user.role)}
                                        </span>
                                    </TableCell>
                                    <TableCell>{user.organization?.name || '-'}</TableCell>
                                    <TableCell>
                                        {user.role !== 'admin' && (
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
                                                            if (typeof onEditUser === 'function') {
                                                                onEditUser(user);
                                                            } else {
                                                                setSelectedUser(user);
                                                                setUserModalOpen(true);
                                                            }
                                                        }}>
                                                        <Edit2 className="h-4 w-4" /> Muokkaa
                                                    </DropdownMenuItem>
                                                    {user.role !== 'customer_admin' && user.role !== 'user' && (
                                                        <DropdownMenuItem
                                                            className="gap-2"
                                                            onClick={() => {
                                                                setSelectedUserForEvents(user);
                                                                setUserEventsModalOpen(true);
                                                            }}>
                                                            <Settings className="h-4 w-4" /> Messujen hallinta
                                                        </DropdownMenuItem>
                                                    )}
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
                                        )}
                                    </TableCell>
                                </TableRow>
                            )))}
                        </TableBody>
                    </Table>
                </div>
            )}
            {/* line comment: render local UsersModal only when parent does not control it */}
            {/* {!onEditUser && ( */}
            <UsersModal open={userModalOpen} fetchUsers={fetchUsers} onOpenChange={setUserModalOpen} selectedUser={selectedUser} />
            <UserEventsModal
                open={userEventsModalOpen}
                fetchUsers={fetchUsers}
                onOpenChange={setUserEventsModalOpen}
                selectedUser={selectedUserForEvents}
            />
            {/* )} */}
        </div>
    );
}