'use client'

import { CheckCircle, Hotel, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function RegistrationSuccessPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
                <div className="flex justify-center mb-4">
                    <div className="flex size-20 items-center justify-center rounded-full bg-green-100">
                        <CheckCircle className="size-10 text-green-600" />
                    </div>
                </div>

                <h1 className="text-2xl font-bold mb-2">Registration Successful!</h1>
                <p className="text-muted-foreground mb-6">
                    Thank you for registering with OmniHotel Pro. Your information has been saved successfully.
                </p>

                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <p className="text-sm text-muted-foreground">
                        A confirmation has been sent to your email address.
                        We look forward to welcoming you!
                    </p>
                </div>

                <div className="space-y-3">
                    <Button asChild className="w-full">
                        <Link href="/">
                            Return to Home
                            <ArrowRight className="ml-2 size-4" />
                        </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full">
                        <Link href="/register">
                            Register Another Guest
                        </Link>
                    </Button>
                </div>

                <div className="mt-6 pt-4 border-t">
                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Hotel className="size-4" />
                        <span>OmniHotel Pro - Your Comfort, Our Priority</span>
                    </div>
                </div>
            </div>
        </div>
    )
}