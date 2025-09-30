import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../../auth/auth.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7);

    try {
      // Handle static admin token for MVP
      if (token === 'admin-session-token') {
        // Add admin user info to request
        request.user = {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'admin@timebuddy.app',
          role: 'admin'
        };
        return true;
      }

      // Handle regular Supabase tokens for other admin users (future)
      const user = await this.authService.verifyToken(token);
      
      if (user.role !== 'admin') {
        throw new UnauthorizedException('Admin access required');
      }

      // Add user info to request for use in controllers
      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid admin token');
    }
  }
}
