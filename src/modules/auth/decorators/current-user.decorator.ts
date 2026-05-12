import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): { userId: string; email: string } => {
    return ctx.switchToHttp().getRequest()['user'];
  },
);
