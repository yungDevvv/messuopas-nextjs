"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardAction, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, Mail, Building2 } from "lucide-react";
import { toast } from "sonner";
import { createUserRecoveryPassword } from "@/lib/appwrite/server";
import { useModal } from "@/hooks/use-modal";
// Inline comment: Client receives fully derived props from server
export default function ClientAccountPage({ user, orgName }) {

    const [loading, setLoading] = useState(false);

    const { onOpen } = useModal();


    const handlePasswordReset = async () => {
        setLoading(true);

        try {
            const { error } = await createUserRecoveryPassword(`${window.location.origin}/update-password`);

            if (error) {
                console.error(error);
                toast.error("Virhe linkin lähetyksessä");
                return;
            }

            toast.success("Palautuslinkki lähetetty sähköpostitse " + user.email);
        } catch (e) {
            console.error(e);
            toast.error("Virhe linkin lähetyksessä");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-7xl p-6 space-y-6">
            {/* Page heading */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Tili</h1>
                <p className="text-base text-muted-foreground">Hallinnoi profiilia, turvallisuutta ja tilauksia.</p>
            </div>

            {/* Profile summary */}


            {/* Main grid */}
            <div className="grid gap-5 grid-cols-2">
                {/* Profile */}
                <Card className="relative overflow-hidden border rounded-xl shadow-none">
                    <CardHeader className="flex items-start py-4 px-5 sm:px-6">
                        <div className="flex items-start gap-4">
                            <Avatar className="size-16 ring-2 ring-zinc-200 dark:ring-zinc-700 shadow-sm">
                                {/* Inline comment: show initials if no avatar image */}
                                <AvatarFallback className="text-sm font-medium">
                                    {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col gap-2">
                                <CardTitle className="text-lg sm:text-xl font-semibold leading-tight tracking-tight">{user?.name}</CardTitle>
                                <CardDescription className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm">
                                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700">
                                        <Mail className="w-4 h-4" /> {user?.email || "-"}
                                    </span>
                                </CardDescription>

                                {orgName && user.role !== "admin" && (
                                    <div className="flex items-center gap-2">
                                        {/* <Badge variant="outline" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700"> */}
                                        <Building2 className="w-4 h-4" />
                                        {orgName}
                                        {/* </Badge> */}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </Card>


                {/* Security */}
                <Card className="bg-white border shadow-none border-zinc-200 dark:border-zinc-800">
                    <CardHeader className="gap-4">
                        <CardTitle className="flex items-center gap-2">Salasanan palautus</CardTitle>
                        <CardDescription>Lähetämme palautuslinkki sähköpostitse salasanan palautusta varten.</CardDescription>

                    </CardHeader>
                    <CardFooter className="flex flex-col items-start gap-3">
                        <CardAction>
                            <Button type="button" disabled={loading} onClick={() => onOpen("confirm-modal", {
                                type: "mail",
                                title: "Salasanan palautus",
                                description: "Lähetämme palautuslinkki sähköpostitse salasanan palautusta varten.",
                                callback: handlePasswordReset
                            })}>Lähetä palautuslinkki</Button>
                        </CardAction>
                        <div className="text-xs text-muted-foreground">Jos et saa viestiä, tarkista roskapostikansio.</div>

                    </CardFooter>

                </Card>
            </div>
            {/* Subscription management */}
            {/* {!hideSubscription && ( */}
            {user.role !== "admin" && (
                <Card className="bg-white border shadow-none border-zinc-200 dark:border-zinc-800 lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-yellow-500" /> Tilauksen hallinta</CardTitle>
                        {/* <CardDescription>Nykyinen paketti: <span className="font-medium text-foreground">{planLabel}</span></CardDescription> */}
                        {/* <CardAction>
                                {user?.role !== "premium_user" ? (
                                    <Button disabled={loading} onClick={handleUpgrade} className="bg-green-600 hover:bg-green-700">Päivitä Premiumiin</Button>
                                ) : (
                                    <Button variant="secondary" disabled={loading} onClick={handleDowngrade}>Alenna Perus-pakettiin</Button>
                                )}
                            </CardAction> */}
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">Tilauksen hallinta saatavilla pian.</div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}