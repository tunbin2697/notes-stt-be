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
    try {
      await this.prisma.profile.update({
        where: { accountId },
        data: data,
        include: { account: { select: { email: true, role: true } } },
      });
    } catch (e) {
      // Check for the specific Prisma error when a record is not found
      if (e.code === 'P2025' || e.name === 'NotFoundError') {
        throw new BusinessRuleException('Profile not found');
      }
      // Re-throw other errors
      throw e;
    }
  }
}
