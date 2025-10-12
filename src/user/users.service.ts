import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async createUser(email: string, password: string) {
    // check existing account first
    const existing = await (this.prisma as any).account.findUnique({
      where: { email },
    });
    if (existing) {
      throw new ConflictException('Account with this email already exists');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await (this.prisma as any).account.create({
      data: { email, password: hashed },
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _p, ...safe } = user as any;
    return safe;
  }

  async findById(id: number) {
    return (this.prisma as any).account.findUnique({ where: { id } });
  }
}
