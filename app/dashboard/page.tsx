'use client'

import { 
  Users, 
  BedDouble, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CalendarCheck,
  CalendarX,
  Clock,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useAppStore } from '@/lib/store'
import { 
  dashboardMetrics, 
  occupancyData, 
  revenueBySource,
  bookings,
  guests,
  rooms,
} from '@/lib/mock-data'
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
  const { currentProperty } = useAppStore()
  
  const propertyRooms = currentProperty 
    ? rooms.filter(r => r.propertyId === currentProperty.id) 
    : rooms
  
  const propertyBookings = currentProperty
    ? bookings.filter(b => b.propertyId === currentProperty.id)
    : bookings

  const todayArrivals = propertyBookings.filter(b => b.status === 'confirmed')
  const todayDepartures = propertyBookings.filter(b => b.status === 'checked_in')
  
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
                    {guest.loyaltyTier}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
