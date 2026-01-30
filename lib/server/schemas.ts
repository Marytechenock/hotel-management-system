import { z } from 'zod'

export const roomTypeSchema = z.enum(['standard', 'deluxe', 'suite', 'executive', 'penthouse'])
export const roomStatusSchema = z.enum(['available', 'occupied', 'maintenance', 'cleaning', 'reserved'])

export const bookingStatusSchema = z.enum(['confirmed', 'checked_in', 'checked_out', 'cancelled', 'no_show'])
export const bookingSourceSchema = z.enum(['direct', 'booking.com', 'expedia', 'airbnb', 'phone', 'walk_in'])

export const userRoleSchema = z.enum(['admin', 'manager', 'front_desk', 'housekeeping', 'maintenance'])
export const loyaltyTierSchema = z.enum(['bronze', 'silver', 'gold', 'platinum'])

export const propertyCreateSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1),
  code: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  phone: z.string().min(1),
  email: z.string().email(),
  timezone: z.string().min(1),
  currency: z.string().min(1),
  totalRooms: z.number().int().nonnegative(),
  createdAt: z.coerce.date().optional(),
})

export const propertyUpdateSchema = propertyCreateSchema.partial().omit({ id: true })

export const guestPreferencesSchema = z.object({
  beef: z.boolean(),
  pork: z.boolean(),
  eggStyle: z.enum(['fried', 'scrambled', 'boiled', 'omelet']).nullable(),
  dietaryRestrictions: z.array(z.string()).optional(),
  specialRequests: z.array(z.string()).optional(),
  roomType: z.string().optional(),
  floorPreference: z.enum(['high', 'low', 'any']).optional(),
  bedType: z.enum(['king', 'queen', 'twin']).optional(),
})

export const guestOtherAdultSchema = z.object({
  surname: z.string().min(1),
  firstName: z.string().min(1),
  nationality: z.string().min(1),
  idPassportNumber: z.string().min(1),
})

export const guestCreateSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1),
  surname: z.string().min(1),
  firstName: z.string().min(1),
  nationality: z.string().min(1),
  idPassportNumber: z.string().min(1),

  numberOfAdults: z.number().int().min(1),
  numberOfChildren: z.number().int().min(0),
  childrenAges: z.array(z.number().int().min(0)).default([]),
  otherAdult: guestOtherAdultSchema.optional(),

  postalAddress: z.string().default(''),
  residentialAddress: z.string().min(1),
  city: z.string().min(1),
  stateProvince: z.string().min(1),
  country: z.string().min(1),

  telHome: z.string().default(''),
  telBusiness: z.string().default(''),
  cellphone: z.string().min(1),
  email: z.string().email(),

  dateIn: z.coerce.date(),
  dateOut: z.coerce.date(),
  roomNumber: z.string().min(1),
  accountPayableBy: z.string().min(1),
  vehicleRegNo: z.string().default(''),
  breakfastTime: z.string().default(''),

  preferences: guestPreferencesSchema,
  serveDinner: z.boolean(),

  agreedToTerms: z.boolean(),
  signatureDate: z.coerce.date(),

  loyaltyTier: loyaltyTierSchema.default('bronze'),
  loyaltyPoints: z.number().int().nonnegative().default(0),
  totalStays: z.number().int().nonnegative().default(0),
  totalSpent: z.number().nonnegative().default(0),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),

  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})

export const guestUpdateSchema = guestCreateSchema.partial().omit({ id: true })

export const roomCreateSchema = z.object({
  id: z.string().min(1).optional(),
  propertyId: z.string().min(1),
  number: z.string().min(1),
  floor: z.number().int(),
  type: roomTypeSchema,
  status: roomStatusSchema,
  maxOccupancy: z.number().int().positive(),
  baseRate: z.number().nonnegative(),
  amenities: z.array(z.string()).default([]),
  lastCleaned: z.coerce.date().optional(),
  notes: z.string().optional(),
})

export const roomUpdateSchema = roomCreateSchema.partial().omit({ id: true })

export const bookingCreateSchema = z.object({
  id: z.string().min(1).optional(),
  propertyId: z.string().min(1),
  guestId: z.string().min(1),
  roomId: z.string().min(1),
  checkIn: z.coerce.date(),
  checkOut: z.coerce.date(),
  status: bookingStatusSchema,
  adults: z.number().int().min(1),
  children: z.number().int().min(0),
  source: bookingSourceSchema,
  totalAmount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative(),
  specialRequests: z.string().optional(),
  createdAt: z.coerce.date().optional(),
  updatedAt: z.coerce.date().optional(),
})

export const bookingUpdateSchema = bookingCreateSchema.partial().omit({ id: true })
