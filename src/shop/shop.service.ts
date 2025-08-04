import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Shop } from './shop.entity';

/**
 * Service responsible for shop-related operations
 * Follows Repository pattern for data access
 */
@Injectable()
export class ShopService {
  constructor(
    @InjectRepository(Shop)
    private shopRepository: Repository<Shop>,
  ) {}

  /**
   * Find a shop by its URL
   * @param shopUrl The URL of the shop to find
   * @returns The shop entity or null if not found
   */
  async findByUrl(shopUrl: string): Promise<Shop | null> {
    return this.shopRepository.findOne({ where: { shopUrl } });
  }

  /**
   * Create or update a shop
   * @param shopData The shop data to upsert
   * @returns The created or updated shop entity
   */
  async upsert(shopData: Partial<Shop> & { shopUrl: string }): Promise<Shop> {
    const { shopUrl } = shopData;

    // Find existing shop or create new one
    let shop = await this.findByUrl(shopUrl);

    if (shop) {
      // Update existing shop
      Object.assign(shop, shopData);
    } else {
      // Create new shop
      shop = this.shopRepository.create(shopData);
    }

    return this.shopRepository.save(shop);
  }
}
