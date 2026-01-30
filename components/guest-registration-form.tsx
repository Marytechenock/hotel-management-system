'use client'

import { useState, useEffect } from 'react'
import { Search, Check, Loader2, Plus, Minus } from 'lucide-react'
import axios from 'axios';
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { SignaturePad } from '@/components/signature-pad'
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
} from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import type { Guest } from '@/lib/types'
import { useAppStore } from '@/lib/store'

interface Room {
  id: string;
  number: string;
  [key: string]: any;
}

interface GuestRegistrationFormProps {
  onClose?: () => void
  guest?: Guest // For edit mode
  onSuccess?: () => void // Callback for successful operations
}

export function GuestRegistrationForm({ onClose, guest, onSuccess }: GuestRegistrationFormProps) {
  const { currentProperty } = useAppStore()
  const [step, setStep] = useState<'search' | 'form'>('search')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Guest[]>([])
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(guest || null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Add state for rooms
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

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
          params: { propertyId: currentProperty.id } 
        });
        
        // Ensure response.data is an array
        const roomsData = response.data;
        if (Array.isArray(roomsData)) {
          setRooms(roomsData);
        } else if (roomsData && typeof roomsData === 'object') {
          // If it's an object with a data property
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

    fetchRooms();
  }, [currentProperty])

  // Handle edit mode
  useEffect(() => {
    if (guest) {
      setStep('form')
      setSelectedGuest(guest)
      setFormData({
        // Primary Guest
        title: guest.title || '',
        surname: guest.surname || '',
        firstName: guest.firstName || '',
        nationality: guest.nationality || '',
        idPassportNumber: guest.idPassportNumber || '',
        
        // Party Info
        numberOfAdults: guest.numberOfAdults || 1,
        numberOfChildren: guest.numberOfChildren || 0,
        childrenAges: guest.childrenAges?.map(String) || [],
        
        // Other Adult
        otherAdultSurname: guest.otherAdult?.surname || '',
        otherAdultFirstName: guest.otherAdult?.firstName || '',
        otherAdultNationality: guest.otherAdult?.nationality || '',
        otherAdultIdPassport: guest.otherAdult?.idPassportNumber || '',
        
        // Address
        postalAddress: guest.postalAddress || '',
        residentialAddress: guest.residentialAddress || '',
        city: guest.city || '',
        stateProvince: guest.stateProvince || '',
        country: guest.country || '',
        
        // Contact
        telHome: guest.telHome || '',
        telBusiness: guest.telBusiness || '',
        cellphone: guest.cellphone || '',
        email: guest.email || '',
        
        // Stay Info
        dateIn: guest.dateIn ? new Date(guest.dateIn).toISOString().split('T')[0] : '',
        dateOut: guest.dateOut ? new Date(guest.dateOut).toISOString().split('T')[0] : '',
        roomNumber: guest.roomNumber || '',
        accountPayableBy: guest.accountPayableBy || '',
        vehicleRegNo: guest.vehicleRegNo || '',
        breakfastTime: guest.breakfastTime || '',
        
        // Food Preferences
        beefYes: guest.preferences?.beef || false,
        beefNo: !guest.preferences?.beef,
        porkYes: guest.preferences?.pork || false,
        porkNo: !guest.preferences?.pork,
        eggStyle: guest.preferences?.eggStyle || '',
        serveDinner: guest.serveDinner || false,
        
        // Agreement
        agreedToTerms: guest.agreedToTerms || false,
        signatureDate: guest.signatureDate ? new Date(guest.signatureDate).toISOString().split('T')[0] : '',
        signatureData: guest.signatureData || '',
      })
    }
  }, [guest]);

  // Fuzzy search with debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const fetch = async () => {
      setIsSearching(true)
      const results = await searchGuests(searchQuery)
      setSearchResults(results)
      setIsSearching(false)
    }

    fetch()
  }, [searchQuery])
  
  // Form state matching the physical registration form
  const [formData, setFormData] = useState({
    // Primary Guest
    title: '',
    surname: '',
    firstName: '',
    nationality: '',
    idPassportNumber: '',
    
    // Party Info
    numberOfAdults: 1,
    numberOfChildren: 0,
    childrenAges: [] as string[],
    
    // Other Adult
    otherAdultSurname: '',
    otherAdultFirstName: '',
    otherAdultNationality: '',
    otherAdultIdPassport: '',
    
    // Address
    postalAddress: '',
    residentialAddress: '',
    city: '',
    stateProvince: '',
    country: '',
    
    // Contact
    telHome: '',
    telBusiness: '',
    cellphone: '',
    email: '',
    
    // Stay Info
    dateIn: '',
    dateOut: '',
    roomNumber: '',
    accountPayableBy: '',
    vehicleRegNo: '',
    breakfastTime: '',
    
    // Food Preferences
    beefYes: false,
    beefNo: false,
    porkYes: false,
    porkNo: false,
    eggStyle: '' as 'fried' | 'scrambled' | 'boiled' | 'omelet' | '',
    serveDinner: false,
    
    // Agreement
    agreedToTerms: false,
    signatureDate: '',
    signatureData: '',
  })

  const searchGuests = async (query: string) => {
    try {
      const response = await axios.get('/api/guests', { params: { query } })
      return response.data
    } catch (error) {
      console.error(error)
      return []
    }
  }

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  // Pre-populate form when guest is selected
  const handleSelectGuest = (guest: Guest) => {
    setSelectedGuest(guest)
    setFormData({
      title: guest.title,
      surname: guest.surname,
      firstName: guest.firstName,
      nationality: guest.nationality,
      idPassportNumber: guest.idPassportNumber,
      numberOfAdults: guest.numberOfAdults,
      numberOfChildren: guest.numberOfChildren,
      childrenAges: guest.childrenAges.map(String),
      otherAdultSurname: guest.otherAdult?.surname || '',
      otherAdultFirstName: guest.otherAdult?.firstName || '',
      otherAdultNationality: guest.otherAdult?.nationality || '',
      otherAdultIdPassport: guest.otherAdult?.idPassportNumber || '',
      postalAddress: guest.postalAddress,
      residentialAddress: guest.residentialAddress,
      city: guest.city,
      stateProvince: guest.stateProvince,
      country: guest.country,
      telHome: guest.telHome,
      telBusiness: guest.telBusiness,
      cellphone: guest.cellphone,
      email: guest.email,
      dateIn: new Date().toISOString().split('T')[0],
      dateOut: '',
      roomNumber: '',
      accountPayableBy: guest.accountPayableBy,
      vehicleRegNo: guest.vehicleRegNo,
      breakfastTime: guest.breakfastTime,
      beefYes: guest.preferences.beef,
      beefNo: !guest.preferences.beef,
      porkYes: guest.preferences.pork,
      porkNo: !guest.preferences.pork,
      eggStyle: guest.preferences.eggStyle || '',
      serveDinner: guest.serveDinner,
      agreedToTerms: false,
      signatureDate: new Date().toISOString().split('T')[0],
      signatureData: guest.signatureData || '',
    })
    setStep('form')
  }

  const handleNewGuest = () => {
    setSelectedGuest(null)
    setFormData({
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
      dateIn: new Date().toISOString().split('T')[0],
      dateOut: '',
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
    })
    setStep('form')
  }

  const handleSave = async () => {
    setIsSaving(true)
    
    // Transform form data to match Guest type expected by API
    const guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
      // Include existing guest ID if updating
      ...(selectedGuest && { id: selectedGuest.id }),
      
      // Primary Guest Info
      title: formData.title,
      surname: formData.surname,
      firstName: formData.firstName,
      nationality: formData.nationality,
      idPassportNumber: formData.idPassportNumber,
      
      // Party Info
      numberOfAdults: formData.numberOfAdults,
      numberOfChildren: formData.numberOfChildren,
      childrenAges: formData.childrenAges.filter(age => age !== '').map(Number),
      
      // Other Adult (only include if there's data)
      otherAdult: formData.otherAdultSurname || formData.otherAdultFirstName ? {
        surname: formData.otherAdultSurname,
        firstName: formData.otherAdultFirstName,
        nationality: formData.otherAdultNationality,
        idPassportNumber: formData.otherAdultIdPassport,
      } : undefined,
      
      // Address Info
      postalAddress: formData.postalAddress,
      residentialAddress: formData.residentialAddress,
      city: formData.city,
      stateProvince: formData.stateProvince,
      country: formData.country,
      
      // Contact Info
      telHome: formData.telHome,
      telBusiness: formData.telBusiness,
      cellphone: formData.cellphone,
      email: formData.email,
      
      // Stay Info
      dateIn: new Date(formData.dateIn),
      dateOut: new Date(formData.dateOut),
      roomNumber: formData.roomNumber,
      accountPayableBy: formData.accountPayableBy,
      vehicleRegNo: formData.vehicleRegNo,
      breakfastTime: formData.breakfastTime,
      
      // Food Preferences - transform from yes/no checkboxes to booleans
      preferences: {
        beef: formData.beefYes,
        pork: formData.porkYes,
        eggStyle: formData.eggStyle || null,
        dietaryRestrictions: [],
        specialRequests: [],
        // Legacy fields for room preferences
        roomType: '',
        floorPreference: 'high', // Default to High
        bedType: 'king',
      },
      serveDinner: formData.serveDinner,
      
      // Agreement
      agreedToTerms: formData.agreedToTerms,
      signatureDate: new Date(formData.signatureDate),
      signatureData: formData.signatureData,
      
      // System Fields - defaults for new guests, preserve for existing
      loyaltyTier: selectedGuest?.loyaltyTier || 'bronze',
      loyaltyPoints: selectedGuest?.loyaltyPoints || 0,
      totalStays: selectedGuest ? 
        // For existing guests, increment stays if this is a new booking (different dates)
        (formData.dateIn !== new Date(selectedGuest.dateIn).toISOString().split('T')[0] || 
         formData.dateOut !== new Date(selectedGuest.dateOut).toISOString().split('T')[0]) 
          ? selectedGuest.totalStays + 1 
          : selectedGuest.totalStays
        : 1, // New guest starts with 1 stay
      totalSpent: selectedGuest?.totalSpent || 0,
      notes: selectedGuest?.notes,
      tags: selectedGuest?.tags || [],
    }
    
    console.log('[v0] Guest data being sent to API:', JSON.stringify(guestData, null, 2))
    
    // Make API call
    try {
      if (selectedGuest?.id) {
        // Update existing guest
        await axios.patch(`/api/guests/${selectedGuest.id}`, guestData)
        console.log('[v0] Guest updated successfully')
      } else {
        // Create new guest
        await axios.post('/api/guests', guestData)
        console.log('[v0] Guest saved successfully')
      }
      
      // Call onSuccess callback if provided
      onSuccess?.()
      
      // Handle successful API call
      onClose?.()
    } catch (error) {
      // Handle API error
      console.error('[v0] Error saving guest:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const updateForm = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleChildrenCountChange = (count: number) => {
    const newCount = Math.max(0, Math.min(10, count))
    const currentAges = [...formData.childrenAges]
    
    if (newCount > currentAges.length) {
      // Add empty age fields
      while (currentAges.length < newCount) {
        currentAges.push('')
      }
    } else {
      // Remove excess age fields
      currentAges.length = newCount
    }
    
    setFormData(prev => ({
      ...prev,
      numberOfChildren: newCount,
      childrenAges: currentAges,
    }))
  }

  const updateChildAge = (index: number, age: string) => {
    const newAges = [...formData.childrenAges]
    newAges[index] = age
    updateForm('childrenAges', newAges)
  }

  if (step === 'search') {
    return (
      <div className="space-y-4">
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
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {searchResults.map((guest) => (
                <Card 
                  key={guest.id} 
                  className="cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => handleSelectGuest(guest)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                          {guest.firstName[0]}{guest.surname[0]}
                        </div>
                        <div>
                          <p className="font-medium">{guest.title} {guest.firstName} {guest.surname}</p>
                          <p className="text-sm text-muted-foreground">{guest.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="capitalize">{guest.loyaltyTier}</Badge>
                        <p className="text-xs text-muted-foreground mt-1">{guest.totalStays} stays</p>
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

        <Button onClick={handleNewGuest} className="w-full">
          Register New Guest
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {selectedGuest && (
        <Card className="bg-accent/30 border-accent">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Check className="size-5 text-accent-foreground" />
              <div>
                <p className="font-medium">Returning Guest Recognized</p>
                <p className="text-sm text-muted-foreground">
                  {selectedGuest.title} {selectedGuest.firstName} {selectedGuest.surname} - {selectedGuest.loyaltyTier} member with {selectedGuest.totalStays} previous stays
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Primary Guest Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Primary Guest</h3>
        
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Select value={formData.title} onValueChange={(v) => updateForm('title', v)}>
              <SelectTrigger id="title">
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
          <div className="col-span-3 space-y-2">
            <Label htmlFor="surname">Surname *</Label>
            <Input
              id="surname"
              value={formData.surname}
              onChange={(e) => updateForm('surname', e.target.value)}
              placeholder="Surname"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={formData.nationality}
              onChange={(e) => updateForm('nationality', e.target.value)}
              placeholder="Nationality"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => updateForm('firstName', e.target.value)}
              placeholder="First Name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="idPassportNumber">ID/Passport Number *</Label>
          <Input
            id="idPassportNumber"
            value={formData.idPassportNumber}
            onChange={(e) => updateForm('idPassportNumber', e.target.value)}
            placeholder="ID/Passport Number"
          />
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
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => updateForm('numberOfAdults', Math.max(1, formData.numberOfAdults - 1))}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-8 text-center font-medium">{formData.numberOfAdults}</span>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => updateForm('numberOfAdults', formData.numberOfAdults + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Number of Children</Label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => handleChildrenCountChange(formData.numberOfChildren - 1)}
              >
                <Minus className="size-4" />
              </Button>
              <span className="w-8 text-center font-medium">{formData.numberOfChildren}</span>
              <Button 
                type="button" 
                variant="outline" 
                size="icon"
                onClick={() => handleChildrenCountChange(formData.numberOfChildren + 1)}
              >
                <Plus className="size-4" />
              </Button>
            </div>
          </div>
          {formData.numberOfChildren > 0 && (
            <div className="space-y-2">
              <Label>Ages</Label>
              <div className="flex flex-wrap gap-2">
                {formData.childrenAges.map((age, index) => (
                  <Input
                    key={index}
                    type="number"
                    min="0"
                    max="17"
                    value={age}
                    onChange={(e) => updateChildAge(index, e.target.value)}
                    className="w-14"
                    placeholder={`#${index + 1}`}
                  />
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
                <Input
                  id="otherAdultSurname"
                  value={formData.otherAdultSurname}
                  onChange={(e) => updateForm('otherAdultSurname', e.target.value)}
                  placeholder="Surname"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherAdultFirstName">First Name</Label>
                <Input
                  id="otherAdultFirstName"
                  value={formData.otherAdultFirstName}
                  onChange={(e) => updateForm('otherAdultFirstName', e.target.value)}
                  placeholder="First Name"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="otherAdultNationality">Nationality</Label>
                <Input
                  id="otherAdultNationality"
                  value={formData.otherAdultNationality}
                  onChange={(e) => updateForm('otherAdultNationality', e.target.value)}
                  placeholder="Nationality"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="otherAdultIdPassport">ID/Passport Number</Label>
                <Input
                  id="otherAdultIdPassport"
                  value={formData.otherAdultIdPassport}
                  onChange={(e) => updateForm('otherAdultIdPassport', e.target.value)}
                  placeholder="ID/Passport Number"
                />
              </div>
            </div>
          </div>
        </>
      )}

      <Separator />

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Address</h3>
        
        <div className="space-y-2">
          <Label htmlFor="postalAddress">Postal Address</Label>
          <Input
            id="postalAddress"
            value={formData.postalAddress}
            onChange={(e) => updateForm('postalAddress', e.target.value)}
            placeholder="Postal Address"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="residentialAddress">Residential Address</Label>
          <Input
            id="residentialAddress"
            value={formData.residentialAddress}
            onChange={(e) => updateForm('residentialAddress', e.target.value)}
            placeholder="Residential Address"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => updateForm('city', e.target.value)}
              placeholder="City"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="stateProvince">State/Province</Label>
            <Input
              id="stateProvince"
              value={formData.stateProvince}
              onChange={(e) => updateForm('stateProvince', e.target.value)}
              placeholder="State/Province"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={formData.country}
              onChange={(e) => updateForm('country', e.target.value)}
              placeholder="Country"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Contact Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="telHome">Tel. No. (Home)</Label>
            <Input
              id="telHome"
              type="tel"
              value={formData.telHome}
              onChange={(e) => updateForm('telHome', e.target.value)}
              placeholder="Home Phone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="telBusiness">Tel. No. (Business)</Label>
            <Input
              id="telBusiness"
              type="tel"
              value={formData.telBusiness}
              onChange={(e) => updateForm('telBusiness', e.target.value)}
              placeholder="Business Phone"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cellphone">Cellphone No. *</Label>
            <Input
              id="cellphone"
              type="tel"
              value={formData.cellphone}
              onChange={(e) => updateForm('cellphone', e.target.value)}
              placeholder="Cellphone"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => updateForm('email', e.target.value)}
              placeholder="Email"
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Stay Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Stay Information</h3>
        
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateIn">Date In *</Label>
            <Input
              id="dateIn"
              type="date"
              value={formData.dateIn}
              onChange={(e) => updateForm('dateIn', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateOut">Date Out *</Label>
            <Input
              id="dateOut"
              type="date"
              value={formData.dateOut}
              onChange={(e) => updateForm('dateOut', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roomNumber">Room No. *</Label>
            <Select 
              value={formData.roomNumber} 
              onValueChange={(v) => updateForm('roomNumber', v)}
              disabled={isLoadingRooms}
            >
              <SelectTrigger id="roomNumber">
                <SelectValue placeholder={isLoadingRooms ? "Loading rooms..." : "Select Room"} />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(rooms) && rooms.length > 0 ? (
                  rooms.map((room: Room) => (
                    <SelectItem key={room.id} value={room.number}>
                      {room.number}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    {isLoadingRooms ? "Loading..." : "No rooms available"}
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="accountPayableBy">Account Payable By</Label>
            <Input
              id="accountPayableBy"
              value={formData.accountPayableBy}
              onChange={(e) => updateForm('accountPayableBy', e.target.value)}
              placeholder="Guest / Company Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="vehicleRegNo">Vehicle Reg. No.</Label>
            <Input
              id="vehicleRegNo"
              value={formData.vehicleRegNo}
              onChange={(e) => updateForm('vehicleRegNo', e.target.value)}
              placeholder="Vehicle Registration"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="breakfastTime">Breakfast Time</Label>
          <Select value={formData.breakfastTime} onValueChange={(v) => updateForm('breakfastTime', v)}>
            <SelectTrigger id="breakfastTime" className="w-[200px]">
              <SelectValue placeholder="Select Time" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="06:00">06:00</SelectItem>
              <SelectItem value="06:30">06:30</SelectItem>
              <SelectItem value="07:00">07:00</SelectItem>
              <SelectItem value="07:30">07:30</SelectItem>
              <SelectItem value="08:00">08:00</SelectItem>
              <SelectItem value="08:30">08:30</SelectItem>
              <SelectItem value="09:00">09:00</SelectItem>
              <SelectItem value="09:30">09:30</SelectItem>
              <SelectItem value="10:00">10:00</SelectItem>
              <SelectItem value="10:30">10:30</SelectItem>
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
                <Checkbox 
                  id="beefYes" 
                  checked={formData.beefYes}
                  onCheckedChange={(checked) => {
                    updateForm('beefYes', !!checked)
                    if (checked) updateForm('beefNo', false)
                  }}
                />
                <Label htmlFor="beefYes" className="font-normal">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="beefNo" 
                  checked={formData.beefNo}
                  onCheckedChange={(checked) => {
                    updateForm('beefNo', !!checked)
                    if (checked) updateForm('beefYes', false)
                  }}
                />
                <Label htmlFor="beefNo" className="font-normal">No</Label>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label>Pork</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="porkYes" 
                  checked={formData.porkYes}
                  onCheckedChange={(checked) => {
                    updateForm('porkYes', !!checked)
                    if (checked) updateForm('porkNo', false)
                  }}
                />
                <Label htmlFor="porkYes" className="font-normal">Yes</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="porkNo" 
                  checked={formData.porkNo}
                  onCheckedChange={(checked) => {
                    updateForm('porkNo', !!checked)
                    if (checked) updateForm('porkYes', false)
                  }}
                />
                <Label htmlFor="porkNo" className="font-normal">No</Label>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <Label>Egg</Label>
          <RadioGroup 
            value={formData.eggStyle} 
            onValueChange={(v) => updateForm('eggStyle', v)}
            className="flex flex-wrap gap-4"
          >
            <div className="flex items-center gap-2">
              <RadioGroupItem value="fried" id="eggFried" />
              <Label htmlFor="eggFried" className="font-normal">Fried</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="scrambled" id="eggScrambled" />
              <Label htmlFor="eggScrambled" className="font-normal">Scrambled</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="boiled" id="eggBoiled" />
              <Label htmlFor="eggBoiled" className="font-normal">Boiled</Label>
            </div>
            <div className="flex items-center gap-2">
              <RadioGroupItem value="omelet" id="eggOmelet" />
              <Label htmlFor="eggOmelet" className="font-normal">Omelet</Label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <Label>Serve Dinner</Label>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="serveDinnerYes" 
                checked={formData.serveDinner}
                onCheckedChange={(checked) => updateForm('serveDinner', !!checked)}
              />
              <Label htmlFor="serveDinnerYes" className="font-normal">Yes</Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox 
                id="serveDinnerNo" 
                checked={!formData.serveDinner}
                onCheckedChange={(checked) => updateForm('serveDinner', !checked)}
              />
              <Label htmlFor="serveDinnerNo" className="font-normal">No</Label>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Terms and Signature */}
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
          <Checkbox 
            id="agreedToTerms" 
            checked={formData.agreedToTerms}
            onCheckedChange={(checked) => updateForm('agreedToTerms', !!checked)}
          />
          <Label htmlFor="agreedToTerms" className="font-normal">
            I agree to the terms and conditions *
          </Label>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="signatureDate">Date</Label>
            <Input
              id="signatureDate"
              type="date"
              value={formData.signatureDate}
              onChange={(e) => updateForm('signatureDate', e.target.value)}
            />
          </div>
          <SignaturePad
            value={formData.signatureData}
            onChange={(signatureData) => updateForm('signatureData', signatureData)}
            label="Digital Signature"
          />
        </div>
      </div>

      <div className="flex justify-between pt-4 sticky bottom-0 bg-background pb-2">
        {!guest && (
          <Button variant="outline" onClick={() => setStep('search')}>
            Back to Search
          </Button>
        )}
        <div className={guest ? 'ml-auto' : ''}>
          <Button onClick={handleSave} disabled={isSaving || !formData.agreedToTerms}>
            {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
            {guest ? 'Update Guest' : 'Register Guest'}
          </Button>
        </div>
      </div>
    </div>
  )
}