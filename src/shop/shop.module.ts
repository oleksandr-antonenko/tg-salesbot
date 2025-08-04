import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Shop } from './shop.entity';
import { ShopService } from './shop.service';
import { ShopController } from './shop.controller';
import { SessionService } from 'src/session/session.service';

/**
 * Shop module responsible for managing shop data
 * Follows Repository pattern for data access
 */
@Module({
  imports: [TypeOrmModule.forFeature([Shop])],
  controllers: [ShopController],
  providers: [ShopService, SessionService],
  exports: [TypeOrmModule, ShopService],
})
export class ShopModule {}
