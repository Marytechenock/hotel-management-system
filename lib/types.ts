// Core Types for OmniHotel Pro

export interface Property {
  id: string
  name: string
  code: string
  address: string
  city: string
  country: string
  phone: string
  email: string
  timezone: string
  currency: string
  totalRooms: number
  createdAt: Date
}

// Guest Registration Form structure based on physical form
export interface Guest {
  id: string
  // Primary Guest Info
  title: string
  surname: string
  firstName: string
  nationality: string
  idPassportNumber: string
  
  // Party Info
  numberOfAdults: number
  numberOfChildren: number
  childrenAges: number[]
  
  // Other Adult (companion)
  otherAdult?: {
    surname: string
    firstName: string
    nationality: string
    idPassportNumber: string
  }
  
  // Address Info
  postalAddress: string
  residentialAddress: string
  city: string
  stateProvince: string
  country: string
  
  // Contact Info
  telHome: string
  telBusiness: string
  cellphone: string
  email: string
  
  // Stay Info
  dateIn: Date
  dateOut: Date
  roomNumber: string
  accountPayableBy: string
  vehicleRegNo: string
  breakfastTime: string
  
  // Food Preferences
  preferences: GuestPreferences
  serveDinner: boolean
  
  // Agreement
  agreedToTerms: boolean
  signatureDate: Date
  
  // System Fields
  loyaltyTier: 'bronze' | 'silver' | 'gold' | 'platinum'
  loyaltyPoints: number
  totalStays: number
  totalSpent: number
  notes?: string
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface GuestPreferences {
  beef: boolean
  pork: boolean
  eggStyle: 'fried' | 'scrambled' | 'boiled' | 'omelet' | null
  dietaryRestrictions?: string[]
  specialRequests?: string[]
  // Legacy fields for room preferences
  roomType?: string
  floorPreference?: 'high' | 'low' | 'any'
  bedType?: 'king' | 'queen' | 'twin'
}

export interface Room {
  id: string
  propertyId: string
  number: string
  floor: number
  type: RoomType
  status: RoomStatus
  maxOccupancy: number
  baseRate: number
  amenities: string[]
  lastCleaned?: Date
  notes?: string
}

export type RoomType = 'standard' | 'deluxe' | 'suite' | 'executive' | 'penthouse'
export type RoomStatus = 'available' | 'occupied' | 'maintenance' | 'cleaning' | 'reserved'

export interface Booking {
  id: string
  propertyId: string
  guestId: string
  roomId: string
  checkIn: Date
  checkOut: Date
  status: BookingStatus
  adults: number
  children: number
  source: BookingSource
  totalAmount: number
  paidAmount: number
  specialRequests?: string
  createdAt: Date
  updatedAt: Date
}

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show'
export type BookingSource = 'direct' | 'booking.com' | 'expedia' | 'airbnb' | 'phone' | 'walk_in'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  propertyIds: string[]
  avatar?: string
  lastLogin?: Date
  isActive: boolean
}

export type UserRole = 'admin' | 'manager' | 'front_desk' | 'housekeeping' | 'maintenance'

export interface DashboardMetrics {
  occupancyRate: number
  occupancyChange: number
  revenue: number
  revenueChange: number
  arrivalsToday: number
  departuresToday: number
  averageRate: number
  averageRateChange: number
  guestsInHouse: number
  availableRooms: number
  pendingCheckIns: number
  pendingCheckOuts: number
}

export interface OccupancyData {
  date: string
  occupancy: number
  revenue: number
}

export interface RevenueBySource {
  source: string
  amount: number
  percentage: number
}
