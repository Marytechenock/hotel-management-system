import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { bookings, guests, properties, rooms, users } from '@/lib/mock-data'
import { toDbBookingSource } from '@/lib/server/booking-source'

export const runtime = 'nodejs'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 })
  }

  await prisma.$transaction(async (tx) => {
    // Clear children first to avoid FK issues
    await tx.userProperty.deleteMany()
    await tx.booking.deleteMany()
    await tx.room.deleteMany()
    await tx.guest.deleteMany()
    await tx.user.deleteMany()
    await tx.property.deleteMany()

    await tx.property.createMany({
      data: properties.map((p) => ({
        id: p.id,
        name: p.name,
        code: p.code,
        address: p.address,
        city: p.city,
        country: p.country,
        phone: p.phone,
        email: p.email,
        timezone: p.timezone,
        currency: p.currency,
        totalRooms: p.totalRooms,
        createdAt: p.createdAt,
      })),
    })

    await tx.guest.createMany({
      data: guests.map((g) => ({
        id: g.id,
        title: g.title,
        surname: g.surname,
        firstName: g.firstName,
        nationality: g.nationality,
        idPassportNumber: g.idPassportNumber,
        numberOfAdults: g.numberOfAdults,
        numberOfChildren: g.numberOfChildren,
        childrenAges: g.childrenAges,
        otherAdult: g.otherAdult as any,
        postalAddress: g.postalAddress,
        residentialAddress: g.residentialAddress,
        city: g.city,
        stateProvince: g.stateProvince,
        country: g.country,
        telHome: g.telHome,
        telBusiness: g.telBusiness,
        cellphone: g.cellphone,
        email: g.email,
        dateIn: g.dateIn,
        dateOut: g.dateOut,
        roomNumber: g.roomNumber,
        accountPayableBy: g.accountPayableBy,
        vehicleRegNo: g.vehicleRegNo,
        breakfastTime: g.breakfastTime,
        preferences: g.preferences as any,
        serveDinner: g.serveDinner,
        agreedToTerms: g.agreedToTerms,
        signatureDate: g.signatureDate,
        loyaltyTier: g.loyaltyTier,
        loyaltyPoints: g.loyaltyPoints,
        totalStays: g.totalStays,
        totalSpent: g.totalSpent,
        notes: g.notes,
        tags: g.tags as any,
        createdAt: g.createdAt,
        updatedAt: g.updatedAt,
      })),
    })

    await tx.room.createMany({
      data: rooms.map((r) => ({
        id: r.id,
        propertyId: r.propertyId,
        number: r.number,
        floor: r.floor,
        type: r.type,
        status: r.status,
        maxOccupancy: r.maxOccupancy,
        baseRate: r.baseRate,
        amenities: r.amenities as any,
        lastCleaned: r.lastCleaned,
        notes: r.notes,
      })),
    })

    await tx.booking.createMany({
      data: bookings.map((b) => ({
        id: b.id,
        propertyId: b.propertyId,
        guestId: b.guestId,
        roomId: b.roomId,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status,
        adults: b.adults,
        children: b.children,
        source: toDbBookingSource(b.source),
        totalAmount: b.totalAmount,
        paidAmount: b.paidAmount,
        specialRequests: b.specialRequests,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
      })),
    })

    await tx.user.createMany({
      data: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role,
        avatar: u.avatar,
        lastLogin: u.lastLogin,
        isActive: u.isActive,
      })),
    })

    await tx.userProperty.createMany({
      data: users.flatMap((u) => u.propertyIds.map((propertyId) => ({ userId: u.id, propertyId }))),
    })
  })

  return NextResponse.json({ ok: true })
}
