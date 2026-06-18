'use client'

import { useState, useEffect } from 'react'
import { Search, Check, Loader2, Plus, Minus, XCircle, CalendarIcon } from 'lucide-react'
import Image from 'next/image'
import axios from 'axios'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SignaturePad } from '@/components/signature-pad'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import type { Guest } from '@/lib/types'
import { getLoyaltyTierConfig } from '@/lib/types'
import { useAppStore } from '@/lib/store'
import { useToast } from '@/hooks/use-toast'

interface Room {
  id: string
  number: string
  type: string
  baseRate: number
  [key: string]: any
}

interface GuestRegistrationFormProps {
  onClose?: () => void
  guest?: Guest
  onSuccess?: () => void
}

export function GuestRegistrationForm({ onClose, guest, onSuccess }: GuestRegistrationFormProps) {
  const { toast } = useToast()
  const { currentProperty } = useAppStore()

  const [step, setStep] = useState<'search' | 'form'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Guest[]>([])
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(guest || null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

  const [bookedRanges, setBookedRanges] = useState<{ from: Date; to: Date }[]>([])
  const [isLoadingBookedDates, setIsLoadingBookedDates] = useState(false)
  const [dateConflict, setDateConflict] = useState(false)

  const [formData, setFormData] = useState({
    title: '',
    surname: '',
    firstName: '',
    nationality: '',
    idPassportNumber: '',
    numberOfAdults: 1,
    numberOfChildren: 0,
    childrenAges: [] as string[],
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
    dateIn: new Date(),
    dateOut: undefined as Date | undefined,
    roomNumber: '',
    accountPayableBy: 'Guest',
    vehicleRegNo: '',
    breakfastTime: '',
    beefYes: false,
    beefNo: false,
    porkYes: false,
    porkNo: false,
    eggStyle: '' as 'fried' | 'scrambled' | 'boiled' | 'omelet' | '',
    serveDinner: false,
    agreedToTerms: false,
    signatureDate: new Date().toISOString().split('T')[0],
    signatureData: '',
  })

  useEffect(() => {
    const fetchRooms = async () => {
      if (!currentProperty?.id) {
        setRooms([])
        return
      }
      setIsLoadingRooms(true)
      try {
        const response = await axios.get('/api/rooms', {
          params: { propertyId: currentProperty.id, limit: 100 }
        })
        const roomsData = response.data
        if (Array.isArray(roomsData)) {
          setRooms(roomsData)
        } else if (roomsData && typeof roomsData === 'object' && Array.isArray(roomsData.data)) {
          setRooms(roomsData.data)
        } else {
          setRooms([])
        }
      } catch (error) {
        console.error('Error fetching rooms:', error)
        setRooms([])
      } finally {
        setIsLoadingRooms(false)
      }
    }
    fetchRooms()
  }, [currentProperty])

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
            .filter((b: any) => !guest || b.id !== guest.id)
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
  }, [formData.roomNumber, rooms, guest])

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

  useEffect(() => {
    if (guest) {
      setStep('form')
      setSelectedGuest(guest)
      setFormData({
        title: guest.title || '',
        surname: guest.surname || '',
        firstName: guest.firstName || '',
        nationality: guest.nationality || '',
        idPassportNumber: guest.idPassportNumber || '',
        numberOfAdults: guest.numberOfAdults || 1,
        numberOfChildren: guest.numberOfChildren || 0,
        childrenAges: Array.isArray(guest.childrenAges) ? guest.childrenAges.map(String) : [],
        otherAdultSurname: guest.otherAdult?.surname || '',
        otherAdultFirstName: guest.otherAdult?.firstName || '',
        otherAdultNationality: guest.otherAdult?.nationality || '',
        otherAdultIdPassport: guest.otherAdult?.idPassportNumber || '',
        postalAddress: guest.postalAddress || '',
        residentialAddress: guest.residentialAddress || '',
        city: guest.city || '',
        stateProvince: guest.stateProvince || '',
        country: guest.country || '',
        telHome: guest.telHome || '',
        telBusiness: guest.telBusiness || '',
        cellphone: guest.cellphone || '',
        email: guest.email || '',
        dateIn: guest.dateIn ? new Date(guest.dateIn) : new Date(),
        dateOut: guest.dateOut ? new Date(guest.dateOut) : undefined,
        roomNumber: guest.roomNumber || '',
        accountPayableBy: guest.accountPayableBy || '',
        vehicleRegNo: guest.vehicleRegNo || '',
        breakfastTime: guest.breakfastTime || '',
        beefYes: guest.preferences?.beef ?? false,
        beefNo: !(guest.preferences?.beef ?? false),
        porkYes: guest.preferences?.pork ?? false,
        porkNo: !(guest.preferences?.pork ?? false),
        eggStyle: guest.preferences?.eggStyle ?? '',
        serveDinner: guest.serveDinner || false,
        agreedToTerms: guest.agreedToTerms || false,
        signatureDate: guest.signatureDate ? new Date(guest.signatureDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        signatureData: guest.signatureData || '',
      })
    }
  }, [guest])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const run = async () => {
      setIsSearching(true)
      const results = await searchGuests(searchQuery)
      setSearchResults(results)
      setIsSearching(false)
    }
    run()
  }, [searchQuery])

  const searchGuests = async (query: string) => {
    try {
      const response = await axios.get('/api/guests', { params: { q: query } })
      return response.data?.data ?? response.data ?? []
    } catch (error) {
      console.error(error)
      return []
    }
  }

  const updateForm = (field: string, value: any) => {
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

  const handleSelectGuest = (g: Guest) => {
    setSelectedGuest(g)
    setFormData({
      title: g.title || '',
      surname: g.surname || '',
      firstName: g.firstName || '',
      nationality: g.nationality || '',
      idPassportNumber: g.idPassportNumber || '',
      numberOfAdults: g.numberOfAdults || 1,
      numberOfChildren: g.numberOfChildren || 0,
      childrenAges: Array.isArray(g.childrenAges) ? g.childrenAges.map(String) : [],
      otherAdultSurname: g.otherAdult?.surname || '',
      otherAdultFirstName: g.otherAdult?.firstName || '',
      otherAdultNationality: g.otherAdult?.nationality || '',
      otherAdultIdPassport: g.otherAdult?.idPassportNumber || '',
      postalAddress: g.postalAddress || '',
      residentialAddress: g.residentialAddress || '',
      city: g.city || '',
      stateProvince: g.stateProvince || '',
      country: g.country || '',
      telHome: g.telHome || '',
      telBusiness: g.telBusiness || '',
      cellphone: g.cellphone || '',
      email: g.email || '',
      dateIn: new Date(),
      dateOut: undefined,
      roomNumber: '',
      accountPayableBy: g.accountPayableBy || 'Guest',
      vehicleRegNo: g.vehicleRegNo || '',
      breakfastTime: g.breakfastTime || '',
      beefYes: g.preferences?.beef ?? false,
      beefNo: !(g.preferences?.beef ?? false),
      porkYes: g.preferences?.pork ?? false,
      porkNo: !(g.preferences?.pork ?? false),
      eggStyle: g.preferences?.eggStyle ?? '',
      serveDinner: g.serveDinner || false,
      agreedToTerms: false,
      signatureDate: new Date().toISOString().split('T')[0],
      signatureData: g.signatureData || '',
    })
    setStep('form')
  }

  const handleNewGuest = () => {
    setSelectedGuest(null)
    setFormData({
      title: '', surname: '', firstName: '', nationality: '', idPassportNumber: '',
      numberOfAdults: 1, numberOfChildren: 0, childrenAges: [],
      otherAdultSurname: '', otherAdultFirstName: '', otherAdultNationality: '', otherAdultIdPassport: '',
      postalAddress: '', residentialAddress: '', city: '', stateProvince: '', country: '',
      telHome: '', telBusiness: '', cellphone: '', email: '',
      dateIn: new Date(), dateOut: undefined, roomNumber: '',
      accountPayableBy: 'Guest', vehicleRegNo: '', breakfastTime: '',
      beefYes: false, beefNo: false, porkYes: false, porkNo: false, eggStyle: '',
      serveDinner: false, agreedToTerms: false,
      signatureDate: new Date().toISOString().split('T')[0], signatureData: '',
    })
    setStep('form')
  }

  const handleSave = async () => {
    if (!formData.firstName || !formData.surname) {
      toast({ title: 'Missing fields', description: 'First name and surname are required', variant: 'destructive' }); return
    }
    if (!formData.email) {
      toast({ title: 'Missing fields', description: 'Email is required', variant: 'destructive' }); return
    }
    if (!formData.cellphone) {
      toast({ title: 'Missing fields', description: 'Cellphone number is required', variant: 'destructive' }); return
    }
    if (!formData.roomNumber) {
      toast({ title: 'Missing fields', description: 'Please select a room number', variant: 'destructive' }); return
    }
    if (!formData.dateIn || !formData.dateOut) {
      toast({ title: 'Missing fields', description: 'Please select check-in and check-out dates', variant: 'destructive' }); return
    }
    if (!formData.residentialAddress) {
      toast({ title: 'Missing fields', description: 'Residential address is required', variant: 'destructive' }); return
    }
    if (!formData.city) {
      toast({ title: 'Missing fields', description: 'City is required', variant: 'destructive' }); return
    }
    if (!formData.stateProvince) {
      toast({ title: 'Missing fields', description: 'State/Province is required', variant: 'destructive' }); return
    }
    if (!formData.country) {
      toast({ title: 'Missing fields', description: 'Country is required', variant: 'destructive' }); return
    }
    if (!formData.accountPayableBy) {
      toast({ title: 'Missing fields', description: 'Account payable by is required', variant: 'destructive' }); return
    }

    // Enhanced date validation
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
      toast({ title: 'Date conflict', description: 'This room is already booked for the selected dates.', variant: 'destructive' }); return
    }
    if (!formData.agreedToTerms) {
      toast({ title: 'Terms not accepted', description: 'Please agree to the terms and conditions', variant: 'destructive' }); return
    }

    setIsSaving(true)

    const safeParseDate = (d: string | Date): Date => {
      const date = new Date(d)
      return isNaN(date.getTime()) ? new Date() : date
    }

    const guestData: any = {
      ...(selectedGuest && { id: selectedGuest.id }),
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
      dateOut: safeParseDate(formData.dateOut!),
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
      signatureDate: safeParseDate(formData.signatureDate),
      signatureData: formData.signatureData || '',
      loyaltyTier: selectedGuest?.loyaltyTier || 'bronze',
      loyaltyPoints: selectedGuest?.loyaltyPoints || 0,
      totalStays: selectedGuest ? selectedGuest.totalStays + 1 : 1,
      totalSpent: selectedGuest?.totalSpent || 0,
      notes: selectedGuest?.notes || '',
      tags: selectedGuest?.tags || [],
    }

    try {
      if (selectedGuest?.id) {
        await axios.patch(`/api/guests/${selectedGuest.id}`, guestData)
        toast({ title: 'Guest updated', description: `${guestData.firstName} ${guestData.surname} has been updated.` })
      } else {
        await axios.post('/api/guests', guestData)
        toast({ title: 'Guest registered', description: `${guestData.firstName} ${guestData.surname} has been registered.` })
      }
      onSuccess?.()
      onClose?.()
    } catch (error: any) {
      console.error('Error saving guest:', error.response?.data)
      let errorMessage = 'Failed to save guest'
      if (error.response?.data?.error) errorMessage = error.response.data.error
      if (Array.isArray(error.response?.data?.details)) {
        errorMessage = error.response.data.details.map((d: any) => `${d.field}: ${d.message}`).join(', ')
      }
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' })
    } finally {
      setIsSaving(false)
    }
  }

  if (step === 'search') {
    return (
        <div className="space-y-4">
          <div className="flex justify-center mb-4">
            <div className="relative w-12 h-12">
              <Image src="/logo.png" alt="OmniHotel Pro Logo" fill className="object-contain" />
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
                placeholder="Search by name, email, phone, or ID/Passport..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                autoFocus
            />
          </div>

          {isSearching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
          )}

          {!isSearching && searchResults.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Found {searchResults.length} matching guest{searchResults.length > 1 ? 's' : ''}
                </p>
                <div className="space-y-2 max-h-75 overflow-y-auto">
                  {searchResults.map((g) => (
                      <Card key={g.id} className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => handleSelectGuest(g)}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                                {g.firstName?.[0]}{g.surname?.[0]}
                              </div>
                              <div>
                                <p className="font-medium">{g.title} {g.firstName} {g.surname}</p>
                                <p className="text-sm text-muted-foreground">{g.email}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="capitalize">{getLoyaltyTierConfig(g.loyaltyTier).name}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">{g.totalStays} stays</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  ))}
                </div>
              </div>
          )}

          {!isSearching && searchQuery.length >= 2 && searchResults.length === 0 && (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No matching guests found</p>
              </div>
          )}

          <Separator />
          <Button onClick={handleNewGuest} className="w-full">Register New Guest</Button>
        </div>
    )
  }

  return (
      <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
        <div className="flex justify-center mb-4">
          <div className="relative w-12 h-12">
            <Image src="/logo.png" alt="OmniHotel Pro Logo" fill className="object-contain" />
          </div>
        </div>

        {selectedGuest && (
            <Card className="bg-accent/30 border-accent">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Check className="size-5 text-accent-foreground" />
                  <div>
                    <p className="font-medium">Returning Guest Recognized</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedGuest.title} {selectedGuest.firstName} {selectedGuest.surname} — {getLoyaltyTierConfig(selectedGuest.loyaltyTier).name} member with {selectedGuest.totalStays} previous stays
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
        )}

        {/* Primary Guest */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Primary Guest</h3>
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Select value={formData.title} onValueChange={(v) => updateForm('title', v)}>
                <SelectTrigger id="title"><SelectValue placeholder="Title" /></SelectTrigger>
                <SelectContent>
                  {['Mr.', 'Mrs.', 'Ms.', 'Miss', 'Dr.'].map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-3 space-y-2">
              <Label htmlFor="surname">Surname *</Label>
              <Input id="surname" value={formData.surname} onChange={(e) => updateForm('surname', e.target.value)} placeholder="Surname" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input id="nationality" value={formData.nationality} onChange={(e) => updateForm('nationality', e.target.value)} placeholder="Nationality" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name *</Label>
              <Input id="firstName" value={formData.firstName} onChange={(e) => updateForm('firstName', e.target.value)} placeholder="First Name" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="idPassportNumber">ID/Passport Number *</Label>
            <Input id="idPassportNumber" value={formData.idPassportNumber} onChange={(e) => updateForm('idPassportNumber', e.target.value)} placeholder="ID/Passport Number" />
          </div>
        </div>

        <Separator />

        {/* Party Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Party Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Number of Adults</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" onClick={() => updateForm('numberOfAdults', Math.max(1, formData.numberOfAdults - 1))}><Minus className="size-4" /></Button>
                <span className="w-8 text-center font-medium">{formData.numberOfAdults}</span>
                <Button type="button" variant="outline" size="icon" onClick={() => updateForm('numberOfAdults', formData.numberOfAdults + 1)}><Plus className="size-4" /></Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Number of Children</Label>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="icon" onClick={() => handleChildrenCountChange(formData.numberOfChildren - 1)}><Minus className="size-4" /></Button>
                <span className="w-8 text-center font-medium">{formData.numberOfChildren}</span>
                <Button type="button" variant="outline" size="icon" onClick={() => handleChildrenCountChange(formData.numberOfChildren + 1)}><Plus className="size-4" /></Button>
              </div>
            </div>
            {formData.numberOfChildren > 0 && (
                <div className="space-y-2">
                  <Label>Ages</Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.childrenAges.map((age, index) => (
                        <Input key={index} type="number" min="0" max="17" value={age} onChange={(e) => updateChildAge(index, e.target.value)} className="w-14" placeholder={`#${index + 1}`} />
                    ))}
                  </div>
                </div>
            )}
          </div>
        </div>

        {/* Other Adult */}
        {formData.numberOfAdults > 1 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Other Adult</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="otherAdultSurname">Surname</Label>
                    <Input id="otherAdultSurname" value={formData.otherAdultSurname} onChange={(e) => updateForm('otherAdultSurname', e.target.value)} placeholder="Surname" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherAdultFirstName">First Name</Label>
                    <Input id="otherAdultFirstName" value={formData.otherAdultFirstName} onChange={(e) => updateForm('otherAdultFirstName', e.target.value)} placeholder="First Name" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="otherAdultNationality">Nationality</Label>
                    <Input id="otherAdultNationality" value={formData.otherAdultNationality} onChange={(e) => updateForm('otherAdultNationality', e.target.value)} placeholder="Nationality" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="otherAdultIdPassport">ID/Passport Number</Label>
                    <Input id="otherAdultIdPassport" value={formData.otherAdultIdPassport} onChange={(e) => updateForm('otherAdultIdPassport', e.target.value)} placeholder="ID/Passport Number" />
                  </div>
                </div>
              </div>
            </>
        )}

        <Separator />

        {/* Address */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Address</h3>
          <div className="space-y-2">
            <Label htmlFor="postalAddress">Postal Address</Label>
            <Input id="postalAddress" value={formData.postalAddress} onChange={(e) => updateForm('postalAddress', e.target.value)} placeholder="Postal Address" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="residentialAddress">Residential Address *</Label>
            <Input id="residentialAddress" value={formData.residentialAddress} onChange={(e) => updateForm('residentialAddress', e.target.value)} placeholder="Residential Address" required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input id="city" value={formData.city} onChange={(e) => updateForm('city', e.target.value)} placeholder="City" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stateProvince">State/Province *</Label>
              <Input id="stateProvince" value={formData.stateProvince} onChange={(e) => updateForm('stateProvince', e.target.value)} placeholder="State/Province" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Input id="country" value={formData.country} onChange={(e) => updateForm('country', e.target.value)} placeholder="Country" required />
            </div>
          </div>
        </div>

        <Separator />

        {/* Contact */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Contact Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telHome">Tel. No. (Home)</Label>
              <Input id="telHome" type="tel" value={formData.telHome} onChange={(e) => updateForm('telHome', e.target.value)} placeholder="Home Phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telBusiness">Tel. No. (Business)</Label>
              <Input id="telBusiness" type="tel" value={formData.telBusiness} onChange={(e) => updateForm('telBusiness', e.target.value)} placeholder="Business Phone" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cellphone">Cellphone No. *</Label>
              <Input id="cellphone" type="tel" value={formData.cellphone} onChange={(e) => updateForm('cellphone', e.target.value)} placeholder="Cellphone" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={formData.email} onChange={(e) => updateForm('email', e.target.value)} placeholder="Email" required />
            </div>
          </div>
        </div>

        <Separator />

        {/* Stay Information */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Stay Information</h3>

          {/* Room No. */}
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="roomNumber">Room No. *</Label>
              <Select value={formData.roomNumber} onValueChange={(v) => updateForm('roomNumber', v)} disabled={isLoadingRooms}>
                <SelectTrigger id="roomNumber">
                  <SelectValue placeholder={isLoadingRooms ? 'Loading rooms...' : 'Select Room'} />
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
                        {isLoadingRooms ? 'Loading...' : 'No rooms available'}
                      </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Date In / Date Out */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Date In *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                      variant="outline"
                      className={cn(
                          "w-full justify-start text-left font-normal",
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
                                // Only show "Already booked" for future dates that are booked
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
              <Label>Date Out *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                      variant="outline"
                      className={cn(
                          "w-full justify-start text-left font-normal",
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
                              const ci = new Date(formData.dateIn);
                              ci.setHours(0, 0, 0, 0);
                              return d <= ci || isDateBooked(d);
                            }}
                            modifiers={{
                              booked: (date) => {
                                const d = new Date(date);
                                d.setHours(0, 0, 0, 0);
                                const ci = new Date(formData.dateIn);
                                ci.setHours(0, 0, 0, 0);
                                // Only show "Already booked" for dates on or after check-in that are booked
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="accountPayableBy">Account Payable By *</Label>
              <Input id="accountPayableBy" value={formData.accountPayableBy} onChange={(e) => updateForm('accountPayableBy', e.target.value)} placeholder="Guest / Company Name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vehicleRegNo">Vehicle Reg. No.</Label>
              <Input id="vehicleRegNo" value={formData.vehicleRegNo} onChange={(e) => updateForm('vehicleRegNo', e.target.value)} placeholder="Vehicle Registration" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="breakfastTime">Breakfast Time</Label>
            <Select value={formData.breakfastTime} onValueChange={(v) => updateForm('breakfastTime', v)}>
              <SelectTrigger id="breakfastTime" className="w-50">
                <SelectValue placeholder="Select Time" />
              </SelectTrigger>
              <SelectContent>
                {['06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator />

        {/* Food Preferences */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Food Preferences</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label>Beef</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="beefYes" checked={formData.beefYes} onCheckedChange={(checked) => { updateForm('beefYes', !!checked); if (checked) updateForm('beefNo', false) }} />
                  <Label htmlFor="beefYes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="beefNo" checked={formData.beefNo} onCheckedChange={(checked) => { updateForm('beefNo', !!checked); if (checked) updateForm('beefYes', false) }} />
                  <Label htmlFor="beefNo" className="font-normal">No</Label>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Label>Pork</Label>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox id="porkYes" checked={formData.porkYes} onCheckedChange={(checked) => { updateForm('porkYes', !!checked); if (checked) updateForm('porkNo', false) }} />
                  <Label htmlFor="porkYes" className="font-normal">Yes</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox id="porkNo" checked={formData.porkNo} onCheckedChange={(checked) => { updateForm('porkNo', !!checked); if (checked) updateForm('porkYes', false) }} />
                  <Label htmlFor="porkNo" className="font-normal">No</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Egg</Label>
            <RadioGroup value={formData.eggStyle} onValueChange={(v) => updateForm('eggStyle', v)} className="flex flex-wrap gap-4">
              {[{ value: 'fried', label: 'Fried' }, { value: 'scrambled', label: 'Scrambled' }, { value: 'boiled', label: 'Boiled' }, { value: 'omelet', label: 'Omelet' }].map(opt => (
                  <div key={opt.value} className="flex items-center gap-2">
                    <RadioGroupItem value={opt.value} id={`egg-${opt.value}`} />
                    <Label htmlFor={`egg-${opt.value}`} className="font-normal">{opt.label}</Label>
                  </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label>Serve Dinner</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox id="serveDinnerYes" checked={formData.serveDinner} onCheckedChange={(checked) => updateForm('serveDinner', !!checked)} />
                <Label htmlFor="serveDinnerYes" className="font-normal">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="serveDinnerNo" checked={!formData.serveDinner} onCheckedChange={(checked) => updateForm('serveDinner', !checked)} />
                <Label htmlFor="serveDinnerNo" className="font-normal">No</Label>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Agreement */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Agreement</h3>
          <div className="bg-muted/50 p-4 rounded-md text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2">I agree to the following conditions:</p>
            <p>
              It is an express condition of your occupation or visit of or to these premises that the Proprietor is NOT responsible for loss
              or damage to property or injury of any visitor which is or may be brought upon these premises arising from negligence or
              wrongful act of any person in employ of the Proprietor. Any money or valuables may be handed in to the Proprietor for
              custody when a special receipt will be issued accordingly.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="agreedToTerms" checked={formData.agreedToTerms} onCheckedChange={(checked) => updateForm('agreedToTerms', !!checked)} />
            <Label htmlFor="agreedToTerms" className="font-normal">I agree to the terms and conditions *</Label>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label htmlFor="signatureDate">Date</Label>
              <Input id="signatureDate" type="date" value={formData.signatureDate} onChange={(e) => updateForm('signatureDate', e.target.value)} />
            </div>
            <SignaturePad value={formData.signatureData} onChange={(signatureData) => updateForm('signatureData', signatureData)} label="Digital Signature" />
          </div>
        </div>

        <div className="flex justify-between pt-4 sticky bottom-0 bg-background pb-2">
          {!guest && (
              <Button variant="outline" onClick={() => setStep('search')}>Back to Search</Button>
          )}
          <div className={guest ? 'ml-auto' : ''}>
            <Button onClick={handleSave} disabled={isSaving || !formData.agreedToTerms || dateConflict}>
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {guest ? 'Update Guest' : 'Register Guest'}
            </Button>
          </div>
        </div>
      </div>
  )
}