'use client'

import { useState, useEffect } from 'react'
import { Check, Loader2, Plus, Minus, XCircle, CalendarIcon } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios';
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { SignaturePad } from '@/components/signature-pad'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

interface Room {
    id: string;
    number: string;
    type: string;
    baseRate: number;
    [key: string]: any;
}

// Form data interface
interface FormData {
    title: string;
    surname: string;
    firstName: string;
    nationality: string;
    idPassportNumber: string;
    numberOfAdults: number;
    numberOfChildren: number;
    childrenAges: string[];
    otherAdultSurname: string;
    otherAdultFirstName: string;
    otherAdultNationality: string;
    otherAdultIdPassport: string;
    postalAddress: string;
    residentialAddress: string;
    city: string;
    stateProvince: string;
    country: string;
    telHome: string;
    telBusiness: string;
    cellphone: string;
    email: string;
    dateIn: Date | undefined;
    dateOut: Date | undefined;
    roomNumber: string;
    accountPayableBy: string;
    vehicleRegNo: string;
    breakfastTime: string;
    beefYes: boolean;
    beefNo: boolean;
    porkYes: boolean;
    porkNo: boolean;
    eggStyle: 'fried' | 'scrambled' | 'boiled' | 'omelet' | '';
    serveDinner: boolean;
    agreedToTerms: boolean;
    signatureDate: string;
    signatureData: string;
}

// Initial form data
const initialFormData: FormData = {
    title: '',
    surname: '',
    firstName: '',
    nationality: '',
    idPassportNumber: '',
    numberOfAdults: 1,
    numberOfChildren: 0,
    childrenAges: [],
    otherAdultSurname: '',
    otherAdultFirstName: '',
    otherAdultNationality: '',
    otherAdultIdPassport: '',
    postalAddress: '',
    residentialAddress: '',
    city: '',
    stateProvince: '',
    country: '',
    telHome: '',
    telBusiness: '',
    cellphone: '',
    email: '',
    dateIn: undefined,
    dateOut: undefined,
    roomNumber: '',
    accountPayableBy: 'Guest',
    vehicleRegNo: '',
    breakfastTime: '',
    beefYes: false,
    beefNo: false,
    porkYes: false,
    porkNo: false,
    eggStyle: '',
    serveDinner: false,
    agreedToTerms: false,
    signatureDate: new Date().toISOString().split('T')[0],
    signatureData: '',
}

export default function GuestRegistrationPage() {
    const { toast } = useToast()
    const { currentProperty } = useAppStore()
    const [isSaving, setIsSaving] = useState(false)

    // State for rooms
    const [rooms, setRooms] = useState<Room[]>([])
    const [isLoadingRooms, setIsLoadingRooms] = useState(false)

    // State for booked dates and conflict
    const [bookedRanges, setBookedRanges] = useState<{ from: Date; to: Date }[]>([])
    const [isLoadingBookedDates, setIsLoadingBookedDates] = useState(false)
    const [dateConflict, setDateConflict] = useState(false)

    // Form state - MOVED UP before any useEffect that uses it
    const [formData, setFormData] = useState<FormData>(initialFormData)

    // Fetch rooms on component mount or when property changes
    useEffect(() => {
        const fetchRooms = async () => {
            if (!currentProperty?.id) {
                setRooms([]);
                return;
            }

            setIsLoadingRooms(true);
            try {
                const response = await axios.get('/api/rooms', {
                    params: { propertyId: currentProperty.id, limit: 100 }
                });

                const roomsData = response.data;
                if (Array.isArray(roomsData)) {
                    setRooms(roomsData);
                } else if (roomsData && typeof roomsData === 'object') {
                    if (Array.isArray(roomsData.data)) {
                        setRooms(roomsData.data);
                    } else {
                        console.warn('API returned unexpected format:', roomsData);
                        setRooms([]);
                    }
                } else {
                    console.warn('API returned non-array data:', roomsData);
                    setRooms([]);
                }
            } catch (error) {
                console.error('Error fetching rooms:', error);
                setRooms([]);
            } finally {
                setIsLoadingRooms(false);
            }
        };

        fetchRooms().catch(error => {
            console.error('Failed to fetch rooms:', error);
        });
    }, [currentProperty])

    // Fetch booked dates when room is selected
    useEffect(() => {
        if (!formData.roomNumber) {
            setBookedRanges([])
            setDateConflict(false)
            return
        }
        const selectedRoom = rooms.find(r => r.number === formData.roomNumber)
        if (!selectedRoom) return

        const fetchBooked = async () => {
            setIsLoadingBookedDates(true)
            try {
                const [r1, r2] = await Promise.all([
                    fetch(`/api/bookings?roomId=${selectedRoom.id}&status=confirmed&limit=200`),
                    fetch(`/api/bookings?roomId=${selectedRoom.id}&status=checked_in&limit=200`),
                ])
                const [d1, d2] = await Promise.all([r1.json(), r2.json()])
                const all = [...(d1.data || []), ...(d2.data || [])]
                    .map((b: any) => ({ from: new Date(b.checkIn), to: new Date(b.checkOut) }))
                setBookedRanges(all)
            } catch (e) {
                console.error('Error fetching booked dates:', e)
                setBookedRanges([])
            } finally {
                setIsLoadingBookedDates(false)
            }
        }
        fetchBooked()
    }, [formData.roomNumber, rooms])

    // Conflict detection - properly handles bookings that end on the check-in date
    useEffect(() => {
        if (!formData.dateIn || !formData.dateOut || bookedRanges.length === 0) {
            setDateConflict(false)
            return
        }

        const checkIn = new Date(formData.dateIn);
        checkIn.setHours(0, 0, 0, 0);
        const checkOut = new Date(formData.dateOut);
        checkOut.setHours(0, 0, 0, 0);

        // Check if there's any OVERLAP with existing bookings
        const conflict = bookedRanges.some(({ from, to }) => {
            const f = new Date(from).setHours(0, 0, 0, 0)
            const tt = new Date(to).setHours(0, 0, 0, 0)
            const ci = checkIn.getTime()
            const co = checkOut.getTime()

            // Overlap exists if: checkIn < existingCheckOut AND checkOut > existingCheckIn
            // This correctly handles bookings that end on the check-in date (they don't conflict)
            return ci < tt && co > f
        })

        setDateConflict(conflict)
    }, [formData.dateIn, formData.dateOut, bookedRanges])

    const isDateBooked = (date: Date): boolean => {
        const t = date.setHours(0, 0, 0, 0)
        return bookedRanges.some(({ from, to }) => {
            const f = new Date(from).setHours(0, 0, 0, 0)
            const tt = new Date(to).setHours(0, 0, 0, 0)
            // A date is booked if it's >= check-in AND < check-out
            return t >= f && t < tt
        })
    }

    const handleSave = async () => {
        // Validation logic
        if (!formData.firstName || !formData.surname) {
            toast({ title: 'Missing fields', description: 'First name and surname are required', variant: 'destructive' })
            return
        }
        if (!formData.email) {
            toast({ title: 'Missing fields', description: 'Email is required', variant: 'destructive' })
            return
        }
        if (!formData.cellphone) {
            toast({ title: 'Missing fields', description: 'Cellphone number is required', variant: 'destructive' })
            return
        }
        if (!formData.roomNumber) {
            toast({ title: 'Missing fields', description: 'Please select a room number', variant: 'destructive' })
            return
        }
        if (!formData.dateIn || !formData.dateOut) {
            toast({ title: 'Missing fields', description: 'Please select check-in and check-out dates', variant: 'destructive' })
            return
        }
        if (!formData.residentialAddress) {
            toast({ title: 'Missing fields', description: 'Residential address is required', variant: 'destructive' })
            return
        }
        if (!formData.city) {
            toast({ title: 'Missing fields', description: 'City is required', variant: 'destructive' })
            return
        }
        if (!formData.stateProvince) {
            toast({ title: 'Missing fields', description: 'State/Province is required', variant: 'destructive' })
            return
        }
        if (!formData.country) {
            toast({ title: 'Missing fields', description: 'Country is required', variant: 'destructive' })
            return
        }
        if (!formData.accountPayableBy) {
            toast({ title: 'Missing fields', description: 'Account payable by is required', variant: 'destructive' })
            return
        }

        // Enhanced date validation - checkout must be at least one day after checkin
        if (formData.dateIn && formData.dateOut) {
            const checkIn = new Date(formData.dateIn);
            checkIn.setHours(0, 0, 0, 0);
            const checkOut = new Date(formData.dateOut);
            checkOut.setHours(0, 0, 0, 0);

            const diffTime = checkOut.getTime() - checkIn.getTime();
            const diffDays = diffTime / (1000 * 60 * 60 * 24);

            if (diffDays < 1) {
                toast({
                    title: 'Invalid dates',
                    description: 'Check-out date must be at least one day after check-in date',
                    variant: 'destructive'
                });
                return;
            }
        }

        if (dateConflict) {
            toast({ title: 'Date conflict', description: 'This room is already booked for the selected dates.', variant: 'destructive' })
            return
        }
        if (!formData.agreedToTerms) {
            toast({ title: 'Terms not accepted', description: 'Please agree to the terms and conditions', variant: 'destructive' })
            return
        }

        setIsSaving(true)

        const safeParseDate = (date: Date): Date => {
            return isNaN(date.getTime()) ? new Date() : date
        }

        const guestData: any = {
            title: formData.title || 'Mr.',
            surname: formData.surname,
            firstName: formData.firstName,
            nationality: formData.nationality || 'Unknown',
            idPassportNumber: formData.idPassportNumber || 'N/A',
            numberOfAdults: formData.numberOfAdults || 1,
            numberOfChildren: formData.numberOfChildren || 0,
            childrenAges: formData.childrenAges
                .filter(age => age !== '' && !isNaN(Number(age)) && Number(age) >= 0 && Number(age) <= 17)
                .map(Number),
            otherAdult: (formData.otherAdultSurname || formData.otherAdultFirstName) ? {
                surname: formData.otherAdultSurname || 'Unknown',
                firstName: formData.otherAdultFirstName || 'Unknown',
                nationality: formData.otherAdultNationality || 'Unknown',
                idPassportNumber: formData.otherAdultIdPassport || 'N/A',
            } : undefined,
            postalAddress: formData.postalAddress || '',
            residentialAddress: formData.residentialAddress || 'N/A',
            city: formData.city || 'Unknown',
            stateProvince: formData.stateProvince || 'Unknown',
            country: formData.country || 'Unknown',
            telHome: formData.telHome || '',
            telBusiness: formData.telBusiness || '',
            cellphone: formData.cellphone,
            email: formData.email,
            dateIn: safeParseDate(formData.dateIn),
            dateOut: safeParseDate(formData.dateOut),
            roomNumber: formData.roomNumber,
            accountPayableBy: formData.accountPayableBy || 'Guest',
            vehicleRegNo: formData.vehicleRegNo || '',
            breakfastTime: formData.breakfastTime || '',
            preferences: {
                beef: formData.beefYes || false,
                pork: formData.porkYes || false,
                eggStyle: formData.eggStyle || null,
                dietaryRestrictions: [],
                specialRequests: [],
                roomType: '',
                floorPreference: 'any',
                bedType: 'king',
            },
            serveDinner: formData.serveDinner || false,
            agreedToTerms: formData.agreedToTerms,
            signatureDate: safeParseDate(new Date(formData.signatureDate)),
            signatureData: formData.signatureData || '',
            loyaltyTier: 'bronze',
            loyaltyPoints: 0,
            totalStays: 1,
            totalSpent: 0,
            notes: '',
            tags: [],
        }

        try {
            await axios.post('/api/guests', guestData)
            toast({ title: 'Guest registered', description: `${guestData.firstName} ${guestData.surname} has been registered.` })
            // Reset form
            setFormData(initialFormData)
        } catch (error: any) {
            console.error('Error saving guest:', error.response?.data)
            let errorMessage = 'Failed to save guest'
            if (error.response?.data?.error) errorMessage = error.response.data.error
            if (error.response?.data?.details) {
                const details = error.response.data.details
                if (Array.isArray(details)) {
                    errorMessage = details.map((d: any) => `${d.field}: ${d.message}`).join(', ')
                }
            }
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
        } finally {
            setIsSaving(false)
        }
    }

    const updateForm = (field: keyof FormData, value: string | number | boolean | string[] | Date | undefined) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleChildrenCountChange = (count: number) => {
        const newCount = Math.max(0, Math.min(10, count))
        const currentAges = [...formData.childrenAges]
        if (newCount > currentAges.length) {
            while (currentAges.length < newCount) currentAges.push('')
        } else {
            currentAges.length = newCount
        }
        setFormData(prev => ({ ...prev, numberOfChildren: newCount, childrenAges: currentAges }))
    }

    const updateChildAge = (index: number, age: string) => {
        const newAges = [...formData.childrenAges]
        newAges[index] = age
        updateForm('childrenAges', newAges)
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-[#cac1b9]/10 to-gray-100">
            {/* Professional Header */}
            <header className="bg-black border-b border-[#cac1b9]/30 sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative w-15 h-15">
                                <Image
                                    src="/logo.png"
                                    alt="OmniHotel Pro Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-white">OmniHotel Pro</h1>
                                <p className="text-xs text-gray-400">Guest Registration</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-300">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8 max-w-4xl">
                <Card className="border-0 shadow-xl bg-white">
                    <CardHeader className="border-b border-gray-200 bg-linear-to-r from-[#cac1b9] to-[#cac1b9]/80">
                        <CardTitle className="text-2xl font-bold text-black">Guest Registration Form</CardTitle>
                        <CardDescription className="text-gray-700">
                            Please complete all required fields marked with *
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 space-y-8">
                        {/* Primary Guest Information */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#cac1b9]/30">
                                <div className="flex size-8 items-center justify-center rounded-full bg-[#cac1b9]/20">
                                    <span className="text-sm font-bold text-[#cac1b9]">1</span>
                                </div>
                                <h3 className="font-semibold text-black">Primary Guest Information</h3>
                            </div>

                            <div className="grid md:grid-cols-4 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title" className="text-gray-700">Title</Label>
                                    <Select value={formData.title} onValueChange={(v) => updateForm('title', v)}>
                                        <SelectTrigger id="title" className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]">
                                            <SelectValue placeholder="Title" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Mr.">Mr.</SelectItem>
                                            <SelectItem value="Mrs.">Mrs.</SelectItem>
                                            <SelectItem value="Ms.">Ms.</SelectItem>
                                            <SelectItem value="Miss">Miss</SelectItem>
                                            <SelectItem value="Dr.">Dr.</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <Label htmlFor="surname" className="text-gray-700">Surname *</Label>
                                    <Input
                                        id="surname"
                                        value={formData.surname}
                                        onChange={(e) => updateForm('surname', e.target.value)}
                                        placeholder="Enter surname"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nationality" className="text-gray-700">Nationality</Label>
                                    <Input
                                        id="nationality"
                                        value={formData.nationality}
                                        onChange={(e) => updateForm('nationality', e.target.value)}
                                        placeholder="Enter nationality"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="firstName" className="text-gray-700">First Name *</Label>
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => updateForm('firstName', e.target.value)}
                                        placeholder="Enter first name"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="idPassportNumber" className="text-gray-700">ID/Passport Number *</Label>
                                <Input
                                    id="idPassportNumber"
                                    value={formData.idPassportNumber}
                                    onChange={(e) => updateForm('idPassportNumber', e.target.value)}
                                    placeholder="Enter ID or Passport number"
                                    className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                    required
                                />
                            </div>
                        </section>

                        <Separator className="bg-gray-200" />

                        {/* Party Information */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#cac1b9]/30">
                                <div className="flex size-8 items-center justify-center rounded-full bg-[#cac1b9]/20">
                                    <span className="text-sm font-bold text-[#cac1b9]">2</span>
                                </div>
                                <h3 className="font-semibold text-black">Party Information</h3>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Number of Adults</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => updateForm('numberOfAdults', Math.max(1, formData.numberOfAdults - 1))}
                                            className="border-[#cac1b9] text-[#cac1b9] hover:bg-[#cac1b9] hover:text-black"
                                        >
                                            <Minus className="size-4" />
                                        </Button>
                                        <span className="w-10 text-center font-semibold text-black">{formData.numberOfAdults}</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => updateForm('numberOfAdults', formData.numberOfAdults + 1)}
                                            className="border-[#cac1b9] text-[#cac1b9] hover:bg-[#cac1b9] hover:text-black"
                                        >
                                            <Plus className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Number of Children</Label>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleChildrenCountChange(formData.numberOfChildren - 1)}
                                            className="border-[#cac1b9] text-[#cac1b9] hover:bg-[#cac1b9] hover:text-black"
                                        >
                                            <Minus className="size-4" />
                                        </Button>
                                        <span className="w-10 text-center font-semibold text-black">{formData.numberOfChildren}</span>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            onClick={() => handleChildrenCountChange(formData.numberOfChildren + 1)}
                                            className="border-[#cac1b9] text-[#cac1b9] hover:bg-[#cac1b9] hover:text-black"
                                        >
                                            <Plus className="size-4" />
                                        </Button>
                                    </div>
                                </div>
                                {formData.numberOfChildren > 0 && (
                                    <div className="space-y-2">
                                        <Label className="text-gray-700">Children Ages</Label>
                                        <div className="flex flex-wrap gap-2">
                                            {formData.childrenAges.map((age, index) => (
                                                <Input
                                                    key={index}
                                                    type="number"
                                                    min="0"
                                                    max="17"
                                                    value={age}
                                                    onChange={(e) => updateChildAge(index, e.target.value)}
                                                    className="w-16 border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                                    placeholder={`#${index + 1}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Other Adult */}
                        {formData.numberOfAdults > 1 && (
                            <>
                                <Separator className="bg-gray-200" />
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 pb-2 border-b border-[#cac1b9]/30">
                                        <div className="flex size-8 items-center justify-center rounded-full bg-[#cac1b9]/20">
                                            <span className="text-sm font-bold text-[#cac1b9]">3</span>
                                        </div>
                                        <h3 className="font-semibold text-black">Additional Adult Details</h3>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="otherAdultSurname" className="text-gray-700">Surname</Label>
                                            <Input
                                                id="otherAdultSurname"
                                                value={formData.otherAdultSurname}
                                                onChange={(e) => updateForm('otherAdultSurname', e.target.value)}
                                                placeholder="Enter surname"
                                                className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="otherAdultFirstName" className="text-gray-700">First Name</Label>
                                            <Input
                                                id="otherAdultFirstName"
                                                value={formData.otherAdultFirstName}
                                                onChange={(e) => updateForm('otherAdultFirstName', e.target.value)}
                                                placeholder="Enter first name"
                                                className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="otherAdultNationality" className="text-gray-700">Nationality</Label>
                                            <Input
                                                id="otherAdultNationality"
                                                value={formData.otherAdultNationality}
                                                onChange={(e) => updateForm('otherAdultNationality', e.target.value)}
                                                placeholder="Enter nationality"
                                                className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="otherAdultIdPassport" className="text-gray-700">ID/Passport Number</Label>
                                            <Input
                                                id="otherAdultIdPassport"
                                                value={formData.otherAdultIdPassport}
                                                onChange={(e) => updateForm('otherAdultIdPassport', e.target.value)}
                                                placeholder="Enter ID or Passport"
                                                className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                            />
                                        </div>
                                    </div>
                                </section>
                            </>
                        )}

                        <Separator className="bg-gray-200" />

                        {/* Address Information */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#cac1b9]/30">
                                <div className="flex size-8 items-center justify-center rounded-full bg-[#cac1b9]/20">
                                    <span className="text-sm font-bold text-[#cac1b9]">4</span>
                                </div>
                                <h3 className="font-semibold text-black">Address Details</h3>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="postalAddress" className="text-gray-700">Postal Address</Label>
                                <Input
                                    id="postalAddress"
                                    value={formData.postalAddress}
                                    onChange={(e) => updateForm('postalAddress', e.target.value)}
                                    placeholder="Enter postal address"
                                    className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="residentialAddress" className="text-gray-700">Residential Address *</Label>
                                <Input
                                    id="residentialAddress"
                                    value={formData.residentialAddress}
                                    onChange={(e) => updateForm('residentialAddress', e.target.value)}
                                    placeholder="Enter residential address"
                                    className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                    required
                                />
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="city" className="text-gray-700">City *</Label>
                                    <Input
                                        id="city"
                                        value={formData.city}
                                        onChange={(e) => updateForm('city', e.target.value)}
                                        placeholder="Enter city"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="stateProvince" className="text-gray-700">State/Province *</Label>
                                    <Input
                                        id="stateProvince"
                                        value={formData.stateProvince}
                                        onChange={(e) => updateForm('stateProvince', e.target.value)}
                                        placeholder="Enter state/province"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="country" className="text-gray-700">Country *</Label>
                                    <Input
                                        id="country"
                                        value={formData.country}
                                        onChange={(e) => updateForm('country', e.target.value)}
                                        placeholder="Enter country"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        <Separator className="bg-gray-200" />

                        {/* Contact Information */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#cac1b9]/30">
                                <div className="flex size-8 items-center justify-center rounded-full bg-[#cac1b9]/20">
                                    <span className="text-sm font-bold text-[#cac1b9]">5</span>
                                </div>
                                <h3 className="font-semibold text-black">Contact Information</h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="telHome" className="text-gray-700">Tel. No. (Home)</Label>
                                    <Input
                                        id="telHome"
                                        type="tel"
                                        value={formData.telHome}
                                        onChange={(e) => updateForm('telHome', e.target.value)}
                                        placeholder="Home phone"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telBusiness" className="text-gray-700">Tel. No. (Business)</Label>
                                    <Input
                                        id="telBusiness"
                                        type="tel"
                                        value={formData.telBusiness}
                                        onChange={(e) => updateForm('telBusiness', e.target.value)}
                                        placeholder="Business phone"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                    />
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="cellphone" className="text-gray-700">Cellphone No. *</Label>
                                    <Input
                                        id="cellphone"
                                        type="tel"
                                        value={formData.cellphone}
                                        onChange={(e) => updateForm('cellphone', e.target.value)}
                                        placeholder="Cellphone number"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700">Email *</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => updateForm('email', e.target.value)}
                                        placeholder="Email address"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                        required
                                    />
                                </div>
                            </div>
                        </section>

                        <Separator className="bg-gray-200" />

                        {/* Stay Information */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#cac1b9]/30">
                                <div className="flex size-8 items-center justify-center rounded-full bg-[#cac1b9]/20">
                                    <span className="text-sm font-bold text-[#cac1b9]">6</span>
                                </div>
                                <h3 className="font-semibold text-black">Stay Details</h3>
                            </div>

                            <div className="grid md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Check-in Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal border-gray-300",
                                                    !formData.dateIn && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.dateIn ? format(formData.dateIn, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            {isLoadingBookedDates ? (
                                                <div className="p-6 text-sm text-muted-foreground text-center">
                                                    Loading availability...
                                                </div>
                                            ) : (
                                                <>
                                                    <Calendar
                                                        mode="single"
                                                        selected={formData.dateIn}
                                                        onSelect={(date) => {
                                                            if (date) {
                                                                updateForm('dateIn', date)
                                                                if (formData.dateOut) {
                                                                    const checkOut = new Date(formData.dateOut);
                                                                    checkOut.setHours(0, 0, 0, 0);
                                                                    const checkIn = new Date(date);
                                                                    checkIn.setHours(0, 0, 0, 0);
                                                                    if (checkOut.getTime() <= checkIn.getTime()) {
                                                                        updateForm('dateOut', undefined)
                                                                    }
                                                                }
                                                            }
                                                        }}
                                                        disabled={(date) => {
                                                            const d = new Date(date);
                                                            d.setHours(0, 0, 0, 0);
                                                            const today = new Date();
                                                            today.setHours(0, 0, 0, 0);
                                                            return d < today || isDateBooked(d);
                                                        }}
                                                        modifiers={{
                                                            booked: (date) => {
                                                                const d = new Date(date);
                                                                d.setHours(0, 0, 0, 0);
                                                                const today = new Date();
                                                                today.setHours(0, 0, 0, 0);
                                                                return d >= today && isDateBooked(d);
                                                            }
                                                        }}
                                                        modifiersClassNames={{
                                                            booked: 'bg-red-50 text-red-400 line-through'
                                                        }}
                                                        initialFocus
                                                    />
                                                    {bookedRanges.length > 0 && (
                                                        <div className="px-3 pb-3 flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                                                            <span className="inline-block w-3 h-3 rounded-sm bg-red-50 border border-red-200" />
                                                            Already booked
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-gray-700">Check-out Date *</Label>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full justify-start text-left font-normal border-gray-300",
                                                    !formData.dateOut && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {formData.dateOut ? format(formData.dateOut, "PPP") : "Pick a date"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            {isLoadingBookedDates ? (
                                                <div className="p-6 text-sm text-muted-foreground text-center">
                                                    Loading availability...
                                                </div>
                                            ) : (
                                                <>
                                                    <Calendar
                                                        mode="single"
                                                        selected={formData.dateOut}
                                                        onSelect={(date) => date && updateForm('dateOut', date)}
                                                        disabled={(date) => {
                                                            const d = new Date(date);
                                                            d.setHours(0, 0, 0, 0);
                                                            const ci = formData.dateIn ? new Date(formData.dateIn) : new Date();
                                                            ci.setHours(0, 0, 0, 0);
                                                            return d <= ci || isDateBooked(d);
                                                        }}
                                                        modifiers={{
                                                            booked: (date) => {
                                                                const d = new Date(date);
                                                                d.setHours(0, 0, 0, 0);
                                                                const ci = formData.dateIn ? new Date(formData.dateIn) : new Date();
                                                                ci.setHours(0, 0, 0, 0);
                                                                return d >= ci && isDateBooked(d);
                                                            }
                                                        }}
                                                        modifiersClassNames={{
                                                            booked: 'bg-red-50 text-red-400 line-through'
                                                        }}
                                                        initialFocus
                                                    />
                                                    {bookedRanges.length > 0 && (
                                                        <div className="px-3 pb-3 flex items-center gap-2 text-xs text-muted-foreground border-t pt-2">
                                                            <span className="inline-block w-3 h-3 rounded-sm bg-red-50 border border-red-200" />
                                                            Already booked
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="roomNumber" className="text-gray-700">Room No. *</Label>
                                    <Select
                                        value={formData.roomNumber}
                                        onValueChange={(v) => updateForm('roomNumber', v)}
                                        disabled={isLoadingRooms}
                                    >
                                        <SelectTrigger id="roomNumber" className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]">
                                            <SelectValue placeholder={isLoadingRooms ? "Loading..." : "Select Room"} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {Array.isArray(rooms) && rooms.length > 0 ? (
                                                rooms.map((room: Room) => (
                                                    <SelectItem key={room.id} value={room.number}>
                                                        {room.number} - {room.type} (${room.baseRate}/night)
                                                    </SelectItem>
                                                ))
                                            ) : (
                                                <SelectItem value="none" disabled>
                                                    {isLoadingRooms ? "Loading rooms..." : "No rooms available"}
                                                </SelectItem>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {/* Availability feedback */}
                            {isLoadingBookedDates && (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Loader2 className="size-3 animate-spin" /> Checking room availability...
                                </p>
                            )}
                            {!isLoadingBookedDates && dateConflict && (
                                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
                                    <XCircle className="size-4 shrink-0" />
                                    This room is already booked for the selected dates. Please choose different dates or a different room.
                                </div>
                            )}
                            {!isLoadingBookedDates && !dateConflict && formData.dateIn && formData.dateOut && (
                                <p className="text-xs text-green-600 flex items-center gap-1">
                                    <Check className="size-3" /> Room is available for the selected dates
                                </p>
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="accountPayableBy" className="text-gray-700">Account Payable By *</Label>
                                    <Input
                                        id="accountPayableBy"
                                        value={formData.accountPayableBy}
                                        onChange={(e) => updateForm('accountPayableBy', e.target.value)}
                                        placeholder="Guest / Company Name"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="vehicleRegNo" className="text-gray-700">Vehicle Reg. No.</Label>
                                    <Input
                                        id="vehicleRegNo"
                                        value={formData.vehicleRegNo}
                                        onChange={(e) => updateForm('vehicleRegNo', e.target.value)}
                                        placeholder="Vehicle registration"
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="breakfastTime" className="text-gray-700">Preferred Breakfast Time</Label>
                                <Select value={formData.breakfastTime} onValueChange={(v) => updateForm('breakfastTime', v)}>
                                    <SelectTrigger id="breakfastTime" className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9] w-full md:w-50">
                                        <SelectValue placeholder="Select preferred time" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="06:00">06:00 AM</SelectItem>
                                        <SelectItem value="06:30">06:30 AM</SelectItem>
                                        <SelectItem value="07:00">07:00 AM</SelectItem>
                                        <SelectItem value="07:30">07:30 AM</SelectItem>
                                        <SelectItem value="08:00">08:00 AM</SelectItem>
                                        <SelectItem value="08:30">08:30 AM</SelectItem>
                                        <SelectItem value="09:00">09:00 AM</SelectItem>
                                        <SelectItem value="09:30">09:30 AM</SelectItem>
                                        <SelectItem value="10:00">10:00 AM</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </section>

                        <Separator className="bg-gray-200" />

                        {/* Food Preferences */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#cac1b9]/30">
                                <div className="flex size-8 items-center justify-center rounded-full bg-[#cac1b9]/20">
                                    <span className="text-sm font-bold text-[#cac1b9]">7</span>
                                </div>
                                <h3 className="font-semibold text-black">Dietary Preferences</h3>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-gray-700 font-medium">Beef</Label>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="beefYes"
                                                checked={formData.beefYes}
                                                onCheckedChange={(checked) => {
                                                    updateForm('beefYes', !!checked)
                                                    if (checked) updateForm('beefNo', false)
                                                }}
                                                className="border-[#cac1b9] data-[state=checked]:bg-[#cac1b9] data-[state=checked]:border-[#cac1b9]"
                                            />
                                            <Label htmlFor="beefYes" className="font-normal text-gray-700 cursor-pointer">Yes</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="beefNo"
                                                checked={formData.beefNo}
                                                onCheckedChange={(checked) => {
                                                    updateForm('beefNo', !!checked)
                                                    if (checked) updateForm('beefYes', false)
                                                }}
                                                className="border-[#cac1b9] data-[state=checked]:bg-[#cac1b9] data-[state=checked]:border-[#cac1b9]"
                                            />
                                            <Label htmlFor="beefNo" className="font-normal text-gray-700 cursor-pointer">No</Label>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-gray-700 font-medium">Pork</Label>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="porkYes"
                                                checked={formData.porkYes}
                                                onCheckedChange={(checked) => {
                                                    updateForm('porkYes', !!checked)
                                                    if (checked) updateForm('porkNo', false)
                                                }}
                                                className="border-[#cac1b9] data-[state=checked]:bg-[#cac1b9] data-[state=checked]:border-[#cac1b9]"
                                            />
                                            <Label htmlFor="porkYes" className="font-normal text-gray-700 cursor-pointer">Yes</Label>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Checkbox
                                                id="porkNo"
                                                checked={formData.porkNo}
                                                onCheckedChange={(checked) => {
                                                    updateForm('porkNo', !!checked)
                                                    if (checked) updateForm('porkYes', false)
                                                }}
                                                className="border-[#cac1b9] data-[state=checked]:bg-[#cac1b9] data-[state=checked]:border-[#cac1b9]"
                                            />
                                            <Label htmlFor="porkNo" className="font-normal text-gray-700 cursor-pointer">No</Label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-gray-700 font-medium">Egg Preparation</Label>
                                <RadioGroup
                                    value={formData.eggStyle}
                                    onValueChange={(v) => updateForm('eggStyle', v as any)}
                                    className="flex flex-wrap gap-4"
                                >
                                    {['fried', 'scrambled', 'boiled', 'omelet'].map((style) => (
                                        <div key={style} className="flex items-center gap-2">
                                            <RadioGroupItem
                                                value={style}
                                                id={`egg-${style}`}
                                                className="border-[#cac1b9] text-[#cac1b9]"
                                            />
                                            <Label htmlFor={`egg-${style}`} className="font-normal text-gray-700 cursor-pointer capitalize">
                                                {style}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-gray-700 font-medium">Serve Dinner</Label>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="serveDinnerYes"
                                            checked={formData.serveDinner}
                                            onCheckedChange={(checked) => updateForm('serveDinner', !!checked)}
                                            className="border-[#cac1b9] data-[state=checked]:bg-[#cac1b9] data-[state=checked]:border-[#cac1b9]"
                                        />
                                        <Label htmlFor="serveDinnerYes" className="font-normal text-gray-700 cursor-pointer">Yes</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Checkbox
                                            id="serveDinnerNo"
                                            checked={!formData.serveDinner}
                                            onCheckedChange={(checked) => updateForm('serveDinner', !checked)}
                                            className="border-[#cac1b9] data-[state=checked]:bg-[#cac1b9] data-[state=checked]:border-[#cac1b9]"
                                        />
                                        <Label htmlFor="serveDinnerNo" className="font-normal text-gray-700 cursor-pointer">No</Label>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <Separator className="bg-gray-200" />

                        {/* Terms and Signature */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-2 pb-2 border-b border-[#cac1b9]/30">
                                <div className="flex size-8 items-center justify-center rounded-full bg-[#cac1b9]/20">
                                    <span className="text-sm font-bold text-[#cac1b9]">8</span>
                                </div>
                                <h3 className="font-semibold text-black">Agreement & Signature</h3>
                            </div>

                            <div className="bg-[#cac1b9]/10 border border-[#cac1b9]/30 p-4 rounded-lg">
                                <p className="font-semibold text-black mb-2">Terms & Conditions</p>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                    It is an express condition of your occupation or visit of or to these premises that the Proprietor is NOT responsible for loss
                                    or damage to property or injury of any visitor which is or may be brought upon these premises arising from negligence or
                                    wrongful act of any person in employ of the Proprietor. Any money or valuables may be handed in to the Proprietor for
                                    custody when a special receipt will be issued accordingly.
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id="agreedToTerms"
                                    checked={formData.agreedToTerms}
                                    onCheckedChange={(checked) => updateForm('agreedToTerms', !!checked)}
                                    className="border-[#cac1b9] data-[state=checked]:bg-[#cac1b9] data-[state=checked]:border-[#cac1b9]"
                                />
                                <Label htmlFor="agreedToTerms" className="font-normal text-gray-700 cursor-pointer">
                                    I agree to the terms and conditions <span className="text-[#cac1b9]">*</span>
                                </Label>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="signatureDate" className="text-gray-700">Date</Label>
                                    <Input
                                        id="signatureDate"
                                        type="date"
                                        value={formData.signatureDate}
                                        onChange={(e) => updateForm('signatureDate', e.target.value)}
                                        className="border-gray-300 focus:border-[#cac1b9] focus:ring-[#cac1b9]"
                                    />
                                </div>
                            </div>

                            <SignaturePad
                                value={formData.signatureData}
                                onChange={(signatureData) => updateForm('signatureData', signatureData)}
                                label="Digital Signature"
                            />
                        </section>
                    </CardContent>
                </Card>

                {/* Sticky Action Bar */}
                <div className="sticky bottom-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 py-4 mt-6">
                    <div className="flex justify-end gap-3">
                        <Button
                            variant="outline"
                            className="border-[#cac1b9] text-[#cac1b9] hover:bg-[#cac1b9] hover:text-black"
                            onClick={() => window.history.back()}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !formData.agreedToTerms || dateConflict}
                            className="bg-[#cac1b9] text-black hover:bg-[#cac1b9]/90 font-semibold px-8"
                        >
                            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                            {isSaving ? 'Registering...' : 'Register Guest'}
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}