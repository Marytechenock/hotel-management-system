'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  const { currentUser, currentProperty, properties, setCurrentProperty } = useAppStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
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
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Operations</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {mainNavItems.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild tooltip={item.title}>
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
      </Sidebar>
    )
  }

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
                  <span className="truncate">{currentProperty?.name || 'Select Property'}</span>
                </div>
                <ChevronDown className="size-4 text-sidebar-foreground/50" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {properties.map((property) => (
                <DropdownMenuItem
                  key={property.id}
                  onClick={() => setCurrentProperty(property)}
                  className={currentProperty?.id === property.id ? 'bg-accent' : ''}
                >
                  <Building2 className="mr-2 size-4" />
                  <div className="flex flex-col">
                    <span>{property.name}</span>
                    <span className="text-xs text-muted-foreground">{property.city}, {property.country}</span>
                  </div>
                </DropdownMenuItem>
              ))}
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
                <span className="text-sm font-medium">{currentUser?.name}</span>
                <span className="text-xs text-sidebar-foreground/60 capitalize">{currentUser?.role?.replace('_', ' ')}</span>
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
