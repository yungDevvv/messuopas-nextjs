"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function RegisterPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');
    
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error("Virheellinen kutsulinkki");
            router.push('/login');
        }
    }, [token, router]);

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
            const response = await fetch('/api/invite/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token,
                    password: formData.password,
                    name: formData.name
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Rekisteröinti epäonnistui');
            }

            toast.success("Rekisteröinti onnistui! Voit nyt kirjautua sisään.");
            router.push('/login');
        } catch (error) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Rekisteröinti epäonnistui');
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

    if (!token) {
        return null;
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div className="text-center">
                    <h2 className="mt-6 text-3xl font-bold text-gray-900">
                        Viimeistele rekisteröinti
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Sinut on kutsuttu liittymään organisaatioon
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="w-5 h-5" />
                            Tilin luominen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="name">Koko nimi</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => handleInputChange('name', e.target.value)}
                                    className="mt-1"
                                />
                            </div>

                            <div>
                                <Label htmlFor="password">Salasana</Label>
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
                                <Label htmlFor="confirmPassword">Vahvista salasana</Label>
                                <div className="relative mt-1">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                        placeholder="Toista salasana"
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
                                disabled={loading || !formData.name || !formData.password || !formData.confirmPassword}
                            >
                                {loading ? "Rekisteröidään..." : "Viimeistele rekisteröinti"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
