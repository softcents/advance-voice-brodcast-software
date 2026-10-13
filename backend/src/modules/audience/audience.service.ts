import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AudienceService {
  constructor(private prisma: PrismaService) {}

  async getGroups(userId?: string) {
    return this.prisma.contactGroup.findMany({
      where: userId ? { userId } : {},
      include: {
        _count: { select: { contacts: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createGroup(userId: string, name: string) {
    return this.prisma.contactGroup.create({
      data: {
        userId,
        name,
        totalContacts: 0,
      },
    });
  }

  async deleteGroup(id: string) {
    return this.prisma.contactGroup.delete({ where: { id } });
  }

  async getContacts(params: { groupId?: string; search?: string; page?: number; limit?: number }) {
    const page = params.page || 1;
    const limit = params.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.groupId) where.groupId = params.groupId;
    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { phoneNumber: { contains: params.search } },
      ];
    }

    const [contacts, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        include: { group: { select: { id: true, name: true } } },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { contacts, total, page, limit };
  }

  async createContact(groupId: string, name: string, phoneNumber: string) {
    const contact = await this.prisma.contact.create({
      data: { groupId, name, phoneNumber },
    });
    await this.prisma.contactGroup.update({
      where: { id: groupId },
      data: { totalContacts: { increment: 1 } },
    });
    return contact;
  }

  async importContacts(groupId: string, contacts: { name?: string; phoneNumber: string }[]) {
    if (!contacts || contacts.length === 0) return { imported: 0 };

    const data = contacts.map((c) => ({
      groupId,
      name: c.name || null,
      phoneNumber: c.phoneNumber.trim(),
    }));

    const result = await this.prisma.contact.createMany({
      data,
      skipDuplicates: true,
    });

    await this.prisma.contactGroup.update({
      where: { id: groupId },
      data: { totalContacts: { increment: result.count } },
    });

    return { imported: result.count };
  }

  async deleteContact(id: string) {
    const contact = await this.prisma.contact.findUnique({ where: { id } });
    if (!contact) throw new NotFoundException('Contact not found');

    await this.prisma.contact.delete({ where: { id } });
    await this.prisma.contactGroup.update({
      where: { id: contact.groupId },
      data: { totalContacts: { decrement: 1 } },
    });

    return { success: true };
  }
}
