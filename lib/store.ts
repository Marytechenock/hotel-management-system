// lib/store.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Property, User } from './types'

interface AppState {
  currentUser: User | null
  currentProperty: Property | null
  properties: Property[]
  sidebarOpen: boolean
  isLoading: boolean
  setCurrentUser: (user: User | null) => void
  setCurrentProperty: (property: Property | null) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setProperties: (properties: Property[]) => void
  fetchProperties: () => Promise<void>
  addProperty: (property: Partial<Property>) => Promise<Property | null>
  updateProperty: (id: string, property: Partial<Property>) => Promise<Property | null>
  deleteProperty: (id: string) => Promise<boolean>
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
          currentUser: null, // Start with null, will be set after login
          currentProperty: null,
          properties: [],
          sidebarOpen: true,
          isLoading: false,

          setCurrentUser: (user) => set({ currentUser: user }),

          setCurrentProperty: (property) => set({ currentProperty: property }),

          setSidebarOpen: (open) => set({ sidebarOpen: open }),

          toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

          setProperties: (properties) => set({ properties }),

          fetchProperties: async () => {
            const { isLoading } = get()
            if (isLoading) return

            set({ isLoading: true })
            try {
              const response = await fetch('/api/properties?limit=100')
              if (!response.ok) throw new Error('Failed to fetch properties')
              const data = await response.json()

              // Handle both paginated and non-paginated responses
              const propertiesList = Array.isArray(data) ? data : data.data || []

              set({ properties: propertiesList })

              // If no current property but we have properties, set the first one
              const { currentProperty } = get()
              if (!currentProperty && propertiesList.length > 0) {
                set({ currentProperty: propertiesList[0] })
              }
            } catch (error) {
              console.error('Error fetching properties:', error)
            } finally {
              set({ isLoading: false })
            }
          },

          addProperty: async (propertyData) => {
            try {
              const response = await fetch('/api/properties', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(propertyData),
              })

              if (!response.ok) throw new Error('Failed to add property')

              const newProperty = await response.json()

              // Update properties list
              set((state) => ({
                properties: [...state.properties, newProperty]
              }))

              return newProperty
            } catch (error) {
              console.error('Error adding property:', error)
              return null
            }
          },

          updateProperty: async (id, propertyData) => {
            try {
              const response = await fetch(`/api/properties/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(propertyData),
              })

              if (!response.ok) throw new Error('Failed to update property')

              const updatedProperty = await response.json()

              // Update properties list
              set((state) => ({
                properties: state.properties.map(p =>
                    p.id === id ? updatedProperty : p
                ),
                currentProperty: state.currentProperty?.id === id
                    ? updatedProperty
                    : state.currentProperty
              }))

              return updatedProperty
            } catch (error) {
              console.error('Error updating property:', error)
              return null
            }
          },

          deleteProperty: async (id) => {
            try {
              const response = await fetch(`/api/properties/${id}`, {
                method: 'DELETE',
              })

              if (!response.ok) throw new Error('Failed to delete property')

              // Update properties list
              set((state) => {
                const newProperties = state.properties.filter(p => p.id !== id)
                return {
                  properties: newProperties,
                  currentProperty: state.currentProperty?.id === id
                      ? (newProperties[0] || null)
                      : state.currentProperty
                }
              })

              return true
            } catch (error) {
              console.error('Error deleting property:', error)
              return false
            }
          },
        }),
        {
          name: 'hotel-management-storage',
          partialize: (state) => ({
            currentUser: state.currentUser,
            currentProperty: state.currentProperty,
            sidebarOpen: state.sidebarOpen,
          }),
        }
    )
)