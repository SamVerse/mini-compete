import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Get required roles from the route handler metadata
    const requiredRoles = this.reflector.get<Role[]>('roles', context.getHandler());
    if (!requiredRoles) {
      return true; // No roles specified, allow access
    }

    // 2. Get the user object from the request
    const request = context.switchToHttp().getRequest();
    const user = request.user; // User object is attached by JwtAuthGuard/Strategy

    if (!user) {
      return false; // No user attached to request (shouldn't happen if JwtAuthGuard runs first)
    }

    // 3. Check if the user's role is in the required roles list
    return requiredRoles.includes(user.role as Role);
  }
}