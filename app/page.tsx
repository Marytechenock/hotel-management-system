'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Hotel, Calendar, Users, Coffee, Wifi, Car, Shield, ArrowRight } from 'lucide-react'

export default function HomePage() {
  return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                  <Hotel className="size-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-foreground">OmniHotel Pro</h1>
                  <p className="text-sm text-muted-foreground">Luxury Redefined</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button asChild variant="outline">
                  <Link href="/login">Staff Login</Link>
                </Button>
                <Button asChild>
                  <Link href="/register">Book Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Welcome to <span className="text-primary">OmniHotel Pro</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              Experience luxury, comfort, and exceptional service. Book your stay with us today.
            </p>
            <Button asChild size="lg" className="mr-4">
              <Link href="/register">
                Book Your Stay
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Staff Access</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Us</h2>
              <p className="text-muted-foreground">Experience the best hospitality services</p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <Wifi className="size-6 text-primary" />
                  </div>
                  <CardTitle>Free WiFi</CardTitle>
                  <CardDescription>High-speed internet access throughout the property</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <Coffee className="size-6 text-primary" />
                  </div>
                  <CardTitle>Complimentary Breakfast</CardTitle>
                  <CardDescription>Start your day with a delicious breakfast</CardDescription>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader>
                  <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <Car className="size-6 text-primary" />
                  </div>
                  <CardTitle>Free Parking</CardTitle>
                  <CardDescription>Secure parking for all our guests</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Easy Registration Process</h2>
              <p className="text-muted-foreground">Get started in just a few simple steps</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold mx-auto mb-4">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-2">Fill Your Details</h3>
                <p className="text-muted-foreground">Provide your personal and contact information</p>
              </div>
              <div className="text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold mx-auto mb-4">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-2">Select Your Stay</h3>
                <p className="text-muted-foreground">Choose your room, dates, and preferences</p>
              </div>
              <div className="text-center">
                <div className="flex size-16 items-center justify-center rounded-full bg-primary text-white text-2xl font-bold mx-auto mb-4">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-2">Confirm Booking</h3>
                <p className="text-muted-foreground">Review and confirm your registration</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary text-primary-foreground">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready for an Amazing Stay?</h2>
            <p className="text-lg mb-8 opacity-90">Book your room now and enjoy our premium services</p>
            <Button asChild size="lg" variant="secondary">
              <Link href="/register">
                Register Now
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-gray-300 py-12">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Hotel className="size-5" />
                  <span className="font-bold text-white">OmniHotel Pro</span>
                </div>
                <p className="text-sm">Luxury accommodations with exceptional service.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2 text-sm">
                  <li><Link href="/register" className="hover:text-white">Book Now</Link></li>
                  <li><Link href="/login" className="hover:text-white">Staff Login</Link></li>
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
                  <li>Facebook</li>
                  <li>Instagram</li>
                  <li>Twitter</li>
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