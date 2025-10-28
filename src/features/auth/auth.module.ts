import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { PrismaModule } from '@/prisma/prisma.module';
import { JwtStrategy } from '../../common/security/strategies/jwt.strategy';
import { UsersModule } from '@/features/user/users.module';
import { EmailService } from '@/common/services/email.service';
import { SECURITY_CONFIG } from '@/config/security.config';

@Module({
  imports: [
    PrismaModule,
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: SECURITY_CONFIG.jwt.defaultSecret,
    }),
  ],
  providers: [AuthService, AuthResolver, JwtStrategy, EmailService],
  exports: [AuthService],
})
export class AuthModule {}
