import { Injectable, CanActivate, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class HierarchyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const currentUser = request.user;
    if (!currentUser) {
      throw new ForbiddenException('Unauthenticated request');
    }

    if (currentUser.role === Role.SUPER_ADMIN) {
      return true; // Super Admin bypasses hierarchy checks
    }

    // Check target user ID from route params or body
    const targetUserId = request.params.userId || request.params.id || request.body.targetUserId;
    if (!targetUserId || targetUserId === currentUser.id) {
      return true; // Operating on self
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, path: true, role: true },
    });

    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    // A user can ONLY access targetUser if targetUser's path starts with currentUser's path
    // e.g. currentUser path: "root/sp/reseller1"
    // targetUser path: "root/sp/reseller1/subreseller2/customer3"
    const isDescendant = targetUser.path.startsWith(currentUser.path);

    if (!isDescendant) {
      throw new ForbiddenException('Access denied: target user is outside your authorized reseller hierarchy');
    }

    return true;
  }
}
