import type { Guest, LoyaltyTierConfig, LoyaltyConfiguration } from './types'

// Default loyalty configuration
export const DEFAULT_LOYALTY_CONFIG: LoyaltyConfiguration = {
  id: 'default',
  tiers: [
    {
      id: 'bronze',
      tier: 'bronze',
      name: 'Bronze',
      level: 1,
      minStays: 0,
      minSpent: 0,
      minPoints: 0,
      benefits: [
        {
          id: 'welcome-bronze',
          name: 'Welcome Points',
          description: '100 points on sign up',
          type: 'bonus',
          value: 100
        }
      ],
      color: '#CD7F32',
      icon: 'medal',
      pointsMultiplier: 1.0,
      discountRate: 0
    },
    {
      id: 'silver',
      tier: 'silver',
      name: 'Silver',
      level: 2,
      minStays: 5,
      minSpent: 1000,
      minPoints: 500,
      benefits: [
        {
          id: 'welcome-silver',
          name: 'Welcome Points',
          description: '200 points on sign up',
          type: 'bonus',
          value: 200
        },
        {
          id: 'silver-discount',
          name: 'Room Upgrade',
          description: 'Complimentary room upgrade when available',
          type: 'upgrade',
          value: 0
        },
        {
          id: 'silver-breakfast',
          name: 'Free Breakfast',
          description: 'Complimentary breakfast for all stays',
          type: 'amenity',
          value: 0
        }
      ],
      color: '#C0C0C0',
      icon: 'award',
      pointsMultiplier: 1.2,
      discountRate: 5
    },
    {
      id: 'gold',
      tier: 'gold',
      name: 'Gold',
      level: 3,
      minStays: 15,
      minSpent: 3000,
      minPoints: 1500,
      benefits: [
        {
          id: 'welcome-gold',
          name: 'Welcome Points',
          description: '500 points on sign up',
          type: 'bonus',
          value: 500
        },
        {
          id: 'gold-discount',
          name: '10% Discount',
          description: '10% off all bookings',
          type: 'discount',
          value: 10
        },
        {
          id: 'gold-late-checkout',
          name: 'Late Checkout',
          description: '2 PM late checkout',
          type: 'service',
          value: 0
        },
        {
          id: 'gold-lounge',
          name: 'Lounge Access',
          description: 'Complimentary lounge access',
          type: 'amenity',
          value: 0
        }
      ],
      color: '#FFD700',
      icon: 'trophy',
      pointsMultiplier: 1.5,
      discountRate: 10
    },
    {
      id: 'platinum',
      tier: 'platinum',
      name: 'Platinum',
      level: 4,
      minStays: 30,
      minSpent: 7500,
      minPoints: 3000,
      benefits: [
        {
          id: 'welcome-platinum',
          name: 'Welcome Points',
          description: '1000 points on sign up',
          type: 'bonus',
          value: 1000
        },
        {
          id: 'platinum-discount',
          name: '15% Discount',
          description: '15% off all bookings',
          type: 'discount',
          value: 15
        },
        {
          id: 'platinum-suite',
          name: 'Suite Upgrade',
          description: 'Complimentary suite upgrade when available',
          type: 'upgrade',
          value: 0
        },
        {
          id: 'platinum-concierge',
          name: 'Personal Concierge',
          description: 'Dedicated concierge service',
          type: 'service',
          value: 0
        },
        {
          id: 'platinum-experiences',
          name: 'Exclusive Experiences',
          description: 'Access to exclusive hotel experiences',
          type: 'amenity',
          value: 0
        }
      ],
      color: '#E5E4E2',
      icon: 'crown',
      pointsMultiplier: 2.0,
      discountRate: 15
    }
  ],
  pointsPerDollar: 10,
  pointsPerStay: 50,
  welcomeBonusPoints: 100,
  referralBonusPoints: 250,
  birthdayBonusPoints: 500,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}

// Loyalty service functions
export class LoyaltyService {
  static calculateLoyaltyTier(guest: Guest, config: LoyaltyConfiguration = DEFAULT_LOYALTY_CONFIG): LoyaltyTierConfig | null {
    if (!config.isActive) return null

    // Sort tiers by level (highest first)
    const sortedTiers = [...config.tiers].sort((a, b) => b.level - a.level)

    // Find the highest tier the guest qualifies for
    for (const tier of sortedTiers) {
      if (
        guest.totalStays >= tier.minStays &&
        guest.totalSpent >= tier.minSpent &&
        guest.loyaltyPoints >= tier.minPoints
      ) {
        return tier
      }
    }

    // Return the lowest tier if guest doesn't qualify for any
    return config.tiers.find(t => t.level === 1) || null
  }

  static calculatePointsEarned(
    amount: number,
    tier: LoyaltyTierConfig | null,
    config: LoyaltyConfiguration = DEFAULT_LOYALTY_CONFIG
  ): number {
    if (!config.isActive) return 0

    const basePoints = Math.floor(amount * config.pointsPerDollar)
    const multiplier = tier?.pointsMultiplier || 1.0

    return Math.floor(basePoints * multiplier)
  }

  static calculateStayPoints(
    tier: LoyaltyTierConfig | null,
    config: LoyaltyConfiguration = DEFAULT_LOYALTY_CONFIG
  ): number {
    if (!config.isActive) return 0

    const basePoints = config.pointsPerStay
    const multiplier = tier?.pointsMultiplier || 1.0

    return Math.floor(basePoints * multiplier)
  }

  static getTierColor(tier: LoyaltyTierConfig | null): string {
    return tier?.color || '#94a3b8' // Default slate color
  }

  static getTierIcon(tier: LoyaltyTierConfig | null): string {
    return tier?.icon || 'user'
  }

  static formatTierName(tier: LoyaltyTierConfig | null): string {
    return tier?.name || 'Standard'
  }

  static getTierBadgeClass(tier: LoyaltyTierConfig | null): string {
    const color = this.getTierColor(tier)
    return `border-2 px-2 py-1 text-xs font-medium rounded-full` +
           ` bg-white dark:bg-gray-800` +
           ` border-[${color}]` +
           ` text-[${color}]`
  }

  static getNextTierProgress(guest: Guest, config: LoyaltyConfiguration = DEFAULT_LOYALTY_CONFIG): {
    currentTier: LoyaltyTierConfig | null
    nextTier: LoyaltyTierConfig | null
    progress: {
      stays: number
      spent: number
      points: number
    }
    requirements: {
      stays: number
      spent: number
      points: number
    }
  } {
    const currentTier = this.calculateLoyaltyTier(guest, config)
    const sortedTiers = [...config.tiers].sort((a, b) => a.level - b.level)

    const currentIndex = sortedTiers.findIndex(t => t.id === currentTier?.id)
    const nextTier = currentIndex < sortedTiers.length - 1 ? sortedTiers[currentIndex + 1] : null

    if (!nextTier) {
      return {
        currentTier,
        nextTier: null,
        progress: {
          stays: guest.totalStays,
          spent: guest.totalSpent,
          points: guest.loyaltyPoints
        },
        requirements: {
          stays: 0,
          spent: 0,
          points: 0
        }
      }
    }

    return {
      currentTier,
      nextTier,
      progress: {
        stays: guest.totalStays,
        spent: guest.totalSpent,
        points: guest.loyaltyPoints
      },
      requirements: {
        stays: nextTier.minStays,
        spent: nextTier.minSpent,
        points: nextTier.minPoints
      }
    }
  }

  static shouldUpgradeTier(guest: Guest, config: LoyaltyConfiguration = DEFAULT_LOYALTY_CONFIG): boolean {
    const newTier = this.calculateLoyaltyTier(guest, config)
    return newTier != null && newTier.tier !== guest.loyaltyTier
  }

  static getWelcomeBonusPoints(tier: LoyaltyTierConfig | null, config: LoyaltyConfiguration = DEFAULT_LOYALTY_CONFIG): number {
    if (!config.isActive) return 0

    const welcomeBenefit = tier?.benefits.find((b) => b.type === 'bonus' && b.name.includes('Welcome'))
    return welcomeBenefit?.value || config.welcomeBonusPoints
  }
}
