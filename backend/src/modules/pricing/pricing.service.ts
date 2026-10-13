import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface CreatePlanDto {
  name: string;
  description?: string;
  isDefault?: boolean;
  rateCards: {
    destinationPrefix: string;
    destinationName: string;
    buyRate: number;
    sellRate: number;
    pulseDuration: number;
    pulseRate: number;
  }[];
}

export interface CalculateCallCostResult {
  pulseDuration: number;
  pulseRate: number;
  buyRate: number;
  sellRate: number;
  pulses: number;
  costPrice: number;
  sellingPrice: number;
  grossProfit: number;
  resellerMargin: number;
  rateCardId: string;
}

@Injectable()
export class PricingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get plans owned by or available to user
   */
  async getPlans(creatorId: string) {
    return this.prisma.pricingPlan.findMany({
      where: {
        OR: [{ creatorId }, { isDefault: true }],
      },
      include: {
        rateCards: {
          where: { isActive: true },
        },
      },
    });
  }

  /**
   * Create a new custom pricing plan with rate cards
   */
  async createPlan(creatorId: string, dto: CreatePlanDto) {
    if (!dto.rateCards || dto.rateCards.length === 0) {
      throw new BadRequestException('At least one rate card must be defined in the pricing plan');
    }

    return this.prisma.pricingPlan.create({
      data: {
        name: dto.name,
        description: dto.description,
        creatorId,
        isDefault: dto.isDefault ?? false,
        rateCards: {
          create: dto.rateCards.map((rc) => ({
            destinationPrefix: rc.destinationPrefix,
            destinationName: rc.destinationName,
            buyRate: new Prisma.Decimal(rc.buyRate),
            sellRate: new Prisma.Decimal(rc.sellRate),
            pulseDuration: rc.pulseDuration,
            pulseRate: new Prisma.Decimal(rc.pulseRate),
            isActive: true,
          })),
        },
      },
      include: {
        rateCards: true,
      },
    });
  }

  /**
   * Assign pricing plan to a child reseller or customer
   */
  async assignPlan(targetUserId: string, planId: string) {
    const plan = await this.prisma.pricingPlan.findUnique({
      where: { id: planId },
    });
    if (!plan) throw new NotFoundException('Pricing plan not found');

    return this.prisma.user.update({
      where: { id: targetUserId },
      data: { pricingPlanId: planId },
      select: {
        id: true,
        name: true,
        email: true,
        pricingPlan: true,
      },
    });
  }

  /**
   * Calculate exact cost price, selling price, and margins for a call
   * Uses longest prefix match on dialed phone number (e.g., 88017 vs 880 vs DEFAULT)
   */
  async calculateCallCost(userId: string, phoneNumber: string, billableSeconds: number): Promise<CalculateCallCostResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        pricingPlan: {
          include: {
            rateCards: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    let rateCards = user?.pricingPlan?.rateCards || [];

    if (rateCards.length === 0) {
      const defaultPlan = await this.prisma.pricingPlan.findFirst({
        where: { isDefault: true },
        include: { rateCards: { where: { isActive: true } } },
      });
      if (defaultPlan && defaultPlan.rateCards.length > 0) {
        rateCards = defaultPlan.rateCards;
      }
    }

    // Find best match: longest matching prefix
    const sanitizedNumber = phoneNumber.replace(/^\+/, '');
    const matchedCard =
      rateCards
        .filter((rc) => rc.destinationPrefix !== 'DEFAULT' && sanitizedNumber.startsWith(rc.destinationPrefix))
        .sort((a, b) => b.destinationPrefix.length - a.destinationPrefix.length)[0] ||
      rateCards.find((rc) => rc.destinationPrefix === 'DEFAULT');

    const pulseDuration = matchedCard?.pulseDuration || 10;
    const pulseRate = matchedCard ? matchedCard.pulseRate.toNumber() : 0.35;
    const buyRate = matchedCard ? matchedCard.buyRate.toNumber() : 0.15;
    const sellRate = matchedCard ? matchedCard.sellRate.toNumber() : 0.35;
    const rateCardId = matchedCard?.id || 'DEFAULT_RATE_CARD';

    if (billableSeconds <= 0) {
      return {
        pulseDuration,
        pulseRate,
        buyRate,
        sellRate,
        pulses: 0,
        costPrice: 0,
        sellingPrice: 0,
        grossProfit: 0,
        resellerMargin: 0,
        rateCardId: matchedCard.id,
      };
    }

    const pulses = Math.ceil(billableSeconds / pulseDuration);
    const sellingPrice = pulses * pulseRate;
    const costPrice = pulses * buyRate;
    const grossProfit = Math.max(0, sellingPrice - costPrice);
    const resellerMargin = grossProfit * 0.7; // Standard 70% reseller commission share

    return {
      pulseDuration,
      pulseRate,
      buyRate,
      sellRate,
      pulses,
      costPrice: Number(costPrice.toFixed(4)),
      sellingPrice: Number(sellingPrice.toFixed(4)),
      grossProfit: Number(grossProfit.toFixed(4)),
      resellerMargin: Number(resellerMargin.toFixed(4)),
      rateCardId,
    };
  }
}
