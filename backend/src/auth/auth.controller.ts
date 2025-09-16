import { Controller, Post, Body, Headers, HttpCode, HttpException, HttpStatus } from '@nestjs/common';
import { Throttle, ThrottlerException } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CheckEmailDto } from './dto/check-email.dto';
import { CompleteAuthDto } from './dto/complete-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('check-email')
  @Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 requests per minute
  @HttpCode(200)
  async checkEmail(@Body() dto: CheckEmailDto) {
    try {
      const exists = await this.authService.emailExists(dto.email);

      if (dto.context === 'signup') {
        return exists
          ? {
              ok: false,
              message: 'An account with this email already exists. Please sign in instead.',
              next: 'signin',
            }
          : {
              ok: true,
              message: 'Email is available. Continue to sign up.',
              next: 'signup',
            };
      }

      // signin context
      return exists
        ? {
            ok: true,
            message: 'Account found. Continue to sign in.',
            next: 'signin',
          }
        : {
            ok: false,
            message: 'No account found with this email. Please sign up instead.',
            next: 'signup',
          };
    } catch (error) {
      if (error instanceof ThrottlerException) {
        throw new HttpException('Too many attempts, please try again later', HttpStatus.TOO_MANY_REQUESTS);
      }
      throw error;
    }
  }

  @Post('complete')
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 requests per minute
  async complete(
    @Headers('authorization') authHeader: string,
    @Body() dto: CompleteAuthDto
  ) {
    console.log('🎯 Backend: Received auth completion request', {
      hasAuthHeader: !!authHeader,
      authHeaderLength: authHeader?.length,
      intendedRole: dto.intendedRole,
      timestamp: new Date().toISOString()
    });

    try {
      const { userId, email, role: existingRole } = await this.authService.verifyToken(authHeader);
      console.log('🔓 Backend: Token verification successful', {
        userId,
        email,
        hasExistingProfile: !!existingRole,
        existingRole
      });

      const profile = await this.authService.completeAuth(
        userId,
        email,
        dto.intendedRole
      );

      console.log('✅ Backend: Auth completion successful', profile);
      return {
        id: profile.id,
        email: profile.email,
        role: profile.role,
      };
    } catch (error) {
      console.error('❌ Backend: Auth completion error:', error);
      
      if (error instanceof ThrottlerException) {
        throw new HttpException('Too many attempts, please try again later', HttpStatus.TOO_MANY_REQUESTS);
      }
      
      // Handle specific JWT verification errors
      if (error.message?.includes('Invalid token') || error.message?.includes('JWT')) {
        throw new HttpException('Invalid or expired token', HttpStatus.UNAUTHORIZED);
      }
      
      // Handle database/profile creation errors
      if (error.message?.includes('Failed to create profile')) {
        throw new HttpException('Failed to create user profile', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      throw new HttpException('Authentication completion failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
