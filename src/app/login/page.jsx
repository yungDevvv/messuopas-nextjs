"use client"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useForm } from 'react-hook-form';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card";
import { redirect, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";

import { getLoggedInUser, signInWithEmail } from "@/lib/appwrite/server";

const Content = () => {
    const router = useRouter();

    const searchParams = useSearchParams();
    const ref = searchParams.get('ref');
    const redirectTo = searchParams.get('redirect_to');

    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const handleLogin = async (formData) => {
        setErrorMessage("");
        setIsLoading(true);

        const { error, success } = await signInWithEmail(formData.email, formData.password);

        if (error) {
            console.log(error)
            setErrorMessage("Virheelliset tunnukset. Tarkista sähköposti ja salasana.")
        }

        setIsLoading(false);

        if (success) {
            // If redirectTo is available, navigate there, otherwise fallback to ref logic
            if (redirectTo) {
                router.push(redirectTo);
            } else {
                router.push("/messuopas");
            }
        }
    };


    useEffect(() => {
        const checkSession = async () => {
            try {
                const user = await getLoggedInUser();

                if (user) {
                    // If redirectTo is available, navigate there, otherwise fallback to ref logic
                    if (redirectTo) {
                        router.push(redirectTo);
                    } else {
                        router.push("/messuopas");
                    }
                }
            } catch (error) {

            }
        };
        checkSession();
    }, [router, ref]);
    return (
        <div className="flex h-screen w-full items-center justify-center px-4 bg-indigo-50">
            <Card className="mx-auto w-full max-w-md shadow-xl">
                <CardHeader>
                    <CardTitle className="text-2xl font-semibold text-center">Kirjaudu sisään</CardTitle>
                    <CardDescription className="hidden"></CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(handleLogin)} className="grid">
                        {errorMessage && <p className="text-red-500 text-sm mb-2">{errorMessage}</p>}
                        <div className="grid gap-2 mb-5">
                            <Label htmlFor="email">Sähköposti</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                {...register("email", { required: "Sähköposti on pakollinen" })}
                            />
                            {errors.email && <p className="text-red-500 text-sm my-2">{errors.email.message}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Salasana</Label>
                            <Input
                                id="password"
                                type="password"
                                {...register("password", { required: "Salasana on pakollinen" })}
                            />
                            {errors.password && <p className="text-red-500 text-sm -mt-1">{errors.password.message}</p>}
                        </div>
                        {/* <Link href="/forgot-password" className="text-green-600 font-semibold mt-2 text-sm hover:text-green-800">Unohditko salasanasi?</Link> */}
                        <Button
                            type="submit"
                            className="w-full mt-6"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Kirjaudu"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function Page() {
    return (
        <Suspense>
            <Content />
        </Suspense>
    )
}