import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { BusinessRuleException } from '@/common/exceptions/business-rule.exception';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number) {
    return (this.prisma as any).account.findUnique({ where: { id } });
  }

  async findProfileByAccountId(accountId: number) {
    const profile = await (this.prisma as any).profile.findUnique({
      where: { accountId },
      include: { account: { select: { email: true, role: true } } },
    });

    if (!profile) {
      throw new BusinessRuleException('Profile not found');
    }

    return profile;
  }

  async updateProfile(
    accountId: number,
    data: {
      fullName?: string;
      phone?: string;
      location?: string;
      avatar?: string;
      bio?: string;
    },
  ) {
    // Check if profile exists
    const existingProfile = await (this.prisma as any).profile.findUnique({
      where: { accountId },
    });

    if (!existingProfile) {
      throw new BusinessRuleException('Profile not found');
    }

    // Update profile
    const updatedProfile = await (this.prisma as any).profile.update({
      where: { accountId },
      data,
      include: { account: { select: { email: true, role: true } } },
    });

    return updatedProfile;
  }
}
