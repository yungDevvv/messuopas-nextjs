"use client";

import { useState, useEffect, useMemo } from "react";
import { useAppContext } from "@/context/app-context";
import { createDocument, updateDocument, deleteDocument, createFile, listDocuments } from '@/lib/appwrite/server';
import { Query } from "node-appwrite";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Building, Eye, EllipsisVertical, Edit2, X } from "lucide-react";
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
import OrganizationModal from "./_modals/organization-modal";


export default function OrganizationsTab() {
    const [organizations, setOrganizations] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [organizationModalOpen, setOrganizationModalOpen] = useState(false);
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
    const fetchOrganizations = async () => {
        setLoading(true);
        try {
            const { data } = await listDocuments('main_db', 'organizations');
            setOrganizations(data || []);

        } catch (error) {
            console.error('Error loading organizations:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
        fetchOrganizations();
        console.log("FETCHING ORGANIZATIONS TAB!!!!!!!!!!")
        console.log("FETCHING ORGANIZATIONS TAB!!!!!!!!!!")
        console.log("FETCHING ORGANIZATIONS TAB!!!!!!!!!!")
        console.log("FETCHING ORGANIZATIONS TAB!!!!!!!!!!")
    }, []);
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 justify-between">

                <h2 className="text-lg font-medium">Organisaatiot</h2>
                <Button onClick={() => setOrganizationModalOpen(true)}>Luo uusi organisaatio</Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {organizations.map((org) => (
                    <Card key={org.$id} className="hover:shadow-md transition-shadow">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>{org.name}</span>
                                {/* <Badge variant="outline">{org.memberCount} jäsentä</Badge> */}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {users.filter(user => user.organization?.$id === org?.$id)?.map((user) => (
                                <div key={user.$id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                                    <div>
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-gray-500">{user.email}</div>
                                    </div>
                                    <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'premium_user' ? 'default' : 'secondary'} size="sm">
                                        {user.role}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
            <OrganizationModal
                open={organizationModalOpen}
                onOpenChange={setOrganizationModalOpen}
            />
        </div>
    );
}