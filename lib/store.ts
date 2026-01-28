import { create } from 'zustand'
import type { Property, User } from './types'
import { properties, users } from './mock-data'

interface AppState {
  currentUser: User | null
  currentProperty: Property | null
  properties: Property[]
  sidebarOpen: boolean
  setCurrentUser: (user: User | null) => void
  setCurrentProperty: (property: Property | null) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: users[0], // Default to admin user
  currentProperty: properties[0], // Default to first property
  properties: properties,
  sidebarOpen: true,
  setCurrentUser: (user) => set({ currentUser: user }),
  setCurrentProperty: (property) => set({ currentProperty: property }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
