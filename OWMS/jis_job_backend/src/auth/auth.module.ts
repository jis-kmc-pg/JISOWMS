import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';
import { RefreshTokenStrategy } from './refresh.strategy';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}), // We handle signAsync manually in AuthService now
  ],
  providers: [
    AuthService,
    JwtStrategy,
    RefreshTokenStrategy,
    LocalStrategy,
  ],

  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
