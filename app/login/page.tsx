'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'  // ← Added Next.js Image component
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'  // ← Hotel icon removed (no longer needed)
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
    const router = useRouter()
    const { toast } = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        // Simple demo login - in production, implement actual authentication
        setTimeout(() => {
            toast({
                title: 'Demo Mode',
                description: 'Redirecting to dashboard...',
            })
            router.push('/dashboard')
            setIsLoading(false)
        }, 1000)
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#cac1b9]/10 to-gray-100 flex items-center justify-center p-4">
            <Card className="max-w-md w-full border-0 shadow-xl bg-white">
                <CardHeader className="text-center">
                    {/* Logo Image - Replace '/logo.png' with your actual filename */}
                    <div className="flex justify-center mb-0">
                        <div className="relative w-27 h-27">
                            <Image
                                src="logo.png"  // ← Place your logo in public/logo.png
                                alt="OmniHotel Pro Logo"
                                fill
                                className="object-contain"
                                priority  // ← Loads logo immediately for better UX
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl text-black">Staff Login</CardTitle>
                    <CardDescription className="text-gray-600">Access the hotel management dashboard</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="admin@omnihotel.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full bg-[#cac1b9] text-black hover:bg-[#cac1b9]/90 font-medium"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                    Logging in...
                                </>
                            ) : (
                                'Login'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-600">
                        <Link href="/" className="hover:text-[#cac1b9] transition-colors">
                            ← Back to Home
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}