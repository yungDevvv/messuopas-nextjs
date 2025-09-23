"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { updateRecoveryPassword } from "@/lib/appwrite/server";

// Loading fallback component
function UpdatePasswordPageFallback() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-sm text-gray-600">Ladataan...</p>
                </div>
            </div>
        </div>
    );
}

// Main update password form component that uses useSearchParams
function UpdatePasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const secret = searchParams.get('secret');
    const userId = searchParams.get('userId');
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!secret || !userId) {
            toast.error("Virheellinen salasanan palautuslinkki");
            router.push('/login');
        }
    }, [secret, userId, router]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            toast.error("Salasanat eivät täsmää");
            return;
        }

        if (formData.password.length < 8) {
            toast.error("Salasanan tulee olla vähintään 8 merkkiä pitkä");
            return;
        }

        setLoading(true);

        try {
            const { error, success } = await updateRecoveryPassword(secret, userId, formData.password);

            if (error) {
                throw new Error(error.message || 'Salasanan päivitys epäonnistui');
            }

            if (success) {
                toast.success("Salasana päivitetty onnistuneesti! Voit nyt kirjautua sisään uudella salasanalla.");
                router.push('/login');
            }
        } catch (error) {
            console.error('Password update error:', error);
            toast.error(error.message || 'Salasanan päivitys epäonnistui');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    if (!secret || !userId) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Aseta uusi salasana
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Syötä uusi salasana tilillesi
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="w-5 h-5" />
                            Salasanan päivitys
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="password">Uusi salasana</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        placeholder="Vähintään 8 merkkiä"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="confirmPassword">Vahvista uusi salasana</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        placeholder="Toista uusi salasana"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4 text-gray-400" />
                                        ) : (
                                            <Eye className="h-4 w-4 text-gray-400" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading || !formData.password || !formData.confirmPassword}
                            >
                                {loading ? "Päivitetään..." : "Päivitä salasana"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Main page component wrapped in Suspense
export default function UpdatePasswordPage() {
    return (
        <Suspense fallback={<UpdatePasswordPageFallback />}>
            <UpdatePasswordForm />
        </Suspense>
    );
}