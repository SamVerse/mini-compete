import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// This interface defines the shape of the user object
// attached by our JwtStrategy
export interface JwtUser {
  userId: number;
  email: string;
  role: string;
}

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): JwtUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);