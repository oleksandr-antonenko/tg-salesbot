import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract shop from request
 * Follows Single Responsibility Principle by focusing only on extracting shop data
 */
export const ShopDecorator = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.shop;
  },
);
