'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Users, 
  BedDouble, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CalendarCheck,
  CalendarX,
  Clock,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { useAppStore } from '@/lib/store'
import type { Booking, Room, Guest } from '@/lib/types'
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, Cell, Pie, PieChart } from 'recharts'

const occupancyChartConfig = {
  occupancy: {
    label: 'Occupancy',
    color: 'var(--chart-1)',
  },
  revenue: {
    label: 'Revenue',
    color: 'var(--chart-2)',
  },
} satisfies ChartConfig

const sourceChartConfig = {
  amount: {
    label: 'Revenue',
  },
  Direct: {
    label: 'Direct',
    color: 'var(--chart-1)',
  },
  'Booking.com': {
    label: 'Booking.com',
    color: 'var(--chart-2)',
  },
  Expedia: {
    label: 'Expedia',
    color: 'var(--chart-3)',
  },
  Airbnb: {
    label: 'Airbnb',
    color: 'var(--chart-4)',
  },
  'Walk-in': {
    label: 'Walk-in',
    color: 'var(--chart-5)',
  },
} satisfies ChartConfig

export default function DashboardPage() {
  const { toast } = useToast()
  const { currentProperty } = useAppStore()
  const [isLoading, setIsLoading] = useState(true)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [guests, setGuests] = useState<Guest[]>([])

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      
      const params = new URLSearchParams()
      if (currentProperty?.id) params.append('propertyId', currentProperty.id)
      params.append('limit', '1000') // Get all data for dashboard calculations

      const [bookingsRes, roomsRes, guestsRes] = await Promise.all([
        fetch(`/api/bookings?${params.toString()}`),
        fetch(`/api/rooms?${params.toString()}`),
        fetch('/api/guests?limit=10')
      ])

      if (!bookingsRes.ok || !roomsRes.ok || !guestsRes.ok) {
        throw new Error('Failed to fetch dashboard data')
      }

      const bookingsData = await bookingsRes.json()
      const roomsData = await roomsRes.json()
      const guestsData = await guestsRes.json()

      setBookings(bookingsData.data || [])
      setRooms(roomsData.data || [])
      setGuests(guestsData.data || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [currentProperty?.id])

  // Calculate dashboard metrics from real data
  const dashboardMetrics = useMemo(() => {
    const propertyBookings = currentProperty 
      ? bookings.filter(b => b.propertyId === currentProperty.id)
      : bookings

    const propertyRooms = currentProperty
      ? rooms.filter(r => r.propertyId === currentProperty.id)
      : rooms

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Calculate occupancy rate
    const occupiedRooms = propertyBookings.filter(b => 
      b.status === 'checked_in' || 
      (b.status === 'confirmed' && new Date(b.checkIn) <= tomorrow && new Date(b.checkOut) > today)
    ).length
    const occupancyRate = propertyRooms.length > 0 ? Math.round((occupiedRooms / propertyRooms.length) * 100) : 0

    // Calculate revenue (MTD - month to date)
    const currentMonth = new Date()
    currentMonth.setDate(1)
    currentMonth.setHours(0, 0, 0, 0)
    const monthlyRevenue = propertyBookings
      .filter(b => new Date(b.createdAt) >= currentMonth)
      .reduce((sum, b) => sum + b.totalAmount, 0)

    // Calculate average daily rate
    const checkedInBookings = propertyBookings.filter(b => b.status === 'checked_in')
    const averageRate = checkedInBookings.length > 0 
      ? Math.round(checkedInBookings.reduce((sum, b) => sum + b.totalAmount, 0) / checkedInBookings.length)
      : 0

    // Calculate guests in house
    const guestsInHouse = propertyBookings.filter(b => b.status === 'checked_in')
      .reduce((sum, b) => sum + b.adults + b.children, 0)

    // Calculate today's arrivals and departures
    const arrivalsToday = propertyBookings.filter(b => {
      const checkIn = new Date(b.checkIn)
      checkIn.setHours(0, 0, 0, 0)
      return checkIn.getTime() === today.getTime() && b.status === 'confirmed'
    }).length

    const departuresToday = propertyBookings.filter(b => {
      const checkOut = new Date(b.checkOut)
      checkOut.setHours(0, 0, 0, 0)
      return checkOut.getTime() === today.getTime() && b.status === 'checked_in'
    }).length

    // Available rooms
    const availableRooms = propertyRooms.filter(r => r.status === 'available').length

    return {
      occupancyRate,
      revenue: monthlyRevenue,
      averageRate,
      guestsInHouse,
      arrivalsToday,
      departuresToday,
      pendingCheckIns: arrivalsToday,
      pendingCheckOuts: departuresToday,
      availableRooms,
      occupancyChange: 0, // TODO: Calculate historical comparison
      revenueChange: 0, // TODO: Calculate historical comparison
      averageRateChange: 0, // TODO: Calculate historical comparison
    }
  }, [bookings, rooms, currentProperty])

  // Generate occupancy trend data for last 7 days
  const occupancyData = useMemo(() => {
    const data = []
    const today = new Date()
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const propertyBookings = currentProperty 
        ? bookings.filter(b => b.propertyId === currentProperty.id)
        : bookings

      const propertyRooms = currentProperty
        ? rooms.filter(r => r.propertyId === currentProperty.id)
        : rooms

      const occupiedCount = propertyBookings.filter(b => {
        const checkIn = new Date(b.checkIn)
        const checkOut = new Date(b.checkOut)
        return (
          (b.status === 'checked_in' || b.status === 'confirmed') &&
          checkIn < nextDay && checkOut > date
        )
      }).length

      const occupancy = propertyRooms.length > 0 ? Math.round((occupiedCount / propertyRooms.length) * 100) : 0
      
      data.push({
        date: date.toISOString(),
        occupancy,
        revenue: propertyBookings
          .filter(b => new Date(b.checkIn).getTime() === date.getTime())
          .reduce((sum, b) => sum + b.totalAmount, 0)
      })
    }
    
    return data
  }, [bookings, rooms, currentProperty])

  // Calculate revenue by source
  const revenueBySource = useMemo(() => {
    const propertyBookings = currentProperty 
      ? bookings.filter(b => b.propertyId === currentProperty.id)
      : bookings

    const sourceMap = new Map<string, number>()
    
    propertyBookings.forEach(booking => {
      const current = sourceMap.get(booking.source) || 0
      sourceMap.set(booking.source, current + booking.totalAmount)
    })

    const sourceLabels: Record<string, string> = {
      direct: 'Direct',
      'booking.com': 'Booking.com',
      expedia: 'Expedia',
      airbnb: 'Airbnb',
      phone: 'Phone',
      walk_in: 'Walk-in',
    }

    return Array.from(sourceMap.entries()).map(([source, amount]) => ({
      source: sourceLabels[source] || source,
      amount
    })).sort((a, b) => b.amount - a.amount)
  }, [bookings, currentProperty])

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading dashboard...</span>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview for {currentProperty?.name || 'All Properties'}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupancy Rate</CardTitle>
            <BedDouble className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.occupancyRate}%</div>
            <div className="flex items-center gap-1 text-xs">
              {dashboardMetrics.occupancyChange > 0 ? (
                <>
                  <TrendingUp className="size-3 text-success" />
                  <span className="text-success">+{dashboardMetrics.occupancyChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="size-3 text-destructive" />
                  <span className="text-destructive">{dashboardMetrics.occupancyChange}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last week</span>
            </div>
            <Progress value={dashboardMetrics.occupancyRate} className="mt-2 h-1" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Revenue (MTD)</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardMetrics.revenue.toLocaleString()}</div>
            <div className="flex items-center gap-1 text-xs">
              {dashboardMetrics.revenueChange > 0 ? (
                <>
                  <TrendingUp className="size-3 text-success" />
                  <span className="text-success">+{dashboardMetrics.revenueChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="size-3 text-destructive" />
                  <span className="text-destructive">{dashboardMetrics.revenueChange}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Daily Rate</CardTitle>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${dashboardMetrics.averageRate}</div>
            <div className="flex items-center gap-1 text-xs">
              {dashboardMetrics.averageRateChange > 0 ? (
                <>
                  <TrendingUp className="size-3 text-success" />
                  <span className="text-success">+{dashboardMetrics.averageRateChange}%</span>
                </>
              ) : (
                <>
                  <TrendingDown className="size-3 text-destructive" />
                  <span className="text-destructive">{dashboardMetrics.averageRateChange}%</span>
                </>
              )}
              <span className="text-muted-foreground">vs last week</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Guests In House</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardMetrics.guestsInHouse}</div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{dashboardMetrics.availableRooms} rooms available</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Occupancy Trend</CardTitle>
            <CardDescription>Last 7 days occupancy percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={occupancyChartConfig} className="h-[200px] w-full">
              <AreaChart data={occupancyData}>
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="occupancy"
                  stroke="var(--chart-1)"
                  fill="var(--chart-1)"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Source</CardTitle>
            <CardDescription>Booking channel distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={sourceChartConfig} className="h-[200px] w-full">
              <BarChart data={revenueBySource} layout="vertical">
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis dataKey="source" type="category" tickLine={false} axisLine={false} width={80} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="amount" radius={4}>
                  {revenueBySource.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`var(--chart-${(index % 5) + 1})`} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Activity Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Today's Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="size-4" />
              {"Today's Activity"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarCheck className="size-4 text-success" />
                <span className="text-sm">Arrivals</span>
              </div>
              <Badge variant="secondary">{dashboardMetrics.arrivalsToday}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarX className="size-4 text-warning" />
                <span className="text-sm">Departures</span>
              </div>
              <Badge variant="secondary">{dashboardMetrics.departuresToday}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span className="text-sm">Pending Check-ins</span>
              </div>
              <Badge variant="secondary">{dashboardMetrics.pendingCheckIns}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-muted-foreground" />
                <span className="text-sm">Pending Check-outs</span>
              </div>
              <Badge variant="secondary">{dashboardMetrics.pendingCheckOuts}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Room Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BedDouble className="size-4" />
              Room Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {['available', 'occupied', 'cleaning', 'maintenance', 'reserved'].map((status) => {
              const propertyRooms = currentProperty
                ? rooms.filter(r => r.propertyId === currentProperty.id)
                : rooms
              const count = propertyRooms.filter(r => r.status === status).length
              const total = propertyRooms.length
              const percentage = total > 0 ? (count / total) * 100 : 0
              
              return (
                <div key={status} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="capitalize">{status}</span>
                    <span className="text-muted-foreground">{count} rooms</span>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent Guests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4" />
              Recent Guests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {guests.slice(0, 4).map((guest) => (
                <div key={guest.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                      {guest.firstName[0]}{guest.surname[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{guest.firstName} {guest.surname}</p>
                      <p className="text-xs text-muted-foreground">{guest.email}</p>
                    </div>
                  </div>
                  <Badge 
                    variant={
                      guest.loyaltyTier === 'platinum' ? 'default' :
                      guest.loyaltyTier === 'gold' ? 'secondary' : 'outline'
                    }
                    className="text-xs capitalize"
                  >
                    {guest.loyaltyTier || 'standard'}
                  </Badge>
                </div>
              ))}
              {guests.length === 0 && (
                <p className="text-center text-muted-foreground text-sm">No guests found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
