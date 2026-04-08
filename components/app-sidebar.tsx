'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Users,
  CalendarDays,
  BedDouble,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Hotel,
  UserCircle,
  Bell,
  Wrench,
  Loader2,
  RefreshCw,
  Plus
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store'

const mainNavItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: BarChart3,
  },
  {
    title: 'Guests',
    href: '/dashboard/guests',
    icon: Users,
  },
  {
    title: 'Bookings',
    href: '/dashboard/bookings',
    icon: CalendarDays,
  },
  {
    title: 'Rooms',
    href: '/dashboard/rooms',
    icon: BedDouble,
  },
]

const managementNavItems = [
  {
    title: 'Properties',
    href: '/dashboard/properties',
    icon: Building2,
  },
  {
    title: 'Staff',
    href: '/dashboard/staff',
    icon: UserCircle,
  },
  {
    title: 'Housekeeping',
    href: '/dashboard/housekeeping',
    icon: Wrench,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const {
    currentUser,
    currentProperty,
    properties,
    setCurrentProperty,
    fetchProperties,
    isLoading
  } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch properties when component mounts and when properties are empty
  useEffect(() => {
    if (mounted && properties.length === 0 && !isLoading) {
      fetchProperties()
    }
  }, [mounted, properties.length, isLoading, fetchProperties])

  return (
      <Sidebar collapsible="icon">
        <SidebarHeader className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Hotel className="size-5" />
            </div>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-semibold text-sidebar-foreground">OmniHotel Pro</span>
              <span className="text-xs text-sidebar-foreground/60">Management Suite</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarSeparator />

        {/* Property Selector */}
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Current Property</SidebarGroupLabel>
          <SidebarGroupContent>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex w-full items-center justify-between rounded-md border border-sidebar-border bg-sidebar-accent/50 px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-sidebar-foreground/70" />
                    <span className="truncate">
                    {isLoading ? (
                        <span className="flex items-center gap-2">
                        <Loader2 className="size-3 animate-spin" />
                        Loading...
                      </span>
                    ) : (
                        currentProperty?.name || 'Select Property'
                    )}
                  </span>
                  </div>
                  <ChevronDown className="size-4 text-sidebar-foreground/50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64">
                {isLoading ? (
                    <DropdownMenuItem disabled>
                      <Loader2 className="mr-2 size-4 animate-spin" />
                      Loading properties...
                    </DropdownMenuItem>
                ) : properties.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-2">No properties found</p>
                      <Link href="/dashboard/properties">
                        <Button size="sm" variant="outline" className="w-full">
                          <Plus className="mr-2 size-3" />
                          Add Property
                        </Button>
                      </Link>
                    </div>
                ) : (
                    <>
                      {properties.map((property) => (
                          <DropdownMenuItem
                              key={property.id}
                              onClick={() => setCurrentProperty(property)}
                              className={currentProperty?.id === property.id ? 'bg-accent' : ''}
                          >
                            <Building2 className="mr-2 size-4" />
                            <div className="flex flex-col flex-1">
                              <span className="text-sm font-medium">{property.name}</span>
                              <span className="text-xs text-muted-foreground">
                          {property.city}, {property.country}
                        </span>
                            </div>
                            {currentProperty?.id === property.id && (
                                <div className="size-2 rounded-full bg-green-500" />
                            )}
                          </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/dashboard/properties" className="cursor-pointer">
                          <Plus className="mr-2 size-4" />
                          Manage Properties
                        </Link>
                      </DropdownMenuItem>
                    </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                          asChild
                          isActive={mounted && pathname === item.href}
                          tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Management</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {managementNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                          asChild
                          isActive={mounted && pathname === item.href}
                          tooltip={item.title}
                      >
                        <Link href={item.href}>
                          <item.icon className="size-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Notifications">
                <button className="relative">
                  <Bell className="size-4" />
                  <span>Notifications</span>
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 flex size-5 items-center justify-center rounded-full bg-sidebar-primary text-[10px] text-sidebar-primary-foreground group-data-[collapsible=icon]:hidden">
                  3
                </span>
                </button>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={mounted && pathname === '/dashboard/settings'} tooltip="Settings">
                <Link href="/dashboard/settings">
                  <Settings className="size-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>

          <SidebarSeparator />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-md p-2 text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                    {currentUser?.name?.split(' ').map(n => n[0]).join('') || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-medium">{currentUser?.name || 'Guest User'}</span>
                  <span className="text-xs text-sidebar-foreground/60 capitalize">
                  {currentUser?.role?.replace('_', ' ') || 'Not logged in'}
                </span>
                </div>
                <ChevronDown className="size-4 text-sidebar-foreground/50 group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem>
                <UserCircle className="mr-2 size-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 size-4" />
                Account Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive">
                <LogOut className="mr-2 size-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>
  )
}