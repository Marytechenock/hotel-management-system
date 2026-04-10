'use client'

import { useState, useEffect } from 'react'
import { Hotel, Calendar, Users, CheckCircle, ArrowRight, Loader2 } from 'lucide-react'
import axios from 'axios'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Room {
    id: string
    number: string
    type: string
    baseRate: number
}

export default function GuestRegistrationPage() {
    const { toast } = useToast()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [rooms, setRooms] = useState<Room[]>([])
    const [isLoadingRooms, setIsLoadingRooms] = useState(true)
    const [currentStep, setCurrentStep] = useState(1)

    const [formData, setFormData] = useState({
        // Personal Information
        title: '',
        firstName: '',
        surname: '',
        nationality: '',
        idPassportNumber: '',

        // Contact Information
        email: '',
        cellphone: '',
        residentialAddress: '',
        city: '',
        stateProvince: '',
        country: '',

        // Stay Information
        dateIn: new Date().toISOString().split('T')[0],
        dateOut: '',
        roomNumber: '',
        numberOfAdults: 1,
        numberOfChildren: 0,

        // Preferences
        breakfastTime: '',
        serveDinner: false,

        // Agreement
        agreedToTerms: false,
    })

    // Fetch available rooms
    useEffect(() => {
        const fetchRooms = async () => {
            try {
                // First, get the first property (or you can make this selectable)
                const propertiesRes = await axios.get('/api/properties?limit=1')
                const properties = propertiesRes.data?.data || []

                if (properties.length > 0) {
                    const propertyId = properties[0].id
                    const roomsRes = await axios.get(`/api/rooms?propertyId=${propertyId}&status=available&limit=100`)
                    const roomsData = roomsRes.data?.data || []
                    setRooms(roomsData)
                }
            } catch (error) {
                console.error('Error fetching rooms:', error)
                toast({
                    title: 'Error',
                    description: 'Failed to load available rooms. Please try again later.',
                    variant: 'destructive',
                })
            } finally {
                setIsLoadingRooms(false)
            }
        }

        fetchRooms()
    }, [toast])

    const updateForm = (field: string, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validate required fields
        const requiredFields = [
            'firstName', 'surname', 'email', 'cellphone',
            'residentialAddress', 'city', 'stateProvince', 'country',
            'dateIn', 'dateOut', 'roomNumber'
        ]

        const missing = requiredFields.filter(field => !formData[field as keyof typeof formData])

        if (missing.length > 0) {
            toast({
                title: 'Missing Information',
                description: `Please fill in: ${missing.join(', ')}`,
                variant: 'destructive',
            })
            return
        }

        const checkIn = new Date(formData.dateIn)
        const checkOut = new Date(formData.dateOut)

        if (checkOut <= checkIn) {
            toast({
                title: 'Invalid Dates',
                description: 'Check-out date must be after check-in date',
                variant: 'destructive',
            })
            return
        }

        if (!formData.agreedToTerms) {
            toast({
                title: 'Terms Required',
                description: 'Please agree to the terms and conditions',
                variant: 'destructive',
            })
            return
        }

        setIsSubmitting(true)

        try {
            const guestData = {
                title: formData.title || 'Mr.',
                firstName: formData.firstName,
                surname: formData.surname,
                nationality: formData.nationality || 'Not specified',
                idPassportNumber: formData.idPassportNumber || 'N/A',
                email: formData.email,
                cellphone: formData.cellphone,
                residentialAddress: formData.residentialAddress,
                city: formData.city,
                stateProvince: formData.stateProvince,
                country: formData.country,
                dateIn: new Date(formData.dateIn),
                dateOut: new Date(formData.dateOut),
                roomNumber: formData.roomNumber,
                numberOfAdults: formData.numberOfAdults,
                numberOfChildren: formData.numberOfChildren,
                breakfastTime: formData.breakfastTime,
                serveDinner: formData.serveDinner,
                agreedToTerms: true,
                signatureDate: new Date(),
                postalAddress: '',
                telHome: '',
                telBusiness: '',
                vehicleRegNo: '',
                accountPayableBy: 'Self',
                preferences: {
                    beef: false,
                    pork: false,
                    eggStyle: null,
                    dietaryRestrictions: [],
                    specialRequests: [],
                    roomType: '',
                    floorPreference: 'any',
                    bedType: 'king'
                },
                loyaltyTier: 'bronze',
                loyaltyPoints: 0,
                totalStays: 1,
                totalSpent: 0,
                notes: '',
                tags: []
            }

            await axios.post('/api/guests', guestData)

            toast({
                title: 'Registration Successful!',
                description: 'Your guest registration has been submitted. Welcome!',
            })

            // Redirect to success page or home
            setTimeout(() => {
                router.push('/registration-success')
            }, 2000)

        } catch (error: any) {
            console.error('Registration error:', error)
            toast({
                title: 'Registration Failed',
                description: error.response?.data?.error || 'Please try again later',
                variant: 'destructive',
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* Header */}
            <div className="bg-white shadow-sm border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex size-10 items-center justify-center rounded-lg bg-primary">
                                <Hotel className="size-6 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-foreground">OmniHotel Pro</h1>
                                <p className="text-sm text-muted-foreground">Guest Self Registration</p>
                            </div>
                        </div>
                        <Link href="/" className="text-sm text-muted-foreground hover:text-primary">
                            Return to Home
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto">
                    {/* Progress Steps */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`flex size-10 items-center justify-center rounded-full ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    1
                                </div>
                                <div className="ml-2">
                                    <p className="text-sm font-medium">Personal Info</p>
                                </div>
                            </div>
                            <div className="flex-1 h-0.5 mx-4 bg-gray-200" />
                            <div className="flex items-center">
                                <div className={`flex size-10 items-center justify-center rounded-full ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    2
                                </div>
                                <div className="ml-2">
                                    <p className="text-sm font-medium">Stay Details</p>
                                </div>
                            </div>
                            <div className="flex-1 h-0.5 mx-4 bg-gray-200" />
                            <div className="flex items-center">
                                <div className={`flex size-10 items-center justify-center rounded-full ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                                    3
                                </div>
                                <div className="ml-2">
                                    <p className="text-sm font-medium">Confirm</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                        <div className="p-6 md:p-8">
                            <form onSubmit={handleSubmit}>
                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <h2 className="text-2xl font-bold">Personal Information</h2>
                                            <p className="text-muted-foreground">Tell us about yourself</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Title</Label>
                                                <select
                                                    id="title"
                                                    value={formData.title}
                                                    onChange={(e) => updateForm('title', e.target.value)}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                                                >
                                                    <option value="">Select</option>
                                                    <option value="Mr.">Mr.</option>
                                                    <option value="Mrs.">Mrs.</option>
                                                    <option value="Ms.">Ms.</option>
                                                    <option value="Dr.">Dr.</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="firstName">First Name *</Label>
                                                <Input
                                                    id="firstName"
                                                    value={formData.firstName}
                                                    onChange={(e) => updateForm('firstName', e.target.value)}
                                                    placeholder="Enter your first name"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="surname">Surname *</Label>
                                                <Input
                                                    id="surname"
                                                    value={formData.surname}
                                                    onChange={(e) => updateForm('surname', e.target.value)}
                                                    placeholder="Enter your surname"
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="nationality">Nationality</Label>
                                                <Input
                                                    id="nationality"
                                                    value={formData.nationality}
                                                    onChange={(e) => updateForm('nationality', e.target.value)}
                                                    placeholder="Your nationality"
                                                />
                                            </div>
                                            <div className="col-span-2 space-y-2">
                                                <Label htmlFor="idPassportNumber">ID/Passport Number</Label>
                                                <Input
                                                    id="idPassportNumber"
                                                    value={formData.idPassportNumber}
                                                    onChange={(e) => updateForm('idPassportNumber', e.target.value)}
                                                    placeholder="ID or Passport number"
                                                />
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <h3 className="font-semibold">Contact Information</h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2 space-y-2">
                                                    <Label htmlFor="email">Email *</Label>
                                                    <Input
                                                        id="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={(e) => updateForm('email', e.target.value)}
                                                        placeholder="your@email.com"
                                                        required
                                                    />
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <Label htmlFor="cellphone">Cellphone *</Label>
                                                    <Input
                                                        id="cellphone"
                                                        value={formData.cellphone}
                                                        onChange={(e) => updateForm('cellphone', e.target.value)}
                                                        placeholder="Your phone number"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <Separator />

                                        <div className="space-y-4">
                                            <h3 className="font-semibold">Address</h3>
                                            <div className="space-y-2">
                                                <Label htmlFor="residentialAddress">Residential Address *</Label>
                                                <Input
                                                    id="residentialAddress"
                                                    value={formData.residentialAddress}
                                                    onChange={(e) => updateForm('residentialAddress', e.target.value)}
                                                    placeholder="Street address"
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor="city">City *</Label>
                                                    <Input
                                                        id="city"
                                                        value={formData.city}
                                                        onChange={(e) => updateForm('city', e.target.value)}
                                                        placeholder="City"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="stateProvince">State/Province *</Label>
                                                    <Input
                                                        id="stateProvince"
                                                        value={formData.stateProvince}
                                                        onChange={(e) => updateForm('stateProvince', e.target.value)}
                                                        placeholder="State/Province"
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="country">Country *</Label>
                                                    <Input
                                                        id="country"
                                                        value={formData.country}
                                                        onChange={(e) => updateForm('country', e.target.value)}
                                                        placeholder="Country"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <h2 className="text-2xl font-bold">Stay Details</h2>
                                            <p className="text-muted-foreground">Tell us about your stay</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="dateIn">Check-in Date *</Label>
                                                <Input
                                                    id="dateIn"
                                                    type="date"
                                                    value={formData.dateIn}
                                                    onChange={(e) => updateForm('dateIn', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="dateOut">Check-out Date *</Label>
                                                <Input
                                                    id="dateOut"
                                                    type="date"
                                                    value={formData.dateOut}
                                                    onChange={(e) => updateForm('dateOut', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="roomNumber">Select Room *</Label>
                                            <select
                                                id="roomNumber"
                                                value={formData.roomNumber}
                                                onChange={(e) => updateForm('roomNumber', e.target.value)}
                                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                                                required
                                                disabled={isLoadingRooms}
                                            >
                                                <option value="">{isLoadingRooms ? 'Loading rooms...' : 'Select a room'}</option>
                                                {rooms.map((room) => (
                                                    <option key={room.id} value={room.number}>
                                                        Room {room.number} - {room.type} (${room.baseRate}/night)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="numberOfAdults">Number of Adults</Label>
                                                <Input
                                                    id="numberOfAdults"
                                                    type="number"
                                                    min="1"
                                                    max="10"
                                                    value={formData.numberOfAdults}
                                                    onChange={(e) => updateForm('numberOfAdults', parseInt(e.target.value))}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="numberOfChildren">Number of Children</Label>
                                                <Input
                                                    id="numberOfChildren"
                                                    type="number"
                                                    min="0"
                                                    max="10"
                                                    value={formData.numberOfChildren}
                                                    onChange={(e) => updateForm('numberOfChildren', parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="breakfastTime">Preferred Breakfast Time</Label>
                                            <select
                                                id="breakfastTime"
                                                value={formData.breakfastTime}
                                                onChange={(e) => updateForm('breakfastTime', e.target.value)}
                                                className="w-full rounded-md border border-input bg-background px-3 py-2"
                                            >
                                                <option value="">Select time</option>
                                                <option value="06:00">06:00</option>
                                                <option value="07:00">07:00</option>
                                                <option value="08:00">08:00</option>
                                                <option value="09:00">09:00</option>
                                                <option value="10:00">10:00</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="serveDinner"
                                                checked={formData.serveDinner}
                                                onCheckedChange={(checked) => updateForm('serveDinner', !!checked)}
                                            />
                                            <Label htmlFor="serveDinner">I would like to have dinner at the hotel</Label>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="text-center mb-6">
                                            <h2 className="text-2xl font-bold">Confirm Your Registration</h2>
                                            <p className="text-muted-foreground">Review your information</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <h3 className="font-semibold">Personal Information</h3>
                                            <p><strong>Name:</strong> {formData.title} {formData.firstName} {formData.surname}</p>
                                            <p><strong>Email:</strong> {formData.email}</p>
                                            <p><strong>Phone:</strong> {formData.cellphone}</p>
                                            <p><strong>Address:</strong> {formData.residentialAddress}, {formData.city}, {formData.stateProvince}, {formData.country}</p>
                                        </div>

                                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                            <h3 className="font-semibold">Stay Information</h3>
                                            <p><strong>Room:</strong> {formData.roomNumber || 'Not selected'}</p>
                                            <p><strong>Check-in:</strong> {new Date(formData.dateIn).toLocaleDateString()}</p>
                                            <p><strong>Check-out:</strong> {new Date(formData.dateOut).toLocaleDateString()}</p>
                                            <p><strong>Guests:</strong> {formData.numberOfAdults} adults, {formData.numberOfChildren} children</p>
                                            <p><strong>Breakfast:</strong> {formData.breakfastTime || 'Not specified'}</p>
                                            <p><strong>Dinner:</strong> {formData.serveDinner ? 'Yes' : 'No'}</p>
                                        </div>

                                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                            <div className="flex items-start gap-3">
                                                <Checkbox
                                                    id="agreeTerms"
                                                    checked={formData.agreedToTerms}
                                                    onCheckedChange={(checked) => updateForm('agreedToTerms', !!checked)}
                                                />
                                                <Label htmlFor="agreeTerms" className="text-sm">
                                                    I confirm that the information provided is accurate and I agree to the hotel's
                                                    terms and conditions, including the cancellation policy and house rules.
                                                </Label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-between gap-4 mt-8 pt-4 border-t">
                                    {currentStep > 1 && (
                                        <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)}>
                                            Back
                                        </Button>
                                    )}
                                    {currentStep < 3 ? (
                                        <Button type="button" className="ml-auto" onClick={() => setCurrentStep(currentStep + 1)}>
                                            Continue
                                            <ArrowRight className="ml-2 size-4" />
                                        </Button>
                                    ) : (
                                        <Button type="submit" className="ml-auto" disabled={isSubmitting || !formData.agreedToTerms}>
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 size-4 animate-spin" />
                                                    Registering...
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle className="mr-2 size-4" />
                                                    Complete Registration
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Info Box */}
                    <div className="mt-6 text-center text-sm text-muted-foreground">
                        <p>By completing this registration, you'll be added to our guest管理系统.</p>
                        <p>Your loyalty points will start accumulating from your first stay!</p>
                    </div>
                </div>
            </div>
        </div>
    )
}