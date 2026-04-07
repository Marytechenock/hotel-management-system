// Import Prisma's LoyaltyTier type
import { LoyaltyTier } from '@prisma/client'

// Re-export for convenience
export { LoyaltyTier } from '@prisma/client'

// Helper functions for LoyaltyTier display properties
export function getLoyaltyTierConfig(tier: LoyaltyTier): LoyaltyTierConfig {
  const configs: Record<LoyaltyTier, LoyaltyTierConfig> = {
    bronze: {
      id: 'bronze',
      tier: 'bronze',
      name: 'Bronze',
      level: 1,
      minStays: 0,
      minSpent: 0,
      minPoints: 0,
      benefits: [],
      color: '#CD7F32',
      pointsMultiplier: 1,
      discountRate: 0,
    },
    silver: {
      id: 'silver',
      tier: 'silver',
      name: 'Silver',
      level: 2,
      minStays: 5,
      minSpent: 1000,
      minPoints: 1000,
      benefits: [],
      color: '#C0C0C0',
      pointsMultiplier: 1.2,
      discountRate: 5,
    },
    gold: {
      id: 'gold',
      tier: 'gold',
      name: 'Gold',
      level: 3,
      minStays: 10,
      minSpent: 3000,
      minPoints: 3000,
      benefits: [],
      color: '#FFD700',
      pointsMultiplier: 1.5,
      discountRate: 10,
    },
    platinum: {
      id: 'platinum',
      tier: 'platinum',
      name: 'Platinum',
      level: 4,
      minStays: 25,
      minSpent: 10000,
      minPoints: 10000,
      benefits: [],
      color: '#E5E4E2',
      pointsMultiplier: 2,
      discountRate: 15,
    },
  }
  return configs[tier]
}

export function getAllLoyaltyTiers(): LoyaltyTierConfig[] {
  const tiers: LoyaltyTier[] = ['bronze', 'silver', 'gold', 'platinum']
  return tiers.map(getLoyaltyTierConfig)
}

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
  signatureData?: string // Base64 encoded signature image
  
  // System Fields
  loyaltyTier: LoyaltyTier // Prisma enum type
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

// Configurable Loyalty Tier Configuration
export interface LoyaltyTierConfig {
  id: string
  tier: LoyaltyTier // Prisma enum
  name: string
  level: number // Higher number = higher tier
  minStays: number
  minSpent: number
  minPoints: number
  benefits: LoyaltyBenefit[]
  color: string // CSS color for badges
  icon?: string // Icon name (optional)
  pointsMultiplier: number // Multiplier for points earned
  discountRate: number // Discount percentage (0-100)
}

export interface LoyaltyBenefit {
  id: string
  name: string
  description: string
  type: 'discount' | 'upgrade' | 'service' | 'amenity' | 'bonus'
  value: number // Discount % or other value
}

export interface LoyaltyConfiguration {
  id: string
  propertyId?: string // undefined = global config
  tiers: LoyaltyTierConfig[]
  pointsPerDollar: number
  pointsPerStay: number
  welcomeBonusPoints: number
  referralBonusPoints: number
  birthdayBonusPoints: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// Loyalty Activity Tracking
export interface LoyaltyActivity {
  id: string
  guestId: string
  type: 'stay' | 'booking' | 'referral' | 'birthday' | 'bonus' | 'redemption'
  points: number
  description: string
  bookingId?: string
  createdAt: Date
}

// Points Redemption
export interface LoyaltyReward {
  id: string
  name: string
  description: string
  pointsCost: number
  type: 'discount' | 'upgrade' | 'service' | 'amenity'
  value: number
  isActive: boolean
  propertyId?: string
}

export interface LoyaltyRedemption {
  id: string
  guestId: string
  rewardId: string
  pointsUsed: number
  status: 'pending' | 'confirmed' | 'used' | 'expired'
  bookingId?: string
  createdAt: Date
  usedAt?: Date
  expiresAt?: Date
}
