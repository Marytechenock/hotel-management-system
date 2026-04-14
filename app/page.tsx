'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Users, Coffee, Wifi, Car, Shield, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
      <div className="min-h-screen bg-gradient-to-br from-[#cac1b9] to-gray-200">
        {/* Header - Sticky + Black background */}
        <header className="sticky top-0 z-50 bg-black shadow-md">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Logo in Header */}
                <div className="relative w-15 h-15">
                  <Image
                      src="/logo.png"
                      alt="OmniHotel Pro Logo"
                      fill
                      className="object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">OmniHotel Pro</h1>
                  <p className="text-sm text-gray-400">Luxury Redefined</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                    asChild
                    variant="outline"
                    className="border-[#cac1b9] text-[#cac1b9] hover:bg-[#cac1b9] hover:text-black transition-colors"
                >
                  <Link href="/login">Staff Login</Link>
                </Button>
                <Button
                    asChild
                    className="bg-[#cac1b9] text-black hover:bg-[#cac1b9]/90 transition-colors"
                >
                  <Link href="/register">Book Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section - Added pt-4 to offset sticky header */}
        <section className="relative py-20 px-4 pt-8">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 text-black">
              Welcome to <span className="text-black">OmniHotel Pro</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-700 max-w-2xl mx-auto mb-8">
              Experience luxury, comfort, and exceptional service. Book your stay with us today.
            </p>
            <Button
                asChild
                size="lg"
                className="mr-4 bg-[#cac1b9] text-black hover:bg-[#cac1b9]/90 transition-colors"
            >
              <Link href="/register">
                Book Your Stay
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button
                asChild
                size="lg"
                variant="outline"
                className="border-[#cac1b9] text-[#cac1b9] hover:bg-[#cac1b9] hover:text-black transition-colors"
            >
              <Link href="/login">Staff Access</Link>
            </Button>
          </div>
        </section>

        {/* Features Section - White background kept */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-4">Why Choose Us</h2>
              <p className="text-gray-600">Experience the best hospitality services</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex size-12 items-center justify-center rounded-lg bg-[#cac1b9]/20 mb-4">
                    <Wifi className="size-6 text-black" />
                  </div>
                  <CardTitle className="text-black">Free WiFi</CardTitle>
                  <CardDescription className="text-gray-600">High-speed internet access throughout the property</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex size-12 items-center justify-center rounded-lg bg-[#cac1b9]/20 mb-4">
                    <Coffee className="size-6 text-black" />
                  </div>
                  <CardTitle className="text-black">Complimentary Breakfast</CardTitle>
                  <CardDescription className="text-gray-600">Start your day with a delicious breakfast</CardDescription>
                </CardHeader>
              </Card>
              <Card className="border-gray-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex size-12 items-center justify-center rounded-lg bg-[#cac1b9]/20 mb-4">
                    <Car className="size-6 text-black" />
                  </div>
                  <CardTitle className="text-black">Free Parking</CardTitle>
                  <CardDescription className="text-gray-600">Secure parking for all our guests</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-gray-100">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black mb-4">Easy Registration Process</h2>
              <p className="text-gray-600">Get started in just a few simple steps</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-[#cac1b9] text-black text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Fill Your Details</h3>
                <p className="text-gray-600">Provide your personal and contact information</p>
              </div>
              <div className="text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-[#cac1b9] text-black text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Select Your Stay</h3>
                <p className="text-gray-600">Choose your room, dates, and preferences</p>
              </div>
              <div className="text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-[#cac1b9] text-black text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold text-black mb-2">Confirm Booking</h3>
                <p className="text-gray-600">Review and confirm your registration</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#cac1b9]">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-black mb-4">Ready for an Amazing Stay?</h2>
            <p className="text-lg mb-8 text-gray-800">Book your room now and enjoy our premium services</p>
            <Button
                asChild
                size="lg"
                variant="outline"
                className="border-black text-black hover:bg-black hover:text-white transition-colors"
            >
              <Link href="/register">
                Register Now
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-black text-gray-400 py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                {/* Logo in Footer - smaller size */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative w-6 h-6">
                    <Image
                        src="/logo.png"
                        alt="OmniHotel Pro Logo"
                        fill
                        className="object-contain"
                    />
                  </div>
                  <span className="font-bold text-white">OmniHotel Pro</span>
                </div>
                <p className="text-sm">Luxury accommodations with exceptional service.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/register" className="hover:text-[#cac1b9] transition-colors">Book Now</Link></li>
                  <li><Link href="/login" className="hover:text-[#cac1b9] transition-colors">Staff Login</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Contact</h4>
                <ul className="space-y-2 text-sm">
                  <li>Phone: +1 (555) 123-4567</li>
                  <li>Email: info@omnihotel.com</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Follow Us</h4>
                <ul className="space-y-2 text-sm">
                  <li className="hover:text-[#cac1b9] cursor-pointer transition-colors">Facebook</li>
                  <li className="hover:text-[#cac1b9] cursor-pointer transition-colors">Instagram</li>
                  <li className="hover:text-[#cac1b9] cursor-pointer transition-colors">Twitter</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
              <p>&copy; 2024 OmniHotel Pro. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
  )
}